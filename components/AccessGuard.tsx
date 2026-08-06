'use client';

import { useEffect, useState } from 'react';
import { useCompanyAccess } from '@/hooks/useCompanyAccess';
import AccessBlocked from '@/components/AccessBlocked';
import { Loader2 } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
  companyId?: number;
}

export default function AccessGuard({ children, companyId }: AccessGuardProps) {
  console.log('🛡️ LC-MOBILE AccessGuard - Iniciando com companyId:', companyId);
  
  const { accessStatus, isLoading, isBlocked, refreshAccess } = useCompanyAccess(companyId);
  const [showBlocked, setShowBlocked] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>('');

  useEffect(() => {
    console.log('🛡️ LC-MOBILE AccessGuard - Estado atualizado:', { isLoading, isBlocked, accessStatus });
    
    if (!isLoading && isBlocked) {
      console.log('🚫 LC-MOBILE AccessGuard - Mostrando tela de bloqueio');
      setShowBlocked(true);
      
      // Gerar link de pagamento baseado na empresa
      if (accessStatus?.company_name && companyId) {
        const paymentUrl = `https://pay.linkcallendar.com/empresa/${companyId}?name=${encodeURIComponent(accessStatus.company_name)}`;
        setPaymentLink(paymentUrl);
        console.log('💳 LC-MOBILE AccessGuard - Link de pagamento gerado:', paymentUrl);
      }
    } else if (!isLoading && !isBlocked) {
      console.log('✅ LC-MOBILE AccessGuard - Acesso liberado');
      setShowBlocked(false);
    }
  }, [isLoading, isBlocked, accessStatus, companyId]);

  // Função para contato com suporte
  const handleContactSupport = () => {
    const message = `Olá! Preciso de ajuda para reativar minha conta do LinkCallendar.
    
Empresa: ${accessStatus?.company_name}
Status: ${accessStatus?.payment_status}

Por favor, me ajudem a resolver esta situação.`;
    
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acesso...</p>
          <p className="text-sm text-gray-500 mt-2">LinkCallendar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Conteúdo da aplicação */}
      <div className={showBlocked ? 'pointer-events-none select-none' : ''}>
        {children}
      </div>

      {/* Modal de bloqueio sobreposto */}
      {showBlocked && accessStatus && (
        <AccessBlocked
          companyName={accessStatus.company_name}
          paymentStatus={accessStatus.payment_status}
          blockedReason={accessStatus.blocked_reason}
          onContactSupport={handleContactSupport}
          paymentLink={paymentLink}
        />
      )}
    </div>
  );
}
