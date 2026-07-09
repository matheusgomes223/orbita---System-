import React, { useState } from 'react';
import { Search, Printer, CheckSquare, Square, FileText, X } from "lucide-react";
import { motion } from 'motion/react';

// ... (keep the mockEstoque the same, so let's match carefully)

const mockEstoque: any[] = [];

export function GeradorEtiquetas({ onClose }: { onClose?: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const filteredEstoque = mockEstoque.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return item.descricao.toLowerCase().includes(searchLower) || 
           item.codigoSAP.toLowerCase().includes(searchLower) ||
           item.partNumber.toLowerCase().includes(searchLower);
  });

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === filteredEstoque.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEstoque.map(item => item.id));
    }
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) return;
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const selectedData = mockEstoque.filter(item => selectedItems.includes(item.id));

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="print:hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-slate-50 relative z-20">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar itens para etiqueta..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedItems.length > 0 
                  ? 'bg-[#0C2340] hover:bg-[#0C2340]/90 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiquetas {selectedItems.length > 0 && `(${selectedItems.length})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#F1F5F9]">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10">
                  <th className="p-4 w-12 text-center">
                    <button onClick={selectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {selectedItems.length === filteredEstoque.length && filteredEstoque.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-[#00B4F1]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Código SAP</th>
                  <th className="p-4">Part Number</th>
                  <th className="p-4">Endereço</th>
                  <th className="p-4">UM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstoque.map((item, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    key={item.id} 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'bg-[#F0F7FF] hover:bg-[#F0F7FF]' : ''}`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <td className="p-4 text-center">
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#00B4F1]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{item.descricao}</td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{item.codigoSAP}</td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{item.partNumber}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium text-xs">
                        {item.endereco}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{item.um}</td>
                  </motion.tr>
                ))}
                {filteredEstoque.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium text-slate-600">Nenhum item encontrado</p>
                      <p className="text-sm">Tente usar outros termos na busca.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print View */}
      {isPrinting && (
        <div className="hidden print:block absolute inset-0 bg-white z-50 p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedData.map(item => (
              <div key={item.id} className="border-2 border-black p-4 flex flex-col justify-between break-inside-avoid h-48 rounded-lg">
                <div className="text-center font-bold text-lg leading-tight mb-2 uppercase">
                  {item.descricao}
                </div>
                <div className="flex justify-between items-end mt-auto text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold">{item.codigoSAP}</span>
                    <span className="font-mono text-xs">{item.partNumber}</span>
                  </div>
                  <div className="flex flex-col text-right gap-1">
                    <span className="font-bold border border-black px-2 py-0.5 rounded">{item.endereco}</span>
                    <span className="text-xs font-bold">{item.um}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
