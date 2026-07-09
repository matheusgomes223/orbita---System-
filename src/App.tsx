/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { HeroVisual } from './components/HeroVisual';
import { AlmoxarifeDashboard } from './components/AlmoxarifeDashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('requisitante');

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div 
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-screen"
        >
          <AlmoxarifeDashboard onLogout={() => setIsAuthenticated(false)} userRole={userRole} />
        </motion.div>
      ) : (
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="flex w-full min-h-screen bg-white overflow-hidden text-slate-800 font-sans"
        >
          {/* Esquerda: Formulário de Login */}
          <div className="w-full 2xl:w-1/2 flex flex-col relative overflow-y-auto">
            <LoginForm onLogin={(role) => {
              setUserRole(role);
              setIsAuthenticated(true);
            }} />
          </div>

          {/* Direita: Hero/Visual (Escondido em telas menores) */}
          <div className="hidden 2xl:flex 2xl:w-1/2 bg-[#0C2340] relative">
            <HeroVisual />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
