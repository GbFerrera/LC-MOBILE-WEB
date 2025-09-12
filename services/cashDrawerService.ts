import { api } from './api';

export interface CashDrawer {
  id: number;
  opened_by_id: number;
  closed_by_id: number | null;
  date_open: string;
  date_closed: string | null;
  value_inicial: string;
  value_final: string | null;
  cash_difference: string | null;
  status: 'open' | 'closed';
  notes: string;
  created_at: string;
  updated_at: string;
  opener_name: string;
  closer_name: string | null;
  company_id: number;
  transactions: Transaction[];
  payments: Payment[];
  discount_info?: {
    has_discount: boolean;
    total_discount_value: number;
  };
}

export interface Transaction {
  id: number;
  company_id: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  cash_drawer_id: number;
}

export interface Payment {
  id: number;
  company_id: number;
  client_id: number;
  command_id: number;
  appointment_id: number | null;
  total_amount: string;
  status: string;
  paid_at: string;
  created_at: string;
  updated_at: string;
  cash_drawer_id: number;
  payment_methods: PaymentMethod[];
  // Dados do cliente (vem do JOIN)
  client_name: string;
  client_email: string;
  client_phone: string;
  // Informações detalhadas de desconto
  discount_info?: {
    has_discount: boolean;
    original_price: number;
    final_price: number;
    discount_type: string | null;
    discount_value: number;
    discount_amount: number;
    total_discount_value: number;
  };
}

export interface PaymentMethod {
  id: number;
  payment_id: number;
  method: string;
  amount: string;
  created_at: string;
}

export interface CreateCashDrawerData {
  opened_by_id: number;
  value_inicial: number;
  notes?: string;
}

export interface CloseCashDrawerData {
  closed_by_id: number;
  value_final: number;
  notes?: string;
  cash_difference?: number;
}

class CashDrawerService {
  private getHeaders(companyId: number) {
    return {
      'company_id': companyId.toString()
    };
  }

  // Buscar gavetas com filtro de data
  async getCashDrawers(companyId: number, startDate?: string, endDate?: string, status?: string): Promise<CashDrawer[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const url = queryString ? `/cash-drawers?${queryString}` : '/cash-drawers';
    
    const response = await api.get(url, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Buscar gaveta específica
  async getCashDrawer(companyId: number, id: number): Promise<CashDrawer> {
    const response = await api.get(`/cash-drawers/${id}`, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Buscar gaveta atualmente aberta
  async getCurrentDrawer(companyId: number): Promise<CashDrawer | null> {
    try {
      const response = await api.get('/cash-drawers/current/open', {
        headers: this.getHeaders(companyId)
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        return null; // Nenhuma gaveta aberta ou endpoint não encontrado
      }
      throw error;
    }
  }

  // Criar/abrir nova gaveta
  async createCashDrawer(companyId: number, data: CreateCashDrawerData): Promise<CashDrawer> {
    const response = await api.post('/cash-drawers', data, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Fechar gaveta
  async closeCashDrawer(companyId: number, id: number, data: CloseCashDrawerData): Promise<CashDrawer> {
    const response = await api.put(`/cash-drawers/${id}/close`, data, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Marcar gaveta como revisada
  async reviewCashDrawer(companyId: number, id: number): Promise<CashDrawer> {
    const response = await api.put(`/cash-drawers/${id}/review`, {}, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }
}

export const cashDrawerService = new CashDrawerService();
