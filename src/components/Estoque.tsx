import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, MoreVertical, ImageIcon, ArrowUpRight, ArrowDownRight, X, User, MapPin, Building, Package, Tag, Hash, Calendar, DollarSign, BookOpen, AlertCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { GeradorEtiquetas } from './GeradorEtiquetas';
import { MobileMenu } from './MobileMenu';
import { fetchDb } from '../services/githubDb';

export function Estoque({ userRole = 'almoxerife', activeTab, onNavigate, userName, onLogout }: { userRole?: string, activeTab?: string, onNavigate?: (tab: string) => void, userName?: string, onLogout?: () => void }) {
  const isAlmoxarife = userRole === 'almoxerife';
  const isAdministrador = userRole === 'administrador';
  const canAccessEtiquetas = isAlmoxarife || isAdministrador;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showEtiquetas, setShowEtiquetas] = useState(false);
  const [estoque, setEstoque] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEstoque(db.estoque || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredEstoque = estoque.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
  });

  if (showEtiquetas) {
    return <GeradorEtiquetas onClose={() => setShowEtiquetas(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4 bg-white">
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
          {canAccessEtiquetas && (
            <button 
              onClick={() => setShowEtiquetas(true)}
              className="hidden xl:flex items-center justify-center p-2.5 rounded-lg text-slate-700 bg-transparent hover:bg-slate-50 transition-colors"
              title="Etiquetas"
            >
              <Tag className="w-4.5 h-4.5" />
            </button>
          )}
          {userRole !== 'requisitante' && !isAlmoxarife && (
            <>
              <button 
                className="flex items-center justify-center p-2.5 rounded-lg text-slate-700 bg-transparent hover:bg-slate-50 transition-colors"
                title="Filtros"
              >
                <Filter className="w-4.5 h-4.5" />
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Container - we need horizontal scroll for so many columns */}
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
              <th className="p-4">Endereço</th>
              <th className="p-4">Planejador</th>
              <th className="p-4">Pedido (PO)</th>
              <th className="p-4">C. Custo</th>
              <th className="p-4">Projeto</th>
              <th className="p-4 text-right">Valor Total (R$)</th>
              <th className="p-4">NF Entrada</th>
              <th className="p-4">Data Entrada</th>
              <th className="p-4">Reg. Entrada</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredEstoque.map((item, idx) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <td className="p-4">
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center border border-slate-200 mx-auto">
                    {item.imagem ? (
                      <img src={item.imagem} alt={item.descricao} className="w-full h-full object-cover rounded" />
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
                <td className="p-4 text-right text-orange-600">{item.qtdRsv.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/30">{item.disponivel.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-slate-500">{item.um}</td>
                <td className="p-4 font-medium">{item.endereco}</td>
                <td className="p-4 text-slate-600">{item.planejador}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.pedidoPo}</td>
                <td className="p-4 text-slate-600">{item.cCusto}</td>
                <td className="p-4 text-slate-600">{item.projeto}</td>
                <td className="p-4 text-right font-medium">
                  {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.nfEntrada}</td>
                <td className="p-4 text-slate-500">{item.dataEntrada}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.regEntrada}</td>
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
      
      {/* Footer / Pagination */}
      <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
        <div>
          Mostrando <span className="font-medium text-slate-800">{filteredEstoque.length > 0 ? 1 : 0}</span> a <span className="font-medium text-slate-800">{filteredEstoque.length}</span> de <span className="font-medium text-slate-800">{filteredEstoque.length}</span> resultados
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white transition-colors disabled:opacity-50" disabled>Anterior</button>
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white transition-colors disabled:opacity-50" disabled>Próxima</button>
        </div>
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                    {selectedItem.imagem ? (
                      <img src={selectedItem.imagem} alt={selectedItem.descricao} className="w-full h-full object-cover rounded" />
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0C2340]">{selectedItem.descricao}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="font-mono text-xs text-slate-500">{selectedItem.codigoItem}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs text-slate-500">{selectedItem.codigoSAP}</span>
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

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Estoque Status */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      Status de Estoque
                    </h3>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">QTD ENT</p>
                        <p className="text-lg font-bold text-slate-700">{selectedItem.saldo.toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">{selectedItem.um}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">QTD DSP</p>
                        <p className="text-lg font-bold text-emerald-600">{selectedItem.disponivel.toLocaleString('pt-BR')} <span className="text-sm font-normal text-emerald-600/70">{selectedItem.um}</span></p>
                      </div>
                    </div>

                    <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-100/50">
                      <p className="text-xs text-orange-600/70 mb-1 font-medium">Quantidade Requisitada (QTD REQ)</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-orange-600">{selectedItem.qtdRsv.toLocaleString('pt-BR')} <span className="text-sm font-normal text-orange-600/70">{selectedItem.um}</span></p>
                        {selectedItem.qtdRsv > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                            Material Reservado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações de Requisição */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Detalhes da Destinação
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Requisitante</p>
                          <p className="text-sm font-medium text-slate-700">{selectedItem.requisitante}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Área de Destino</p>
                          <p className="text-sm font-medium text-slate-700">{selectedItem.areaDestino}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Projeto / Centro de Custo</p>
                          <p className="text-sm font-medium text-slate-700">{selectedItem.projeto} • {selectedItem.cCusto}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <hr className="my-6 border-slate-100" />

                {/* Additional Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3" /> Endereço</p>
                    <p className="text-sm font-medium text-slate-700">{selectedItem.endereco}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><User className="w-3 h-3" /> Planejador</p>
                    <p className="text-sm font-medium text-slate-700">{selectedItem.planejador}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">Pedido (PO)</p>
                    <p className="text-sm font-medium text-slate-700 font-mono text-xs">{selectedItem.pedidoPo}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">Valor Total</p>
                    <p className="text-sm font-medium text-slate-700">R$ {selectedItem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
