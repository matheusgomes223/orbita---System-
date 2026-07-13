const GITHUB_OWNER = 'matheusgomes223';
const GITHUB_REPO = 'orbita---System-';
const FILE_PATH = 'db.json';

let cachedDb: any = null;
let lastSaveTime = 0;

function getLocalCache() {
  if (cachedDb) return cachedDb;
  const stored = localStorage.getItem('ORBITA_CACHED_DB');
  if (stored) {
    try {
      cachedDb = JSON.parse(stored);
      return cachedDb;
    } catch (e) {
      // ignore
    }
  }
  return null;
}

function setLocalCache(db: any) {
  cachedDb = db;
  try {
    localStorage.setItem('ORBITA_CACHED_DB', JSON.stringify(db));
  } catch (e) {
    console.warn("localStorage quota exceeded, caching in memory only", e);
  }
  window.dispatchEvent(new Event('storage'));
}

export function getGithubToken() {
  // @ts-ignore
  return import.meta.env?.VITE_GITHUB_TOKEN || '';
}

export function hasGithubConfig() {
  return !!getGithubToken();
}

export async function fetchDb(forceRefresh = false, skipBackgroundSync = false) {
  const cache = getLocalCache();
  if (cache && !forceRefresh) {
    // Return cache immediately, but trigger background sync if not skipped
    if (!skipBackgroundSync) {
      triggerBackgroundSync();
    }
    return cache;
  }

  return await performFetch();
}

async function performFetch() {
  const token = getGithubToken();
  if (!token) {
    return getEmptyDb();
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 404) {
      const initialDb = getEmptyDb();
      await saveDb(initialDb);
      return initialDb;
    }

    const data = await response.json();
    
    let content = '';
    if (data.content) {
      try {
        content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
      } catch (e) {
        console.warn('Error decoding base64 content from GitHub:', e);
      }
    }

    let parsed = null;
    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.warn('Error parsing JSON from GitHub:', e);
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn('GitHub database is empty or invalid. Initializing/restoring...');
      const fallbackDb = getLocalCache() || getEmptyDb();
      // Attempt to restore/initialize the database on GitHub
      await saveDb(fallbackDb);
      return fallbackDb;
    }
    
    const localCache = getLocalCache();
    const localLastUpdated = localCache?.lastUpdated || 0;
    const remoteLastUpdated = parsed.lastUpdated || 0;

    if (!localCache || remoteLastUpdated >= localLastUpdated) {
      setLocalCache(parsed);
      return parsed;
    }
    return localCache;
  } catch (error) {
    console.error('Error fetching database from GitHub:', error);
    return getLocalCache() || getEmptyDb();
  }
}

async function triggerBackgroundSync() {
  if (Date.now() - lastSaveTime < 10000) {
    // Skip background sync shortly after saving to avoid downloading stale/eventually-consistent data
    return;
  }
  const token = getGithubToken();
  if (!token) return;
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      let content = '';
      if (data.content) {
        try {
          content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
        } catch (e) {
          console.warn('Background sync: Error decoding base64 content:', e);
        }
      }

      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            const localCache = getLocalCache();
            const localLastUpdated = localCache?.lastUpdated || 0;
            const remoteLastUpdated = parsed.lastUpdated || 0;

            if (remoteLastUpdated > localLastUpdated) {
              setLocalCache(parsed);
            }
          }
        } catch (e) {
          console.warn('Background sync: Error parsing JSON:', e);
        }
      }
    }
  } catch (e) {
    console.error('Background sync failed:', e);
  }
}

let isSaving = false;
let pendingSaveData: any = null;

export async function saveDb(dbData: any): Promise<boolean> {
  lastSaveTime = Date.now();
  dbData.lastUpdated = Date.now();
  // Update cache immediately so UI feels instant
  setLocalCache(dbData);

  const token = getGithubToken();
  if (!token) return false;

  if (isSaving) {
    pendingSaveData = dbData;
    return true;
  }

  isSaving = true;

  try {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
      attempts++;
      let sha = '';
      const getFileResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(dbData, null, 2))));
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'Sync database state',
          content,
          sha: sha || undefined
        })
      });

      if (response.ok) {
        success = true;
      } else if (response.status === 409) {
        // Conflict! Wait a little bit and retry with the latest fetched SHA
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    isSaving = false;
    if (pendingSaveData) {
      const nextData = pendingSaveData;
      pendingSaveData = null;
      saveDb(nextData);
    }
    return success;
  } catch (error) {
    console.error('Error saving database to GitHub:', error);
    isSaving = false;
    return false;
  }
}

function getEmptyDb() {
  return {
    enderecos: [],
    items: [],
    planejadores: [],
    projetos: [],
    requisitantes: [],
    entradas: [],
    requisicoes: [],
    estoque: [],
    lastUpdated: 0
  };
}
