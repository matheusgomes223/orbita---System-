import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, User, CheckCircle2, Circle, ArrowRight, Check, Clock, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchDb } from '../services/githubDb';

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

export function Rastreio() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<TrackingData | null>(null);
  const [trackings, setTrackings] = useState<TrackingData[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      const mappedList: TrackingData[] = (db.requisicoes || []).map((req: any) => {
        let statusVal = 0;
        if (req.statusAprovacao === 'Aprovado') {
          statusVal = 1;
          if (req.statusLogistico === 'Disponível') {
            statusVal = 2;
          } else if (req.statusLogistico === 'Retirado') {
            statusVal = 3;
          }
        }
        return {
          id: req.requisicao,
          metodo: req.tipoSaida === 'ENTREGA' ? 'Entrega' : 'Balcão CMP',
          statusAtual: statusVal,
          requisitante: req.requisitante,
          dataRequisicao: req.detalhesAprovador?.dataSolicitacao?.split(' às ')[0] || req.dataDesejada || '',
          aprovador: req.detalhesAprovador?.nome || 'N/A',
          dataAprovacao: req.detalhesAprovador?.dataSolicitacao?.split(' às ')[0] || '',
          recebedor: req.detalhesRetirada?.nome,
          dataRecebimento: req.detalhesRetirada?.dataHora?.split(' às ')[0]
        };
      });
      setTrackings(mappedList);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = trackings.find(t => t.id.toLowerCase() === searchValue.toLowerCase());
    if (found) {
      setSelectedTracking(found);
      setNotFound(false);
    } else {
      setSelectedTracking(null);
      setNotFound(true);
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
          
          return (
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-8"
            >
              {/* Icon / Circle */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-all duration-300">
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>

              {/* Card Content */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCompleted ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step}
                  </span>
                </div>
                <h4 className="font-bold text-[#0C2340] text-sm md:text-base">{step}</h4>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  {index === 0 && `Requisitado por ${tracking.requisitante} em ${tracking.dataRequisicao}`}
                  {index === 1 && (tracking.statusAtual >= 1 ? `Aprovado por ${tracking.aprovador} em ${tracking.dataAprovacao}` : 'Aguardando validação do planejador')}
                  {index === 2 && (tracking.statusAtual >= 2 ? (isEntrega ? 'Material separado e despachado para entrega' : 'Material disponível para retirada no balcão') : 'Pendente de separação física')}
                  {index === 3 && (tracking.statusAtual >= 3 ? `Entregue a ${tracking.recebedor} em ${tracking.dataRecebimento}` : 'Aguardando recebimento/retirada')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/30">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0C2340] tracking-tight">Rastreamento de Materiais</h2>
            <p className="text-sm text-slate-500">Consulte a situação física e logística da sua requisição em tempo real.</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative flex items-center border border-[#00B4F1] rounded-xl p-1.5 bg-white shadow-[0_0_0_3px_rgba(0,180,241,0.15)] transition-all">
              <Search className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
              <input 
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Ex: REQ-8199" 
                className="flex-1 bg-transparent px-3 py-2 text-base text-[#0C2340] font-medium placeholder-slate-400 focus:outline-none"
              />
              <button 
                type="submit"
                className="bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm active:scale-95"
              >
                Buscar
              </button>
            </div>
          </form>

          {notFound && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center max-w-xl mx-auto text-sm font-medium">
              Nenhuma requisição encontrada com o código "{searchValue}".
            </div>
          )}

          {/* Result Tracker */}
          {selectedTracking && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-bold text-[#00B4F1] uppercase tracking-wider">Código da Requisição</span>
                  <h3 className="text-2xl font-black text-[#0C2340] mt-0.5">{selectedTracking.id}</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método</p>
                      <p className="text-sm font-bold text-slate-700">{selectedTracking.metodo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Solicitação</p>
                      <p className="text-sm font-bold text-slate-700">{selectedTracking.dataRequisicao}</p>
                    </div>
                  </div>
                </div>
              </div>

              {renderTimeline(selectedTracking)}
            </motion.div>
          )}

          {/* Quick List - Mocks */}
          {!selectedTracking && trackings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="col-span-full">
                <p className="text-sm font-bold text-slate-400 uppercase text-center mb-2">Suas Requisições Recentes</p>
              </div>
              {trackings.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => {
                    setSearchValue(t.id);
                    setSelectedTracking(t);
                    setNotFound(false);
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
