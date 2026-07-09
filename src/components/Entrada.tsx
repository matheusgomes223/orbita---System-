import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Package, FileText, Check, AlertTriangle, Building, Tag, ChevronDown, Download, ShoppingCart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';

export function Entrada() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Header Form State
  const [headerData, setHeaderData] = useState({
    numDoc: '',
    notaFiscal: '',
    pedidoCompra: '',
    fornecedor: '',
    projetoPep: '',
    planejador: '',
    enderecoArmazenagem: '',
    patrimonio: '',
    classificacao: 'C',
    divergente: false
  });

  // Shopping Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [allRegisteredItems, setAllRegisteredItems] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEntradas(db.entradas || []);
      setAllRegisteredItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setHeaderData(prev => ({ ...prev, [name]: val }));
  };

  // Filter items based on search input
  const filteredSearchItems = itemSearchValue.trim() === '' 
    ? [] 
    : allRegisteredItems.filter(item => 
        item.codigoSAP?.toLowerCase().includes(itemSearchValue.toLowerCase()) ||
        item.descricao?.toLowerCase().includes(itemSearchValue.toLowerCase())
      );

  const addToCart = (item: any) => {
    if (!cart.find(i => i.id === item.id)) {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setItemSearchValue('');
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const updateCartQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const handleCadastrar = async () => {
    if (!headerData.notaFiscal) {
      alert('Por favor, preencha os campos obrigatórios (Nota Fiscal).');
      return;
    }
    if (cart.length === 0) {
      alert('Por favor, adicione pelo menos um item à entrada.');
      return;
    }

    const docNum = headerData.numDoc || `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
    const db = await fetchDb();
    
    // 1. Create entry records
    const newEntries = cart.map(item => ({
      id: `${Date.now()}-${item.id}`,
      numDoc: docNum,
      notaFiscal: headerData.notaFiscal,
      fornecedor: headerData.fornecedor || 'N/A',
      codigoItem: item.codigoSAP,
      descricao: item.descricao,
      quantidade: item.quantity,
      und: item.und || 'UN',
      data: new Date().toLocaleDateString('pt-BR'),
      divergente: headerData.divergente
    }));

    const updatedEntradas = [...newEntries, ...entradas];
    setEntradas(updatedEntradas);
    db.entradas = updatedEntradas;

    // 2. Create physical inventory (estoque) records
    const newEstoqueItems = cart.map(item => ({
      id: `${Date.now()}-${item.id}-estoque`,
      descricao: item.descricao,
      codigoItem: item.codigoSAP,
      codigoSAP: item.codigoSAP,
      saldo: item.quantity,
      qtdRsv: 0,
      disponivel: item.quantity,
      um: item.und || 'UN',
      endereco: headerData.enderecoArmazenagem || '-',
      abc: headerData.classificacao || 'C',
      planejador: headerData.planejador || '-',
      pedidoPo: headerData.pedidoCompra || '-',
      cCusto: '-',
      projeto: headerData.projetoPep || '-',
      valorTotal: (item.valor || 0) * item.quantity,
      nfEntrada: headerData.notaFiscal,
      dataEntrada: new Date().toLocaleDateString('pt-BR'),
      requisitante: '-',
      areaDestino: '-',
      partNumber: item.partNumber || '-',
      regEntrada: docNum
    }));

    db.estoque = [...newEstoqueItems, ...(db.estoque || [])];
    await saveDb(db);

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setHeaderData({
      numDoc: '',
      notaFiscal: '',
      pedidoCompra: '',
      fornecedor: '',
      projetoPep: '',
      planejador: '',
      enderecoArmazenagem: '',
      patrimonio: '',
      classificacao: 'C',
      divergente: false
    });
    setCart([]);
    setItemSearchValue('');
  };

  const filteredEntradas = entradas.filter(entrada => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(entrada).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar entradas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] transition-all"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0C2340] hover:bg-[#0a1d36] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Entrada
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-slate-600">Num Doc</th>
              <th className="py-3 px-4 font-semibold text-slate-600">Nota Fiscal</th>
              <th className="py-3 px-4 font-semibold text-slate-600">Data</th>
              <th className="py-3 px-4 font-semibold text-slate-600">Fornecedor</th>
              <th className="py-3 px-4 font-semibold text-slate-600">Item</th>
              <th className="py-3 px-4 font-semibold text-slate-600">Status</th>
              <th className="py-3 px-4 font-semibold text-slate-600 w-10 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntradas.map((entrada) => (
              <tr key={entrada.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4 font-mono text-slate-600">{entrada.numDoc}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{entrada.notaFiscal}</td>
                <td className="py-3 px-4 text-slate-600">{entrada.data}</td>
                <td className="py-3 px-4 text-slate-600">{entrada.fornecedor}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-slate-500">{entrada.codigoItem}</span>
                    <span className="text-slate-700">{entrada.descricao}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {entrada.divergente ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                      <AlertTriangle className="w-3.5 h-3.5" /> Divergente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <Check className="w-3.5 h-3.5" /> Regular
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center relative">
                  <button 
                    onClick={() => setOpenDropdownId(openDropdownId === entrada.id ? null : entrada.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openDropdownId === entrada.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenDropdownId(null)}
                      />
                      <div className="absolute right-8 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                        <div className="px-4 py-2 text-xs text-slate-400 font-bold border-b border-slate-100">Quantidade</div>
                        <div className="px-4 py-2 text-sm text-slate-700 font-mono font-bold">{entrada.quantidade} {entrada.und}</div>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredEntradas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Nenhuma entrada registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Entrada */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
              onClick={closeModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-4xl max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nova Entrada de Material</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Preencha a documentação e adicione os itens ao carrinho de entrada.</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-6">
                  
                  {/* Seção 1: Documentação e Informações Base */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                      DOCUMENTAÇÃO E INFORMAÇÕES
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nota Fiscal <span className="text-rose-500">*</span></label>
                        <input 
                          name="notaFiscal" 
                          value={headerData.notaFiscal} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] font-mono" 
                          placeholder="Ex: NF-001928" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pedido de Compra</label>
                        <input 
                          name="pedidoCompra" 
                          value={headerData.pedidoCompra} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] font-mono" 
                          placeholder="Ex: PO-4592" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fornecedor</label>
                        <input 
                          name="fornecedor" 
                          value={headerData.fornecedor} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340]" 
                          placeholder="Nome do fornecedor" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Projeto PEP</label>
                        <input 
                          name="projetoPep" 
                          value={headerData.projetoPep} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] font-mono" 
                          placeholder="Ex: C018317" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Planejador</label>
                        <input 
                          name="planejador" 
                          value={headerData.planejador} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340]" 
                          placeholder="Nome do planejador" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Endereço de Armaz.</label>
                        <input 
                          name="enderecoArmazenagem" 
                          value={headerData.enderecoArmazenagem} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] font-mono" 
                          placeholder="Ex: A-01-01" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Patrimônio</label>
                        <input 
                          name="patrimonio" 
                          value={headerData.patrimonio} 
                          onChange={handleHeaderChange} 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340]" 
                          placeholder="Nº Patrimônio" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Classificação ABC</label>
                        <select 
                          name="classificacao" 
                          value={headerData.classificacao} 
                          onChange={handleHeaderChange} 
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] cursor-pointer"
                        >
                          <option value="A">A (Alto valor / Importância)</option>
                          <option value="B">B (Médio valor)</option>
                          <option value="C">C (Baixo valor / Consumo)</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                          <input 
                            type="checkbox" 
                            name="divergente" 
                            checked={headerData.divergente} 
                            onChange={handleHeaderChange}
                            className="w-4 h-4 rounded border-slate-300 text-[#0C2340] focus:ring-[#0C2340]" 
                          />
                          Entrada Divergente
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Carrinho de Materiais */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                      ITENS DA ENTRADA
                    </h3>

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={itemSearchValue}
                        onChange={(e) => setItemSearchValue(e.target.value)}
                        placeholder="Buscar item por código SAP ou descrição..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] transition-all"
                      />

                      {/* Dropdown Results */}
                      <AnimatePresence>
                        {filteredSearchItems.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto"
                          >
                            {filteredSearchItems.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{item.descricao}</p>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.codigoSAP} | Part: {item.partNumber || '-'}</p>
                                </div>
                                <span className="text-xs font-bold bg-[#00B4F1]/10 text-[#00B4F1] px-2 py-0.5 rounded-full">{item.und}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Cart Items Table */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Código SAP</th>
                            <th className="py-3 px-4">Descrição</th>
                            <th className="py-3 px-4 text-center w-36">Quantidade</th>
                            <th className="py-3 px-4 text-right w-16">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cart.map(item => (
                            <tr key={item.id} className="hover:bg-white transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.codigoSAP}</td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{item.descricao}</td>
                              <td className="py-2 px-4 text-center">
                                <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
                                  <button 
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                    className="w-7 h-7 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center transition-colors shadow-sm active:scale-95"
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateCartQuantity(item.id, Number(e.target.value))}
                                    className="w-12 text-center bg-transparent border-0 outline-none text-sm font-bold text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button 
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center transition-colors shadow-sm active:scale-95"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cart.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400">
                                <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                <p className="font-semibold text-sm">Carrinho de entrada vazio</p>
                                <p className="text-xs text-slate-400 mt-1">Busque e adicione itens para registrar a entrada.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                  <button 
                    onClick={closeModal}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCadastrar}
                    disabled={cart.length === 0}
                    className="px-6 py-2.5 bg-[#0C2340] hover:bg-[#0a1d36] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Registrar Entrada
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
