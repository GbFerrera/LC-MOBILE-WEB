"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";

// Interfaces para tipagem
interface Commission {
  id: number;
  company_id: number;
  professional_id: number;
  service_id: number | null;
  type: 'fixed' | 'percentage';
  value: string;
  active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  service_price?: string;
  service_duration?: number;
}

interface ProfessionalData {
  professional_id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  commissions_general: Commission[];
  commissions_services: Commission[];
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
  services: any[];
  appointments_detail: any[];
}

interface ProfessionalCommissions {
  professional_id: number;
  name: string;
  position: string;
  email: string;
  phone_number?: string;
  commissions_general: Commission[];
  commissions_services: Commission[];
  period_filter: {
    start_date: string | null;
    end_date: string | null;
  };
  earnings_report: EarningsReport | null;
}

export default function FinancasPage() {
  const { user } = useAuth();
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [earningsReport, setEarningsReport] = useState<EarningsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Função para buscar dados das comissões do profissional logado
  const fetchCommissions = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      // Buscar comissões do profissional
      const commissionsResponse = await api.get(`/commissions/team/${user.id}?${params.toString()}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      console.log('Dados das comissões retornados:', commissionsResponse.data);
      setProfessionalData(commissionsResponse.data);
      
      // Sempre buscar relatório de ganhos (com datas padrão ou selecionadas)
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
      setError(error.response?.data?.message || 'Erro ao carregar dados das comissões');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [user?.id, startDate, endDate]);

  // Função para formatar o valor da comissão
  const formatCommissionValue = (commission: Commission) => {
    if (commission.type === 'percentage') {
      return `${commission.value}%`;
    } else {
      return `R$ ${parseFloat(commission.value).toFixed(2)}`;
    }
  };

  // Função para calcular total de comissões (todas)
  const getTotalCommissions = () => {
    if (!professionalData) return 0;
    const allCommissions = [
      ...(professionalData.commissions_general || []),
      ...(professionalData.commissions_services || [])
    ];
    return allCommissions.length;
  };

  // Função para obter comissões gerais
  const getGeneralCommissions = () => {
    return professionalData?.commissions_general || [];
  };

  // Função para obter comissões por serviço
  const getServiceCommissions = () => {
    return professionalData?.commissions_services || [];
  };

  // Filtrar comissões baseado no filtro selecionado
  const getFilteredCommissions = (commissionsArray: Commission[]) => {
    if (filter === 'all') return commissionsArray;
    return commissionsArray.filter(c => filter === 'active' ? c.active : !c.active);
  };

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
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 mb-2">{error}</p>
            <Button onClick={fetchCommissions} variant="outline" size="sm">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Comissões</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Voltar
          </Link>
        </div>
        {/* Filtros Simples */}
        <div className="bg-white rounded border p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inativas
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="De"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="Até"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Ganhos do Período (se houver filtro de data) */}
        {earningsReport && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-3">💰 Seus Ganhos no Período</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{earningsReport.summary.total_appointments}</div>
                <div className="text-sm text-green-600">Agendamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{earningsReport.summary.total_services}</div>
                <div className="text-sm text-green-600">Serviços</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  R$ {earningsReport.summary.total_value.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-green-600">Faturamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  R$ {earningsReport.summary.total_commission.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-green-600">Comissão</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumo Simples */}
        <div className="bg-white rounded border p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-green-600">{getTotalCommissions()}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-blue-600">{getGeneralCommissions().length}</div>
              <div className="text-sm text-gray-600">Gerais</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-purple-600">{getServiceCommissions().length}</div>
              <div className="text-sm text-gray-600">Específicas</div>
            </div>
          </div>
        </div>

        {/* Detalhamento das Comissões */}
        <div className="space-y-8">
          {/* Comissões Gerais */}
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suas Comissões Gerais ({getGeneralCommissions().length})
              </h2>
              <p className="text-emerald-100 text-sm mt-1">Aplicam-se a todos os serviços prestados</p>
            </div>
            
            <div className="p-6">
              {getGeneralCommissions().length > 0 ? (
                <div className="space-y-4">
                  {getGeneralCommissions().map((commission) => (
                    <div key={commission.id} className={`p-4 rounded-xl border-2 transition-all ${
                      commission.active 
                        ? 'bg-green-50 border-green-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            commission.active ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="font-medium text-gray-900">Comissão Geral</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{formatCommissionValue(commission)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            commission.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {commission.active ? 'Ativa' : 'Inativa'}
                          </div>
                        </div>
                      </div>
                      {commission.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-800"><strong>Observações:</strong> {commission.notes}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-3 flex items-center gap-4">
                        <span>Criada: {new Date(commission.created_at).toLocaleDateString('pt-BR')}</span>
                        <span>Atualizada: {new Date(commission.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma Comissão Geral</h3>
                  <p className="text-gray-600">Você não possui comissões gerais {filter === 'active' ? 'ativas' : filter === 'inactive' ? 'inativas' : 'cadastradas'}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Comissões por Serviço */}
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Suas Comissões por Serviço ({getServiceCommissions().length})
              </h2>
              <p className="text-blue-100 text-sm mt-1">Comissões específicas para serviços individuais</p>
            </div>
            
            <div className="p-6">
              {getServiceCommissions().length > 0 ? (
                <div className="space-y-4">
                  {getServiceCommissions().map((commission) => (
                    <div key={commission.id} className={`p-4 rounded-xl border-2 transition-all ${
                      commission.active 
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            commission.active ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></div>
                          <div>
                            <span className="font-medium text-gray-900">{commission.service_name}</span>
                            <div className="text-sm text-gray-600">Preço do serviço: R$ {commission.service_price}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{formatCommissionValue(commission)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            commission.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {commission.active ? 'Ativa' : 'Inativa'}
                          </div>
                        </div>
                      </div>
                      {commission.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <p className="text-sm text-yellow-800"><strong>Observações:</strong> {commission.notes}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-3 flex items-center gap-4">
                        <span>Criada: {new Date(commission.created_at).toLocaleDateString('pt-BR')}</span>
                        <span>Atualizada: {new Date(commission.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma Comissão Específica</h3>
                  <p className="text-gray-600">Você não possui comissões específicas por serviço {filter === 'active' ? 'ativas' : filter === 'inactive' ? 'inativas' : 'cadastradas'}.</p>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
