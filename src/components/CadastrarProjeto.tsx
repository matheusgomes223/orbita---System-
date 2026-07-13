import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, Hash, FolderTree, FileText, User, Users, Bell, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDb, saveDb } from '../services/githubDb';

export function CadastrarProjeto() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [elementoPep, setElementoPep] = useState('');
  const [pepRaiz, setPepRaiz] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [implantador, setImplantador] = useState('');
  const [planejadores, setPlanejadores] = useState('');

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setProjetos(db.projetos || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredProjetos = projetos.filter(proj => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(proj).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
  });

  const handleCadastrar = async () => {
    if (elementoPep && pepRaiz && nomeProjeto) {
      const projetoData = {
        elementoPep,
        pepRaiz,
        nomeProjeto,
        implantador,
        planejadores
      };

      let updated: any[] = [];
      if (editingItemId) {
        updated = projetos.map(proj => proj.id === editingItemId ? { ...proj, ...projetoData } : proj);
      } else {
        const novoProjeto = {
          id: Math.random().toString(36).substr(2, 9),
          ...projetoData
        };
        updated = [novoProjeto, ...projetos];
      }
      setProjetos(updated);

      const db = await fetchDb();
      db.projetos = updated;
      await saveDb(db);

      closeModal();
    }
  };

  const handleEdit = (proj: any) => {
    setElementoPep(proj.elementoPep);
    setPepRaiz(proj.pepRaiz);
    setNomeProjeto(proj.nomeProjeto);
    setImplantador(proj.implantador || '');
    setPlanejadores(proj.planejadores || '');
    setEditingItemId(proj.id);
    setOpenDropdownId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = projetos.filter(proj => proj.id !== id);
    setProjetos(updated);

    const db = await fetchDb();
    db.projetos = updated;
    await saveDb(db);

    setOpenDropdownId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setElementoPep('');
    setPepRaiz('');
    setNomeProjeto('');
    setImplantador('');
    setPlanejadores('');
    setEditingItemId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar projeto..." 
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-6 py-5 w-40">Elemento PEP</th>
              <th className="px-6 py-5 w-32">PEP Raiz</th>
              <th className="px-6 py-5">Nome do Projeto</th>
              <th className="px-6 py-5">Implantador</th>
              <th className="px-6 py-5">Planejadores</th>
              <th className="px-6 py-5 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-base">
            {filteredProjetos.map((proj) => (
              <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5 text-slate-700 font-medium font-mono text-sm">
                  {proj.elementoPep}
                </td>
                <td className="px-6 py-5 text-slate-600 font-mono text-sm">
                  {proj.pepRaiz}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {proj.nomeProjeto}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {proj.implantador || '-'}
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {proj.planejadores || '-'}
                </td>
                <td className="px-6 py-5 text-center relative">
                  <button 
                    onClick={() => setOpenDropdownId(openDropdownId === proj.id ? null : proj.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {openDropdownId === proj.id && (
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
                            onClick={() => handleEdit(proj)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#3B82F6] flex items-center gap-2 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(proj.id)}
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
            {filteredProjetos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  Nenhum projeto encontrado.
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
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingItemId ? 'Editar Projeto' : 'Cadastrar Projeto'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {editingItemId ? 'Edite os dados do projeto selecionado' : 'Preencha os dados do novo projeto'}
                  </p>
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
                    <label className="text-sm font-medium text-slate-700">Elemento PEP</label>
                    <input 
                      type="text" 
                      value={elementoPep}
                      onChange={(e) => setElementoPep(e.target.value)}
                      placeholder="Ex: PEP-001.01"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">PEP Raiz</label>
                    <input 
                      type="text" 
                      value={pepRaiz}
                      onChange={(e) => setPepRaiz(e.target.value)}
                      placeholder="Ex: PEP-001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nome do Projeto</label>
                    <input 
                      type="text" 
                      value={nomeProjeto}
                      onChange={(e) => setNomeProjeto(e.target.value)}
                      placeholder="Ex: Ampliação Galpão A"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Implantador</label>
                    <input 
                      type="text" 
                      value={implantador}
                      onChange={(e) => setImplantador(e.target.value)}
                      placeholder="Ex: João Souza"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Planejadores</label>
                    <input 
                      type="text" 
                      value={planejadores}
                      onChange={(e) => setPlanejadores(e.target.value)}
                      placeholder="Ex: Ana, Pedro"
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
                  {editingItemId ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
