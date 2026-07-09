const fs = require('fs');
let code = fs.readFileSync('src/components/MobileMenu.tsx', 'utf8');

const returnRegex = /return \([\s\S]*?\);\n\}/;

const newReturn = `return (
    <div className="flex items-center gap-2 xl:hidden">
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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 py-1"
            >
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (onNavigate) onNavigate(tab.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00B4F1] transition-colors text-left"
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}`;

code = code.replace(returnRegex, newReturn);
fs.writeFileSync('src/components/MobileMenu.tsx', code);
