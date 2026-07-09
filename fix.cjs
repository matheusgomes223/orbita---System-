const fs = require('fs');
let code = fs.readFileSync('src/components/NovaRequisicao.tsx', 'utf8');

const endOfCorrectCode = code.indexOf('{/* Carrinho */}');

const newEnd = `                {/* Carrinho */}
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
                        onClick={() => setStep(3)}
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

fs.writeFileSync('src/components/NovaRequisicao.tsx', code.slice(0, endOfCorrectCode) + newEnd);
