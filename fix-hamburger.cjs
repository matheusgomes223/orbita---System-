const fs = require('fs');
let code = fs.readFileSync('src/components/MobileMenu.tsx', 'utf8');

code = code.replace(
  /className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 sm:hidden"/,
  'className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"'
);

fs.writeFileSync('src/components/MobileMenu.tsx', code);
