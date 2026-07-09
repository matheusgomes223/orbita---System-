import React, { useState, useEffect } from 'react';
import { Search, Filter, Tag, ImageIcon, X, MapPin, User, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb } from '../services/githubDb';
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
  const [estoque, setEstoque] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showEtiquetas, setShowEtiquetas] = useState(false);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEstoque(db.estoque || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Group inventory by SAP code to consolidate totals and list allocations
  const groupedEstoque = React.useMemo(() => {
    const groups: { [key: string]: any } = {};

    estoque.forEach(item => {
      const key = (item.codigoSAP || item.codigoItem || '').toUpperCase();
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
          imagem: item.imagem || null,
          allocations: []
        };
      }
      
      groups[key].saldo += Number(item.saldo || 0);
      groups[key].qtdRsv += Number(item.qtdRsv || 0);
      groups[key].disponivel += Number(item.disponivel || 0);
      groups[key].valorTotal += Number(item.valorTotal || 0);
      if (item.imagem && !groups[key].imagem) {
        groups[key].imagem = item.imagem;
      }
      
      groups[key].allocations.push(item);
    });

    return Object.values(groups);
  }, [estoque]);

  const filteredEstoque = groupedEstoque.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.descricao?.toLowerCase().includes(searchLower) ||
      item.codigoSAP?.toLowerCase().includes(searchLower) ||
      item.partNumber?.toLowerCase().includes(searchLower)
    );
  });

  if (showEtiquetas) {
    return <GeradorEtiquetas onClose={() => setShowEtiquetas(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
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
          
          {userRole !== 'requisitante' && (
            <button 
              onClick={() => setShowEtiquetas(true)}
              className="flex items-center justify-center p-2.5 rounded-lg text-slate-700 bg-transparent hover:bg-slate-50 transition-colors"
              title="Etiquetas"
            >
              <Tag className="w-4.5 h-4.5" />
            </button>
          )}
          {userRole === 'administrador' && (
            <button 
              className="flex items-center justify-center p-2.5 rounded-lg text-slate-700 bg-transparent hover:bg-slate-50 transition-colors"
              title="Filtros"
            >
              <Filter className="w-4.5 h-4.5" />
            </button>
          )}
          {userRole === 'almoxerife' && (
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

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <th className="p-4 w-20 text-center">Imagem</th>
              <th className="p-4 min-w-[200px]">Descrição</th>
              <th className="p-4">Código SAP</th>
              <th className="p-4">Part Number</th>
              <th className="p-4 text-right">QTD ENT</th>
              <th className="p-4 text-right">QTD REQ</th>
              <th className="p-4 text-right font-bold text-emerald-600">QTD DSP</th>
              <th className="p-4">UM</th>
              <th className="p-4 text-right">Valor Total (R$)</th>
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
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center border border-slate-200 mx-auto">
                    {item.imagem ? (
                      <img src={item.imagem} alt={item.descricao} className="w-full h-full object-cover rounded" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium text-[#0C2340] max-w-[250px] truncate" title={item.descricao}>{item.descricao}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.codigoSAP}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.partNumber}</td>
                <td className="p-4 text-right">{item.saldo.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-right text-orange-600">{item.qtdRsv.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/30">{item.disponivel.toLocaleString('pt-BR')}</td>
                <td className="p-4 text-slate-500">{item.um}</td>
                <td className="p-4 text-right font-medium">
                  {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
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
                      <span className="text-slate-300">•</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
                    Detalhamento de Destinações e Lotes
                  </h3>
                  
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm">
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
                        {selectedItem.allocations.map((alloc: any, idx: number) => (
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
    </div>
  );
}
