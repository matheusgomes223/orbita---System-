import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, ArrowLeft } from 'lucide-react';
import { OrbitaLogo } from './OrbitaLogo';
import { OrbitaIcon } from './OrbitaIcon';
import { MicrosoftIcon } from './MicrosoftIcon';

export function LoginForm({ onLogin }: { onLogin?: (role: string) => void }) {
  const [activeView, setActiveView] = useState<'login' | 'request' | 'recover' | 'loading'>('login');
  const [requestRole, setRequestRole] = useState<string>("");
  const [isRequestDropdownOpen, setIsRequestDropdownOpen] = useState(false);
  const requestDropdownRef = useRef<HTMLDivElement>(null);
  const [site, setSite] = useState<string>("");
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const siteDropdownRef = useRef<HTMLDivElement>(null);
  
  const [loginRole, setLoginRole] = useState<string>("");
  const [isLoginRoleDropdownOpen, setIsLoginRoleDropdownOpen] = useState(false);
  const loginRoleDropdownRef = useRef<HTMLDivElement>(null);

  const roles = [
    { id: 'administrador', label: 'Administrador' },
    { id: 'almoxerife', label: 'Almoxerife' },
    { id: 'requisitante', label: 'Requisitante' },
  ];

  const sites = [
    { id: 's11d', label: 'S11D / Canaã dos Carajás' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (requestDropdownRef.current && !requestDropdownRef.current.contains(event.target as Node)) {
        setIsRequestDropdownOpen(false);
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
        setIsSiteDropdownOpen(false);
      }
      if (loginRoleDropdownRef.current && !loginRoleDropdownRef.current.contains(event.target as Node)) {
        setIsLoginRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center px-6 py-12">
      <AnimatePresence mode="wait">
        {activeView === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[340px] mx-auto flex flex-col"
          >
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center mb-10"
            >
              <OrbitaLogo className="w-64" />
            </motion.div>

            <h1 className="text-3xl font-medium text-[#0A1729] mb-10 text-center">
              Acesse sua conta
            </h1>

            <form className="flex flex-col w-full" onSubmit={(e) => { 
              e.preventDefault(); 
              setActiveView('loading');
              setTimeout(() => {
                if(onLogin) onLogin(loginRole || 'almoxerife');
              }, 2000);
            }}>
              <div className="flex flex-col mb-8">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="email">
                  Chave C0 ou Matrícula
                </label>
                <input 
                  id="email"
                  type="text" 
                  placeholder="Ex: C0693921..." 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-8">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="password">
                  Senha
                </label>
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••••" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-[#0A1729] placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-8" ref={loginRoleDropdownRef}>
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="login-role">
                  Perfil de Acesso
                </label>
                <div className="relative">
                  <div 
                    className="w-full border-b-[2px] border-slate-200 py-2.5 flex items-center justify-between cursor-pointer transition-colors hover:border-slate-300"
                    onClick={() => setIsLoginRoleDropdownOpen(!isLoginRoleDropdownOpen)}
                  >
                    <span className={`font-medium ${loginRole ? 'text-[#0A1729]' : 'text-slate-300 font-normal'}`}>
                      {loginRole ? roles.find(r => r.id === loginRole)?.label : 'Selecione o perfil'}
                    </span>
                    <motion.div
                      animate={{ rotate: isLoginRoleDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {isLoginRoleDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50"
                      >
                        {roles.map((r) => (
                          <div 
                            key={`login-role-${r.id}`}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                              loginRole === r.id ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              setLoginRole(r.id);
                              setIsLoginRoleDropdownOpen(false);
                            }}
                          >
                            <span className={`text-sm ${loginRole === r.id ? 'font-semibold' : 'font-medium'}`}>
                              {r.label}
                            </span>
                            {loginRole === r.id && (
                              <Check className="w-4 h-4 text-[#00B4F1]" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-start mb-10 -mt-2">
                <button 
                  type="button"
                  onClick={() => setActiveView('recover')}
                  className="text-sm font-medium text-slate-500 hover:text-[#00B4F1] transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#0C2340] text-white py-3 rounded-md font-medium hover:bg-[#123158] transition-colors shadow-lg shadow-[#0C2340]/20 mb-5"
              >
                Entrar
              </button>
            </form>

            <div className="relative flex items-center mb-5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-[#829bb5] text-sm font-medium">ou</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button 
              type="button" 
              className="w-full flex items-center justify-center gap-2.5 border border-slate-200 rounded-md py-3 px-4 bg-white hover:bg-slate-50 transition-all font-medium text-[#0C2340] shadow-sm"
            >
              <MicrosoftIcon className="w-5 h-5" />
              <span>Entrar com Microsoft</span>
            </button>

            <div className="mt-6 text-center">
              <span className="text-slate-500 text-sm">
                Não tem uma conta?{' '}
                <button 
                  onClick={() => setActiveView('request')}
                  className="font-bold text-[#0A1729] hover:text-[#00B4F1] transition-colors"
                >
                  Solicite acesso
                </button>
              </span>
            </div>
          </motion.div>
        )}

        {activeView === 'request' && (
          <motion.div 
            key="request-access"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[340px] mx-auto flex flex-col"
          >
            <div className="flex items-center mb-10">
              <button 
                onClick={() => setActiveView('login')}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-medium text-[#0A1729] flex-1 text-center pr-8">
                Solicitar Acesso
              </h1>
            </div>

            <form className="flex flex-col w-full" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col mb-6">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="request-email">
                  E-mail
                </label>
                <input 
                  id="request-email"
                  type="email" 
                  placeholder="seu.nome@vale.com" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="name">
                  Nome
                </label>
                <input 
                  id="name"
                  type="text" 
                  placeholder="Nome Completo" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="matricula">
                  Matrícula
                </label>
                <input 
                  id="matricula"
                  type="text" 
                  placeholder="1234567" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-6" ref={requestDropdownRef}>
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="cargo">
                  Cargo
                </label>
                <div className="relative">
                  <div 
                    className="w-full border-b-[2px] border-slate-200 py-2.5 flex items-center justify-between cursor-pointer transition-colors hover:border-slate-300"
                    onClick={() => setIsRequestDropdownOpen(!isRequestDropdownOpen)}
                  >
                    <span className={`font-medium ${requestRole ? 'text-[#0A1729]' : 'text-slate-300 font-normal'}`}>
                      {requestRole ? roles.find(r => r.id === requestRole)?.label : 'Selecione o cargo'}
                    </span>
                    <motion.div
                      animate={{ rotate: isRequestDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isRequestDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50"
                      >
                        {roles.map((r) => (
                          <div 
                            key={`req-${r.id}`}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                              requestRole === r.id ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              setRequestRole(r.id);
                              setIsRequestDropdownOpen(false);
                            }}
                          >
                            <span className={`text-sm ${requestRole === r.id ? 'font-semibold' : 'font-medium'}`}>
                              {r.label}
                            </span>
                            {requestRole === r.id && (
                              <Check className="w-4 h-4 text-[#00B4F1]" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="geipss">
                  GEIPSS
                </label>
                <input 
                  id="geipss"
                  type="text" 
                  placeholder="GEIPSS" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <div className="flex flex-col mb-10" ref={siteDropdownRef}>
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="site">
                  Site
                </label>
                <div className="relative">
                  <div 
                    className="w-full border-b-[2px] border-slate-200 py-2.5 flex items-center justify-between cursor-pointer transition-colors hover:border-slate-300"
                    onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                  >
                    <span className={`font-medium ${site ? 'text-[#0A1729]' : 'text-slate-300 font-normal'}`}>
                      {site ? sites.find(s => s.id === site)?.label : 'Selecione o site'}
                    </span>
                    <motion.div
                      animate={{ rotate: isSiteDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isSiteDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50"
                      >
                        {sites.map((s) => (
                          <div 
                            key={`site-${s.id}`}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                              site === s.id ? 'bg-[#00B4F1]/10 text-[#0C2340]' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              setSite(s.id);
                              setIsSiteDropdownOpen(false);
                            }}
                          >
                            <span className={`text-sm ${site === s.id ? 'font-semibold' : 'font-medium'}`}>
                              {s.label}
                            </span>
                            {site === s.id && (
                              <Check className="w-4 h-4 text-[#00B4F1]" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#0C2340] text-white py-3.5 rounded-md font-medium hover:bg-[#123158] transition-colors shadow-lg shadow-[#0C2340]/20"
              >
                Solicitar
              </button>
            </form>
          </motion.div>
        )}

        {activeView === 'recover' && (
          <motion.div 
            key="recover-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[340px] mx-auto flex flex-col"
          >
            <div className="flex items-center mb-10">
              <button 
                onClick={() => setActiveView('login')}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-medium text-[#0A1729] flex-1 text-center pr-8">
                Recuperar Senha
              </h1>
            </div>

            <p className="text-slate-500 text-sm mb-8 text-center">
              Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
            </p>

            <form className="flex flex-col w-full" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col mb-10">
                <label className="text-sm font-medium text-slate-500 mb-1" htmlFor="recover-email">
                  E-mail @vale
                </label>
                <input 
                  id="recover-email"
                  type="email" 
                  placeholder="seu.nome@vale.com" 
                  className="w-full border-b-[2px] border-slate-200 py-2.5 focus:outline-none focus:border-[#0C2340] transition-colors font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal bg-transparent"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#0C2340] text-white py-3.5 rounded-md font-medium hover:bg-[#123158] transition-colors shadow-lg shadow-[#0C2340]/20"
              >
                Enviar Instruções
              </button>
            </form>
          </motion.div>
        )}
        
        {activeView === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[340px] mx-auto flex flex-col items-center justify-center h-64"
          >
            <OrbitaIcon spinning={true} className="w-14 h-14" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
