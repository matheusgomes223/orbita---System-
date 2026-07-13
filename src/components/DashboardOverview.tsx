import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Calendar, Package, DollarSign, FolderCog } from 'lucide-react';
import { motion, animate } from 'framer-motion';

function AnimatedNumber({ value, format = (v: number) => v.toString() }: { value: number, format?: (v: number) => string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  const prevValue = useRef(0);

  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(prevValue.current, value, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = formatRef.current(v);
        },
        onComplete() {
          prevValue.current = value;
        }
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={nodeRef} />;
}

const dailyData: any[] = [];
const pepData: any[] = [];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

export function DashboardOverview() {
  const [filterPeriod, setFilterPeriod] = useState('semana');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 h-full p-4 sm:p-6"
    >
      {/* Header and Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0C2340] tracking-tight">Visão Geral</h2>
          <p className="text-sm text-slate-500 mt-1">Indicadores consolidados do CMP SERRA SUL</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm self-start sm:self-auto">
          {['semana', 'mes', 'ano'].map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all duration-300 ${
                filterPeriod === period
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0C2340] hover:bg-slate-50'
              }`}
            >
              {period === 'mes' ? 'Mês' : period}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden group text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Total de Itens
            </p>
            <h3 className="text-4xl font-bold text-[#0C2340] tracking-tight">
              <AnimatedNumber value={0} format={(v) => Math.round(v).toLocaleString('pt-BR')} />
            </h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden group text-center">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Total R$
            </p>
            <h3 className="text-4xl font-bold text-[#0C2340] tracking-tight">
              <AnimatedNumber value={0} format={(v) => '0,00 Mil'} />
            </h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden group text-center">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Total Projetos
            </p>
            <h3 className="text-4xl font-bold text-[#0C2340] tracking-tight">
              <AnimatedNumber value={0} format={(v) => Math.round(v).toString()} />
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Soma de QTD por Dia */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <h3 className="text-lg font-bold text-[#0C2340]">Soma de Quantidade por Dia</h3>
          </div>
          <div className="relative w-full h-[300px] flex-1">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart data={dailyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="qtde" radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={800}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3B82F6" className="hover:opacity-80 transition-opacity" />
                  ))}
                  <LabelList dataKey="qtde" position="top" fill="#475569" fontSize={14} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quantidade Recebida por PEP */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <h3 className="text-lg font-bold text-[#0C2340]">Quantidade Recebida por PEP</h3>
          </div>
          <div className="relative w-full h-[300px] flex-1">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart data={pepData} layout="vertical" margin={{ top: 0, right: 40, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis 
                  type="number" 
                  hide 
                />
                <YAxis 
                  dataKey="pep" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="qtde" radius={[0, 4, 4, 0]} barSize={20} animationDuration={800}>
                  {pepData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3B82F6" className="hover:opacity-80 transition-opacity" />
                  ))}
                  <LabelList dataKey="qtde" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
