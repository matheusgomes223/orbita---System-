import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, User, Briefcase, Mail, Users, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';

export function CadastrarPlanejador() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planejadores, setPlanejadores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [nome, setNome] = useState('');
  const [gerencia, setGerencia] = useState('');
  const [email, setEmail] = useState('');
  const [grupoAprovador, setGrupoAprovador] = useState('');

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setPlanejadores(db.planejadores || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredPlanejadores = planejadores.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(plan).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
  });

  const handleCadastrar = async () => {
    if (nome && gerencia && email) {
      const novoPlanejador = {
        id: Math.random().toString(36).substr(2, 9),
        nome,
        gerencia,
        email,
        grupoAprovador
      };
      const updated = [novoPlanejador, ...planejadores];
      setPlanejadores(updated);

      const db = await fetchDb();
      db.planejadores = updated;
      await saveDb(db);

      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNome('');
    setGerencia('');
    setEmail('');
    setGrupoAprovador('');
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar planejador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-6 py-5 w-48">Nome</th>
              <th className="px-6 py-5 w-40">Gerência</th>
              <th className="px-6 py-5">E-mail</th>
              <th className="px-6 py-5">Grupo Aprovador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-base">
            {filteredPlanejadores.map((plan) => (
              <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5 text-slate-700 font-medium">
                  {plan.nome}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {plan.gerencia}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {plan.email}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {plan.grupoAprovador || '-'}
                </td>
              </tr>
            ))}
            {filteredPlanejadores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Nenhum planejador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Cadastrar Planejador</h2>
                  <p className="text-sm text-slate-500 mt-1">Preencha os dados do novo planejador</p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nome</label>
                    <input 
                      type="text" 
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">E-mail</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: joao.silva@empresa.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">Gerência</label>
                    <input 
                      type="text" 
                      value={gerencia}
                      onChange={(e) => setGerencia(e.target.value)}
                      placeholder="Ex: Manutenção Elétrica"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">Grupo Aprovador</label>
                    <input 
                      type="text" 
                      value={grupoAprovador}
                      onChange={(e) => setGrupoAprovador(e.target.value)}
                      placeholder="Ex: Liderança"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
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
                  className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Cadastrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
