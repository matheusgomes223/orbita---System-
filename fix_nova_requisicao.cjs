const fs = require('fs');
let code = fs.readFileSync('src/components/NovaRequisicao.tsx', 'utf-8');

const isModalStart = code.indexOf('const isModal = !!onClose;');
if (isModalStart !== -1) {
  const returnContentStart = code.indexOf('const content = (', isModalStart);
  if (returnContentStart !== -1) {
    let headerStart = code.indexOf('{/* Modal Header */}');
    let insideContent = code.substring(headerStart, code.lastIndexOf('</motion.div>', code.indexOf('if (!isModal)')));
    
    let replacement = `  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-7xl max-h-[90vh]"
        >
          ${insideContent}
        </motion.div>
      </div>
    </>
  );
}`;
    
    code = code.substring(0, isModalStart) + replacement;
    fs.writeFileSync('src/components/NovaRequisicao.tsx', code);
    console.log('Fixed layout');
  }
}
