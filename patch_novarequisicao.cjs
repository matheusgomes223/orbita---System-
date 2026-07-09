const fs = require('fs');
let code = fs.readFileSync('src/components/NovaRequisicao.tsx', 'utf8');

const newFormCode = `
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
`;

const startIdx = code.indexOf('{step === 1 && (');
const endIdx = code.indexOf(')}', code.indexOf('</motion.div>', startIdx)) + 2;

code = code.slice(0, startIdx) + '{step === 1 && (\n' + newFormCode + '              )}\n' + code.slice(endIdx);

const startHeaderIdx = code.indexOf('<div className="flex items-center gap-3">');
const endHeaderIdx = code.indexOf('</div>', startHeaderIdx) + 6;

code = code.slice(0, startHeaderIdx) + `<div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Nova Requisição</h2>
                <p className="text-sm text-slate-500">Preencha os dados para registrar uma nova requisição.</p>
              </div>
            </div>` + code.slice(code.indexOf('</div>', code.indexOf('</p>', startHeaderIdx)) + 6);

// change background color to slate-50/30
code = code.replace(/<div className="flex-1 overflow-y-auto p-6 pt-2 bg-white">/, '<div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">');

// add footer
const footerStr = `              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#0C2340] hover:bg-[#0a1d36] text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Registrar Requisição
                </button>
              </div>`;

code = code.replace(/<\/div>\n\s*<\/div>\n\s*<\/motion\.div>/, `</div>\n${footerStr}\n        </motion.div>`);

fs.writeFileSync('src/components/NovaRequisicao.tsx', code);
