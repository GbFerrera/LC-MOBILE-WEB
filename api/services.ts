import { api } from "@/services/api";

export interface Service {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  
  service_id?: number;
  service_name?: string;
  service_description?: string;
  service_price?: string | number;
  service_duration?: number;
}

export const getServices = async (companyId?: number, professionalId?: number) => {
  try {
    let effectiveCompanyId = companyId;
    
    if (!effectiveCompanyId && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('@linkCallendar:user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          effectiveCompanyId = user?.company_id;
        }
      } catch (e) {
        console.error('Erro ao obter company_id do localStorage:', e);
      }
    }
    
    const url = professionalId ? `/service?professional_id=${professionalId}` : "/service";
    
    const response = await api.get(url, {
      headers: {
        company_id: effectiveCompanyId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    throw error;
  }
};

export const createService = async (companyId: number, payload: Omit<Service, "id" | "created_at" | "updated_at" | "company_id">) => {
  try {
    const response = await api.post("/service", {
      ...payload,
      company_id: companyId,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateService = async (companyId: number, serviceId: number, payload: Partial<Omit<Service, "id" | "created_at" | "updated_at" | "company_id">>) => {
  try {
    const response = await api.put(`/service/${serviceId}`, {
      ...payload,
      company_id: companyId,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteService = async (companyId: number, serviceId: number) => {
  try {
    const response = await api.delete(`/service/${serviceId}`, {
      headers: {
        company_id: companyId.toString(),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
