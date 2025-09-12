"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, CheckCircle, DollarSign, Filter, RotateCcw, Settings, TrendingUp, Wallet, RefreshCw, HandCoins } from "lucide-react";

// Interfaces para tipagem
interface CommissionConfig {
  type: 'percentage' | 'fixed';
  value: string;
  scope: 'general' | 'specific';
}

interface ServiceCommission {
  service_id: number;
  service_name: string;
  service_price: string;
  total_quantity: number;
  total_value: number;
  total_commission: number;
  commission_config: CommissionConfig;
}

interface AppointmentService {
  service_id: number;
  service_name: string;
  service_price: string;
  quantity: number;
  total_value: number;
  commission_value: number;
  commission_config: CommissionConfig;
}

interface AppointmentDetail {
  appointment_id: number;
  date: string;
  start_time: string;
  end_time: string;
  services: AppointmentService[];
  total_value: number;
  total_commission: number;
}

interface EarningsReport {
  professional: {
    id: number;
    name: string;
    position: string;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_appointments: number;
    total_services: number;
    total_value: number;
    total_commission: number;
  };
  services: ServiceCommission[];
  appointments_detail: AppointmentDetail[];
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [earningsReport, setEarningsReport] = useState<EarningsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Estado de filtro removido pois não é mais necessário
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Função para buscar relatório de ganhos do profissional logado
  const fetchCommissions = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar relatório de ganhos (com datas padrão ou selecionadas)
      const earningsResponse = await api.get(`/commissions/professional/${user.id}/report?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      console.log('Dados do relatório de ganhos:', earningsResponse.data);
      setEarningsReport(earningsResponse.data);
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      
      // Verificar se é erro de usuário não encontrado (sem comissão)
      if (error.response?.status === 404 || error.response?.data?.message?.includes('Usuário não encontrado')) {
        setError('Você ainda não possui comissões configuradas. Entre em contato com seu gerente para configurar suas comissões.');
      } else {
        setError(error.response?.data?.message || 'Erro ao carregar dados das comissões');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [user?.id, startDate, endDate]);

  // Funções auxiliares removidas pois não são mais necessárias

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] text-white shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-bold text-2xl tracking-wide flex items-center gap-2">
                    <HandCoins className="h-6 w-6" />
                    Comissões
                  </h1>
                  <p className="text-emerald-100 text-sm mt-1">
                    Acompanhe seus ganhos e comissões
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="px-4 py-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    const isNoCommissionError = error.includes('ainda não possui comissões');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] text-white shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-bold text-2xl tracking-wide flex items-center gap-2">
                    <HandCoins className="h-6 w-6" />
                    Comissões
                  </h1>
                  <p className="text-emerald-100 text-sm mt-1">
                    Acompanhe seus ganhos e comissões
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  onClick={fetchCommissions}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="px-4 py-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-full flex items-center justify-center mx-auto mb-6">
                {isNoCommissionError ? (
                  <Settings className="h-10 w-10 text-white" />
                ) : (
                  <RotateCcw className="h-10 w-10 text-white" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {isNoCommissionError ? 'Comissões não configuradas' : 'Erro ao carregar dados'}
              </h3>
              
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {error}
              </p>
              
              {!isNoCommissionError && (
                <Button 
                  onClick={fetchCommissions}
                  className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] hover:from-[#1e5d4f] hover:to-[#236F5D] text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Tentar Novamente
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-2xl tracking-wide flex items-center gap-2">
                  <HandCoins className="h-6 w-6" />
                  Comissões
                </h1>
                <p className="text-emerald-100 text-sm mt-1">
                  Acompanhe seus ganhos e comissões
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={fetchCommissions}
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Filtros de Data */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#236F5D] focus:ring-1 focus:ring-[#236F5D]"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#236F5D] focus:ring-1 focus:ring-[#236F5D]"
                />
              </div>
              {(startDate || endDate) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="px-4 py-2 text-sm border-2 rounded-lg hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!earningsReport && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Selecione um Período</h3>
              <p className="text-gray-600 max-w-sm mx-auto">Escolha as datas inicial e final para visualizar seu relatório de comissões.</p>
            </CardContent>
          </Card>
        )}

        {/* Ganhos do Período */}
        {earningsReport && (
          <div className="bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <span className="text-white/80 text-sm font-medium">Seus Ganhos no Período</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-xs">Ativo</span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold mb-1">
                R$ {earningsReport.summary.total_commission.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-white/70 text-sm">
                Total de comissões no período selecionado
              </p>
            </div>
            
            {/* Mini Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Agendamentos</p>
                <p className="text-white font-bold text-sm">{earningsReport.summary.total_appointments}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Serviços</p>
                <p className="text-white font-bold text-sm">{earningsReport.summary.total_services}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Faturamento</p>
                <p className="text-white font-bold text-sm">R$ {earningsReport.summary.total_value.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Comissão</p>
                <p className="text-white font-bold text-sm">R$ {earningsReport.summary.total_commission.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cards de Estatísticas Detalhadas */}
        {earningsReport && earningsReport.services && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <Settings className="h-6 w-6 text-white/70" />
                </div>
                <p className="text-white/80 text-xs font-medium mb-1">TOTAL</p>
                <p className="text-white text-xl font-bold">
                  {earningsReport.services.length}
                </p>
              </div>
            </Card>
            
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <Settings className="h-6 w-6 text-white/70" />
                </div>
                <p className="text-white/80 text-xs font-medium mb-1">GERAIS</p>
                <p className="text-white text-xl font-bold">
                  {earningsReport.services.filter(s => s.commission_config?.scope === 'general').length}
                </p>
              </div>
            </Card>
            
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <Settings className="h-6 w-6 text-white/70" />
                </div>
                <p className="text-white/80 text-xs font-medium mb-1">ESPECÍFICAS</p>
                <p className="text-white text-xl font-bold">
                  {earningsReport.services.filter(s => s.commission_config?.scope === 'specific').length}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Lista de Comissões */}
        {earningsReport && earningsReport.services && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-lg flex items-center justify-center">
                  <HandCoins className="h-4 w-4 text-white" />
                </div>
                Suas Comissões por Serviço ({earningsReport.services.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {earningsReport.services.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HandCoins className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">Nenhuma comissão registrada</p>
                  <p className="text-gray-400 text-sm">Você não possui comissões no período selecionado</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {earningsReport.services.map((service, index) => (
                    <div key={`${service.service_id}-${index}`} className={`p-4 hover:bg-gray-50 transition-colors ${index !== earningsReport.services.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] flex items-center justify-center">
                            <HandCoins className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">
                              {service.service_name}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Preço: R$ {parseFloat(service.service_price).toFixed(2).replace('.', ',')}</span>
                              <span>•</span>
                              <span>Qtd: {service.total_quantity}</span>
                              <span>•</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                service.commission_config?.scope === 'general' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {service.commission_config?.scope === 'general' ? 'Geral' : 'Específica'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[#236F5D] mb-1">
                            {service.commission_config?.type === 'percentage' 
                              ? `${service.commission_config.value}%` 
                              : `R$ ${parseFloat(service.commission_config?.value || '0').toFixed(2).replace('.', ',')}`
                            }
                          </p>
                          <div className="text-sm text-gray-600">
                            <div>Faturado: R$ {service.total_value.toFixed(2).replace('.', ',')}</div>
                            <div className="font-semibold text-green-600">Comissão: R$ {service.total_commission.toFixed(2).replace('.', ',')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}