import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, Filter, MoreVertical, Calendar, Package, FileText, CheckCircle, XCircle, AlertCircle, MapPin, Truck, Printer, X, User, Camera, PenTool, Trash2, MessageSquare, Plus } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { MobileMenu } from './MobileMenu';
import SignatureCanvas from 'react-signature-canvas';
import { NovaRequisicao } from './NovaRequisicao';
import { fetchDb, saveDb } from '../services/githubDb';

export function Requisicao({ userRole = 'almoxerife', onNovaRequisicao, activeTab, onNavigate, userName, onLogout }: { userRole?: string, onNovaRequisicao?: () => void, activeTab?: string, onNavigate?: (tab: string) => void, userName?: string, onLogout?: () => void }) {
  const isAlmoxarife = userRole === 'almoxerife';
  const [isNovaRequisicaoOpen, setIsNovaRequisicaoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedRequisicao, setSelectedRequisicao] = useState<any>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatusLogistico, setFilterStatusLogistico] = useState('');
  const [filterStatusAprovacao, setFilterStatusAprovacao] = useState('');
  const [filterDataDesejada, setFilterDataDesejada] = useState('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [requisicoes, setRequisicoes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setRequisicoes(db.requisicoes || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const filteredRequisicoes = requisicoes.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = Object.values(req).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
    const matchesLogistico = filterStatusLogistico ? req.statusLogistico === filterStatusLogistico : true;
    const matchesAprovacao = filterStatusAprovacao ? req.statusAprovacao === filterStatusAprovacao : true;
    const matchesData = filterDataDesejada ? req.dataDesejada === filterDataDesejada : true;

    return matchesSearch && matchesLogistico && matchesAprovacao && matchesData;
  });

  const getStatusAprovacaoColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'bg-emerald-50 text-emerald-600';
      case 'Aguardando': return 'bg-amber-50 text-amber-600';
      case 'Rejeitado': return 'bg-rose-50 text-rose-600';
      case 'Expirado': return 'bg-slate-50 text-slate-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLogisticoColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'text-emerald-600 bg-emerald-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Pendente': return 'text-amber-600 bg-amber-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Retirado': return 'text-blue-600 bg-blue-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Cancelado': return 'text-rose-600 bg-rose-50/50 font-medium px-2.5 py-1 rounded-md';
      default: return 'text-slate-600 bg-slate-50 font-medium px-2.5 py-1 rounded-md';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-slate-50 relative z-20">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-96 flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar requisições..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" />
          </div>
          <div className="sm:hidden">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <div className="hidden sm:block">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>
          {!isAlmoxarife && (
            <button 
              onClick={() => onNovaRequisicao ? onNovaRequisicao() : setIsNovaRequisicaoOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${showFilters ? 'bg-slate-100 text-slate-800' : 'bg-transparent hover:bg-slate-50 text-slate-700'}`}
            title="Filtros"
          >
            <Filter className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 bg-white overflow-hidden z-10"
          >
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status CMP</label>
                <select 
                  value={filterStatusLogistico}
                  onChange={(e) => setFilterStatusLogistico(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                >
                  <option value="">Todos</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Retirado">Retirado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status Aprovação</label>
                <select 
                  value={filterStatusAprovacao}
                  onChange={(e) => setFilterStatusAprovacao(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                >
                  <option value="">Todos</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Aguardando">Aguardando</option>
                  <option value="Rejeitado">Rejeitado</option>
                  <option value="Expirado">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Data Desejada</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={filterDataDesejada}
                    onChange={(e) => setFilterDataDesejada(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                  />
                  {!filterDataDesejada && (
                    <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none bg-white px-1">
                      <span className="text-sm text-slate-500">Todas as datas</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {(filterStatusLogistico || filterStatusAprovacao || filterDataDesejada) && (
              <div className="px-4 sm:px-6 pb-4 flex justify-end">
                <button 
                  onClick={() => {
                    setFilterStatusLogistico('');
                    setFilterStatusAprovacao('');
                    setFilterDataDesejada('');
                  }}
                  className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <th className="p-4 pl-6">Requisição</th>
              <th className="p-4">Requisitante</th>
              <th className="p-4">Matrícula</th>
              <th className="p-4">Projeto / Destino</th>
              <th className="p-4">Tipo Saída</th>
              <th className="p-4 text-center">Status Aprovação</th>
              <th className="p-4 text-center">Status CMP</th>
              <th className="p-4">Data Desejada</th>
              <th className="p-4 pr-6 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredRequisicoes.map((req, idx) => (
              <motion.tr 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => setSelectedRequisicao(req)}
              >
                <td className="p-4 pl-6 font-medium text-[#0C2340]">
                  {req.requisicao}
                </td>
                <td className="p-4">{req.requisitante}</td>
                <td className="p-4 font-mono text-xs text-slate-500">{req.matricula}</td>
                <td className="p-4">{req.projetoDestino}</td>
                <td className="p-4 text-slate-600">
                  {req.tipoSaida}
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusAprovacaoColor(req.statusAprovacao)}`}>
                    {req.statusAprovacao}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={getStatusLogisticoColor(req.statusLogistico)}>
                    {req.statusLogistico}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {formatDate(req.dataDesejada)}
                </td>
                <td className="p-4 pr-6 relative text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === req.id ? null : req.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {activeMenuId === req.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-2"
                        >
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0C2340] flex items-center gap-2 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              // Imprimir logic here
                            }}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir Requisição
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filteredRequisicoes.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 w-full">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Nenhuma requisição encontrada</p>
            <p className="text-sm">Ajuste os filtros de busca para encontrar o que precisa.</p>
          </div>
        )}
      </div>



      {/* Centered Modal */}
      <AnimatePresence>
        {selectedRequisicao && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
              onClick={() => setSelectedRequisicao(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl flex flex-col border border-slate-200 max-h-[95vh] h-full pointer-events-auto overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      Detalhes da Requisição
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{selectedRequisicao.requisicao}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRequisicao(null);
                      setIsDelivering(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isDelivering ? (
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Form */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Recebedor</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" placeholder="Nome completo" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">CPF ou Matrícula</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" placeholder="000.000.000-00 ou 123456" />
                        </div>
                        
                        {!showObservation ? (
                          <button
                            onClick={() => setShowObservation(true)}
                            className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1.5 transition-colors focus:outline-none"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Adicionar observação (Opcional)
                          </button>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex justify-between items-end mb-2">
                              <label className="block text-sm font-medium text-slate-700">Observação</label>
                              <button
                                onClick={() => {
                                  setShowObservation(false);
                                  setObservation('');
                                }}
                                className="text-xs text-slate-400 hover:text-rose-500 transition-colors focus:outline-none"
                              >
                                Cancelar
                              </button>
                            </div>
                            <textarea 
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-none h-24" 
                              placeholder="Digite alguma observação sobre a entrega..."
                              value={observation}
                              onChange={(e) => setObservation(e.target.value)}
                            />
                          </motion.div>
                        )}

                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">Assinatura Digital</label>
                            <button
                              onClick={() => signatureRef.current?.clear()}
                              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Limpar
                            </button>
                          </div>
                          <div className="border border-slate-300 rounded-lg bg-white h-40 relative overflow-hidden">
                            <SignatureCanvas 
                              ref={signatureRef}
                              penColor="black"
                              canvasProps={{ className: 'w-full h-full absolute inset-0 z-10 touch-none' }} 
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                              <span className="text-slate-300 flex items-center gap-2 select-none">
                                <PenTool className="w-4 h-4" /> Assine aqui
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">Foto do Recebedor</label>
                            {photoPreview && (
                              <button
                                onClick={() => setPhotoPreview(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Remover
                              </button>
                            )}
                          </div>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white h-40 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <Camera className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="text-sm font-medium">Tirar foto</p>
                                <p className="text-xs mt-1 text-slate-400">Tamanho máximo: 5MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Items */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">Itens da Entrega</h3>
                          <p className="text-sm text-slate-500">Confirme os itens que estão sendo entregues.</p>
                        </div>
                        
                        <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg">
                          <div className="h-full overflow-y-auto">
                            <table className="w-full text-left text-sm relative">
                              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium sticky top-0 backdrop-blur-sm">
                                <tr>
                                  <th className="py-3 px-5">Código</th>
                                  <th className="py-3 px-5">Descrição</th>
                                  <th className="py-3 px-5 text-right">Qtd</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedRequisicao.itens?.map((item: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-5 font-mono text-xs text-slate-500">{item.codigo}</td>
                                    <td className="py-4 px-5 font-medium text-slate-700">{item.descricao}</td>
                                    <td className="py-4 px-5 text-right font-semibold text-slate-600">{item.quantidade}</td>
                                  </tr>
                                ))}
                                {(!selectedRequisicao.itens || selectedRequisicao.itens.length === 0) && (
                                  <tr>
                                    <td colSpan={3} className="py-12 text-center text-slate-400">
                                      <Package className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                      <p>Nenhum item cadastrado para esta requisição.</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Requisitante
                        </div>
                        <div className="font-medium text-slate-800 text-base">{selectedRequisicao.requisitante}</div>
                        <div className="text-sm text-slate-500 mt-1 font-mono">Matrícula: {selectedRequisicao.matricula}</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Projeto Destino
                        </div>
                        <div className="font-medium text-slate-800 text-base">{selectedRequisicao.projetoDestino}</div>
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          Modalidade: <span className="text-slate-700">{selectedRequisicao.tipoSaida}</span>
                        </div>
                      </div>
                    </div>

                    {selectedRequisicao.statusAprovacao === 'Aguardando' && selectedRequisicao.statusLogistico === 'Pendente' && selectedRequisicao.detalhesAprovador && (
                      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <h3 className="text-lg font-semibold text-slate-800">Aguardando Aprovação</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aprovador Responsável</div>
                            <div className="font-medium text-slate-800">{selectedRequisicao.detalhesAprovador.nome}</div>
                            <div className="text-sm text-slate-500">{selectedRequisicao.detalhesAprovador.cargo}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data da Solicitação</div>
                            <div className="font-medium text-slate-800">{selectedRequisicao.detalhesAprovador.dataSolicitacao}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRequisicao.statusLogistico === 'Retirado' && selectedRequisicao.detalhesRetirada && (
                      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <h3 className="text-lg font-semibold text-slate-800">Detalhes da Retirada</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recebedor</div>
                              <div className="font-medium text-slate-800">{selectedRequisicao.detalhesRetirada.nome}</div>
                              <div className="text-sm text-slate-500 font-mono mt-0.5">CPF/Matrícula: {selectedRequisicao.detalhesRetirada.cpf}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data e Hora</div>
                              <div className="font-medium text-slate-800">{selectedRequisicao.detalhesRetirada.dataHora}</div>
                            </div>
                            {selectedRequisicao.detalhesRetirada.observacao && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observação</div>
                                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  {selectedRequisicao.detalhesRetirada.observacao}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequisicao.detalhesRetirada.assinatura && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assinatura</div>
                                <div className="bg-white border border-slate-200 rounded-lg p-2 h-32 flex items-center justify-center relative overflow-hidden">
                                  <img src={selectedRequisicao.detalhesRetirada.assinatura} alt="Assinatura" className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80" />
                                </div>
                              </div>
                            )}
                            {selectedRequisicao.detalhesRetirada.fotoUrl && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Foto</div>
                                <div 
                                  className="bg-white border border-slate-200 rounded-lg h-32 overflow-hidden flex items-center justify-center relative cursor-pointer group"
                                  onClick={() => setExpandedImage(selectedRequisicao.detalhesRetirada.fotoUrl)}
                                >
                                  <img src={selectedRequisicao.detalhesRetirada.fotoUrl} alt="Foto do recebedor" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-6 h-6" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Itens List */}
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        Itens da Requisição
                      </h3>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                              <th className="py-3 px-5">Código</th>
                              <th className="py-3 px-5">Descrição</th>
                              <th className="py-3 px-5 text-right w-24">Qtd</th>
                              <th className="py-3 px-5">Endereço</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedRequisicao.itens?.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-5 font-mono text-xs text-slate-500">{item.codigo}</td>
                                <td className="py-4 px-5 font-medium text-slate-700">{item.descricao}</td>
                                <td className="py-4 px-5 text-right font-semibold text-slate-600">{item.quantidade}</td>
                                <td className="py-4 px-5 text-slate-500">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-mono text-xs text-slate-600">
                                    {item.endereco}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!selectedRequisicao.itens || selectedRequisicao.itens.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                  <Package className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                  <p>Nenhum item cadastrado para esta requisição.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      if (isDelivering) {
                        setIsDelivering(false);
                      } else {
                        setSelectedRequisicao(null);
                        setIsDelivering(false);
                      }
                    }}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    {isDelivering ? "Voltar" : "Fechar"}
                  </button>
                  
                  {isDelivering ? (
                    <button 
                      onClick={() => {
                        setIsDelivering(false);
                        setSelectedRequisicao(null);
                      }}
                      className="px-5 py-2.5 bg-[#0C2340] text-white rounded-lg font-medium hover:bg-[#0a1d36] transition-colors shadow-sm flex items-center gap-2"
                    >
                      Finalizar Entrega
                    </button>
                  ) : (selectedRequisicao.statusAprovacao === 'Aprovado' && selectedRequisicao.statusLogistico === 'Disponível') && (
                    <button 
                      onClick={() => setIsDelivering(true)}
                      className="px-5 py-2.5 bg-[#0C2340] text-white rounded-lg font-medium hover:bg-[#0a1d36] transition-colors shadow-sm flex items-center gap-2"
                    >
                      Iniciar Entrega
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={expandedImage} 
                alt="Foto expandida" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />
              <button 
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNovaRequisicaoOpen && (
          <NovaRequisicao onClose={() => setIsNovaRequisicaoOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
