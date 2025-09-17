"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarIcon, 
  UsersIcon, 
  WalletIcon, 
  SettingsIcon, 
  HandCoinsIcon,
  PlusIcon, 
  RefreshCwIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UmbrellaIcon,
  BellIcon,
  SmileIcon,
  TrendingUpIcon,
  SparklesIcon,
  ZapIcon,
  StarIcon,
  ActivityIcon,
  BarChart3Icon,
  CrownIcon,
  RocketIcon,
  GemIcon,
  ShieldIcon,
  LightbulbIcon,
  HeartIcon,
  ThumbsUpIcon
} from "lucide-react";
import Link from "next/link";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";

interface Service {
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  document: string;
}

interface Schedule {
  id: number;
  professional_id: number;
  company_id: number;
  date: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  is_day_off: boolean;
  created_at: string;
  updated_at: string;
  is_specific_date: boolean;
}

interface Appointment {
  id: number;
  client: Client;
  services: Service[];
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}

interface ScheduleResponse {
  schedule: Schedule;
  appointments: Appointment[];
}

export default function Home() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      // Só executa se o usuário estiver carregado
      if (!user || !user.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Aguarda o usuário estar carregado antes de fazer a requisição
        if (!user?.id) {
          console.log('Usuário ainda não carregado, pulando busca de agendamentos');
          setIsLoading(false);
          return;
        }

        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const userId = user.id;

        console.log('Buscando agendamentos para:', { userId, formattedDate });
        const response = await api.get(`/schedules/${userId}/date/${formattedDate}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            company_id: user?.company_id?.toString() || "1",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // Filtra os agendamentos para remover registros com status "free"
        const filteredData = {
          ...response.data,
          appointments: response.data.appointments.filter(appointment => appointment.status !== 'free')
        };
        setScheduleData(filteredData);
        setError(null); // Limpa erro anterior se sucesso
      } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        setError('Não foi possível carregar os agendamentos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]); // Adiciona user como dependência

  const appointments = scheduleData?.appointments || [];
  const schedule = scheduleData?.schedule;
  
  // Atualiza o horário atual a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if(!user) {
      router.push("/Login");
    }
  }, [])

  // Buscar foto do perfil
  const fetchProfilePhoto = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/team-photos/${user.id}`);
      if (response.data?.photo_url) {
        setProfilePhoto(response.data.photo_url);
      }
    } catch (error) {
      console.log('Foto de perfil não encontrada ou erro:', error);
    }
  };

  useEffect(() => {
    fetchProfilePhoto();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Modern Header */}
      <header className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-xl shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-3 border-white/20 shadow-xl bg-gray-100 overflow-hidden">
                <AvatarImage src={profilePhoto || "/barber-avatar.png"} alt={user?.name || ""} className="object-cover bg-gray-100" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm sm:text-lg font-bold">
                  {user?.name?.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg sm:text-2xl tracking-wide text-white truncate">Olá, {user?.name}!</h1>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {!isLoading && schedule && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-white">
                      {schedule.is_day_off 
                        ? <><UmbrellaIcon className="h-3 w-3" /> <span className="hidden xs:inline">Dia de folga</span><span className="xs:hidden">Folga</span></> 
                        : <><ClockIcon className="h-3 w-3" /> <span className="xs:inline">{schedule.start_time} - {schedule.end_time}</span></>}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-white">
                      <CalendarIcon className="h-3 w-3" /> <span className="hidden xs:inline">{appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'}</span><span className="xs:hidden">{appointments.length}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Link href={"/teste-notificacoes"}>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10">
                <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="text-emerald-100 text-xs sm:text-sm font-medium">Agendamentos Hoje</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-6 sm:h-8 w-8 sm:w-12 rounded"></div>
                ) : appointments.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="text-emerald-100 text-xs sm:text-sm font-medium">Status do Dia</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1">
                {isLoading || !schedule ? (
                  <div className="animate-pulse bg-white/20 h-5 sm:h-6 w-16 sm:w-20 rounded"></div>
                ) : schedule.is_day_off ? (
                  <span className="text-yellow-200 flex items-center gap-1"><UmbrellaIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Folga</span>
                ) : (
                  <span className="text-green-200 flex items-center gap-1"><CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Ativo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/agenda" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">Agenda</span>
              <p className="text-xs text-gray-500 mt-1">Gerenciar horários</p>
            </div>
          </Link>
          <Link href="/clientes" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Clientes</span>
              <p className="text-xs text-gray-500 mt-1">Base de clientes</p>
            </div>
          </Link>
          <Link href="/comandas" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <ShoppingBagIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">Comandas</span>
              <p className="text-xs text-gray-500 mt-1">Gerenciar vendas</p>
            </div>
          </Link>
          <Link href="/financas" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Finanças</span>
              <p className="text-xs text-gray-500 mt-1">Controle financeiro</p>
            </div>
          </Link>

          <Link href="/commitions" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-800 to-emerald-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <HandCoinsIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-green-500 transition-colors">Comissões</span>
              <p className="text-xs text-gray-500 mt-1">Controle de comissões</p>
            </div>
          </Link>

           <Link href="/ajustes" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-800 to-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">Ajustes</span>
              <p className="text-xs text-gray-500 mt-1">Configurações</p>
            </div>
          </Link>
        </div>


        {/* Upcoming Appointments */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Próximos Agendamentos
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {appointments.length > 0 ? `${appointments.length} agendamento${appointments.length > 1 ? 's' : ''} hoje` : 'Agenda livre hoje'}
              </p>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
                      <div className="ml-4 flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((appointment, index) => (
                    <div key={appointment.id} className="group relative">
                      <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm px-3 py-2 rounded-lg">
                            {appointment.start_time.slice(0, 5)}
                          </div>
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="font-semibold text-gray-900 mb-1">{appointment.client?.name || 'Cliente não informado'}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {appointment.services?.map(s => s.service_name).join(', ') || 'Serviços não informados'}
                            </span>
                            <span className="text-sm font-medium text-emerald-600">
                              R$ {appointment.services?.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0).toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700'
                              : appointment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmado' : 
                             appointment.status === 'completed' ? 'Concluido' : 'Concluido'}
                          </span>
                        </div>
                      </div>
                      {index < appointments.length - 1 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Nenhum agendamento para hoje</p>
                  <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">Que tal aproveitar para relaxar? <SmileIcon className="h-4 w-4" /></p>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <Link href="/agenda">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Ver Agenda Completa
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Most Popular Services */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Serviços Mais Prestados
              </h2>
              <p className="text-purple-100 text-sm mt-1">Análise dos seus serviços mais populares</p>
            </div>
            
            <div className="p-6">
              {(() => {
                // Calcular estatísticas dos serviços a partir dos agendamentos
                const serviceStats = appointments.reduce((acc, appointment) => {
                  // Verificar se services existe e é um array
                  if (appointment.services && Array.isArray(appointment.services)) {
                    appointment.services.forEach(service => {
                      if (service && service.service_name) {
                        if (!acc[service.service_name]) {
                          acc[service.service_name] = {
                            name: service.service_name,
                            count: 0,
                            revenue: 0
                          };
                        }
                        acc[service.service_name].count += service.quantity || 1;
                        acc[service.service_name].revenue += parseFloat(service.price || '0') * (service.quantity || 1);
                      }
                    });
                  }
                  return acc;
                }, {} as Record<string, { name: string; count: number; revenue: number }>);

                const sortedServices = Object.values(serviceStats)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5); // Top 5 serviços

                const maxCount = sortedServices[0]?.count || 1;

                return sortedServices.length > 0 ? (
                  <div className="space-y-4">
                    {sortedServices.map((service, index) => {
                      const percentage = (service.count / maxCount) * 100;
                      const colors = [
                        'from-purple-500 to-indigo-500',
                        'from-blue-500 to-cyan-500', 
                        'from-green-500 to-emerald-500',
                        'from-yellow-500 to-orange-500',
                        'from-pink-500 to-rose-500'
                      ];
                      
                      return (
                        <div key={service.name} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index]}`}></div>
                              <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{service.count} vezes</div>
                              <div className="text-xs text-gray-500">R$ {service.revenue.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                            <div 
                              className={`h-3 bg-gradient-to-r ${colors[index]} rounded-full transition-all duration-1000 ease-out transform origin-left`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          {index < sortedServices.length - 1 && (
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-3"></div>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-semibold text-purple-900">Resumo</span>
                      </div>
                      <div className="text-sm text-purple-700">
                        <div className="flex justify-between items-center">
                          <span>Total de serviços hoje:</span>
                          <span className="font-semibold">{sortedServices.reduce((sum, s) => sum + s.count, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>Receita estimada:</span>
                          <span className="font-semibold">R$ {sortedServices.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-purple-600 font-medium">Nenhum serviço prestado hoje</p>
                    <p className="text-purple-500 text-sm mt-1">As estatísticas aparecerão conforme você atender clientes</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Link href="/agenda">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] text-lg font-semibold">
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Agendamento
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}