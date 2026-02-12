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

export interface Client {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  company_id?: number;
}

export interface ClientSuggestion {
  id: number;
  display: string;
  name: string;
  email: string;
  phone: string;
}

export const getClients = async () => {
  try {
    const companyId = getCompanyId();
    const response = await api.get("/clients", {
      headers: {
        'company_id': companyId
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchClients = async (searchTerm: string) => {
  try {
    const companyId = getCompanyId();
    console.log('Buscando clientes com termo:', searchTerm, 'company_id:', companyId);
    
    const response = await api.get(`/clients?search=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'company_id': companyId
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar clientes:', error.message, error.response?.data);
    throw error;
  }
};

export const createClient = async (payload: Omit<Client, "id">) => {
  try {
    const companyId = getCompanyId();
    const response = await api.post("/clients", payload, {
      headers: {
        'company_id': companyId
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateClient = async (clientId: number, payload: Partial<Omit<Client, "id">>) => {
  try {
    const companyId = getCompanyId();
    const response = await api.put(`/clients/${clientId}`, payload, {
      headers: {
        'company_id': companyId
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteClient = async (clientId: number) => {
  try {
    const companyId = getCompanyId();
    const response = await api.delete(`/clients/${clientId}`, {
      headers: {
        'company_id': companyId
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
