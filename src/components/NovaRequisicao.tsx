import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, ShoppingCart, ArrowRight, CheckCircle, FileText, X, Pencil, Check, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';
import { OrbitaIcon } from './OrbitaIcon';

export function NovaRequisicao({ onClose, userName = 'João Silva' }: { onClose?: () => void, userName?: string }) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [step, setStep] = useState<number | 'loading'>(1);
  const [searchType, setSearchType] = useState('Geral');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [tipoRetirada, setTipoRetirada] = useState<'balcao' | 'entrega'>('balcao');
  const [observacao, setObservacao] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('Av. Industrial, 1000 - Galpão 3, Área Industrial');
  const [isEditingEndereco, setIsEditingEndereco] = useState(false);
  const [tempEndereco, setTempEndereco] = useState('');
  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [matriculaRecebedor, setMatriculaRecebedor] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [allAvailableStock, setAllAvailableStock] = useState<any[]>([]);
  const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false);
  const [modalSelected, setModalSelected] = useState<Record<string, number>>({});
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    setIsSearching(true);
    const db = await fetchDb();
    
    // Map db.estoque to dynamically compute up-to-date disponivel balance based on active/pending reservations
    const activeRequisitions = db.requisicoes || [];
    const estoqueWithDynamicDisp = (db.estoque || []).map((estItem: any) => {
      const estCode = (estItem.codigoSAP || estItem.codigoItem || '').toUpperCase();
      const totalReqQty = activeRequisitions
        .filter((req: any) => 
          req.statusAprovacao !== 'Cancelado' && 
          req.statusAprovacao !== 'Rejeitado' &&
          req.statusLogistico !== 'Entregue' &&
          req.statusLogistico !== 'Retirado' &&
          req.statusLogistico !== 'Recebido'
        )
        .reduce((sum: number, req: any) => {
          const reqItem = (req.itens || []).find((i: any) => (i.codigo || '').toUpperCase() === estCode);
          return sum + (reqItem ? Number(reqItem.quantidade || 0) : 0);
        }, 0);

      return {
        ...estItem,
        disponivel: Math.max(0, Number(estItem.saldo || 0) - totalReqQty)
      };
    });

    const searchLower = searchValue.trim().toLowerCase();
    const searchResults = estoqueWithDynamicDisp.filter((item: any) => 
      item.nfEntrada?.toLowerCase().includes(searchLower) ||
      item.pedidoPo?.toLowerCase().includes(searchLower) ||
      item.projeto?.toLowerCase().includes(searchLower) ||
      item.codigoSAP?.toLowerCase().includes(searchLower) ||
      item.codigoItem?.toLowerCase().includes(searchLower) ||
      item.descricao?.toLowerCase().includes(searchLower)
    );
    
    await new Promise(resolve => setTimeout(resolve, 600));

    if (searchResults.length === 0) {
      setErrorMessage('"Não encontrado" Verifique o número se está correto.');
      setIsSearching(false);
      return;
    }

    // Map each search result to include the image from db.items
    const resultsWithImages = searchResults.map((estItem: any) => {
      const baseItem = (db.items || []).find((i: any) => {
        if (i.codigoItem && estItem.codigoItem && estItem.codigoItem !== '-' && i.codigoItem !== '-') {
          return i.codigoItem.toUpperCase() === estItem.codigoItem.toUpperCase();
        }
        if (i.descricao && estItem.descricao) {
          return i.descricao.toUpperCase() === estItem.descricao.toUpperCase();
        }
        return i.codigoSAP && estItem.codigoSAP && i.codigoSAP.toUpperCase() === estItem.codigoSAP.toUpperCase();
      });
      return {
        ...estItem,
        imagem: baseItem?.foto || null
      };
    });

    setResults(resultsWithImages);

    // Load all available stock items in the database that have status 'Disponível'
    const availableMapped = estoqueWithDynamicDisp
      .filter((item: any) => {
        const statusStr = (item.status || 'Disponível').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return statusStr === 'disponivel';
      })
      .map((estItem: any) => {
        const baseItem = (db.items || []).find((i: any) => {
          if (i.codigoItem && estItem.codigoItem && estItem.codigoItem !== '-' && i.codigoItem !== '-') {
            return i.codigoItem.toUpperCase() === estItem.codigoItem.toUpperCase();
          }
          if (i.descricao && estItem.descricao) {
            return i.descricao.toUpperCase() === estItem.descricao.toUpperCase();
          }
          return i.codigoSAP && estItem.codigoSAP && i.codigoSAP.toUpperCase() === estItem.codigoSAP.toUpperCase();
        });
        return {
          ...estItem,
          imagem: baseItem?.foto || null
        };
      });
    setAllAvailableStock(availableMapped);
    
    // Resolve real project information from searchResults
    const firstItem = searchResults[0];
    let projNome = "-";
    let projCentroCusto = "-";
    let projStatus = "Sem Saldo";

    if (firstItem) {
      // Find matching project in db.projetos by elementoPep
      const proj = (db.projetos || []).find((p: any) => 
        p.elementoPep?.toLowerCase() === firstItem.projeto?.toLowerCase()
      );
      if (proj) {
        projNome = proj.nomeProjeto;
        projCentroCusto = proj.pepRaiz || "-";
        projStatus = "Ativo";
      } else {
        projNome = firstItem.projeto || "-";
        projCentroCusto = firstItem.cCusto || "-";
        projStatus = firstItem.disponivel > 0 ? "Ativo" : "Sem Saldo";
      }
    } else {
      projNome = searchValue.trim();
      projCentroCusto = "-";
      projStatus = "Inativo";
    }

    setProjectInfo({
      codigo: searchValue.trim(),
      nome: projNome,
      centroCusto: projCentroCusto,
      status: projStatus
    });
    setIsSearching(false);
    setStep(2);
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
    const item = cart.find(i => i.id === id);
    if (item && qtd > item.disponivel) {
      setErrorMessage(`Não é possível solicitar mais do que a quantidade disponível (${item.disponivel} ${item.um || 'UN'}).`);
      setCart(cart.map(i => i.id === id ? { ...i, quantidadeSolicitada: item.disponivel } : i));
      return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, quantidadeSolicitada: qtd } : i));
  };

  const submitRequisicao = async () => {
    setStep('loading');
    const db = await fetchDb();
    
    // Look up logged-in user in db.requisitantes to find their matricula
    const matchedReq = (db.requisitantes || []).find((r: any) => r.nome?.toLowerCase() === userName.toLowerCase());
    const userMatricula = matchedReq ? matchedReq.matricula : '98120';

    const todayDateStr = new Date().toLocaleDateString('pt-BR');

    const novaReq = {
      id: String(Date.now()),
      requisicao: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requisitante: userName,
      matricula: userMatricula,
      projetoDestino: projectInfo ? projectInfo.nome : 'Estoque Geral',
      localDestino: tipoRetirada === 'entrega' ? enderecoEntrega : 'Balcão',
      tipoSaida: tipoRetirada === 'entrega' ? 'ENTREGA' : 'BALCÃO CMP',
      statusAprovacao: 'Aguardando',
      statusLogistico: 'Aguardando',
      dataDesejada: todayDateStr,
      detalhesAprovador: {
        nome: 'Roberto Costa',
        cargo: 'Gerente de Manutenção',
        dataSolicitacao: todayDateStr + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
      itens: cart.map(item => ({
        codigo: item.codigoSAP,
        descricao: item.descricao,
        quantidade: item.quantidadeSolicitada,
        endereco: item.endereco || 'A-01-01'
      }))
    };

    db.requisicoes = [novaReq, ...(db.requisicoes || [])];
    await saveDb(db); // Sync to GitHub in the background asynchronously

    // Simulate loading for 2 seconds, then transition back and close
    setTimeout(() => {
      setStep(1);
      setCart([]);
      setSearchValue('');
      if (onClose) onClose();
    }, 2000);
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
      {step === 'loading' ? (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center pointer-events-auto"
            >
              <OrbitaIcon spinning={true} className="w-14 h-14" />
            </motion.div>
          </div>
        </>
      ) : (
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
                 <AnimatePresence mode="wait">
                   {isSearching ? (
                     <motion.div 
                       key="searching"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       transition={{ duration: 0.3 }}
                       className="w-full flex flex-col items-center justify-center py-20 h-64"
                     >
                       <OrbitaIcon spinning={true} className="w-14 h-14" />
                     </motion.div>
                   ) : (
                     <motion.div 
                       key="search-form"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                       transition={{ duration: 0.3 }}
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
                               Buscar <ArrowRight className="w-4 h-4" />
                             </button>
                           </div>
                       </form>
                     </motion.div>
                   )}
                 </AnimatePresence>
               )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors mt-1">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h2 className="font-bold text-[#0C2340] text-lg">{getSearchTypeLabel(searchValue)}</h2>
                        {projectInfo ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium text-slate-700">Projeto / PEP: <span className="font-normal text-slate-600">{projectInfo.nome}</span></p>
                            <div className="flex items-center gap-4">
                              <p className="text-xs text-slate-500">Centro de Custo / Raiz: {projectInfo.centroCusto}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 mt-1">Tipo de busca: {searchType}</p>
                        )}
                      </div>
                    </div>
                  </div>
                    {/* Local Filter Memo */}
                    {(() => {
                      // Sort: status === 'Projeto' comes first
                      const sortedResults = [...results].sort((a, b) => {
                        const statusA = a.status || 'Disponível';
                        const statusB = b.status || 'Disponível';
                        if (statusA === 'Projeto' && statusB !== 'Projeto') return -1;
                        if (statusA !== 'Projeto' && statusB === 'Projeto') return 1;
                        return 0;
                      });

                      // Include all items in the cart so that they remain visible in the main screen selection list
                      const cartItemsNotInResults = cart.filter(cartItem => !sortedResults.some(r => r.id === cartItem.id));
                      const baseList = [...cartItemsNotInResults, ...sortedResults];

                      const filteredResults = baseList.filter(item => {
                        const query = filterQuery.toLowerCase().trim();
                        if (!query) return true;
                        return (
                          item.codigoItem?.toLowerCase().includes(query) ||
                          item.codigoSAP?.toLowerCase().includes(query) ||
                          item.descricao?.toLowerCase().includes(query)
                        );
                      });

                      return (
                        <>
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700">
                                  Materiais para Solicitação
                                </span>
                                <span className="text-xs text-slate-400 font-normal">
                                  ({cart.length} {cart.length === 1 ? 'item selecionado' : 'itens selecionados'})
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                {/* Toggle Switch */}
                                <div className="flex items-center gap-2 select-none">
                                  <span className="text-xs text-slate-500 font-semibold">Disponíveis</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const db = await fetchDb(true);
                                      const allEstoque = db.estoque || [];
                                      const availableMapped = allEstoque
                                        .filter((item: any) => {
                                          const statusStr = (item.status || 'Disponível').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                          return statusStr === 'disponivel';
                                        })
                                        .map((estItem: any) => {
                                          const baseItem = (db.items || []).find((i: any) => {
                                            if (i.codigoItem && estItem.codigoItem && estItem.codigoItem !== '-' && i.codigoItem !== '-') {
                                              return i.codigoItem.toUpperCase() === estItem.codigoItem.toUpperCase();
                                            }
                                            if (i.descricao && estItem.descricao) {
                                              return i.descricao.toUpperCase() === estItem.descricao.toUpperCase();
                                            }
                                            return i.codigoSAP && estItem.codigoSAP && i.codigoSAP.toUpperCase() === estItem.codigoSAP.toUpperCase();
                                          });
                                          return {
                                            ...estItem,
                                            imagem: baseItem?.foto || null
                                          };
                                        });
                                      setAllAvailableStock(availableMapped);
                                      
                                      // Pre-populate modal selected items with items in the cart
                                      const initialSelected: Record<string, number> = {};
                                      cart.forEach(cartItem => {
                                        if (availableMapped.some(item => item.id === cartItem.id)) {
                                          initialSelected[cartItem.id] = cartItem.quantidadeSolicitada;
                                        }
                                      });
                                      setModalSelected(initialSelected);
                                      setIsAvailableModalOpen(true);
                                    }}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isAvailableModalOpen ? 'bg-[#00B4F1]' : 'bg-slate-200'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isAvailableModalOpen ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                <div className="relative w-full sm:w-72">
                                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="text"
                                    placeholder="Filtrar por código ou descrição..."
                                    value={filterQuery}
                                    onChange={(e) => setFilterQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#00B4F1] focus:ring-1 focus:ring-[#00B4F1] transition-all text-slate-700"
                                  />
                                  {filterQuery && (
                                    <button 
                                      onClick={() => setFilterQuery('')} 
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {showOnlyAvailable ? (
                              /* Grid Mode (Ecommerce card grid) */
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 overflow-auto max-h-[500px] bg-slate-50/30">
                                {filteredResults.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 col-span-full">
                                    Nenhum material disponível encontrado com o filtro aplicado.
                                  </div>
                                ) : (
                                  filteredResults.map(item => {
                                    const cartItem = cart.find(i => i.id === item.id);
                                    const isAdded = !!cartItem;
                                    return (
                                      <div 
                                        key={item.id} 
                                        className={`bg-white border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                                          isAdded ? 'border-[#00B4F1] ring-1 ring-[#00B4F1]' : 'border-slate-200'
                                        }`}
                                      >
                                        <div>
                                          {/* Image Container */}
                                          <div className="w-full aspect-square rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-3 relative group border-0">
                                            {item.imagem ? (
                                              <img src={item.imagem} alt={item.descricao} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                              <ImageIcon className="w-8 h-8 text-slate-300" />
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100">
                                              {item.um || 'UN'}
                                            </div>
                                          </div>

                                          {/* Item Info */}
                                          <h4 className="font-bold text-slate-800 text-sm line-clamp-2 h-10 mb-1 leading-tight" title={item.descricao}>
                                            {item.descricao}
                                          </h4>
                                          <p className="text-[11px] text-slate-400 font-mono font-semibold mb-3">Item: {item.codigoItem}</p>
                                          
                                          {/* Stock Info tag */}
                                          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <span>Disponível:</span>
                                            <strong className="text-emerald-600 font-bold">{item.disponivel} {item.um}</strong>
                                          </div>
                                        </div>

                                        {/* Action area */}
                                        <div className="mt-auto pt-2">
                                          {isAdded ? (
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                                                <span className="text-xs font-semibold text-slate-500 pl-1">Qtd:</span>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  max={item.disponivel}
                                                  value={cartItem.quantidadeSolicitada}
                                                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                                  className="w-16 bg-transparent text-right text-sm font-bold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-xs font-bold text-slate-500 font-mono pr-1">{item.um}</span>
                                              </div>
                                              <button 
                                                onClick={() => removeFromCart(item.id)} 
                                                className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                              >
                                                <X className="w-3.5 h-3.5" /> Remover
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => addToCart(item)}
                                              className="w-full py-2 bg-[#00B4F1] hover:bg-[#00B4F1]/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                              <Plus className="w-3.5 h-3.5" /> Selecionar
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            ) : (
                              /* List Mode (Standard row layout) */
                              <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
                                {filteredResults.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400">
                                    Nenhum material encontrado com o filtro aplicado.
                                  </div>
                                ) : (
                                  filteredResults.map(item => {
                                    const cartItem = cart.find(i => i.id === item.id);
                                    const isAdded = !!cartItem;
                                    return (
                                      <div key={item.id} className={`p-4 flex items-center justify-between hover:bg-slate-50/40 transition-all duration-200 gap-4 ${isAdded ? 'bg-slate-50/30' : ''}`}>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {/* Item Image */}
                                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.imagem ? (
                                              <img src={item.imagem} alt={item.descricao} className="w-full h-full object-cover" />
                                            ) : (
                                              <ImageIcon className="w-5 h-5 text-slate-400" />
                                            )}
                                          </div>
                                          <div className="truncate flex-1">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{item.descricao}</p>
                                            <p className="text-[11px] text-slate-400 font-mono font-semibold mt-0.5">{item.codigoItem}</p>
                                          </div>
                                          <div className="hidden sm:flex flex-col items-end shrink-0 pl-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">QTD MAX</span>
                                            <span className="text-xs font-bold text-emerald-600">{item.disponivel} {item.um}</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                          {isAdded ? (
                                            <>
                                              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5">
                                                <input
                                                  type="number"
                                                  min="1"
                                                  max={item.disponivel}
                                                  value={cartItem.quantidadeSolicitada}
                                                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                                  className="w-14 bg-transparent text-center text-sm font-bold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-xs font-bold text-slate-500 pr-1 font-mono">{item.um}</span>
                                              </div>
                                              <button 
                                                onClick={() => removeFromCart(item.id)} 
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-all duration-150"
                                                title="Desmarcar"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              onClick={() => addToCart(item)}
                                              className="px-4 py-1.5 bg-[#00B4F1] hover:bg-[#00B4F1]/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                            >
                                              <Plus className="w-3.5 h-3.5" /> Selecionar
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}

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

            </div>
          </div>
            
        </motion.div>
      </div>
    </>
  )}

      {/* Custom Toast Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-[#0C2340] border border-slate-700/50 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-md w-[90vw]"
          >
            <p className="text-sm font-semibold flex-1 leading-snug">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Estoque Disponível */}
      <AnimatePresence>
        {isAvailableModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto border border-slate-200"
            >
              {/* Header */}
              <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0C2340] text-lg">Material Disponível</h3>
                  <p className="text-xs text-slate-500">Selecione os materiais e defina as quantidades para adicionar à requisição</p>
                </div>
                <button
                  onClick={() => setIsAvailableModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-header with Search Filter inside modal */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar estoque por código SAP, descrição..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#00B4F1] focus:ring-1 focus:ring-[#00B4F1] transition-all text-slate-700"
                  />
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List in Modal */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 min-h-[250px]">
                {(() => {
                  const filtered = allAvailableStock.filter(item => {
                    const q = modalSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      item.codigoItem?.toLowerCase().includes(q) ||
                      item.codigoSAP?.toLowerCase().includes(q) ||
                      item.descricao?.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400">
                        Nenhum material disponível encontrado no estoque.
                      </div>
                    );
                  }

                  return filtered.map(item => {
                    const isSelected = item.id in modalSelected;
                    const selectedQty = modalSelected[item.id] || 1;

                    return (
                      <div
                        key={item.id}
                        className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          isSelected ? 'bg-[#00B4F1]/5 -mx-4 px-4 sm:-mx-6 sm:px-6' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Item Image */}
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.imagem ? (
                              <img src={item.imagem} alt={item.descricao} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="truncate flex-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">{item.descricao}</p>
                            <p className="text-[11px] text-slate-400 font-mono font-semibold mt-0.5">{item.codigoSAP}</p>
                          </div>
                          <div className="hidden md:flex flex-col items-end shrink-0 pl-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">QTD MAX</span>
                            <span className="text-xs font-bold text-emerald-600">{item.disponivel} {item.um}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          {/* Mobile Qtd Max display */}
                          <div className="flex md:hidden flex-col items-start">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">QTD MAX</span>
                            <span className="text-xs font-bold text-emerald-600">{item.disponivel} {item.um}</span>
                          </div>

                          {isSelected ? (
                            <div className="flex items-center gap-3">
                              {/* Quantity Selector */}
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = Math.max(1, selectedQty - 1);
                                    setModalSelected({ ...modalSelected, [item.id]: nextQty });
                                  }}
                                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded font-bold transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.disponivel}
                                  value={selectedQty}
                                  onChange={(e) => {
                                    const val = Math.min(item.disponivel, Math.max(1, Number(e.target.value)));
                                    setModalSelected({ ...modalSelected, [item.id]: val });
                                  }}
                                  className="w-12 bg-transparent text-center text-sm font-bold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = Math.min(item.disponivel, selectedQty + 1);
                                    setModalSelected({ ...modalSelected, [item.id]: nextQty });
                                  }}
                                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded font-bold transition-colors"
                                >
                                  +
                                </button>
                                <span className="text-xs font-semibold text-slate-400 px-1 font-mono">{item.um}</span>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = { ...modalSelected };
                                  delete updated[item.id];
                                  setModalSelected(updated);
                                }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all"
                              >
                                Remover
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setModalSelected({ ...modalSelected, [item.id]: 1 });
                              }}
                              className="px-4 py-1.5 bg-[#00B4F1] hover:bg-[#00B4F1]/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Selecionar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {Object.keys(modalSelected).length} itens selecionados
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAvailableModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const newCart = [...cart];
                      Object.entries(modalSelected).forEach(([id, qty]) => {
                        const item = allAvailableStock.find(i => i.id === id);
                        if (item) {
                          const cartIdx = newCart.findIndex(c => c.id === id);
                          if (cartIdx > -1) {
                            newCart[cartIdx].quantidadeSolicitada = qty;
                          } else {
                            newCart.push({ ...item, quantidadeSolicitada: qty });
                          }
                        }
                      });
                      setCart(newCart);
                      setIsAvailableModalOpen(false);
                    }}
                    className="px-5 py-2 bg-[#00B4F1] hover:bg-[#00B4F1]/90 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    Confirmar Seleção
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}