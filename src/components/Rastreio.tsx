import React, { useState } from 'react';
import { Search, Package, MapPin, User, CheckCircle2, Circle, ArrowRight, Check, Clock, Box } from 'lucide-react';
import { motion } from 'motion/react';

type Metodo = 'Entrega' | 'Balcão CMP';

interface TrackingData {
  id: string;
  metodo: Metodo;
  statusAtual: number; // 0 to 3
  requisitante: string;
  dataRequisicao: string;
  aprovador: string;
  dataAprovacao: string;
  recebedor?: string;
  dataRecebimento?: string;
}

const mockTrackings: TrackingData[] = [];

export function Rastreio() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<TrackingData | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = mockTrackings.find(t => t.id.toLowerCase() === searchValue.toLowerCase());
    if (found) {
      setSelectedTracking(found);
    } else {
      setSelectedTracking(null);
    }
  };

  const renderTimeline = (tracking: TrackingData) => {
    const isEntrega = tracking.metodo === 'Entrega';
    
    const steps = isEntrega 
      ? ['Requisitado', 'Aprovação', 'Separação', 'Recebido']
      : ['Requisitado', 'Aprovação', 'Aguardando Retirada', 'Recebido'];

    return (
      <div className="mt-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {steps.map((step, index) => {
          const isCompleted = index <= tracking.statusAtual;
          const isCurrent = index === tracking.statusAtual;
          
          return (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 last:mb-0">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                isCompleted 
                  ? 'bg-[#00B4F1] border-white text-white' 
                  : 'bg-slate-100 border-white text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-white border border-slate-100">
                <div className="flex flex-col gap-1">
                  <h3 className={`font-bold text-lg ${isCompleted ? 'text-[#0C2340]' : 'text-slate-400'}`}>
                    {step}
                  </h3>
                  
                  {/* Informações detalhadas baseadas no passo e no método */}
                  {index === 0 && isCompleted && (
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                      <p><span className="font-semibold text-slate-700">Requisitante:</span> {tracking.requisitante}</p>
                      <p><span className="font-semibold text-slate-700">Data:</span> {tracking.dataRequisicao}</p>
                    </div>
                  )}

                  {index === 1 && isCompleted && (
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                      <p><span className="font-semibold text-slate-700">Aprovador:</span> {tracking.aprovador}</p>
                      <p><span className="font-semibold text-slate-700">Data:</span> {tracking.dataAprovacao}</p>
                    </div>
                  )}

                  {index === 2 && isCompleted && !isEntrega && (
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                         <p className="italic text-slate-400">Pronto para retirada no balcão</p>
                    </div>
                  )}

                  {index === 3 && isCompleted && (
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                      <p><span className="font-semibold text-slate-700">Recebedor:</span> {tracking.recebedor || tracking.requisitante}</p>
                      {tracking.dataRecebimento && (
                        <p><span className="font-semibold text-slate-700">Data:</span> {tracking.dataRecebimento}</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] overflow-hidden">
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0C2340]">Rastreio de Requisição</h2>
            <p className="text-slate-500 mt-1">Acompanhe o status e o histórico das suas solicitações.</p>
          </div>

          {/* Resultado */}
          {selectedTracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setSelectedTracking(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180 text-slate-500" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0C2340]">{selectedTracking.id}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-full uppercase tracking-wider">
                      Método: {selectedTracking.metodo}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm">
                  Status: {
                    selectedTracking.metodo === 'Entrega' 
                      ? ['Requisitado', 'Aprovado', 'Em Separação', 'Recebido'][selectedTracking.statusAtual]
                      : ['Requisitado', 'Aprovado', 'Aguardando Retirada', 'Recebido'][selectedTracking.statusAtual]
                  }
                </div>
              </div>

              <div className="px-4">
                {renderTimeline(selectedTracking)}
              </div>
            </motion.div>
          )}

          {/* Quick List - Mocks */}
          {!selectedTracking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="col-span-full">
                <p className="text-sm font-bold text-slate-400 uppercase text-center mb-2">Suas Requisições Recentes</p>
              </div>
              {mockTrackings.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => {
                    setSearchValue(t.id);
                    setSelectedTracking(t);
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#00B4F1] hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#0C2340] group-hover:text-[#00B4F1] transition-colors">{t.id}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00B4F1] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-sm text-slate-500 mb-1">{t.metodo}</div>
                  <div className="text-xs text-slate-400">{t.dataRequisicao}</div>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
