const fs = require('fs');
let code = `import React, { useState, useRef, useEffect } from 'react';
import { Menu, Package, FileText, LayoutDashboard, Plus, Clock, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MobileMenuProps = {
  userName?: string;
  onLogout?: () => void;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
  userRole?: string;
};

export function MobileMenu({ activeTab, onNavigate, userRole, userName, onLogout }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAlmoxarife = userRole === 'almoxerife';
  const isAdministrador = userRole === 'administrador';
  const isRequisitante = userRole === 'requisitante';

  const canAccessTab = (tab: string) => {
    if (isAdministrador) return true;
    if (isRequisitante) return ['nova_requisicao', 'minhas_requisicoes', 'rastreio'].includes(tab);
    if (isAlmoxarife) return ['requisicao', 'saldo_itens'].includes(tab);
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nova_requisicao', label: 'Nova Requisição', icon: Plus },
    { id: 'minhas_requisicoes', label: 'Minhas Requisições', icon: FileText },
    { id: 'rastreio', label: 'Rastreio', icon: Search },
    { id: 'entrada', label: 'Entrada', icon: Package },
    { id: 'requisicao', label: 'Requisição', icon: Clock },
    { id: 'saldo_itens', label: 'Estoque', icon: Package },
  ];

  const availableTabs = tabs.filter(t => canAccessTab(t.id) && t.id !== activeTab);

  if (availableTabs.length === 0) return null;

  return (
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
}
`;
fs.writeFileSync('src/components/MobileMenu.tsx', code);
