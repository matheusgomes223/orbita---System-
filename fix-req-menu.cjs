const fs = require('fs');
let code = fs.readFileSync('src/components/Requisicao.tsx', 'utf8');

code = code.replace(
  /<MobileMenu activeTab=\{activeTab\} onNavigate=\{onNavigate\} userRole=\{userRole\} userName=\{userName\} onLogout=\{onLogout\} \/>/,
  `<div className="sm:hidden">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>`
);

code = code.replace(
  /<div className="flex items-center justify-end gap-3 w-full sm:w-auto">/,
  `<div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <div className="hidden sm:block">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>`
);

fs.writeFileSync('src/components/Requisicao.tsx', code);
