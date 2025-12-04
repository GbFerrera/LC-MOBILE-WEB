"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarIcon, 
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
  ThumbsUpIcon,
  PackageIcon,
  TargetIcon
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
  const upcomingAppointments = appointments
    .filter((appointment) => {
      const parts = appointment.start_time.split(":");
      const h = parseInt(parts[0] || "0", 10);
      const m = parseInt(parts[1] || "0", 10);
      const now = new Date(currentTime);
      const appt = new Date(now);
      appt.setHours(h, m, 0, 0);
      return appt.getTime() >= now.getTime();
    })
    .sort((a, b) => {
      const [ah, am] = a.start_time.split(":").map((v) => parseInt(v || "0", 10));
      const [bh, bm] = b.start_time.split(":").map((v) => parseInt(v || "0", 10));
      return ah !== bh ? ah - bh : am - bm;
    });
  
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
    <div className="min-h-screen">

      <header className="bg-gradient-to-tr from-white/10 via-[#3D583F]/80 to-[#3D583F] border-b">



        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/ajustes" className="cursor-pointer">
                <Avatar className="h-20 w-20 sm:h-14 sm:w-14 border bg-gray-100 overflow-hidden">
                  <AvatarImage src={profilePhoto || "/barber-avatar.png"} alt={user?.name || ""} className="object-cover bg-gray-100" />
                  <AvatarFallback className="bg-[#3D583F] text-white text-sm sm:text-base font-semibold">
                    {user?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-lg sm:text-xl tracking-wide text-white truncate max-w-[220px]">Olá, {user?.name}!</h1>
                <p className="text-white/80 text-xs sm:text-sm mt-1">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {!isLoading && schedule && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-white/20 px-2 py-1 rounded-md text-xs flex items-center gap-1 text-white">
                      {schedule.is_day_off 
                        ? <><UmbrellaIcon className="h-3 w-3" /> <span className="hidden xs:inline">Dia de folga</span><span className="xs:hidden">Folga</span></> 
                        : <><ClockIcon className="h-3 w-3" /> <span className="xs:inline">{schedule.start_time} - {schedule.end_time}</span></>}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded-md text-xs flex items-center gap-1 text-white">
                      <CalendarIcon className="h-3 w-3" /> <span>{appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'}</span>
                      </span>
                  </div>
                )}
              </div>
            </div>
           
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-gray-600 text-xs font-medium">Agendamentos Hoje</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-6 w-10 rounded"></div>
                ) : appointments.length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-gray-600 text-xs font-medium">Status do Dia</div>
              <div className="text-base font-semibold text-gray-900 mt-1">
                {isLoading || !schedule ? (
                  <div className="animate-pulse bg-gray-200 h-5 w-16 rounded"></div>
                ) : schedule.is_day_off ? (
                  <span className="text-yellow-700 flex items-center gap-1"><UmbrellaIcon className="h-3 w-3" /> Folga</span>
                ) : (
                  <span className="text-green-700 flex items-center gap-1"><CheckIcon className="h-3 w-3" /> Ativo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="relative max-w-6xl mx-auto px-4 py-8">

       

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-[#3D583F]/20 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <div>
                <h2 className="text-gray-800 font-semibold text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Próximos Agendamentos
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  {upcomingAppointments.length > 0 ? `${upcomingAppointments.length} a partir de agora` : 'Agenda livre a partir de agora'}
                </p>
              </div>
              <Link href="/agenda" className="text-[#3D583F] text-sm">Ver agenda</Link>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-10 bg-gray-100 rounded-md"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-2">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center p-3 bg-white rounded-md border">
                      <div className="flex-shrink-0">
                        <div className="bg-[#3D583F] text-white text-xs px-2 py-1 rounded">
                          {appointment.start_time.slice(0, 5)}
                        </div>
                      </div>
                      <div className="flex-1 ml-3">
                        <div className="font-medium text-gray-900">{appointment.client?.name || 'Cliente'}</div>
                        <div className="text-xs text-gray-600">
                          {appointment.services?.map(s => s.service_name).join(', ') || 'Serviço'}
                        </div>
                      </div>
                      <div className="ml-3">
                        <span className={`px-2 py-1 text-[11px] rounded ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmado' : appointment.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
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
                  <p className="text-gray-600 font-medium">Nenhum agendamento a partir de agora</p>
                  <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">Que tal aproveitar para relaxar? <SmileIcon className="h-4 w-4" /></p>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-center">
                <Link href="/agenda">
                  <Button className="px-4 py-2 bg-[#3D583F] hover:bg-[#365137] text-white rounded-md text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Ver Agenda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <h2 className="text-gray-800 font-semibold text-base">Serviços Mais Prestados</h2>
              <span className="text-xs text-gray-500">Hoje</span>
            </div>
            <div className="p-4">
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
                  <div className="space-y-3">
                    {sortedServices.map((service, index) => {
                      const percentage = (service.count / maxCount) * 100;

                      return (
                        <div key={service.name} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-[#3D583F]"></div>
                              <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{service.count} vezes</div>
                              <div className="text-xs text-gray-500">R$ {service.revenue.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mb-2 overflow-hidden">
                            <div 
                              className="h-2 bg-[#3D583F] rounded transition-all duration-700 ease-out origin-left"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="flex justify-between items-center">
                        <span>Total:</span>
                        <span className="font-semibold">{sortedServices.reduce((sum, s) => sum + s.count, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span>Receita:</span>
                        <span className="font-semibold">R$ {sortedServices.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm">Nenhum serviço prestado hoje</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Link href="/agenda">
            <Button className="w-full px-4 py-3 bg-[#3D583F] hover:bg-[#365137] text-white rounded-md text-base">
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
