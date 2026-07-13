import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, Filter, MoreVertical, Calendar, Package, FileText, CheckCircle, XCircle, AlertCircle, MapPin, Truck, Printer, X, User, Camera, PenTool, Trash2, MessageSquare, Plus, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { MobileMenu } from './MobileMenu';
import SignatureCanvas from 'react-signature-canvas';
import { NovaRequisicao } from './NovaRequisicao';
import { fetchDb, saveDb } from '../services/githubDb';
import { OrbitaIcon } from './OrbitaIcon';
import cktrLogo from '../assets/cktr_logo.png';

export function Requisicao({ userRole = 'almoxerife', onNovaRequisicao, activeTab, onNavigate, userName, onLogout }: { userRole?: string, onNovaRequisicao?: () => void, activeTab?: string, onNavigate?: (tab: string) => void, userName?: string, onLogout?: () => void }) {
  const isAlmoxarife = userRole === 'almoxerife';
  const [isNovaRequisicaoOpen, setIsNovaRequisicaoOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedRequisicao, setSelectedRequisicao] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    if (selectedRequisicao) {
      setIsModalLoading(true);
      const timer = setTimeout(() => {
        setIsModalLoading(false);
      }, 500); // 500ms smooth loading
      return () => clearTimeout(timer);
    }
  }, [selectedRequisicao]);

  const [isDelivering, setIsDelivering] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [observation, setObservation] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverCpf, setReceiverCpf] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatusLogistico, setFilterStatusLogistico] = useState('');
  const [filterStatusAprovacao, setFilterStatusAprovacao] = useState('');
  const [filterDataDesejada, setFilterDataDesejada] = useState('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [registeredItems, setRegisteredItems] = useState<any[]>([]);

  const getFullUnitName = (und: string) => {
    const map: Record<string, string> = {
      'UN': 'Unidade',
      'KG': 'Quilograma',
      'M': 'Metro',
      'L': 'Litro',
      'CX': 'Caixa',
      'CJ': 'Conjunto',
      'PC': 'Peça',
      'RL': 'Rolo',
      'ROLO': 'Rolo'
    };
    return map[und?.toUpperCase()] || und;
  };

  const getItemUm = (item: any) => {
    if (item.um) return item.um;
    const found = registeredItems.find(ri => 
      (ri.codigoSAP && item.codigo && ri.codigoSAP.toUpperCase() === item.codigo.toUpperCase()) ||
      (ri.codigoItem && item.codigo && ri.codigoItem.toUpperCase() === item.codigo.toUpperCase())
    );
    return found ? found.und : 'UN';
  };

  const handleFinalizeDelivery = async () => {
    if (!selectedRequisicao) return;
    
    const deliveryDetails = {
      nome: receiverName || selectedRequisicao.requisitante,
      cpf: receiverCpf || selectedRequisicao.matricula,
      dataHora: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      observacao: observation,
      assinatura: signatureRef.current?.toDataURL() || null,
      fotoUrl: photoPreview || null
    };

    setRequisicoes(prev => 
      prev.map(req => {
        if (req.id === selectedRequisicao.id) {
          return {
            ...req,
            statusLogistico: 'Entregue',
            detalhesRetirada: deliveryDetails
          };
        }
        return req;
      })
    );

    // Save database update asynchronously in background
    (async () => {
      try {
        const db = await fetchDb(false, true);
        
        // 1. Update requisition status
        db.requisicoes = (db.requisicoes || []).map((req: any) => {
          if (req.id === selectedRequisicao.id) {
            return {
              ...req,
              statusLogistico: 'Entregue',
              detalhesRetirada: deliveryDetails
            };
          }
          return req;
        });

        // 2. Deduct quantities from db.estoque
        db.estoque = (db.estoque || []).map((estItem: any) => {
          const estCode = (estItem.codigoSAP || estItem.codigoItem || '').toUpperCase();
          
          const matchingReqItem = (selectedRequisicao.itens || []).find((i: any) => {
            const reqCode = (i.codigo || '').toUpperCase();
            const codesMatch = reqCode === estCode;
            
            const reqAddr = (i.endereco || '').trim().toUpperCase();
            const estAddr = (estItem.endereco || '').trim().toUpperCase();
            const addrMatch = !reqAddr || !estAddr || reqAddr === estAddr;
            
            return codesMatch && addrMatch;
          });

          if (matchingReqItem) {
            const oldSaldo = Number(estItem.saldo || 0);
            const qtyToDeduct = Number(matchingReqItem.quantidade || 0);
            const newSaldo = Math.max(0, oldSaldo - qtyToDeduct);
            
            const unitValue = oldSaldo > 0 ? Number(estItem.valorTotal || 0) / oldSaldo : 0;
            const newValorTotal = unitValue * newSaldo;
            const newDisponivel = Math.max(0, Number(estItem.disponivel || 0) - qtyToDeduct);

            return {
              ...estItem,
              saldo: newSaldo,
              disponivel: newDisponivel,
              valorTotal: newValorTotal
            };
          }
          return estItem;
        }).filter((estItem: any) => Number(estItem.saldo || 0) > 0);

        await saveDb(db);
      } catch (err) {
        console.error("Erro ao salvar entrega no banco:", err);
      }
    })();

    // Reset state and close modal
    setIsDelivering(false);
    setSelectedRequisicao(null);
    setReceiverName('');
    setReceiverCpf('');
    setObservation('');
    setShowObservation(false);
    setPhotoPreview(null);
  };

  const handleCancelRequisicao = async (id: string) => {
    setRequisicoes(prev => 
      prev.map(req => {
        if (req.id === id) {
          return {
            ...req,
            statusAprovacao: 'Cancelado',
            statusLogistico: 'Cancelado'
          };
        }
        return req;
      })
    );

    (async () => {
      try {
        const db = await fetchDb();
        db.requisicoes = (db.requisicoes || []).map((req: any) => {
          if (req.id === id) {
            return {
              ...req,
              statusAprovacao: 'Cancelado',
              statusLogistico: 'Cancelado'
            };
          }
          return req;
        });
        await saveDb(db);
      } catch (err) {
        console.error("Erro ao cancelar requisição:", err);
      }
    })();
  };

  const handleDevolverMaterial = async (id: string) => {
    setRequisicoes(prev => 
      prev.map(req => {
        if (req.id === id) {
          return {
            ...req,
            statusLogistico: 'Devolvido'
          };
        }
        return req;
      })
    );

    (async () => {
      try {
        const db = await fetchDb();
        db.requisicoes = (db.requisicoes || []).map((req: any) => {
          if (req.id === id) {
            return {
              ...req,
              statusLogistico: 'Devolvido'
            };
          }
          return req;
        });
        await saveDb(db);
      } catch (err) {
        console.error("Erro ao devolver material:", err);
      }
    })();
  };

  const handleDeleteRequisicao = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente esta requisição?")) return;
    
    setRequisicoes(prev => prev.filter(req => req.id !== id));

    try {
      const db = await fetchDb();
      db.requisicoes = (db.requisicoes || []).filter((req: any) => req.id !== id);
      await saveDb(db);
    } catch (err) {
      console.error("Erro ao excluir requisição:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setRequisicoes(db.requisicoes || []);
      setRegisteredItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);

    // Carregar CKTR Logo
    fetch(cktrLogo)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Erro ao carregar CKTR logo para o PDF:', err));

    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const filteredRequisicoes = requisicoes.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = Object.values(req).some(val => 
      val && val.toString().toLowerCase().includes(searchLower)
    );
    const matchesLogistico = filterStatusLogistico ? req.statusLogistico === filterStatusLogistico : true;
    const matchesAprovacao = filterStatusAprovacao ? req.statusAprovacao === filterStatusAprovacao : true;
    const matchesData = filterDataDesejada ? req.dataDesejada === filterDataDesejada : true;

    return matchesSearch && matchesLogistico && matchesAprovacao && matchesData;
  });

  const getStatusAprovacaoColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'bg-emerald-50 text-emerald-600';
      case 'Aguardando': return 'bg-amber-50 text-amber-600';
      case 'Rejeitado': return 'bg-rose-50 text-rose-600';
      case 'Expirado': return 'bg-slate-50 text-slate-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLogisticoColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'text-emerald-600 bg-emerald-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Pendente': return 'text-amber-600 bg-amber-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Retirado':
      case 'Recebido':
      case 'Entregue': return 'text-blue-600 bg-blue-50/50 font-medium px-2.5 py-1 rounded-md';
      case 'Cancelado': return 'text-rose-600 bg-rose-50/50 font-medium px-2.5 py-1 rounded-md';
      default: return 'text-slate-600 bg-slate-50 font-medium px-2.5 py-1 rounded-md';
    }
  };

  const handlePrintRequisicao = (req: any) => {
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const logoHtml = logoBase64 
      ? `<img src="${logoBase64}" style="height: 38px; object-fit: contain;" alt="Logo CKTR">`
      : `
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 38px; height: 38px;">
          <g transform="translate(10, 10)">
            <circle cx="70" cy="70" r="22" fill="#0C2340"/>
            <ellipse cx="70" cy="70" rx="65" ry="25" transform="rotate(-35 70 70)" stroke="#0C2340" strokeWidth="6"/>
            <ellipse cx="70" cy="70" rx="65" ry="25" transform="rotate(35 70 70)" stroke="#00B4F1" strokeWidth="6"/>
            <circle cx="34" cy="45" r="7" fill="#F7A800"/>
            <circle cx="106" cy="45" r="5" fill="#00B4F1"/>
          </g>
        </svg>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisição ${req.requisicao}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page {
            size: auto;
            margin: 0;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20mm 15mm;
            font-size: 12px;
            line-height: 1.5;
            background-color: #fff;
          }
          
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0C2340;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .logo-text {
            font-size: 20px;
            font-weight: 700;
            color: #0C2340;
            letter-spacing: 1px;
          }
          
          .doc-info {
            text-align: right;
          }
          
          .doc-title {
            font-size: 14px;
            font-weight: 700;
            color: #0C2340;
            margin: 0 0 3px 0;
            text-transform: uppercase;
          }
          
          .doc-number {
            font-family: monospace;
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin: 0;
          }
          
          .section-title {
            font-size: 11px;
            font-weight: 700;
            color: #0C2340;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 4px;
            margin: 20px 0 10px 0;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .card {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 10px 12px;
          }
          
          .label {
            font-size: 9px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          
          .value {
            font-size: 12px;
            font-weight: 500;
            color: #0f172a;
          }
          
          .value-mono {
            font-family: monospace;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
            text-transform: uppercase;
          }
          
          td {
            padding: 8px 10px;
            color: #334155;
          }
          
          .text-right {
            text-align: right;
          }

          .status-badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 5px;
          }

          .status-Aprovado { background-color: #d1fae5; color: #065f46; }
          .status-Aguardando { background-color: #fef3c7; color: #92400e; }
          .status-Rejeitado { background-color: #fee2e2; color: #991b1b; }
          .status-Cancelado { background-color: #f1f5f9; color: #475569; }
          .status-Retirado { background-color: #dbeafe; color: #1e40af; }
          .status-Disponivel { background-color: #d1fae5; color: #065f46; }
          .status-Pendente { background-color: #fef3c7; color: #92400e; }

          .footer-note {
            margin-top: 50px;
            text-align: center;
            font-size: 10.5px;
            color: #64748b;
            line-height: 1.6;
          }

          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            ${logoHtml}
          </div>
          <div class="doc-info">
            <h1 class="doc-title">Requisição de Materiais</h1>
            <p class="doc-number">${req.requisicao}</p>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Requisitante</div>
            <div class="value">${req.requisitante}</div>
            <div class="label" style="margin-top: 6px;">Matrícula</div>
            <div class="value value-mono">${req.matricula || '-'}</div>
          </div>
          <div class="card">
            <div class="label">Projeto Destino</div>
            <div class="value">${req.projetoDestino || '-'}</div>
            <div class="label" style="margin-top: 6px;">Modalidade / Recebedor</div>
            <div class="value">${req.tipoSaida || '-'} &bull; ${req.localDestino || '-'}</div>
          </div>
        </div>

        <div class="grid" style="margin-top: 10px;">
          <div class="card">
            <div class="label">Data de Solicitação</div>
            <div class="value">${req.dataDesejada || '-'}</div>
          </div>
          <div class="card">
            <div class="label">Status CMP</div>
            <div>
              <span class="status-badge status-${req.statusLogistico}">${req.statusLogistico}</span>
            </div>
          </div>
        </div>

        <div class="section-title">Aprovação</div>
        <div class="grid">
          <div class="card">
            <div class="label">Aprovador</div>
            <div class="value" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 500;">${req.detalhesAprovador?.nome || '-'}</span>
              <span class="status-badge status-${req.statusAprovacao}">${req.statusAprovacao}</span>
            </div>
            ${req.detalhesAprovador?.cargo ? `
              <div class="label" style="margin-top: 6px;">Cargo</div>
              <div class="value">${req.detalhesAprovador.cargo}</div>
            ` : ''}
          </div>
          <div class="card">
            <div class="label">Data/Hora da Aprovação</div>
            <div class="value">${req.detalhesAprovador?.dataSolicitacao || '-'}</div>
          </div>
        </div>

        <div class="section-title">Itens Solicitados</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Código SAP</th>
              <th style="width: 55%;">Descrição</th>
              <th style="width: 15%;" class="text-right">Qtd</th>
              <th style="width: 15%;">Endereço</th>
            </tr>
          </thead>
          <tbody>
            ${(req.itens || []).map((item: any) => `
              <tr>
                <td style="font-family: monospace;">${item.codigo || '-'}</td>
                <td style="font-weight: 500;">${item.descricao || '-'}</td>
                <td class="text-right" style="font-weight: 600;">${item.quantidade || '0'}</td>
                <td style="font-family: monospace; color: #475569;">${item.endereco || '-'}</td>
              </tr>
            `).join('')}
            ${(!req.itens || req.itens.length === 0) ? `
              <tr>
                <td colspan="4" style="text-align: center; color: #64748b; padding: 15px;">Nenhum item solicitado.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        ${req.detalhesRetirada ? `
        <div class="section-title">Confirmação de Retirada / Entrega</div>
        <div class="grid">
          <div class="card">
            <div class="label">Recebedor</div>
            <div class="value">${req.detalhesRetirada.nome || '-'}</div>
            <div class="label" style="margin-top: 6px;">CPF/Matrícula</div>
            <div class="value value-mono">${req.detalhesRetirada.cpf || '-'}</div>
          </div>
          <div class="card">
            <div class="label">Data/Hora da Retirada</div>
            <div class="value">${req.detalhesRetirada.dataHora || '-'}</div>
            ${req.detalhesRetirada.observacao ? `
              <div class="label" style="margin-top: 6px;">Observação</div>
              <div class="value">${req.detalhesRetirada.observacao}</div>
            ` : ''}
          </div>
        </div>
        <div class="grid" style="margin-top: 10px;">
          ${req.detalhesRetirada.assinatura ? `
            <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 140px;">
              <div class="label" style="align-self: flex-start; margin-bottom: 5px; width: 100%;">Assinatura do Recebedor</div>
              <img src="${req.detalhesRetirada.assinatura}" style="max-height: 100px; max-width: 100%; object-fit: contain; background: white; padding: 4px;" alt="Assinatura">
            </div>
          ` : ''}
          ${req.detalhesRetirada.fotoUrl ? `
            <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 140px;">
              <div class="label" style="align-self: flex-start; margin-bottom: 5px; width: 100%;">Foto do Recebedor</div>
              <img src="${req.detalhesRetirada.fotoUrl}" style="max-height: 100px; max-width: 100%; object-fit: contain; background: white; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;" alt="Foto">
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer-note">
          Essa requisição só é válida em até 72 horas. Após esse prazo, ela será cancelada automaticamente.<br>
          O CMP SERRA SUL agradece a sua atenção.
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-slate-50 relative z-20">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-96 flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar requisições..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" />
          </div>
          <div className="sm:hidden">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <div className="hidden sm:block">
            <MobileMenu activeTab={activeTab} onNavigate={onNavigate} userRole={userRole} userName={userName} onLogout={onLogout} />
          </div>
          {!isAlmoxarife && (
            <button 
              onClick={() => onNovaRequisicao ? onNovaRequisicao() : setIsNovaRequisicaoOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${showFilters ? 'bg-slate-100 text-slate-800' : 'bg-transparent hover:bg-slate-50 text-slate-700'}`}
            title="Filtros"
          >
            <Filter className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 bg-white overflow-hidden z-10"
          >
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status CMP</label>
                <select 
                  value={filterStatusLogistico}
                  onChange={(e) => setFilterStatusLogistico(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                >
                  <option value="">Todos</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Retirado">Retirado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status Aprovação</label>
                <select 
                  value={filterStatusAprovacao}
                  onChange={(e) => setFilterStatusAprovacao(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                >
                  <option value="">Todos</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Aguardando">Aguardando</option>
                  <option value="Rejeitado">Rejeitado</option>
                  <option value="Expirado">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Data Desejada</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={filterDataDesejada}
                    onChange={(e) => setFilterDataDesejada(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-slate-700"
                  />
                  {!filterDataDesejada && (
                    <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none bg-white px-1">
                      <span className="text-sm text-slate-500">Todas as datas</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {(filterStatusLogistico || filterStatusAprovacao || filterDataDesejada) && (
              <div className="px-4 sm:px-6 pb-4 flex justify-end">
                <button 
                  onClick={() => {
                    setFilterStatusLogistico('');
                    setFilterStatusAprovacao('');
                    setFilterDataDesejada('');
                  }}
                  className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <th className="p-4 pl-6">Requisição</th>
              <th className="p-4">Requisitante</th>
              <th className="p-4">Matrícula</th>
              <th className="p-4">Projeto</th>
              <th className="p-4">Recebedor</th>
              <th className="p-4">Tipo Saída</th>
              <th className="p-4 text-center">Status Aprovação</th>
              <th className="p-4 text-center">Status CMP</th>
              <th className="p-4">Data Desejada</th>
              <th className="p-4 pr-6 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredRequisicoes.map((req, idx) => (
              <motion.tr 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => setSelectedRequisicao(req)}
              >
                <td className="p-4 pl-6 font-medium text-[#0C2340]">
                  {req.requisicao}
                </td>
                <td className="p-4">{req.requisitante}</td>
                <td className="p-4 font-mono text-xs text-slate-500">{req.matricula}</td>
                <td className="p-4">{req.projetoDestino}</td>
                <td className="p-4 font-semibold text-slate-700">{req.detalhesRetirada?.nome || '-'}</td>
                <td className="p-4 text-slate-600">
                  {req.tipoSaida}
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusAprovacaoColor(req.statusAprovacao)}`}>
                    {req.statusAprovacao}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={getStatusLogisticoColor(req.statusLogistico)}>
                    {req.statusLogistico}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {formatDate(req.dataDesejada)}
                </td>
                <td className="p-4 pr-6 relative text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === req.id ? null : req.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {activeMenuId === req.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-2"
                        >
                          {userRole === 'requisitante' ? (
                            <>
                              <button 
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0C2340] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handleCancelRequisicao(req.id);
                                }}
                              >
                                <XCircle className="w-4 h-4 text-rose-500" />
                                Cancelar Requisição
                              </button>
                              <button 
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0C2340] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handleDevolverMaterial(req.id);
                                }}
                              >
                                <RotateCcw className="w-4 h-4 text-amber-500" />
                                Devolver Material
                              </button>
                              <button 
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0C2340] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handlePrintRequisicao(req);
                                }}
                              >
                                <Printer className="w-4 h-4 text-slate-500" />
                                Imprimir Requisição
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0C2340] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handlePrintRequisicao(req);
                                }}
                              >
                                <Printer className="w-4 h-4" />
                                Imprimir Requisição
                              </button>
                              {userRole === 'administrador' && (
                                <button 
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    handleDeleteRequisicao(req.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir Requisição
                                </button>
                              )}
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filteredRequisicoes.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 w-full">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">Nenhuma requisição encontrada</p>
            <p className="text-sm">Ajuste os filtros de busca para encontrar o que precisa.</p>
          </div>
        )}
      </div>



      {/* Centered Modal */}
      <AnimatePresence>
        {selectedRequisicao && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
              onClick={() => setSelectedRequisicao(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl flex flex-col border border-slate-200 max-h-[95vh] h-full pointer-events-auto overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      Detalhes da Requisição
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{selectedRequisicao.requisicao}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRequisicao(null);
                      setIsDelivering(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isModalLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/20">
                    <OrbitaIcon spinning={true} className="w-14 h-14" />
                    <p className="text-sm font-medium text-slate-500 mt-4 animate-pulse">Carregando detalhes...</p>
                  </div>
                ) : isDelivering ? (
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Form */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Recebedor</label>
                          <input 
                            type="text" 
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" 
                            placeholder="Nome completo" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">CPF ou Matrícula</label>
                          <input 
                            type="text" 
                            value={receiverCpf}
                            onChange={(e) => setReceiverCpf(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all" 
                            placeholder="000.000.000-00 ou 123456" 
                          />
                        </div>
                        
                        {!showObservation ? (
                          <button
                            onClick={() => setShowObservation(true)}
                            className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1.5 transition-colors focus:outline-none"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Adicionar observação (Opcional)
                          </button>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex justify-between items-end mb-2">
                              <label className="block text-sm font-medium text-slate-700">Observação</label>
                              <button
                                onClick={() => {
                                  setShowObservation(false);
                                  setObservation('');
                                }}
                                className="text-xs text-slate-400 hover:text-rose-500 transition-colors focus:outline-none"
                              >
                                Cancelar
                              </button>
                            </div>
                            <textarea 
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-none h-24" 
                              placeholder="Digite alguma observação sobre a entrega..."
                              value={observation}
                              onChange={(e) => setObservation(e.target.value)}
                            />
                          </motion.div>
                        )}

                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">Assinatura Digital</label>
                            <button
                              onClick={() => signatureRef.current?.clear()}
                              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Limpar
                            </button>
                          </div>
                          <div className="rounded-lg bg-white h-40 relative overflow-hidden">
                            <SignatureCanvas 
                              ref={signatureRef}
                              penColor="black"
                              canvasProps={{ className: 'w-full h-full absolute inset-0 z-10 touch-none' }} 
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                              <span className="text-slate-300 flex items-center gap-2 select-none">
                                <PenTool className="w-4 h-4" /> Assine aqui
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">Foto do Recebedor</label>
                            {photoPreview && (
                              <button
                                onClick={() => setPhotoPreview(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Remover
                              </button>
                            )}
                          </div>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white h-40 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                            ) : (
                              <>
                                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <Camera className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="text-sm font-medium">Tirar foto</p>
                                <p className="text-xs mt-1 text-slate-400">Tamanho máximo: 5MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Items */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">Itens da Entrega</h3>
                          <p className="text-sm text-slate-500">Confirme os itens que estão sendo entregues.</p>
                        </div>
                        
                        <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg">
                          <div className="h-full overflow-y-auto">
                            <table className="w-full text-left text-sm relative">
                              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium sticky top-0 backdrop-blur-sm">
                                <tr>
                                  <th className="py-3 px-5">Código</th>
                                  <th className="py-3 px-5">Descrição</th>
                                  <th className="py-3 px-5 text-right w-24">Qtd</th>
                                  <th className="py-3 px-5 w-32">Unidade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedRequisicao.itens?.map((item: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-5 font-mono text-xs text-slate-500">{item.codigo}</td>
                                    <td className="py-4 px-5 font-medium text-slate-700">{item.descricao}</td>
                                    <td className="py-4 px-5 text-right font-semibold text-slate-600">{item.quantidade}</td>
                                    <td className="py-4 px-5 font-medium text-slate-700">
                                      {getFullUnitName(getItemUm(item))}
                                    </td>
                                  </tr>
                                ))}
                                {(!selectedRequisicao.itens || selectedRequisicao.itens.length === 0) && (
                                  <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400">
                                      <Package className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                      <p>Nenhum item cadastrado para esta requisição.</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-none">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Requisitante
                        </div>
                        <div className="font-medium text-slate-800 text-base">{selectedRequisicao.requisitante}</div>
                        <div className="text-sm text-slate-500 mt-1 font-mono">Matrícula: {selectedRequisicao.matricula}</div>
                      </div>
                      <div className="bg-white p-5 rounded-none">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Projeto Destino
                        </div>
                        <div className="font-medium text-slate-800 text-base">{selectedRequisicao.projetoDestino}</div>
                      </div>
                      <div className="bg-white p-5 rounded-none">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Local / Descrição
                        </div>
                        <div className="font-medium text-slate-800 text-base">{selectedRequisicao.localDestino || '-'}</div>
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          Modalidade: <span className="text-slate-700">{selectedRequisicao.tipoSaida}</span>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-none">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          Aprovador
                        </div>
                        <div className="font-medium text-slate-800 text-base">
                          {selectedRequisicao.detalhesAprovador?.nome || '-'}
                        </div>
                        <div className="text-sm text-slate-500 mt-1 flex flex-col font-medium">
                          {selectedRequisicao.detalhesAprovador?.cargo && (
                            <div>Cargo: <span className="text-slate-700">{selectedRequisicao.detalhesAprovador.cargo}</span></div>
                          )}
                          <div>Status: <span className="text-slate-700">{selectedRequisicao.statusAprovacao}</span></div>
                        </div>
                      </div>
                    </div>

                    {selectedRequisicao.statusAprovacao === 'Aguardando' && selectedRequisicao.statusLogistico === 'Pendente' && selectedRequisicao.detalhesAprovador && (
                      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <h3 className="text-lg font-semibold text-slate-800">Aguardando Aprovação</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aprovador Responsável</div>
                            <div className="font-medium text-slate-800">{selectedRequisicao.detalhesAprovador.nome}</div>
                            <div className="text-sm text-slate-500">{selectedRequisicao.detalhesAprovador.cargo}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data da Solicitação</div>
                            <div className="font-medium text-slate-800">{selectedRequisicao.detalhesAprovador.dataSolicitacao}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedRequisicao.statusLogistico === 'Recebido' || selectedRequisicao.statusLogistico === 'Retirado' || selectedRequisicao.statusLogistico === 'Entregue') && selectedRequisicao.detalhesRetirada && (
                      <div className="bg-white p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-lg font-semibold text-slate-800">Detalhes da Retirada</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recebedor</div>
                              <div className="font-medium text-slate-800">{selectedRequisicao.detalhesRetirada.nome}</div>
                              <div className="text-sm text-slate-500 font-mono mt-0.5">CPF/Matrícula: {selectedRequisicao.detalhesRetirada.cpf}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data e Hora</div>
                              <div className="font-medium text-slate-800">{selectedRequisicao.detalhesRetirada.dataHora}</div>
                            </div>
                            {selectedRequisicao.detalhesRetirada.observacao && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observação</div>
                                <div className="text-sm text-slate-700 bg-slate-50 p-3">
                                  {selectedRequisicao.detalhesRetirada.observacao}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequisicao.detalhesRetirada.assinatura && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assinatura</div>
                                <div className="bg-white p-2 h-32 flex items-center justify-center relative overflow-hidden">
                                  <img src={selectedRequisicao.detalhesRetirada.assinatura} alt="Assinatura" className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80" />
                                </div>
                              </div>
                            )}
                            {selectedRequisicao.detalhesRetirada.fotoUrl && (
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Foto</div>
                                <div 
                                  className="bg-white h-32 overflow-hidden flex items-center justify-center relative cursor-pointer group"
                                  onClick={() => setExpandedImage(selectedRequisicao.detalhesRetirada.fotoUrl)}
                                >
                                  <img src={selectedRequisicao.detalhesRetirada.fotoUrl} alt="Foto do recebedor" className="w-full h-full object-contain bg-slate-50 transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-6 h-6" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Itens List */}
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        Itens da Requisição
                      </h3>
                      <div className="bg-white overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                              <th className="py-3 px-5">Código</th>
                              <th className="py-3 px-5">Descrição</th>
                              <th className="py-3 px-5 text-right w-24">Qtd</th>
                              <th className="py-3 px-5 w-32">Unidade</th>
                              <th className="py-3 px-5">Endereço</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedRequisicao.itens?.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-5 font-mono text-xs text-slate-500">{item.codigo}</td>
                                <td className="py-4 px-5 font-medium text-slate-700">{item.descricao}</td>
                                <td className="py-4 px-5 text-right font-semibold text-slate-600">{item.quantidade}</td>
                                <td className="py-4 px-5 font-medium text-slate-700">
                                  {getFullUnitName(getItemUm(item))}
                                </td>
                                <td className="py-4 px-5 text-slate-500">
                                  <span className="font-mono text-xs text-slate-600">
                                    {item.endereco}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!selectedRequisicao.itens || selectedRequisicao.itens.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                  <Package className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                  <p>Nenhum item cadastrado para esta requisição.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {!isModalLoading && (
                  <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        if (isDelivering) {
                          setIsDelivering(false);
                        } else {
                          setSelectedRequisicao(null);
                          setIsDelivering(false);
                        }
                      }}
                      className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      {isDelivering ? "Voltar" : "Fechar"}
                    </button>
                    
                    {isDelivering ? (
                      <button 
                        onClick={handleFinalizeDelivery}
                        className="px-5 py-2.5 bg-[#0C2340] text-white rounded-lg font-medium hover:bg-[#0a1d36] transition-colors shadow-sm flex items-center gap-2"
                      >
                        Finalizar Entrega
                      </button>
                    ) : (isAlmoxarife ? (selectedRequisicao.statusLogistico !== 'Retirado' && selectedRequisicao.statusLogistico !== 'Recebido') : (selectedRequisicao.statusAprovacao === 'Aprovado' && selectedRequisicao.statusLogistico === 'Disponível')) && (
                      <button 
                        onClick={() => setIsDelivering(true)}
                        className="px-5 py-2.5 bg-[#0C2340] text-white rounded-lg font-medium hover:bg-[#0a1d36] transition-colors shadow-sm flex items-center gap-2"
                      >
                        Iniciar Entrega
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={expandedImage} 
                alt="Foto expandida" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />
              <button 
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNovaRequisicaoOpen && (
          <NovaRequisicao onClose={() => setIsNovaRequisicaoOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
