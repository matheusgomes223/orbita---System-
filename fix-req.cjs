const fs = require('fs');
let code = fs.readFileSync('src/components/Requisicao.tsx', 'utf8');

code = code.replace(/export function Requisicao\(\{ userRole = 'almoxerife', onNovaRequisicao, activeTab, onNavigate \}: \{ userRole\?: string, onNovaRequisicao\?: \(\) => void, activeTab\?: string, onNavigate\?: \(tab: string\) => void \}\) \{/, `export function Requisicao({ userRole = 'almoxerife', onNovaRequisicao, activeTab, onNavigate, userName, onLogout }: { userRole?: string, onNovaRequisicao?: () => void, activeTab?: string, onNavigate?: (tab: string) => void, userName?: string, onLogout?: () => void }) {`);

code = code.replace(/<MobileMenu activeTab=\{activeTab\} onNavigate=\{onNavigate\} userRole=\{userRole\} \/>/, `<MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />`);

fs.writeFileSync('src/components/Requisicao.tsx', code);
