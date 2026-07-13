import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Package, FileText, Check, AlertTriangle, Building, Tag, ChevronDown, Download, Trash2, Pencil } from 'lucide-react';
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
    classificacao: 'Investimento',
    divergente: false,
    status: 'Disponível'
  });

  // Shopping Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [allRegisteredItems, setAllRegisteredItems] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingNumDoc, setEditingNumDoc] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [allRegisteredProjects, setAllRegisteredProjects] = useState<any[]>([]);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [allRegisteredPlanners, setAllRegisteredPlanners] = useState<any[]>([]);
  const [showPlannerSuggestions, setShowPlannerSuggestions] = useState(false);
  const [allRegisteredAddresses, setAllRegisteredAddresses] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEntradas(db.entradas || []);
      setAllRegisteredItems(db.items || []);
      setAllRegisteredProjects(db.projetos || []);
      setAllRegisteredPlanners(db.planejadores || []);
      setAllRegisteredAddresses(db.enderecos || []);
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
    : allRegisteredItems.filter(item => {
        // Skip items that are already in the cart
        if (cart.some(cartItem => cartItem.id === item.id)) {
          return false;
        }
        return (
          item.codigoSAP?.toLowerCase().includes(itemSearchValue.toLowerCase()) ||
          item.codigoItem?.toLowerCase().includes(itemSearchValue.toLowerCase()) ||
          item.descricao?.toLowerCase().includes(itemSearchValue.toLowerCase())
        );
      });

  // Filter projects based on search input
  const filteredProjects = headerData.projetoPep.trim() === ''
    ? []
    : allRegisteredProjects.filter(p =>
        p.elementoPep?.toLowerCase().includes(headerData.projetoPep.toLowerCase()) ||
        p.nomeProjeto?.toLowerCase().includes(headerData.projetoPep.toLowerCase())
      );

  // Filter planners based on search input
  const filteredPlanners = headerData.planejador.trim() === ''
    ? []
    : allRegisteredPlanners.filter(p =>
        p.nome?.toLowerCase().includes(headerData.planejador.toLowerCase()) ||
        p.email?.toLowerCase().includes(headerData.planejador.toLowerCase())
      );

  // Filter storage addresses based on search input
  const filteredAddresses = headerData.enderecoArmazenagem.trim() === ''
    ? []
    : allRegisteredAddresses.filter(a =>
        a.codigo?.toLowerCase().includes(headerData.enderecoArmazenagem.toLowerCase()) ||
        a.local?.toLowerCase().includes(headerData.enderecoArmazenagem.toLowerCase()) ||
        a.descricao?.toLowerCase().includes(headerData.enderecoArmazenagem.toLowerCase())
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

  const handleStartEdit = async (entrada: any) => {
    setOpenDropdownId(null);
    const db = await fetchDb();
    
    // Find all entries sharing the same numDoc
    const groupEntries = (db.entradas || []).filter((e: any) => e.numDoc === entrada.numDoc);
    
    // Find matching estoque item to get header info
    const relatedEstoque = (db.estoque || []).find((est: any) => est.regEntrada === entrada.numDoc);
    
    // Populate header info
    setHeaderData({
      numDoc: entrada.numDoc,
      notaFiscal: entrada.notaFiscal,
      pedidoCompra: relatedEstoque?.pedidoPo || '',
      fornecedor: entrada.fornecedor || '',
      projetoPep: relatedEstoque?.projeto || '',
      planejador: relatedEstoque?.planejador || '',
      enderecoArmazenagem: relatedEstoque?.endereco || '',
      patrimonio: relatedEstoque?.patrimonio || '',
      classificacao: relatedEstoque?.abc || 'Investimento',
      divergente: entrada.divergente,
      status: relatedEstoque?.status || 'Disponível'
    });
    
    // Populate cart items
    const restoredCart = groupEntries.map((e: any) => {
      // Find base item details
      const baseItem = (db.items || []).find((item: any) => 
        (item.codigoItem && e.codigoItem && item.codigoItem === e.codigoItem) || 
        (item.codigoSAP === e.codigoSAP)
      ) || {};
      return {
        ...baseItem,
        id: e.id.split('-estoque')[0].split('-')[1] || baseItem.id || String(Date.now() + Math.random()),
        codigoItem: e.codigoItem,
        codigoSAP: e.codigoSAP,
        descricao: e.descricao,
        quantity: e.quantidade,
        und: e.und,
        valor: baseItem.valor || (relatedEstoque?.valorTotal / (relatedEstoque?.saldo || 1)) || 0
      };
    });
    
    setCart(restoredCart);
    setEditingNumDoc(entrada.numDoc);
    setIsModalOpen(true);
  };

  const handleCadastrar = async () => {
    if (!headerData.notaFiscal) {
      setAlertMessage('Por favor, preencha os campos obrigatórios (Nota Fiscal).');
      return;
    }
    if (cart.length === 0) {
      setAlertMessage('Por favor, adicione pelo menos um item à entrada.');
      return;
    }

    const docNum = editingNumDoc || headerData.numDoc || `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
    const db = await fetchDb(false, true);
    
    // 1. Create entry records
    const newEntries = cart.map(item => ({
      id: `${Date.now()}-${item.id}`,
      numDoc: docNum,
      notaFiscal: headerData.notaFiscal,
      fornecedor: headerData.fornecedor || 'N/A',
      codigoItem: item.codigoItem || '-',
      codigoSAP: item.codigoSAP,
      descricao: item.descricao,
      quantidade: item.quantity,
      und: item.und || 'UN',
      data: new Date().toLocaleDateString('pt-BR'),
      divergente: headerData.divergente
    }));

    // 2. Create physical inventory (estoque) records
    const newEstoqueItems = cart.map(item => ({
      id: `${Date.now()}-${item.id}-estoque`,
      descricao: item.descricao,
      codigoItem: item.codigoItem || '-',
      codigoSAP: item.codigoSAP,
      saldo: item.quantity,
      qtdRsv: 0,
      disponivel: item.quantity,
      um: item.und || 'UN',
      endereco: headerData.enderecoArmazenagem || '-',
      abc: headerData.classificacao || 'Investimento',
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
      regEntrada: docNum,
      patrimonio: headerData.patrimonio || '-',
      status: headerData.status || 'Disponível',
      imagem: item.foto || null
    }));

    let updatedEntradas = db.entradas || [];
    let updatedEstoque = db.estoque || [];

    if (editingNumDoc) {
      updatedEntradas = updatedEntradas.filter((e: any) => e.numDoc !== editingNumDoc);
      updatedEstoque = updatedEstoque.filter((est: any) => est.regEntrada !== editingNumDoc);
    }

    updatedEntradas = [...newEntries, ...updatedEntradas];
    updatedEstoque = [...newEstoqueItems, ...updatedEstoque];

    setEntradas(updatedEntradas);
    db.entradas = updatedEntradas;
    db.estoque = updatedEstoque;

    saveDb(db); // Sync to GitHub in the background asynchronously
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNumDoc(null);
    setHeaderData({
      numDoc: '',
      notaFiscal: '',
      pedidoCompra: '',
      fornecedor: '',
      projetoPep: '',
      planejador: '',
      enderecoArmazenagem: '',
      patrimonio: '',
      classificacao: 'Investimento',
      divergente: false,
      status: 'Disponível'
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full bg-white overflow-hidden"
    >
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
                    <span className="font-mono text-xs text-slate-500">
                      Item: {entrada.codigoItem || '-'} | SAP: {entrada.codigoSAP || '-'}
                    </span>
                    <span className="text-slate-700">{entrada.descricao}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {entrada.divergente ? (
                    <span className="text-xs font-semibold text-amber-600">
                      Divergente
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600">
                      Regular
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
                      <div className="absolute right-8 top-8 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left">
                        <div className="px-4 py-2 text-xs text-slate-400 font-bold border-b border-slate-100">Ações</div>
                        <button 
                          onClick={() => handleStartEdit(entrada)}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                          Editar Entrada
                        </button>
                        <div className="px-4 py-2 text-xs text-slate-400 font-bold">Quantidade</div>
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
                    <h2 className="text-xl font-bold text-slate-800">
                      {editingNumDoc ? 'Editar Entrada de Material' : 'Nova Entrada de Material'}
                    </h2>
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

                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Projeto PEP</label>
                        <input 
                          name="projetoPep" 
                          value={headerData.projetoPep} 
                          onChange={handleHeaderChange} 
                          onFocus={() => setShowProjectSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 200)}
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340]" 
                          placeholder="Ex: C018317" 
                          autoComplete="off"
                        />
                        {showProjectSuggestions && filteredProjects.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            {filteredProjects.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => {
                                  setHeaderData(prev => ({
                                    ...prev,
                                    projetoPep: p.nomeProjeto,
                                    planejador: p.planejadores || prev.planejador
                                  }));
                                  setShowProjectSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-0"
                              >
                                <div className="font-semibold text-slate-700">{p.elementoPep}</div>
                                <div className="text-xs text-slate-500">{p.nomeProjeto}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Planejador</label>
                        <input 
                          name="planejador" 
                          value={headerData.planejador} 
                          onChange={handleHeaderChange} 
                          onFocus={() => setShowPlannerSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowPlannerSuggestions(false), 200)}
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340]" 
                          placeholder="Nome do planejador" 
                          autoComplete="off"
                        />
                        {showPlannerSuggestions && filteredPlanners.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            {filteredPlanners.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => {
                                  setHeaderData(prev => ({
                                    ...prev,
                                    planejador: p.nome
                                  }));
                                  setShowPlannerSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-0"
                              >
                                <div className="font-semibold text-slate-700">{p.nome}</div>
                                <div className="text-xs text-slate-500">{p.email} ({p.gerencia})</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Endereço de Armaz.</label>
                        <input 
                          name="enderecoArmazenagem" 
                          value={headerData.enderecoArmazenagem} 
                          onChange={handleHeaderChange} 
                          onFocus={() => setShowAddressSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] font-mono" 
                          placeholder="Ex: A-01-01" 
                          autoComplete="off"
                        />
                        {showAddressSuggestions && filteredAddresses.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            {filteredAddresses.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onMouseDown={() => {
                                  setHeaderData(prev => ({
                                    ...prev,
                                    enderecoArmazenagem: a.codigo
                                  }));
                                  setShowAddressSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-0"
                              >
                                <div className="font-semibold text-slate-700">{a.codigo}</div>
                                <div className="text-xs text-slate-500">{a.local} - {a.descricao}</div>
                              </button>
                            ))}
                          </div>
                        )}
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
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Classificação</label>
                        <input 
                          type="text" 
                          value="Investimento" 
                          disabled 
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed font-medium" 
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                        <button
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm text-left focus:outline-none focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] bg-white font-medium text-slate-700 flex items-center justify-between transition-all"
                        >
                          <span>{headerData.status || 'Disponível'}</span>
                          <ChevronDown className="w-4 h-4 text-slate-450 shrink-0" />
                        </button>
                        
                        {isStatusDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden font-semibold text-xs text-slate-600">
                              <button
                                type="button"
                                onClick={() => {
                                  setHeaderData(prev => ({ ...prev, status: 'Disponível' }));
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                                  headerData.status === 'Disponível' ? 'bg-slate-50/50 text-[#0C2340]' : ''
                                }`}
                              >
                                Disponível
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHeaderData(prev => ({ ...prev, status: 'Projeto' }));
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                                  headerData.status === 'Projeto' ? 'bg-slate-50/50 text-[#0C2340]' : ''
                                }`}
                              >
                                Projeto
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 select-none pt-2">
                      <span className="text-sm font-bold text-slate-700">Divergente</span>
                      <button
                        type="button"
                        onClick={() => setHeaderData(prev => ({ ...prev, divergente: !prev.divergente }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          headerData.divergente ? 'bg-[#00B4F1]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            headerData.divergente ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
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
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">Item: {item.codigoItem || '-'} | SAP: {item.codigoSAP} | Part: {item.partNumber || '-'}</p>
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
                            <th className="py-3 px-4">Códigos</th>
                            <th className="py-3 px-4">Descrição</th>
                            <th className="py-3 px-4 text-center w-36">Quantidade</th>
                            <th className="py-3 px-4 text-right w-16">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cart.map(item => (
                            <tr key={item.id} className="hover:bg-white transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-600">
                                <div className="flex flex-col text-left">
                                  <span className="text-xs text-slate-400 font-normal">Item: {item.codigoItem || '-'}</span>
                                  <span>SAP: {item.codigoSAP}</span>
                                </div>
                              </td>
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
                                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cart.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400">
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
                    {editingNumDoc ? 'Salvar Alterações' : 'Registrar Entrada'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Toast Alert */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0C2340] border border-slate-700/50 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-md w-[90vw]"
          >
            <p className="text-sm font-semibold flex-1 leading-snug">{alertMessage}</p>
            <button 
              onClick={() => setAlertMessage(null)} 
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
