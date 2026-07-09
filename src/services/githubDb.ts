const GITHUB_OWNER = 'matheusgomes223';
const GITHUB_REPO = 'orbita---System-';
const FILE_PATH = 'db.json';

let cachedDb: any = null;

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
  localStorage.setItem('ORBITA_CACHED_DB', JSON.stringify(db));
  window.dispatchEvent(new Event('storage'));
}

export function getGithubToken() {
  // @ts-ignore
  const envToken = import.meta.env?.VITE_GITHUB_TOKEN;
  return localStorage.getItem('ORBITA_GITHUB_TOKEN') || envToken || '';
}

export function setGithubToken(token: string) {
  localStorage.setItem('ORBITA_GITHUB_TOKEN', token);
  window.dispatchEvent(new Event('storage'));
}

export function hasGithubConfig() {
  return !!getGithubToken();
}

export async function fetchDb(forceRefresh = false) {
  const cache = getLocalCache();
  if (cache && !forceRefresh) {
    // Return cache immediately, but trigger background sync
    triggerBackgroundSync();
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
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });

    if (response.status === 404) {
      const initialDb = getEmptyDb();
      await saveDb(initialDb);
      return initialDb;
    }

    const data = await response.json();
    const content = decodeURIComponent(escape(atob(data.content)));
    const parsed = JSON.parse(content);
    setLocalCache(parsed);
    return parsed;
  } catch (error) {
    console.error('Error fetching database from GitHub:', error);
    return getLocalCache() || getEmptyDb();
  }
}

async function triggerBackgroundSync() {
  const token = getGithubToken();
  if (!token) return;
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });
    if (response.ok) {
      const data = await response.json();
      const content = decodeURIComponent(escape(atob(data.content)));
      const parsed = JSON.parse(content);
      
      // Only update cache and dispatch event if it changed
      const localStr = JSON.stringify(getLocalCache());
      const remoteStr = JSON.stringify(parsed);
      if (localStr !== remoteStr) {
        setLocalCache(parsed);
      }
    }
  } catch (e) {
    console.error('Background sync failed:', e);
  }
}

export async function saveDb(dbData: any) {
  // Update cache immediately so UI feels instant
  setLocalCache(dbData);

  const token = getGithubToken();
  if (!token) return false;

  try {
    let sha = '';
    const getFileResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
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
      // Re-fetch to update local cache with official SHA-synced version
      await performFetch();
    }
    return response.ok;
  } catch (error) {
    console.error('Error saving database to GitHub:', error);
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
    estoque: []
  };
}
