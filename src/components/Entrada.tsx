import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Package, FileText, Check, AlertTriangle, Building, Tag, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';

export function Entrada() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    numDoc: '',
    notaFiscal: '',
    fornecedor: '',
    pedidoCompra: '',
    codigoItem: '',
    descricao: '',
    und: '',
    quantidade: '',
    valorTotal: '',
    classificacao: '',
    aplicacao: '',
    patrimonio: '',
    centroCusto: '',
    projetoPep: '',
    om: '',
    planejador: '',
    enderecoArmazenagem: '',
    inventario: '',
    divergente: false,
    disponivel: false
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEntradas(db.entradas || []);
      setItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      
      if (name === 'codigoItem' && value) {
        const foundItem = items.find(
          item => item.codigoSAP?.toUpperCase() === value.toUpperCase()
        );
        if (foundItem) {
          updated.descricao = foundItem.descricao || '';
          updated.und = foundItem.und || 'UN';
        }
      }
      
      return updated;
    });
  };

  const formatCurrency = (value: string) => {
    let rawValue = value.replace(/\D/g, '');
    if (rawValue === '') return '';
    const numberValue = parseInt(rawValue, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numberValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, valorTotal: formatCurrency(e.target.value) }));
  };

  const handleCadastrar = async () => {
    if (!formData.numDoc || !formData.notaFiscal || !formData.codigoItem) {
      alert('Por favor, preencha os campos obrigatórios (Num Doc, Nota Fiscal, Código do Item).');
      return;
    }

    const novaEntrada = {
      id: String(Date.now()),
      numDoc: formData.numDoc,
      notaFiscal: formData.notaFiscal,
      fornecedor: formData.fornecedor || 'N/A',
      codigoItem: formData.codigoItem,
      descricao: formData.descricao || 'Item sem descrição',
      quantidade: Number(formData.quantidade) || 0,
      und: formData.und || 'UN',
      data: new Date().toLocaleDateString('pt-BR'),
      divergente: formData.divergente
    };

    const updatedEntradas = [novaEntrada, ...entradas];
    setEntradas(updatedEntradas);

    const db = await fetchDb();
    db.entradas = updatedEntradas;

    // Also insert or update the item in the physical stock (estoque)
    const valorFloat = parseFloat(formData.valorTotal.replace(/\./g, '').replace(',', '.')) || 0;
    const novoEstoqueItem = {
      id: String(Date.now()),
      descricao: formData.descricao || 'Item sem descrição',
      codigoItem: formData.codigoItem,
      codigoSAP: formData.codigoItem,
      saldo: Number(formData.quantidade) || 0,
      qtdRsv: 0,
      disponivel: Number(formData.quantidade) || 0,
      um: formData.und || 'UN',
      endereco: formData.enderecoArmazenagem || '-',
      abc: formData.classificacao || 'C',
      planejador: formData.planejador || '-',
      pedidoPo: formData.pedidoCompra || '-',
      cCusto: formData.centroCusto || '-',
      projeto: formData.projetoPep || '-',
      valorTotal: valorFloat,
      nfEntrada: formData.notaFiscal,
      dataEntrada: new Date().toLocaleDateString('pt-BR'),
      requisitante: '-',
      areaDestino: formData.aplicacao || '-',
      partNumber: '-',
      regEntrada: formData.numDoc
    };

    db.estoque = [novoEstoqueItem, ...(db.estoque || [])];
    await saveDb(db);

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      numDoc: '', notaFiscal: '', fornecedor: '', pedidoCompra: '', codigoItem: '', descricao: '',
      und: '', quantidade: '', valorTotal: '', classificacao: '', aplicacao: '', patrimonio: '',
      centroCusto: '', projetoPep: '', om: '', planejador: '', enderecoArmazenagem: '', inventario: '', divergente: false, disponivel: false
    });
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
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Detalhes
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
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
                className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-3xl max-h-full"
              >
                {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nova Entrada de Material</h2>
                    <p className="text-sm text-slate-500">Preencha os dados para registrar uma nova entrada no estoque.</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div className="space-y-8">
                  
                  {/* Seção 1: Documentos e Dados Base */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Documentação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nota Fiscal <span className="text-rose-500">*</span></label>
                        <input name="notaFiscal" value={formData.notaFiscal} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="Ex: NF-001928" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Pedido de Compra</label>
                        <input name="pedidoCompra" value={formData.pedidoCompra} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="Ex: PO-4592" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Fornecedor</label>
                        <input name="fornecedor" value={formData.fornecedor} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Nome do fornecedor" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Dados do Material */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Material
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Código SAP <span className="text-rose-500">*</span></label>
                        <input name="codigoItem" value={formData.codigoItem} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="SAP-XXXX" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Descrição do Item</label>
                        <input name="descricao" value={formData.descricao} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Descrição completa" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Unidade</label>
                        <div className="relative">
                          <select name="und" value={formData.und} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white appearance-none cursor-pointer pr-10">
                            <option value="">Selecione...</option>
                            <option value="UN">UN - Unidade</option>
                            <option value="KG">KG - Quilograma</option>
                            <option value="M">M - Metro</option>
                            <option value="CX">CX - Caixa</option>
                            <option value="PC">PC - Peça</option>
                            <option value="L">L - Litro</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Quantidade</label>
                        <input name="quantidade" value={formData.quantidade} onChange={handleInputChange} type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Valor Total (R$)</label>
                        <input name="valorTotal" value={formData.valorTotal} onChange={handleCurrencyChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="R$ 0,00" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Classificação</label>
                        <input name="classificacao" value={formData.classificacao} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Ex: Investimento" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Aplicação</label>
                        <input name="aplicacao" value={formData.aplicacao} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Onde será utilizado" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Patrimônio</label>
                        <input name="patrimonio" value={formData.patrimonio} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="Nº Patrimônio" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 3: Rastreabilidade e Logística */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Alocação & Logística
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Projeto / PEP</label>
                        <input name="projetoPep" value={formData.projetoPep} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="PRJ-XXXX" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Planejador</label>
                        <input name="planejador" value={formData.planejador} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Nome do planejador" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Endereço de Armaz.</label>
                        <input name="enderecoArmazenagem" value={formData.enderecoArmazenagem} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="A1-02-03" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Inventário</label>
                        <input name="inventario" value={formData.inventario} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Periódico, Rotativo..." />
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes Options */}
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="flex items-center h-5">
                        <input
                          id="divergente"
                          name="divergente"
                          type="checkbox"
                          checked={formData.divergente}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-[#0C2340] bg-white border-slate-300 rounded focus:ring-[#0C2340] focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label htmlFor="divergente" className="text-sm font-semibold text-slate-800 cursor-pointer block">
                          Marcar como Divergente
                        </label>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="flex items-center h-5">
                        <input
                          id="disponivel"
                          name="disponivel"
                          type="checkbox"
                          checked={formData.disponivel}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-[#0C2340] bg-white border-slate-300 rounded focus:ring-[#0C2340] focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label htmlFor="disponivel" className="text-sm font-semibold text-slate-800 cursor-pointer block">
                          Disponível
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white">
                <button 
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCadastrar}
                  className="px-6 py-2.5 bg-[#0C2340] hover:bg-[#0a1d36] text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Registrar Entrada
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
