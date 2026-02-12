import { api } from "@/services/api";
import { toast } from "sonner";

export interface CreatePlanPayload {
  name: string;
  description: string;
  price: number;
  is_recurring: boolean;
  sessions_per_week?: number | null;
  service_ids: number[];
  company_id?: number;
  start_date?: string;
  end_date?: string;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export const CreatePlan = async (payload: CreatePlanPayload, companyId?: number) => {
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
    
    const response = await api.post("/plans", {
      ...payload,
      company_id: effectiveCompanyId,
    }, {
      headers: {
        "Content-Type": "application/json",
        "company_id": effectiveCompanyId?.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    throw error;
  }
};

export const DeletePlan = async (planId: number, company_id: number) => {
  try {
    let effectiveCompanyId = company_id;
    
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
    
    const response = await api.delete(`/plans/${planId}`, {
      headers: {
        "Content-Type": "application/json",
        "company_id": effectiveCompanyId?.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    throw error;
  }
};

export const UpdatePlan = async (planId: number, payload: UpdatePlanPayload, companyId?: number) => {
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
    
    const response = await api.put(`/plans/${planId}`, {
      ...payload,
      company_id: effectiveCompanyId,
    }, {
      headers: {
        "Content-Type": "application/json",
        "company_id": effectiveCompanyId?.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    throw error;
  }
};
