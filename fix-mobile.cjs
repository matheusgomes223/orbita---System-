const fs = require('fs');
let code = fs.readFileSync('src/components/MobileMenu.tsx', 'utf8');

const search = `<div className="relative xl:hidden" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
      <AnimatePresence>`;

const replace = `<div className="flex items-center gap-2 xl:hidden">
      {userName && (
        <div className="w-8 h-8 rounded-full bg-[#00B4F1] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
      )}
      {onLogout && (
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <AnimatePresence>`;

code = code.replace(search, replace);
code = code.replace(/<\/div>\n  \);\n}/g, `      </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/MobileMenu.tsx', code);
