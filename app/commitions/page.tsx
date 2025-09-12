"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { ArrowLeft, Calendar, CheckCircle, DollarSign, Filter, RotateCcw, Settings, TrendingUp, Wallet } from "lucide-react";

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

export default function FinancasPage() {
  const { user } = useAuth();

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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNoCommissionError = error.includes('ainda não possui comissões');
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Comissões</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm flex items-center flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Link>
          </div>
          
          <div className={`${isNoCommissionError ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 text-center`}>
            <div className="mb-4">
              {isNoCommissionError ? (
                <Settings className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              ) : (
                <RotateCcw className="h-12 w-12 text-red-500 mx-auto mb-3" />
              )}
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 ${isNoCommissionError ? 'text-blue-800' : 'text-red-800'}`}>
              {isNoCommissionError ? 'Comissões não configuradas' : 'Erro ao carregar dados'}
            </h3>
            
            <p className={`mb-4 ${isNoCommissionError ? 'text-blue-700' : 'text-red-700'}`}>
              {error}
            </p>
            
            {!isNoCommissionError && (
              <Button onClick={fetchCommissions} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Comissões</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm flex items-center flex-shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </div>
        {/* Filtros de Data */}
        <div className="bg-white rounded border p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-2 py-1 border rounded text-sm min-w-0"
              placeholder="De"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-2 py-1 border rounded text-sm min-w-0"
              placeholder="Até"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 flex-shrink-0"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {!earningsReport && (
          <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione um Período</h3>
            <p className="text-gray-600">Escolha as datas inicial e final para visualizar seu relatório de comissões.</p>
          </div>
        )}

        {/* Ganhos do Período */}
        {earningsReport && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200 p-3 sm:p-4 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 flex-shrink-0" /> 
              <span className="truncate">Seus Ganhos no Período</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-700">{earningsReport.summary.total_appointments}</div>
                <div className="text-xs sm:text-sm text-green-600">Agendamentos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-700">{earningsReport.summary.total_services}</div>
                <div className="text-xs sm:text-sm text-green-600">Serviços</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  R$ {earningsReport.summary.total_value.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs sm:text-sm text-green-600">Faturamento</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  R$ {earningsReport.summary.total_commission.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs sm:text-sm text-green-600">Comissão</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumo das Comissões */}
        {earningsReport && earningsReport.services && (
          <div className="bg-white rounded border p-3 sm:p-4 mb-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-green-600">{earningsReport.services.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-blue-600">{earningsReport.services.filter(s => s.commission_config?.scope === 'general').length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Gerais</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-purple-600">{earningsReport.services.filter(s => s.commission_config?.scope === 'specific').length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Específicas</div>
              </div>
            </div>
          </div>
        )}

        {/* Detalhamento das Comissões por Serviço */}
        {earningsReport && earningsReport.services && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4">
                <h2 className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
                  <span className="truncate">Suas Comissões por Serviço ({earningsReport.services.length})</span>
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">Comissões específicas para serviços individuais</p>
              </div>
              
              <div className="p-4 sm:p-6">
                {earningsReport.services.length > 0 ? (
                  <div className="space-y-4">
                    {earningsReport.services.map((service, index) => (
                      <div key={`${service.service_id}-${index}`} className="p-3 sm:p-4 rounded-xl border-2 bg-blue-50 border-blue-200 shadow-sm transition-all">
                        <div className="flex items-start sm:items-center justify-between mb-2 gap-3">
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 bg-blue-500"></div>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">{service.service_name}</span>
                              <div className="text-xs sm:text-sm text-gray-600">Preço: R$ {parseFloat(service.service_price).toFixed(2).replace('.', ',')}</div>
                              <div className="text-xs sm:text-sm text-gray-600">Quantidade: {service.total_quantity}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg sm:text-2xl font-bold text-gray-900">
                              {service.commission_config?.type === 'percentage' 
                                ? `${service.commission_config.value}%` 
                                : `R$ ${parseFloat(service.commission_config?.value || '0').toFixed(2).replace('.', ',')}`
                              }
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full mt-1 bg-blue-100 text-blue-700">
                              {service.commission_config?.scope === 'general' ? 'Geral' : 'Específica'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Faturado:</span>
                              <div className="font-semibold text-green-700">R$ {service.total_value.toFixed(2).replace('.', ',')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Comissão:</span>
                              <div className="font-semibold text-green-700">R$ {service.total_commission.toFixed(2).replace('.', ',')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Settings className="h-8 w-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma Comissão no Período</h3>
                    <p className="text-gray-600">Você não possui comissões no período selecionado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}