const fs = require('fs');

const content = `import React, { useState } from 'react';
import { CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

export function NovaRequisicao({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(1);

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
          className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto w-full max-w-4xl max-h-full"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Nova Requisição</h2>
                <p className="text-sm text-slate-500">Preencha os dados para registrar uma nova requisição.</p>
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
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            <div className="w-full max-w-4xl mx-auto space-y-6">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Seção 1: Documentação */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Documentação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nota Fiscal <span className="text-rose-500">*</span></label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Ex: NF-001928" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Pedido de Compra</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Ex: PO-4592" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Fornecedor</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Nome do fornecedor" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Material */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Material
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Código SAP <span className="text-rose-500">*</span></label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="SAP-XXXX" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Descrição do Item</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Descrição completa" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Unidade</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white">
                          <option value="">Selecione...</option>
                          <option value="un">UN - Unidade</option>
                          <option value="kg">KG - Quilograma</option>
                          <option value="m">M - Metro</option>
                          <option value="cx">CX - Caixa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Quantidade</label>
                        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Valor Total (R$)</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="R$ 0,00" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Classificação</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Ex: Investimento" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Aplicação</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Onde será utilizado" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Patrimônio</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="Nº Patrimônio" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 3: Alocação & Logística */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      Alocação & Logística
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Projeto / PEP</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent font-mono" placeholder="PRJ-XXXX" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Planejador</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent" placeholder="Nome do planejador" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
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

          {step === 1 && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#0C2340] hover:bg-[#0a1d36] text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Registrar Requisição
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </>
  );
}
`;

fs.writeFileSync('src/components/NovaRequisicao.tsx', content);
