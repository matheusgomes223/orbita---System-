import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Search, Bell, LogOut, FileText, Printer, 
  QrCode, Tag, History, X, Download, ShieldCheck,
  Building, MapPin, SlidersHorizontal, ClipboardList, Database, DollarSign,
  LayoutDashboard, Book, ArrowDownToLine, Truck, FolderCog, PieChart,
  Boxes, BookOpen, CheckCircle2, Camera, PenTool, Eraser, ChevronDown,
  Mail, Lock
} from 'lucide-react';
import { getGithubToken, fetchDb, saveDb } from '../services/githubDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { OrbitaIcon } from './OrbitaIcon';
import { CadastrarItem } from './CadastrarItem';
import { CadastrarEndereco } from './CadastrarEndereco';
import { CadastrarPlanejador } from './CadastrarPlanejador';
import { CadastrarRequisitante } from './CadastrarRequisitante';
import { CadastrarProjeto } from './CadastrarProjeto';
import { CadastrarRobo } from './CadastrarRobo';
import { Entrada } from './Entrada';
import { Estoque } from './Estoque';
import { Requisicao } from './Requisicao';
import { NovaRequisicao } from './NovaRequisicao';
import { DashboardOverview } from './DashboardOverview';
import SignatureCanvas from 'react-signature-canvas';
import metalPipesImg from '../assets/images/metal_pipes_1781574295664.jpg';
import cementImg from '../assets/images/portland_cement_1781574316051.jpg';
import screwsImg from '../assets/images/hex_screws_1781574329795.jpg';
import solarPanelsImg from '../assets/images/solar_panels_1781574340603.jpg';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione..." 
}: { 
  options: { label: string, value: string }[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder?: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-white border outline-none rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${isOpen ? 'border-[#00B4F1] ring-2 ring-[#00B4F1]/10' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <span className={`truncate ${!value ? 'text-slate-500' : 'text-slate-700'}`}>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto"
          >
            {options.map((opt, idx) => (
              <div 
                key={opt.value || idx}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt.value ? 'bg-[#F0F7FF] text-[#00B4F1] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <CheckCircle2 className="w-4 h-4" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AlmoxarifeDashboard({ onLogout, userRole = 'almoxerife' }: { onLogout: () => void, userRole?: string }) {
  const isAdministrador = userRole === 'administrador';
  const isAlmoxarife = userRole === 'almoxerife';
  const isRequisitante = userRole === 'requisitante';

  const canAccessTab = (tab: string) => {
    if (isAdministrador) return !['nova_requisicao', 'minhas_requisicoes'].includes(tab);
    if (isRequisitante) return ['nova_requisicao', 'minhas_requisicoes', 'saldo_itens'].includes(tab);
    if (isAlmoxarife) return ['requisicao', 'saldo_itens'].includes(tab);
    return false;
  };

  const canAccessCadastro = isAdministrador;

  const [activeTab, setActiveTab] = useState(isRequisitante ? 'minhas_requisicoes' : 'saldo_itens');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(canAccessCadastro ? ['cadastro'] : []);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState('João Silva');
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };
  const sigCanvas = useRef<any>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const [formCc, setFormCc] = useState('');
  const [formPep, setFormPep] = useState('');
  const [formEnd, setFormEnd] = useState('');
  
  const [filterProj, setFilterProj] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30d');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap bg-[#F8FAFC] border-y border-slate-200 first:border-l first:rounded-tl-lg last:border-r last:rounded-tr-lg">
      {children}
    </th>
  );

  const TableCell = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <td className={`px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap border-b border-slate-100 ${className}`}>
      {children}
    </td>
  );

  const InfoGroup = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-[14px] font-medium text-[#0C2340]">{value}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans">
      
      {/* Sidebar */}
      <aside className="hidden xl:flex xl:w-64 transition-all duration-300 bg-white border-r border-slate-200 flex-col z-20 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="flex items-center justify-center lg:justify-start gap-2 w-full">
            <OrbitaIcon className="w-8 h-8" />
            <span className="hidden lg:block font-bold text-[#0C2340] text-xl tracking-tight">Órbita</span>
          </div>
        </div>
        
        <div className="p-2 lg:p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
          {/* Dashboard */}
          {canAccessTab('dashboard') && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'dashboard' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Dashboard</span>
              </button>
            </div>
          )}

          {/* Nova Requisição */}
          {canAccessTab('nova_requisicao') && !isRequisitante && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('nova_requisicao')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'nova_requisicao' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Nova Requisição</span>
              </button>
            </div>
          )}

          {canAccessTab('minhas_requisicoes') && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('minhas_requisicoes')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'minhas_requisicoes' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Minhas Requisições</span>
              </button>
            </div>
          )}



          {/* Movimentação (Removido agrupamento) */}
          {canAccessTab('entrada') && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('entrada')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'entrada' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Entrada</span>
              </button>
            </div>
          )}

          {canAccessTab('requisicao') && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('requisicao')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'requisicao' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Requisição</span>
              </button>
            </div>
          )}

          {/* Recebimento (Removido agrupamento) */}
          {canAccessTab('saldo_itens') && (
            <div className="mb-2">
              <button 
                onClick={() => setActiveTab('saldo_itens')}
                className={`w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  activeTab === 'saldo_itens' ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden lg:block flex-1 text-left">Estoque</span>
              </button>
            </div>
          )}

          {/* Cadastro */}
          {canAccessCadastro && (
            <div className="mt-2">
              <button 
                onClick={() => toggleMenu('cadastro')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                  expandedMenus.includes('cadastro') ? 'bg-[#F4F7F9] text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Cadastro</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedMenus.includes('cadastro') ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {expandedMenus.includes('cadastro') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 pt-2 pb-2 pl-3">
                      <button 
                        onClick={() => setActiveTab('cadastrar_item')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_item' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Cadastrar Item</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('cadastrar_endereco')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_endereco' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Cadastrar Endereço</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('cadastrar_planejador')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_planejador' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Cadastrar Planejador</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('cadastrar_requisitante')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_requisitante' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Cadastrar Requisitante</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('cadastrar_projeto')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_projeto' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Cadastrar Projeto</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('cadastrar_robo')}
                        className={`flex items-center gap-3 py-2 transition-colors text-sm w-full text-left ${
                          activeTab === 'cadastrar_robo' ? 'text-[#3B82F6] font-bold border-l-2 border-[#3B82F6] pl-[10px]' : 'text-slate-500 hover:text-[#0C2340] border-l-2 border-transparent pl-3'
                        }`}
                      >
                        <span className="flex-1">Robô</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#00B4F1]/10 text-[#00B4F1] flex items-center justify-center font-bold text-xs overflow-hidden border border-[#00B4F1]/20">
              {userProfilePic ? (
                <img src={userProfilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-[#0C2340] group-hover:text-[#3B82F6] transition-colors truncate">{userName}</span>
              <span className="text-[11px] font-medium text-slate-500 truncate capitalize">{userRole === 'almoxerife' ? 'Almoxarife Líder' : userRole}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }} 
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* Workspace */}
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full flex flex-col">
            
            {/* Todas as abas foram removidas para construção passo a passo */}
            {activeTab === 'cadastrar_item' ? (
              <CadastrarItem />
            ) : activeTab === 'cadastrar_endereco' ? (
              <CadastrarEndereco />
            ) : activeTab === 'cadastrar_planejador' ? (
              <CadastrarPlanejador />
            ) : activeTab === 'cadastrar_requisitante' ? (
              <CadastrarRequisitante />
            ) : activeTab === 'cadastrar_projeto' ? (
              <CadastrarProjeto />
            ) : activeTab === 'cadastrar_robo' ? (
              <CadastrarRobo />
            ) : activeTab === 'dashboard' ? (
              <DashboardOverview />
            ) : activeTab === 'saldo_itens' ? (
              <Estoque userRole={userRole} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />
            ) : activeTab === 'entrada' ? (
              <Entrada />
            ) : activeTab === 'requisicao' ? (
              <Requisicao userRole={userRole} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />
            ) : activeTab === 'nova_requisicao' ? (
              <NovaRequisicao onClose={() => setActiveTab('minhas_requisicoes')} userName={userName} />
            ) : activeTab === 'minhas_requisicoes' ? (
              <Requisicao userRole={userRole} onNovaRequisicao={() => setActiveTab('nova_requisicao')} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white border border-slate-200 rounded-xl shadow-sm p-12 flex-1">
                <FolderCog className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-slate-600 mb-2">Módulo em Desenvolvimento</h2>
                <p className="text-slate-500">Este módulo será construído passo a passo.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-[#F0F7FF] border-blue-200 text-[#0C2340]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'error' && <X className="w-5 h-5 text-red-600" />}
            {toast.type === 'info' && <Bell className="w-5 h-5 text-[#00B4F1]" />}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
              onClick={() => setIsProfileModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#0C2340] to-[#0f3460] h-24 relative">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-8 pb-8 pt-0 relative">
                <div 
                  className="w-20 h-20 bg-white rounded-full p-1 -mt-10 mx-auto shadow-md relative group cursor-pointer"
                  onClick={() => document.getElementById('profile-pic-upload')?.click()}
                >
                  <div className="w-full h-full rounded-full bg-[#00B4F1]/10 text-[#00B4F1] flex items-center justify-center font-bold text-2xl overflow-hidden">
                    {userProfilePic ? (
                      <img src={userProfilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="absolute inset-1 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input type="file" id="profile-pic-upload" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setUserProfilePic(e.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
                
                <div className="text-center mt-4">
                  {isEditingName ? (
                    <div className="relative inline-flex items-center justify-center">
                      <input 
                        type="text" 
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        className="border-b-2 border-[#3B82F6] text-xl font-bold text-[#0C2340] text-center focus:outline-none w-48 bg-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setUserName(editNameValue);
                            setIsEditingName(false);
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          setUserName(editNameValue);
                          setIsEditingName(false);
                        }}
                        className="absolute -right-8 text-[#3B82F6] hover:text-[#2563EB]"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative inline-flex items-center justify-center group/edit cursor-pointer" onClick={() => {
                      setEditNameValue(userName);
                      setIsEditingName(true);
                    }}>
                      <h2 className="text-xl font-bold text-[#0C2340]">{userName}</h2>
                      <div className="absolute -right-6 flex items-center h-full">
                        <PenTool className="w-3.5 h-3.5 text-slate-300 group-hover/edit:text-[#3B82F6] transition-colors" />
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 font-medium mt-1">Almoxarife Líder</p>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-slate-500">Email</span>
                      <span className="text-sm font-medium text-slate-700">joao.silva@empresa.com.br</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Building className="w-5 h-5 text-slate-400" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-slate-500">Departamento</span>
                      <span className="text-sm font-medium text-slate-700">Logística e Suprimentos</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onLogout();
                  }}
                  className="mt-8 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Sistema
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
