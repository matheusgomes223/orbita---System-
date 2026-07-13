import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Upload, Check, ImageIcon, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';

export function CadastrarItem() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [isUnidadeOpen, setIsUnidadeOpen] = useState(false);
  const [valorUnitario, setValorUnitario] = useState('');
  const [fotoMaterial, setFotoMaterial] = useState<string | null>(null);
  const [codigoItem, setCodigoItem] = useState('');
  const [codigoSAP, setCodigoSAP] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [descricao, setDescricao] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const formatCurrency = (value: string) => {
    let rawValue = value.replace(/\D/g, '');
    if (rawValue === '') return '';
    const numberValue = parseInt(rawValue, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numberValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorUnitario(formatCurrency(e.target.value));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoMaterial(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCadastrar = async () => {
    if (!codigoSAP || !descricao || !unidadeMedida || !valorUnitario) {
      setAlertMessage('Por favor, preencha os campos obrigatórios (Código SAP, Descrição, Unidade e Valor).');
      return;
    }

    const valorFloat = parseFloat(valorUnitario.replace(/\./g, '').replace(',', '.'));

    let updated: any[] = [];
    if (editingItemId) {
      const itemData = {
        codigoItem: codigoItem.toUpperCase(),
        codigoSAP: codigoSAP.toUpperCase(),
        partNumber: partNumber.toUpperCase(),
        descricao: descricao.toUpperCase(),
        und: unidadeMedida.toUpperCase(),
        valor: valorFloat,
        foto: fotoMaterial,
      };
      updated = items.map(item => item.id === editingItemId ? { ...item, ...itemData } : item);
    } else {
      // Find maximum numeric code >= 1500
      const existingCodes = items
        .map(item => parseInt(item.codigoItem, 10))
        .filter(num => !isNaN(num) && num >= 1500);
      const nextCode = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1500;

      const itemData = {
        codigoItem: String(nextCode),
        codigoSAP: codigoSAP.toUpperCase(),
        partNumber: partNumber.toUpperCase(),
        descricao: descricao.toUpperCase(),
        und: unidadeMedida.toUpperCase(),
        valor: valorFloat,
        foto: fotoMaterial,
      };

      const newItem = {
        id: String(Date.now()),
        ...itemData
      };
      updated = [newItem, ...items];
    }
    setItems(updated);

    const db = await fetchDb(false, true);
    db.items = updated;
    saveDb(db); // Sync to GitHub in the background asynchronously

    closeModal();
  };

  const handleEdit = (item: typeof items[0]) => {
    setCodigoItem(item.codigoItem || '');
    setCodigoSAP(item.codigoSAP);
    setPartNumber(item.partNumber);
    setDescricao(item.descricao);
    setUnidadeMedida(item.und.toLowerCase());
    setValorUnitario(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.valor));
    setFotoMaterial(item.foto || null);
    setEditingItemId(item.id);
    setOpenDropdownId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);

    const db = await fetchDb(false, true);
    db.items = updated;
    saveDb(db);

    setOpenDropdownId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setCodigoItem('');
    setCodigoSAP('');
    setPartNumber('');
    setDescricao('');
    setUnidadeMedida('');
    setValorUnitario('');
    setFotoMaterial(null);
  };

  const unidades = [
    { value: 'un', label: 'Unidade (UN)' },
    { value: 'kg', label: 'Quilograma (KG)' },
    { value: 'm', label: 'Metro (M)' },
    { value: 'l', label: 'Litro (L)' },
    { value: 'cx', label: 'Caixa (CX)' },
    { value: 'cj', label: 'Conjunto (CJ)' },
    { value: 'pc', label: 'Peça (PC)' },
    { value: 'rolo', label: 'Rolo (RL)' },
  ];

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

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(val => 
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
            placeholder="Buscar item..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10">
              <th className="p-4 w-20 text-center">Imagem</th>
              <th className="p-4 min-w-[200px]">Descrição</th>
              <th className="p-4">Código Item</th>
              <th className="p-4">Código SAP</th>
              <th className="p-4">Part Number</th>
              <th className="p-4">Und. Medida</th>
              <th className="p-4">Valor Unit. (R$)</th>
              <th className="p-4 w-16 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 text-center">
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 mx-auto overflow-hidden">
                    {item.foto ? (
                      <img src={item.foto} alt="Material" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8" />
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-700">{item.descricao}</td>
                <td className="p-4 font-medium text-slate-500 font-mono text-xs">{item.codigoItem || '-'}</td>
                <td className="p-4 font-medium text-slate-900">
                  {item.codigoSAP}
                </td>
                <td className="p-4 text-slate-500">
                  {item.partNumber}
                </td>
                <td className="p-4 text-slate-600">{getFullUnitName(item.und)}</td>
                <td className="p-4 text-slate-600">
                  {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-center relative">
                  <button 
                    onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {openDropdownId === item.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdownId(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                        >
                          <button
                            onClick={() => handleEdit(item)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#3B82F6] flex items-center gap-2 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-500 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Registration Form */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-[#0C2340]">{editingItemId ? 'Editar Item' : 'Cadastrar Novo Item'}</h2>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Código SAP</label>
                      <input 
                        type="text"
                        value={codigoSAP}
                        onChange={(e) => setCodigoSAP(e.target.value)}
                        placeholder="Ex: SAP-001"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Part Number</label>
                      <input 
                        type="text"
                        value={partNumber}
                        onChange={(e) => setPartNumber(e.target.value)}
                        placeholder="Ex: PN-12345"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Descrição do Material</label>
                    <textarea 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição completa do material..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-sm font-medium text-slate-700">Unidade de Medida</label>
                      
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsUnidadeOpen(!isUnidadeOpen)}
                          className={`w-full px-3 py-2 bg-white border text-left rounded-lg text-sm transition-all flex items-center justify-between ${
                            isUnidadeOpen 
                              ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' 
                              : 'border-slate-300 hover:border-[#3B82F6]'
                          }`}
                        >
                          <span className={unidadeMedida ? 'text-slate-900' : 'text-slate-400'}>
                            {unidadeMedida 
                              ? unidades.find(u => u.value === unidadeMedida)?.label 
                              : 'Selecione...'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUnidadeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isUnidadeOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setIsUnidadeOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#3B82F6] rounded-lg shadow-lg z-20 overflow-hidden py-1"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnidadeMedida('');
                                    setIsUnidadeOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
                                >
                                  Selecione...
                                </button>
                                {unidades.map((und) => (
                                  <button
                                    key={und.value}
                                    type="button"
                                    onClick={() => {
                                      setUnidadeMedida(und.value);
                                      setIsUnidadeOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                      unidadeMedida === und.value ? 'bg-slate-50 text-[#3B82F6] font-medium' : 'text-slate-700'
                                    }`}
                                  >
                                    {und.label}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Valor Unitário (R$)</label>
                      <input 
                        type="text" 
                        value={valorUnitario}
                        onChange={handleCurrencyChange}
                        placeholder="0,00"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Foto do Material</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-colors relative overflow-hidden group min-h-[160px]">
                      {fotoMaterial ? (
                        <div className="relative w-full h-full min-h-[140px] flex flex-col items-center justify-center">
                          <img src={fotoMaterial} alt="Preview" className="h-32 w-32 object-cover mb-4 rounded-md shadow-sm border border-slate-200" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFotoMaterial(null);
                            }}
                            className="text-sm text-rose-500 font-medium hover:text-rose-600 flex items-center gap-1 z-10 relative bg-white/80 px-2 py-1 rounded backdrop-blur-sm"
                          >
                            <X className="w-4 h-4" /> Remover foto
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center cursor-pointer space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-[#3B82F6] transition-colors" />
                          <div className="flex text-sm text-slate-600 justify-center">
                            <span className="font-medium text-[#3B82F6] group-hover:text-[#2563EB]">
                              Faça upload de um arquivo
                            </span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                          </div>
                          <p className="text-xs text-slate-500">PNG, JPG, GIF até 10MB</p>
                          <div className="mt-2 px-3 text-left w-full max-w-xs mx-auto">
                            <p className="text-[11px] text-slate-500 leading-tight text-center">
                              <strong>Dica de imagem:</strong> Para melhor visualização no sistema, prefira imagens em formato <strong>quadrado (1:1)</strong>.
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-slate-200 bg-white flex gap-3">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCadastrar}
                  className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cadastrar
                </button>
              </div>
            </motion.div>
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
    </div>
  );
}
