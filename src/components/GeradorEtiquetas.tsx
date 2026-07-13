import React, { useState, useEffect } from 'react';
import { Search, Printer, CheckSquare, Square, FileText, X } from "lucide-react";
import { motion } from 'motion/react';
import { fetchDb } from '../services/githubDb';
import cktrLogo from '../assets/cktr_logo.png';
import valeLogo from '../assets/vale_logo.png';

export function GeradorEtiquetas({ onClose }: { onClose?: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [registeredItems, setRegisteredItems] = useState<any[]>([]);
  const [logoBase64, setLogoBase64] = useState('');
  const [valeLogoBase64, setValeLogoBase64] = useState('');

  useEffect(() => {
    // Load CKTR Logo
    fetch(cktrLogo)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Error loading CKTR logo:', err));

    // Load Vale Logo
    fetch(valeLogo)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setValeLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Error loading Vale logo:', err));
  }, []);

  useEffect(() => {
    async function loadData() {
      const db = await fetchDb();
      setEstoque(db.estoque || []);
      setRegisteredItems(db.items || []);
    }
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredEstoque = estoque.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (item.descricao || '').toLowerCase().includes(searchLower) || 
           (item.codigoSAP || '').toLowerCase().includes(searchLower) ||
           (item.partNumber || '').toLowerCase().includes(searchLower);
  });

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === filteredEstoque.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEstoque.map(item => item.id));
    }
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) return;
    setIsPrinting(true);

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

    const selectedData = estoque.filter(item => selectedItems.includes(item.id));

    const getUmFullName = (um: string) => {
      const upper = (um || 'UN').toUpperCase().trim();
      if (upper === 'M') return 'Metro';
      if (upper === 'PC') return 'Peça';
      if (upper === 'UN') return 'Unidade';
      if (upper === 'CJ') return 'Conjunto';
      if (upper === 'KG') return 'Quilo';
      if (upper === 'L') return 'Litro';
      return um || 'Unidade';
    };

    // Vector Code 39 SVG barcode generator function
    const getCode39SVG = (text: string) => {
      const chars: Record<string, string> = {
        '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
        '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
        '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
        'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
        'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
        'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
        'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
        'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
        'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
        '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
        '$': '100100100101', '/': '100100101001', '+': '100101001001', '%': '101001001001'
      };
      const cleanText = text.toUpperCase().replace(/[^A-Z0-9\-\.\s\$\/\+\%]/g, '');
      const formatted = `*${cleanText}*`;
      let result = '';
      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i];
        const pattern = chars[char] || chars['-'];
        result += pattern + '0';
      }
      
      let pathData = '';
      for (let x = 0; x < result.length; x++) {
        if (result[x] === '1') {
          pathData += `M${x},0 h1 v40 h-1 z `;
        }
      }
      
      return `<svg viewBox="0 0 ${result.length} 40" width="240" height="28" preserveAspectRatio="none">
        <path d="${pathData}" fill="#000000" />
      </svg>`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Plaquetas de Identificação</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              padding: 0;
              margin: 0;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            padding: 0;
            margin: 0;
          }
          .page-wrapper {
            width: 297mm;
            height: 210mm;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
            background: #ffffff;
          }
          .page-wrapper:last-child {
            page-break-after: avoid;
            page-break-inside: avoid;
            break-after: avoid;
          }
          .plate {
            width: 277mm;
            height: 190mm;
            border: 3px solid #0C2340;
            border-radius: 12px;
            padding: 8mm;
            position: relative;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            border-bottom: 2px solid #0C2340;
            padding-bottom: 3mm;
            margin-bottom: 4mm;
          }
          .header-title {
            font-size: 26px;
            font-weight: 800;
            color: #0C2340;
            letter-spacing: -0.5px;
          }
          .header-address {
            background: #0C2340;
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .main-content {
            display: flex;
            gap: 6mm;
            flex: 1;
            margin-bottom: 4mm;
          }
          .left-column {
            flex: 1.3;
            display: flex;
            flex-direction: column;
            gap: 2mm;
          }
          .right-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 2px solid #0C2340;
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff;
            height: 86mm;
          }
          .photo-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            box-sizing: border-box;
          }
          .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .info-row {
            display: flex;
            align-items: center;
            height: 10.5mm;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            background: #ffffff;
          }
          .info-icon {
            width: 10.5mm;
            height: 100%;
            background: #0C2340;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            flex-shrink: 0;
          }
          .info-icon svg {
            width: 5mm;
            height: 5mm;
            fill: currentColor;
          }
          .info-label {
            width: 38mm;
            background: #f8fafc;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 4mm;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            border-right: 1px solid #cbd5e1;
            text-transform: uppercase;
          }
          .info-value {
            flex: 1;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 4mm;
            font-size: 13px;
            font-weight: 600;
            color: #0c2340;
            background: #ffffff;
          }
          .description-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            position: relative;
            padding: 12px 14px;
            font-size: 16px;
            line-height: 1.4;
            color: #334155;
            font-weight: 700;
            background: #ffffff;
            flex: 1;
            margin-top: 2mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .description-title {
            position: absolute;
            top: -9px;
            left: 10px;
            background: #0C2340;
            color: #ffffff;
            padding: 2px 10px;
            font-size: 9px;
            font-weight: 800;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .footer {
            background: #0C2340;
            height: 12mm;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 4mm;
            color: #ffffff;
            overflow: hidden;
          }
          .footer-left {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .footer-right {
            background: #ffffff;
            height: 100%;
            margin-right: -4mm;
            padding: 2px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 75mm;
          }
          .barcode-line {
            font-family: monospace;
            font-size: 8px;
            font-weight: 700;
            color: #0c2340;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${selectedData.map(item => {
          const rawPep = item.cc || item.centroCusto || '0073292-01';
          const formattedPep = rawPep.toUpperCase().startsWith('C') ? rawPep : `C-${rawPep}`;
          const barcodeText = `CMP-${item.codigoSAP || '00000000'}-${item.nfEntrada || item.notaFiscal || '000'}-${rawPep}`;
          const barcodeSVG = getCode39SVG(barcodeText);

          // Resolve the correct image from the registered catalog items (prioritizing item code first)
          let finalImage = null;
          const foundCatalog = registeredItems.find(ri => {
            if (ri.codigoItem && item.codigoItem && ri.codigoItem !== '-' && item.codigoItem !== '-') {
              return ri.codigoItem.toUpperCase() === item.codigoItem.toUpperCase();
            }
            if (ri.codigoSAP && item.codigoSAP && ri.codigoSAP !== '-' && item.codigoSAP !== '-') {
              return ri.codigoSAP.toUpperCase() === item.codigoSAP.toUpperCase();
            }
            return false;
          });
          if (foundCatalog && foundCatalog.foto) {
            finalImage = foundCatalog.foto;
          } else {
            finalImage = item.imagem || null;
          }

          return `
            <div class="page-wrapper">
              <div class="plate">
              <div class="header">
                <div style="display: flex; align-items: center;">
                  ${logoBase64 ? `<img src="${logoBase64}" style="height: 38px; object-fit: contain;" alt="Logo CKTR">` : ''}
                </div>
                <div style="display: flex; align-items: center; justify-content: center;">
                  <div class="header-title">CMP SERRA SUL</div>
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                  ${valeLogoBase64 ? `<img src="${valeLogoBase64}" style="height: 38px; object-fit: contain;" alt="Logo Vale">` : ''}
                </div>
              </div>
              
              <div class="main-content">
                <div class="left-column">
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 8c-.83 0-1.5-.67-1.5-1.5S4.67 5 5.5 5 7 5.67 7 6.5 6.33 8 5.5 8z"/></svg>
                    </div>
                    <div class="info-label">CÓDIGO</div>
                    <div class="info-value">${item.codigoItem || '-'}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    </div>
                    <div class="info-label">NF</div>
                    <div class="info-value">${item.nfEntrada || item.notaFiscal || '-'}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <div class="info-label">ELEMENTO (PEP)</div>
                    <div class="info-value">${formattedPep}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </div>
                    <div class="info-label">PEDIDO</div>
                    <div class="info-value">${item.pedidoPo || item.pedidoCompra || '-'}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                    </div>
                    <div class="info-label">PROJETO</div>
                    <div class="info-value">${item.projeto || '-'}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M10.5 9h3v3h-3zm0 5h3v3h-3zM8 2v22h8V2H8zm6 18h-4v-3h4v3zm0-5h-4v-3h4v3zm0-5h-4V7h4v3z"/></svg>
                    </div>
                    <div class="info-label">UND. MED.</div>
                    <div class="info-value">${getUmFullName(item.um)}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-icon">
                      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    </div>
                    <div class="info-label">ENDEREÇO</div>
                    <div class="info-value">${item.endereco || '-'}</div>
                  </div>
                </div>
                
                <div class="right-column">
                   <div class="photo-container">
                     ${finalImage ? `<img src="${finalImage}" alt="${item.descricao}">` : `
                       <svg viewBox="0 0 24 24" width="48" height="48" fill="#94a3b8"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                     `}
                   </div>
                 </div>
              </div>
              
              <div class="description-box">
                <div class="description-title">DESCRIÇÃO</div>
                ${item.descricao || ''}
              </div>
              
              <div class="footer">
                <div class="footer-left">
                  CONTROLE E RASTREABILIDADE DE ATIVOS
                </div>
                <div class="footer-right">
                  <div style="height: 28px; display: flex; align-items: center; justify-content: center;">
                    ${barcodeSVG}
                  </div>
                  <div class="barcode-line">${barcodeText}</div>
                </div>
              </div>
            </div>
          </div>
          `;
        }).join('')}
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
        setIsPrinting(false);
      }, 500);
    }
  };

  const selectedData = estoque.filter(item => selectedItems.includes(item.id));

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="print:hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-slate-50 relative z-20">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar itens para etiqueta..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedItems.length > 0 
                  ? 'bg-[#0C2340] hover:bg-[#0C2340]/90 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiquetas {selectedItems.length > 0 && `(${selectedItems.length})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#F1F5F9]">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10">
                  <th className="p-4 w-12 text-center">
                    <button onClick={selectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {selectedItems.length === filteredEstoque.length && filteredEstoque.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-[#00B4F1]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Código SAP</th>
                  <th className="p-4">Part Number</th>
                  <th className="p-4">Endereço</th>
                  <th className="p-4">UM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstoque.map((item, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    key={item.id} 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'bg-[#F0F7FF] hover:bg-[#F0F7FF]' : ''}`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <td className="p-4 text-center">
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#00B4F1]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{item.descricao}</td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{item.codigoSAP}</td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{item.partNumber}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium text-xs">
                        {item.endereco}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{item.um}</td>
                  </motion.tr>
                ))}
                {filteredEstoque.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium text-slate-600">Nenhum item encontrado</p>
                      <p className="text-sm">Tente usar outros termos na busca.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
}
