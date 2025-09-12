import { api } from './api';

export interface FinancialTransaction {
  id: number;
  company_id: number;
  cash_drawer_id: number;
  type: 'income' | 'expense' | 'cash_out';
  description: string;
  category: string;
  amount: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  type: 'income' | 'expense' | 'cash_out';
  description: string;
  category: string;
  amount: number;
  cash_drawer_id: number;
}

class FinancialTransactionsService {
  private getHeaders(companyId: number) {
    return {
      'company_id': companyId.toString()
    };
  }

  // Buscar transações de uma gaveta específica
  async getTransactions(companyId: number, cashDrawerId: number): Promise<FinancialTransaction[]> {
    const response = await api.get(`/financial?cash_drawer_id=${cashDrawerId}`, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Criar nova transação
  async createTransaction(companyId: number, data: CreateTransactionData): Promise<FinancialTransaction> {
    const response = await api.post('/financial', data, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }

  // Buscar saldo por período
  async getCashBalanceByPeriod(companyId: number, startDate: string, endDate: string) {
    const response = await api.get(`/financial/balance?start_date=${startDate}&end_date=${endDate}`, {
      headers: this.getHeaders(companyId)
    });
    return response.data;
  }
}

export const financialTransactionsService = new FinancialTransactionsService();
