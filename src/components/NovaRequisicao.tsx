import React, { useState } from 'react';
import { Search, Package, Plus, ShoppingCart, ArrowRight, CheckCircle, FileText, X, Pencil, Check } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

export function NovaRequisicao({ onClose }: { onClose?: () => void }) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [searchType, setSearchType] = useState('Geral');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [tipoRetirada, setTipoRetirada] = useState<'balcao' | 'entrega'>('balcao');
  const [observacao, setObservacao] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('Av. Industrial, 1000 - Galpão 3, Área Industrial');
  const [isEditingEndereco, setIsEditingEndereco] = useState(false);
  const [tempEndereco, setTempEndereco] = useState('');
  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [matriculaRecebedor, setMatriculaRecebedor] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue) return;
    
    setIsSearching(true);
    // Mock search
    setTimeout(() => {
      setProjectInfo({
        codigo: searchValue,
        nome: "Manutenção Preventiva - Linha de Produção 1",
        centroCusto: "CC-90123",
        status: "Ativo"
      });
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

  const getSearchTypeLabel = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length === 44 || numbersOnly.length === 9) return `Nota Fiscal: ${value}`;
    if (numbersOnly.length === 10) return `Pedido: ${value}`;
    if (value.length >= 11) return `Elemento PEP: ${value}`;
    return `Resultados para: ${value}`;
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
          className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-7xl max-h-[90vh]"
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
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="w-full max-w-6xl mx-auto space-y-6">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center w-full py-12"
                >
                  <form onSubmit={handleSearch} className="w-full flex items-center justify-center">
                      <div className="relative flex items-center border border-slate-300 focus-within:border-[#00B4F1] rounded-xl p-1.5 bg-white shadow-sm focus-within:shadow-[0_0_0_3px_rgba(0,180,241,0.15)] transition-all w-full max-w-2xl">
                        <Search className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Digite a Nota Fiscal, Elemento PEP ou Pedido..."
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-slate-700 text-base"
                        />
                        <button
                          type="submit"
                          disabled={!searchValue || isSearching}
                          className="px-8 py-3 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                        >
                          {isSearching ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>Buscar <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors mt-1">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h2 className="font-bold text-[#0C2340] text-lg">{getSearchTypeLabel(searchValue)}</h2>
                        {projectInfo ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium text-slate-700">Projeto: <span className="font-normal text-slate-600">{projectInfo.nome}</span></p>
                            <div className="flex items-center gap-4">
                              <p className="text-xs text-slate-500">Centro de Custo: {projectInfo.centroCusto}</p>
                              <p className="text-xs text-slate-500">Status: <span className="text-green-600 font-medium">{projectInfo.status}</span></p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 mt-1">Tipo de busca: {searchType}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200/60">
                        <span className="text-sm font-medium text-slate-700">{cart.length} itens selecionados</span>
                      </div>
                      <button className="px-4 py-2 text-slate-600 hover:text-[#0C2340] hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors border border-slate-200 flex items-center gap-2">
                        Empréstimo de material
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 bg-slate-50/60 font-bold text-slate-700 flex items-center justify-between">
                        <span className="text-sm">
                          Materiais Disponíveis
                        </span>
                        <span className="text-xs font-normal text-slate-500">
                          {results.length} encontrado{results.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
                        {results.map(item => {
                          const isAdded = cart.some(i => i.id === item.id);
                          return (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-all duration-200 gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-xs text-slate-400 font-mono font-semibold shrink-0">
                                  {item.codigoSAP}
                                </span>
                                <div className="truncate flex-1">
                                  <p className="font-semibold text-slate-800 text-sm truncate">{item.descricao}</p>
                                </div>
                                <div className="hidden sm:flex flex-col items-end shrink-0 pl-2">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DISPONÍVEL</span>
                                  <span className="text-xs font-bold text-emerald-600">{item.disponivel} {item.um}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={isAdded}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  isAdded 
                                    ? 'bg-transparent text-emerald-600 border border-transparent cursor-default' 
                                    : 'bg-[#00B4F1] hover:bg-[#00B4F1]/90 text-white shadow-sm active:scale-90'
                                }`}
                              >
                                {isAdded ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Carrinho */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                        Sua Requisição
                      </div>
                      <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                            <p>Nenhum item adicionado ainda.</p>
                          </div>
                        ) : (
                          cart.map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-all duration-150">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-xs text-slate-400 font-mono font-semibold shrink-0">
                                  {item.codigoSAP}
                                </span>
                                <div className="truncate flex-1">
                                  <p className="font-semibold text-slate-800 text-sm truncate">{item.descricao}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DISPONÍVEL:</span>
                                    <span className="text-xs font-bold text-emerald-600">{item.disponivel} {item.um}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2 bg-slate-50/80 border border-transparent rounded-lg p-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.disponivel}
                                    value={item.quantidadeSolicitada}
                                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                    className="w-14 bg-transparent text-center text-base font-bold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-xs font-bold text-slate-500 pr-2 font-mono">{item.um}</span>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className="text-slate-400 hover:text-red-500 transition-all duration-150"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
                    >
                      <h3 className="font-bold text-[#0C2340] mb-6 border-b border-slate-100 pb-3">Informações da Requisição</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Aprovador (Planejador)</h4>
                            <div className="p-4 rounded-lg border border-slate-200 flex flex-col gap-1">
                              <p className="text-sm font-bold text-[#0C2340]">Carlos Roberto (Planejamento Manutenção)</p>
                              <p className="text-sm text-slate-500">Matrícula: 123456</p>
                              <p className="text-sm text-slate-500">Chave C0: C0-12A4</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Tipo de Retirada</h4>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="retirada" 
                                  value="balcao"
                                  checked={tipoRetirada === 'balcao'}
                                  onChange={(e) => setTipoRetirada(e.target.value as 'balcao' | 'entrega')}
                                  className="w-4 h-4 text-[#0C2340] focus:ring-[#0C2340]"
                                />
                                <span className="text-sm font-medium text-slate-700">Balcão</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="retirada" 
                                  value="entrega"
                                  checked={tipoRetirada === 'entrega'}
                                  onChange={(e) => setTipoRetirada(e.target.value as 'balcao' | 'entrega')}
                                  className="w-4 h-4 text-[#0C2340] focus:ring-[#0C2340]"
                                />
                                <span className="text-sm font-medium text-slate-700">Entrega</span>
                              </label>
                            </div>
                          </div>

                          {tipoRetirada === 'entrega' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }}
                            >
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">Endereço de Entrega</h4>
                              <div className="p-4 rounded-lg border border-slate-200 flex items-start justify-between gap-4 min-h-[72px]">
                                {isEditingEndereco ? (
                                  <div className="w-full flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={tempEndereco}
                                      onChange={(e) => setTempEndereco(e.target.value)}
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-[#0C2340] focus:outline-none focus:border-[#00B4F1] focus:ring-1 focus:ring-[#00B4F1]"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEnderecoEntrega(tempEndereco);
                                          setIsEditingEndereco(false);
                                        }}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                        title="Salvar"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setIsEditingEndereco(false)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Cancelar"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <p className="text-sm font-medium text-[#0C2340]">{enderecoEntrega}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setTempEndereco(enderecoEntrega);
                                        setIsEditingEndereco(true);
                                      }}
                                      className="text-slate-400 hover:text-[#00B4F1] transition-colors p-1"
                                      title="Editar endereço"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {tipoRetirada === 'balcao' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-700">Dados do Recebedor</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNomeRecebedor('Sem dados');
                                    setMatriculaRecebedor('Sem dados');
                                  }}
                                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                                >
                                  Sem dados
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Nome</label>
                                  <input
                                    type="text"
                                    value={nomeRecebedor}
                                    onChange={(e) => setNomeRecebedor(e.target.value)}
                                    placeholder="Nome completo"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-[#0C2340] focus:outline-none focus:border-[#00B4F1] focus:ring-1 focus:ring-[#00B4F1]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Matrícula</label>
                                  <input
                                    type="text"
                                    value={matriculaRecebedor}
                                    onChange={(e) => setMatriculaRecebedor(e.target.value)}
                                    placeholder="Ex: 123456"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-[#0C2340] focus:outline-none focus:border-[#00B4F1] focus:ring-1 focus:ring-[#00B4F1]"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex flex-col h-full">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Observação (Opcional)</h4>
                          <textarea
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Adicione informações adicionais ou justificativa da requisição..."
                            className="flex-1 w-full min-h-[120px] p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] resize-none"
                          />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={submitRequisicao}
                          className="px-8 py-3 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white rounded-lg font-bold transition-colors w-full md:w-auto"
                        >
                          Finalizar Requisição
                        </button>
                      </div>
                    </motion.div>
                  )}
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