// Camada de serviço de mock para integração SAP futura

export const IntegracaoSAP = {
  validarPedido: async (poNumber: string) => {
    console.log(`[SAP Mock] Validando pedido ${poNumber}...`);
    return new Promise((resolve) => setTimeout(() => resolve({
      status: 'VALIDO',
      fornecedor: 'Fornecedor Exemplo SA',
      itens: []
    }), 1000));
  },

  lancarEntrada: async (docData: any) => {
    console.log(`[SAP Mock] Lançando entrada de mercadoria MIGO...`, docData);
    return new Promise((resolve) => setTimeout(() => resolve({
      docMaterialSAP: '5000192837',
      status: 'SUCESSO'
    }), 1000));
  },

  criarReserva: async (reqData: any) => {
    console.log(`[SAP Mock] Criando reserva MB21...`, reqData);
    return new Promise((resolve) => setTimeout(() => resolve({
      numReservaSAP: '001293847',
      status: 'SUCESSO'
    }), 1000));
  },

  lancarSaida: async (expedicaoData: any) => {
    console.log(`[SAP Mock] Lançando saída de mercadoria MIGO (Mov 201/261)...`, expedicaoData);
    return new Promise((resolve) => setTimeout(() => resolve({
      docMaterialSAP: '4900123847',
      status: 'SUCESSO'
    }), 1000));
  },

  consultarSaldo: async (materialCode: string, plantCode: string) => {
    console.log(`[SAP Mock] Consultando saldo MMBE...`);
    return new Promise((resolve) => setTimeout(() => resolve({
      livreUtilizacao: 150,
      emControleQualidade: 0,
      bloqueado: 0
    }), 500));
  }
};
