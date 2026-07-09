const fs = require('fs');
let code = fs.readFileSync('src/components/Estoque.tsx', 'utf8');

code = code.replace(/export function Estoque\(\{ userRole = 'almoxerife', activeTab, onNavigate \}: \{ userRole\?: string, activeTab\?: string, onNavigate\?: \(tab: string\) => void \}\) \{/, `export function Estoque({ userRole = 'almoxerife', activeTab, onNavigate, userName, onLogout }: { userRole?: string, activeTab?: string, onNavigate?: (tab: string) => void, userName?: string, onLogout?: () => void }) {`);

code = code.replace(/<MobileMenu activeTab=\{activeTab\} onNavigate=\{onNavigate\} userRole=\{userRole\} \/>/, `<MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />`);

fs.writeFileSync('src/components/Estoque.tsx', code);
