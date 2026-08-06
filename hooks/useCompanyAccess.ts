import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface CompanyAccessStatus {
  access_allowed: boolean;
  company_name: string;
  payment_status: string;
  last_access_date?: string;
  payment_due_date?: string;
  blocked_reason?: string;
}

export const useCompanyAccess = (companyId?: number) => {
  const [accessStatus, setAccessStatus] = useState<CompanyAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkAccess = async () => {
    console.log('🔍 LC-MOBILE useCompanyAccess - Verificando acesso para company_id:', companyId);
    
    if (!companyId) {
      console.log('❌ LC-MOBILE useCompanyAccess - Company ID não fornecido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📡 LC-MOBILE useCompanyAccess - Fazendo requisição para /companies/check-access');
      
      const response = await api.get('/companies/check-access', {
        headers: {
          'company_id': companyId.toString()
        }
      });

      const status = response.data;
      console.log('📋 LC-MOBILE useCompanyAccess - Status recebido:', status);
      
      setAccessStatus(status);
      setIsBlocked(!status.access_allowed);
      
      console.log('🚫 LC-MOBILE useCompanyAccess - Acesso bloqueado?', !status.access_allowed);

      // Se o acesso estiver bloqueado, mostrar notificação
      if (!status.access_allowed) {
        toast.error(`Acesso bloqueado: ${status.blocked_reason || 'Entre em contato com o suporte'}`);
      }

    } catch (error: any) {
      console.error('❌ LC-MOBILE Erro ao verificar acesso:', error);
      
      // Se retornou erro 403, significa que está bloqueado
      if (error.response?.status === 403) {
        setIsBlocked(true);
        const errorData = error.response.data;
        setAccessStatus({
          access_allowed: false,
          company_name: errorData.company_name || 'Empresa',
          payment_status: errorData.payment_status || 'unknown',
          blocked_reason: errorData.message || 'Acesso bloqueado'
        });
        toast.error(errorData.message || 'Acesso bloqueado');
      } else {
        toast.error('Erro ao verificar acesso da empresa');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [companyId]);

  return {
    accessStatus,
    isLoading,
    isBlocked,
    checkAccess,
    refreshAccess: checkAccess
  };
};
