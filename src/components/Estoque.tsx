import React, { useState, useEffect } from 'react';
import { Search, Filter, Printer, ImageIcon, X, MapPin, User, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';
import { MobileMenu } from './MobileMenu';
import { GeradorEtiquetas } from './GeradorEtiquetas';

export function Estoque({ 
  activeTab = 'saldo_itens', 
  onNavigate = () => {}, 
  userRole = 'almoxerife', 
  userName = 'João Silva', 
  onLogout = () => {} 
}: { 
  activeTab?: string, 
  onNavigate?: (tab: string) => void, 
  userRole?: string, 
  userName?: string, 
  onLogout?: () => void 
}) {
  const getFullUnitName = (und: string) => {
    const map: Record<string, string> = {
      'UN': 'Unidade',
      'KG': 'Quilograma',
      'M': 'Metro',
      'L': 'Litro',
      'CX': 'Caixa',
      'CJ': 'Conjunto',
      'PC': 'Peça',
      'RL': 'Rolo',
      'ROLO': 'Rolo'
    };
    return map[und?.toUpperCase()] || und;
  };

  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [registeredItems, setRegisteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Disponível' | 'Projeto'>('Todos');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showEtiquetas, setShowEtiquetas] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEstoque(db.estoque || []);
      setRequisicoes(db.requisicoes || []);
      setRegisteredItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleStatusChange = async (codigoKey: string, newStatus: string) => {
    setEstoque(prev => {
      const updated = prev.map(item => {
        const key = (item.codigoSAP || item.codigoItem || '').toUpperCase();
        if (key === codigoKey.toUpperCase()) {
          return { ...item, status: newStatus };
        }
        return item;
      });

      // Save database update asynchronously in background
      (async () => {
        try {
          const db = await fetchDb();
          db.estoque = db.estoque.map((item: any) => {
            const key = (item.codigoSAP || item.codigoItem || '').toUpperCase();
            if (key === codigoKey.toUpperCase()) {
              return { ...item, status: newStatus };
            }
            return item;
          });
          await saveDb(db);
        } catch (err) {
          console.error("Erro ao salvar status no banco de dados:", err);
        }
      })();

      return updated;
    });
  };

  // Group inventory by SAP code to consolidate totals and list allocations
  const groupedEstoque = React.useMemo(() => {
    const groups: { [key: string]: any } = {};

    estoque.forEach(item => {
      const existsInCatalog = registeredItems.some(ri => {
        if (ri.codigoItem && item.codigoItem && ri.codigoItem !== '-' && item.codigoItem !== '-') {
          return ri.codigoItem.toUpperCase() === item.codigoItem.toUpperCase();
        }
        if (ri.codigoSAP && item.codigoSAP && ri.codigoSAP !== '-' && item.codigoSAP !== '-') {
          return ri.codigoSAP.toUpperCase() === item.codigoSAP.toUpperCase();
        }
        return ri.descricao && item.descricao && ri.descricao.trim().toUpperCase() === item.descricao.trim().toUpperCase();
      });
      if (!existsInCatalog) return;

      const key = (item.codigoSAP || item.codigoItem || '').toUpperCase();
      let fallbackImage = null;
      const foundCatalog = registeredItems.find(ri => {
        if (ri.codigoItem && item.codigoItem && ri.codigoItem !== '-' && item.codigoItem !== '-') {
          return ri.codigoItem.toUpperCase() === item.codigoItem.toUpperCase();
        }
        if (ri.codigoSAP && item.codigoSAP && ri.codigoSAP !== '-' && item.codigoSAP !== '-') {
          return ri.codigoSAP.toUpperCase() === item.codigoSAP.toUpperCase();
        }
        return false;
      });
      if (foundCatalog && foundCatalog.foto) {
        fallbackImage = foundCatalog.foto;
      } else {
        fallbackImage = item.imagem || null;
      }

      if (!groups[key]) {
        groups[key] = {
          id: item.id,
          descricao: item.descricao,
          codigoItem: item.codigoItem || item.codigoSAP,
          codigoSAP: item.codigoSAP || item.codigoItem,
          partNumber: item.partNumber || '-',
          saldo: 0,
          qtdRsv: 0,
          disponivel: 0,
          um: item.um || 'UN',
          valorTotal: 0,
          imagem: fallbackImage,
          allocations: []
        };
      }
      
      groups[key].saldo += Number(item.saldo || 0);
      groups[key].valorTotal += Number(item.valorTotal || 0);
      if (fallbackImage && !groups[key].imagem) {
        groups[key].imagem = fallbackImage;
      }
      if (item.status) {
        groups[key].status = item.status;
      } else if (!groups[key].status) {
        groups[key].status = 'Disponível';
      }
      
      groups[key].allocations.push(item);
    });

    // Calculate dynamic QTD REQ (qtdRsv) and QTD DSP (disponivel) from active requisitions
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      const totalReqQty = requisicoes
        .filter(req => 
          req.statusAprovacao !== 'Cancelado' && 
          req.statusAprovacao !== 'Rejeitado' &&
          req.statusLogistico !== 'Entregue' &&
          req.statusLogistico !== 'Retirado' &&
          req.statusLogistico !== 'Recebido'
        )
        .reduce((sum, req) => {
          const reqItem = (req.itens || []).find((i: any) => (i.codigo || '').toUpperCase() === key);
          return sum + (reqItem ? Number(reqItem.quantidade || 0) : 0);
        }, 0);

      group.qtdRsv = totalReqQty;
      group.disponivel = Math.max(0, group.saldo - totalReqQty);
      
      let remainingReq = totalReqQty;
      group.allocations = group.allocations.map((alloc: any) => {
        const allocSaldo = Number(alloc.saldo || 0);
        const allocUsed = Math.min(allocSaldo, remainingReq);
        remainingReq -= allocUsed;
        return {
          ...alloc,
          disponivel: Math.max(0, allocSaldo - allocUsed)
        };
      });
    });

    const result: any[] = [];
    Object.values(groups).forEach((group: any) => {
      group.allocations.forEach((alloc: any) => {
        let finalImage = null;
        const foundCatalog = registeredItems.find(ri => {
          if (ri.codigoItem && alloc.codigoItem && ri.codigoItem !== '-' && alloc.codigoItem !== '-') {
            return ri.codigoItem.toUpperCase() === alloc.codigoItem.toUpperCase();
          }
          if (ri.codigoSAP && alloc.codigoSAP && ri.codigoSAP !== '-' && alloc.codigoSAP !== '-') {
            return ri.codigoSAP.toUpperCase() === alloc.codigoSAP.toUpperCase();
          }
          if (ri.descricao && alloc.descricao) {
            return ri.descricao.trim().toUpperCase() === alloc.descricao.trim().toUpperCase();
          }
          return false;
        });

        if (foundCatalog && foundCatalog.foto) {
          finalImage = foundCatalog.foto;
        } else {
          finalImage = alloc.imagem || null;
        }

        result.push({
          ...alloc,
          qtdRsv: Number(alloc.saldo) - Number(alloc.disponivel),
          imagem: finalImage || group.imagem || null
        });
      });
    });
    return result;
  }, [estoque, requisicoes, registeredItems]);

  const filteredEstoque = groupedEstoque.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      item.descricao?.toLowerCase().includes(searchLower) ||
      item.codigoItem?.toLowerCase().includes(searchLower) ||
      item.codigoSAP?.toLowerCase().includes(searchLower) ||
      item.partNumber?.toLowerCase().includes(searchLower)
    );
    if (!matchesSearch) return false;
    if (statusFilter === 'Todos') return true;
    return (item.status || 'Disponível') === statusFilter;
  });

  if (showEtiquetas) {
    return <GeradorEtiquetas onClose={() => setShowEtiquetas(false)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full bg-white overflow-hidden"
    >
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-96 flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar no estoque..." 
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
          
          {/* Segmented Filter (Modelo Tomada) */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            {(['Todos', 'Disponível', 'Projeto'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusFilter === status
                    ? 'bg-white text-[#0C2340] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {userRole !== 'requisitante' && (
            <button 
              onClick={() => setShowEtiquetas(true)}
              className="flex items-center justify-center p-2.5 rounded-lg text-slate-700 bg-transparent hover:bg-slate-50 transition-colors"
              title="Gerador de Etiquetas"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          )}

          {userRole === 'administrador' && (
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <th className="p-4 w-20 text-center">Imagem</th>
              <th className="p-4 min-w-[200px]">Descrição</th>
              <th className="p-4">Código Item</th>
              <th className="p-4">Código SAP</th>
              <th className="p-4">Part Number</th>
              <th className="p-4 text-right">QTD ENT</th>
              <th className="p-4 text-right">QTD REQ</th>
              <th className="p-4 text-right font-bold text-emerald-600">QTD DSP</th>
              <th className="p-4">UM</th>
              <th className="p-4 text-right">Valor Total (R$)</th>
              {(userRole === 'administrador' || userRole === 'almoxerife') && (
                <>
                  <th className="p-4">Projeto</th>
                  <th className="p-4">Endereço</th>
                </>
              )}
              {(userRole === 'administrador' || userRole === 'almoxerife') && (
                <>
                  <th className="p-4">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredEstoque.map((item: any) => (
              <motion.tr 
                layoutId={`row-${item.id}`}
                onClick={() => setSelectedItem(item)}
                key={item.id} 
                className="hover:bg-slate-50/50 cursor-pointer transition-colors text-sm text-slate-700"
              >
                <td className="p-4">
                  <div className="w-10 h-10 bg-slate-100 flex items-center justify-center mx-auto overflow-hidden">
                    {item.imagem ? (
                      <img 
                        src={item.imagem} 
                        alt={item.descricao} 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedImage(item.imagem);
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium text-[#0C2340] max-w-[250px] truncate" title={item.descricao}>{item.descricao}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.codigoItem}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.codigoSAP}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.partNumber}</td>
                <td className="p-4 text-right">{item.saldo.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-right text-orange-600">{item.qtdRsv > 0 ? `- ${item.qtdRsv.toLocaleString('pt-BR')}` : '0'}</td>
                <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/30">{item.disponivel.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-slate-500">{getFullUnitName(item.um)}</td>
                <td className="p-4 text-right font-medium">
                  {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                {(userRole === 'administrador' || userRole === 'almoxerife') && (
                  <>
                    <td className="p-4 text-slate-600 font-semibold font-mono text-xs">{item.projeto || '-'}</td>
                    <td className="p-4 text-slate-600 font-semibold font-mono text-xs">{item.endereco || '-'}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const nextStatus = (item.status || 'Disponível') === 'Projeto' ? 'Disponível' : 'Projeto';
                          handleStatusChange(item.codigoSAP || item.codigoItem, nextStatus);
                        }}
                        className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all active:scale-95 select-none ${
                          (item.status || 'Disponível') === 'Projeto'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <span>{item.status || 'Disponível'}</span>
                      </button>
                    </td>
                  </>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filteredEstoque.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Nenhum item encontrado</p>
            <p className="text-sm">Ajuste os filtros de busca</p>
          </div>
        )}
      </div>
      


      {/* Modal Details */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                    {selectedItem.imagem ? (
                      <img src={selectedItem.imagem} alt={selectedItem.descricao} className="w-full h-full object-cover rounded" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0C2340]">{selectedItem.descricao}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="font-mono text-xs text-slate-500">SAP: {selectedItem.codigoSAP}</span>
                      <span className="font-mono text-xs text-slate-500">Part: {selectedItem.partNumber}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Total Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-2">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quantidade Total</p>
                    <p className="text-lg font-bold text-slate-800">{selectedItem.saldo.toLocaleString('pt-BR')} {selectedItem.um}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponível</p>
                    <p className="text-lg font-bold text-emerald-600">{selectedItem.disponivel.toLocaleString('pt-BR')} {selectedItem.um}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requisitado</p>
                    <p className="text-lg font-bold text-orange-600">{selectedItem.qtdRsv.toLocaleString('pt-BR')} {selectedItem.um}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor em Estoque</p>
                    <p className="text-lg font-bold text-slate-800">R$ {selectedItem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Breakdown List (Allocations per Project/Batch) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Detalhamento
                  </h3>
                  
                  <div className="overflow-x-auto bg-white border border-slate-100 rounded-lg">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-150">
                        <tr>
                          <th className="py-2.5 px-4">Projeto</th>
                          <th className="py-2.5 px-4">Endereço</th>
                          <th className="py-2.5 px-4">Planejador</th>
                          <th className="py-2.5 px-4">NF Entrada</th>
                          <th className="py-2.5 px-4 text-center">Qtd Ent</th>
                          <th className="py-2.5 px-4 text-center">Qtd Disp</th>
                          <th className="py-2.5 px-4">Data Entrada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedItem.allocations || [selectedItem]).map((alloc: any, idx: number) => (
                          <tr key={alloc.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-[#0C2340] font-mono">{alloc.projeto || '-'}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-700">{alloc.endereco || '-'}</td>
                            <td className="py-2.5 px-4 text-slate-600">{alloc.planejador || '-'}</td>
                            <td className="py-2.5 px-4 font-mono">{alloc.nfEntrada || '-'}</td>
                            <td className="py-2.5 px-4 text-center font-semibold text-slate-700">{alloc.saldo}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/20">{alloc.disponivel}</td>
                            <td className="py-2.5 px-4 text-slate-500">{alloc.dataEntrada || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Linked Requisitions Section */}
                {(userRole === 'almoxerife' || userRole === 'administrador') && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Requisições Ativas Vinculadas
                    </h3>
                    
                    <div className="overflow-x-auto bg-white border border-slate-100 rounded-lg">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-150">
                          <tr>
                            <th className="py-2.5 px-4">Requisição</th>
                            <th className="py-2.5 px-4">Requisitante</th>
                            <th className="py-2.5 px-4">Matrícula</th>
                            <th className="py-2.5 px-4">Projeto Destino</th>
                            <th className="py-2.5 px-4 text-center">Qtd Req</th>
                            <th className="py-2.5 px-4">Data</th>
                            <th className="py-2.5 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const linkedReqs = requisicoes.filter(req => {
                              if (
                                req.statusAprovacao === 'Cancelado' || 
                                req.statusAprovacao === 'Rejeitado' ||
                                req.statusLogistico === 'Entregue' ||
                                req.statusLogistico === 'Retirado' ||
                                req.statusLogistico === 'Recebido'
                              ) return false;
                              return (req.itens || []).some((i: any) => (i.codigo || '').toUpperCase() === (selectedItem.codigoSAP || selectedItem.codigoItem || '').toUpperCase());
                            });

                            if (linkedReqs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="py-6 text-center text-slate-400">
                                    Nenhuma requisição ativa vinculada a este item.
                                  </td>
                                </tr>
                              );
                            }

                            return linkedReqs.map((req: any, idx: number) => {
                              const reqItem = (req.itens || []).find((i: any) => (i.codigo || '').toUpperCase() === (selectedItem.codigoSAP || selectedItem.codigoItem || '').toUpperCase());
                              return (
                                <tr key={req.id || idx} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-bold text-[#0C2340] font-mono">{req.requisicao}</td>
                                  <td className="py-2.5 px-4 font-semibold text-slate-700">{req.requisitante}</td>
                                  <td className="py-2.5 px-4 font-mono text-slate-500">{req.matricula || '-'}</td>
                                  <td className="py-2.5 px-4 text-slate-600">{req.projetoDestino || '-'}</td>
                                  <td className="py-2.5 px-4 text-center font-bold text-orange-600">{reqItem?.quantidade || 0}</td>
                                  <td className="py-2.5 px-4 text-slate-500">{req.dataDesejada || '-'}</td>
                                  <td className="py-2.5 px-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                      {req.statusAprovacao}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox / Zoomed Image Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImage(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 cursor-zoom-out"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={zoomedImage} alt="Visualização ampliada" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900/80 text-white p-2 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
