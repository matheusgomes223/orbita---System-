const fs = require('fs');
let code = fs.readFileSync('src/components/AlmoxarifeDashboard.tsx', 'utf8');

code = code.replace(/<Estoque userRole=\{userRole\} activeTab=\{activeTab\} onNavigate=\{setActiveTab\} \/>/g, `<Estoque userRole={userRole} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />`);

code = code.replace(/<Requisicao userRole=\{userRole\} activeTab=\{activeTab\} onNavigate=\{setActiveTab\} \/>/g, `<Requisicao userRole={userRole} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />`);

code = code.replace(/<Requisicao userRole=\{userRole\} onNovaRequisicao=\{\(\) => setActiveTab\('nova_requisicao'\)\} activeTab=\{activeTab\} onNavigate=\{setActiveTab\} \/>/g, `<Requisicao userRole={userRole} onNovaRequisicao={() => setActiveTab('nova_requisicao')} activeTab={activeTab} onNavigate={setActiveTab} userName={userName} onLogout={onLogout} />`);

fs.writeFileSync('src/components/AlmoxarifeDashboard.tsx', code);
