const fs = require('fs');
let code = fs.readFileSync('src/components/NovaRequisicao.tsx', 'utf-8');

const returnStatementStart = code.indexOf('return (', code.indexOf('const getSearchTypeLabel'));

const wrapper = `
  const isModal = !!onClose;

  const content = (
    <motion.div 
      initial={isModal ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0 }}
      animate={isModal ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
      exit={isModal ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0 }}
      className={\`bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-300 \${
        isModal 
          ? \`shadow-xl pointer-events-auto \${step === 2 ? 'w-[95vw] max-w-[1600px] h-[95vh]' : 'w-full max-w-3xl max-h-[90vh]'}\`
          : \`border border-slate-200 shadow-sm mx-auto \${step === 1 ? 'w-full max-w-3xl h-fit' : 'w-full h-full max-h-full'}\`
      }\`}
    >
`;

code = code.replace(/return \(\s*<>\s*<motion\.div[\s\S]*?pointer-events-none">\s*<motion\.div[^>]*className=[^>]*>/, wrapper);

code = code.replace(/<\/motion\.div>\s*<\/div>\s*<\/>\s*\);\s*};/g, 
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
};`);

fs.writeFileSync('src/components/NovaRequisicao.tsx', code);
