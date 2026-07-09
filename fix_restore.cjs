const fs = require('fs');

const content = `import React, { useState } from 'react';
import { Search, Package, Plus, ShoppingCart, ArrowRight, CheckCircle, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

export function NovaRequisicao({ onClose }: { onClose?: () => void }) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [searchType, setSearchType] = useState('Geral');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue) return;
    
    setIsSearching(true);
    // Mock search
    setTimeout(() => {
      setResults([
        { id: '1', codigoSAP: 'SAP-10293', descricao: 'Cimento Portland CP II', quantidade: 50, um: 'KG', disponivel: 1200 },
        { id: '2', codigoSAP: 'SAP-10294', descricao: 'Parafuso Sextavado 5/8', quantidade: 100, um: 'UN', disponivel: 5000 },
      ]);
      setIsSearching(false);
      setStep(2);
    }, 800);
  };

  const addToCart = (item: any) => {
    if (!cart.find(i => i.id === item.id)) {
      setCart([...cart, { ...item, quantidadeSolicitada: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, qtd: number) => {
    setCart(cart.map(i => i.id === id ? { ...i, quantidadeSolicitada: qtd } : i));
  };

  const submitRequisicao = () => {
    setStep(3);
  };

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
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-3xl max-h-full"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#0C2340]">Nova Requisição</h2>
                <p className="text-sm text-slate-500">Busque os materiais desejados utilizando um dos métodos abaixo.</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="w-full max-w-4xl mx-auto space-y-6">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center w-full"
                >
                  <form onSubmit={handleSearch} className="w-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center min-h-[200px]">
                      <div className="relative flex items-center border border-[#00B4F1] rounded-xl p-1.5 bg-white shadow-[0_0_0_3px_rgba(0,180,241,0.15)] transition-all w-full max-w-xl">
                        <Search className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Digite a Nota Fiscal, Elemento PEP ou Pedido..."
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-slate-700 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!searchValue || isSearching}
                          className="px-6 py-2 bg-[#8A95A5] hover:bg-[#737E8F] text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                        >
                          {isSearching ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>Buscar <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h2 className="font-bold text-[#0C2340]">Resultados para: {searchValue}</h2>
                        <p className="text-sm text-slate-500">Tipo de busca: {searchType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#00B4F1]/10 px-4 py-2 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-[#00B4F1]" />
                      <span className="font-bold text-[#00B4F1]">{cart.length} itens selecionados</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resultados */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                        <Package className="w-5 h-5 text-slate-400" />
                        Materiais Disponíveis
                      </div>
                      <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
                        {results.map(item => (
                          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-bold text-[#0C2340] text-sm">{item.descricao}</p>
                              <p className="text-xs text-slate-500 font-mono mt-1">{item.codigoSAP} • Disponível: {item.disponivel} {item.um}</p>
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              disabled={cart.some(i => i.id === item.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-[#00B4F1] hover:text-white"
                            >
                              {cart.some(i => i.id === item.id) ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Carrinho */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-slate-400" />
                        Sua Requisição
                      </div>
                      <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                            <p>Nenhum item adicionado ainda.</p>
                          </div>
                        ) : (
                          cart.map(item => (
                            <div key={item.id} className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-[#0C2340] text-sm truncate pr-4">{item.descricao}</p>
                                <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="1"
                                  max={item.disponivel}
                                  value={item.quantidadeSolicitada}
                                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:outline-none focus:border-[#00B4F1]"
                                />
                                <span className="text-sm font-medium text-slate-500">{item.um}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {cart.length > 0 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                          <button 
                            onClick={submitRequisicao}
                            className="w-full py-3 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white rounded-lg font-bold transition-colors"
                          >
                            Finalizar Requisição
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg mx-auto"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0C2340] mb-2">Requisição Enviada!</h2>
                  <p className="text-slate-500 mb-8">Sua requisição foi encaminhada para aprovação. Você pode acompanhar o status na listagem.</p>
                  <button 
                    onClick={() => {
                      setStep(1);
                      setCart([]);
                      setSearchValue('');
                      if (onClose) onClose();
                    }}
                    className="px-6 py-3 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white rounded-lg font-bold transition-colors"
                  >
                    Nova Requisição
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
`;

fs.writeFileSync('src/components/NovaRequisicao.tsx', content);
