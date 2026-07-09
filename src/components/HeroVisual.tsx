import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const phrases = [
  {
    title: "Tudo em Órbita.\nNada Fora de Controle.",
    desc: "Controle materiais, estoque e operações em tempo real com máxima rastreabilidade e eficiência."
  },
  {
    title: "Gestão Inteligente.\nResultados Precisos.",
    desc: "Acompanhe seus projetos com dados atualizados e tome decisões assertivas rapidamente."
  },
  {
    title: "Estoque Otimizado.\nZero Desperdício.",
    desc: "Mantenha o equilíbrio perfeito de materiais e reduza custos operacionais."
  },
  {
    title: "Fluxo Ágil.\nEntrega Garantida.",
    desc: "Agilize requisições e garanta que os materiais certos cheguem no momento exato."
  }
];

const TypewriterText = ({ text, className }: { text: string, className?: string }) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: index * 0.05 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

export function HeroVisual() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-8 sm:p-12 bg-[#F8F9FA]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob Top Left */}
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-[10%] -left-[10%] w-[65%] h-[75%] bg-[#3ABDF4]"
          style={{ borderRadius: '20% 40% 60% 30% / 30% 40% 70% 50%' }}
        />
        {/* Blob Bottom Right */}
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: 45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute -bottom-[20%] -right-[15%] w-[85%] h-[95%] bg-[#EEA93C]"
          style={{ borderRadius: '40% 60% 40% 60% / 50% 50% 60% 40%' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center -mt-8 min-h-[250px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-bold text-[#0C2340] mb-6 tracking-tight leading-[1.2] whitespace-pre-line">
              <TypewriterText text={phrases[currentIndex].title} />
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: phrases[currentIndex].title.length * 0.05 + 0.3, duration: 0.8 }}
              className="text-[16px] sm:text-[18px] lg:text-[20px] text-[#0C2340] max-w-lg mx-auto leading-relaxed font-medium"
            >
              {phrases[currentIndex].desc}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-10 flex gap-2.5 justify-center z-50">
        {phrases.map((_, dot) => (
          <button
            key={dot}
            onClick={() => setCurrentIndex(dot)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === dot 
                ? 'bg-[#3ABDF4] w-6' 
                : 'bg-white w-2 opacity-80 hover:opacity-100 shadow-sm'
            }`}
            aria-label={`Mudar para frase ${dot + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
