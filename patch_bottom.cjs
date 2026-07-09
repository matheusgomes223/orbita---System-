const fs = require('fs');
let code = fs.readFileSync('src/components/NovaRequisicao.tsx', 'utf-8');

code = code.replace(/<\/motion\.div>\s*<\/div>\s*<\/>\s*\);\s*}/g, 
`    </motion.div>
  );

  if (!isModal) {
    return <div className="w-full h-full flex justify-center p-4 sm:p-6">{content}</div>;
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        {content}
      </div>
    </>
  );
}`);

fs.writeFileSync('src/components/NovaRequisicao.tsx', code);
