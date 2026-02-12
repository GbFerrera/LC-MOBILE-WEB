import { api } from "@/services/api";

const getCompanyId = (): string => {
  if (typeof window === 'undefined') return '';
  const userData = localStorage.getItem('@linkCallendar:user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user?.company_id ? String(user.company_id) : '';
    } catch (e) {
      console.error('Erro ao obter company_id:', e);
      return '';
    }
  }
  return '';
};

export interface Subscription {
  id: number;
  client_id: number;
  plan_id: number;
  status: 'active' | 'inactive' | 'canceled' | 'pending';
  payment_status: boolean;
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  price: number;
  remaining_sessions?: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
  plan?: {
    id: number;
    name: string;
    description: string;
    price: number;
    is_recurring: boolean;
    sessions_per_week: number;
    services?: Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      duration: number;
    }>;
  };
}

export interface UpdateSubscriptionData {
  status?: 'active' | 'inactive' | 'canceled' | 'pending';
  payment_status?: boolean;
  end_date?: string;
  price?: number;
  remaining_sessions?: number;
}

export const subscriptionsService = {
  getSubscriptions: async (): Promise<Subscription[]> => {
    try {
      const companyId = getCompanyId();
      const response = await api.get('/subscriptions', {
        headers: {
          'company_id': companyId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      throw error;
    }
  },

  updateSubscription: async (id: number, data: UpdateSubscriptionData): Promise<Subscription> => {
    try {
      const companyId = getCompanyId();
      const response = await api.put(`/subscriptions/${id}`, data, {
        headers: {
          'company_id': companyId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw error;
    }
  },

  deleteSubscription: async (id: number): Promise<void> => {
    try {
      const companyId = getCompanyId();
      await api.delete(`/subscriptions/${id}`, {
        headers: {
          'company_id': companyId
        }
      });
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      throw error;
    }
  }
};

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  is_recurring: boolean;
  sessions_per_week: number;
  services?: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
  }>;
}

export const plansService = {
  getPlans: async (): Promise<Plan[]> => {
    try {
      const companyId = getCompanyId();
      const response = await api.get('/plans', {
        headers: {
          'company_id': companyId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      throw error;
    }
  }
};
