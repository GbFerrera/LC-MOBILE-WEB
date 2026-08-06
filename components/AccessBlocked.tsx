'use client';

import { AlertTriangle, CreditCard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessBlockedProps {
  companyName: string;
  paymentStatus: string;
  blockedReason?: string;
  onContactSupport?: () => void;
  paymentLink?: string;
}

export default function AccessBlocked({ 
  companyName, 
  paymentStatus, 
  blockedReason,
  onContactSupport,
  paymentLink 
}: AccessBlockedProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600';
      case 'blocked':
        return 'text-red-700';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Pagamento em Atraso';
      case 'blocked':
        return 'Conta Bloqueada';
      case 'pending':
        return 'Pagamento Pendente';
      default:
        return 'Status Desconhecido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 text-center">
        {/* Ícone de Alerta */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Título */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Acesso Temporariamente
        </h1>
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Suspenso
        </h2>

        {/* Nome da Empresa */}
        <p className="text-lg font-medium text-gray-800 mb-6">{companyName}</p>

        {/* Mensagem Simples */}
        <p className="text-gray-600 mb-6 text-sm">
          O acesso ao sistema foi temporariamente suspenso. Para reativar sua conta, realize o pagamento ou entre em contato conosco.
        </p>

        {/* Botões de Ação */}
        <div className="space-y-3">
          {/* Botão de Pagamento - WhatsApp */}
          <Button
            onClick={() => {
              const whatsappNumber = "556298516080";
              const message = `Olá! Preciso reativar minha conta da empresa ${companyName}. Gostaria de realizar o pagamento.`;
              const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="w-full bg-[#3D573F] hover:bg-[#204749] text-white font-medium py-3"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Realizar Pagamento
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

        </div>

      </div>
    </div>
  );
}
