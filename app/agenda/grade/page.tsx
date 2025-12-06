"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, ChevronLeft, ChevronRight, User, Phone, 
  CalendarIcon, Clock, RefreshCw, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import Link from "next/link";

// Interfaces
interface Agendamento {
  id: string;
  client_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'free';
  notes: string;
  client: {
    id: string;
    name: string;
    phone_number?: string;
  };
  services: Array<{
    service_id: string;
    service_name: string;
    service_duration: number;
  }>;
}

interface Professional {
  id: string;
  name: string;
  url_avatar?: string;
  photo_url?: string;
}

interface HorarioProfissional {
  professional_id: string;
  schedules: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    lunch_start_time?: string;
    lunch_end_time?: string;
    is_day_off: boolean;
  }>;
}

// Função para gerar slots de horário de 15 em 15 minutos
const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;
  
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    slots.push(timeString);
  }
  
  return slots;
};

// Função para gerar labels de horário (apenas :00 e :30)
const generateTimeLabels = (startTime: string, endTime: string): string[] => {
  const labels: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;
  
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    labels.push(timeString);
  }
  
  return labels;
};

export default function AgendaGradePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [schedules, setSchedules] = useState<HorarioProfissional[]>([]);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const currentTimeMarkerRef = useRef<HTMLDivElement>(null);

  // Calcular horários de funcionamento
  const { earliestTime, latestTime, timeLabels, allTimeSlots } = useMemo(() => {
    // Usar horário padrão amplo
    const defaultStart = 8 * 60; // 08:00
    const defaultEnd = 18 * 60;  // 18:00
    
    if (schedules.length === 0) {
      return { 
        earliestTime: defaultStart, 
        latestTime: defaultEnd, 
        timeLabels: generateTimeLabels('08:00', '18:00'),
        allTimeSlots: generateTimeSlots('08:00', '18:00')
      };
    }

    let earliest = 24 * 60; // 24:00 em minutos
    let latest = 0;

    const dayOfWeek = format(currentDate, 'EEEE');
    
    schedules.forEach(schedule => {
      const daySchedule = schedule.schedules.find(s => s.day_of_week === dayOfWeek);
      if (daySchedule && !daySchedule.is_day_off) {
        const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
        const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        earliest = Math.min(earliest, startMinutes);
        latest = Math.max(latest, endMinutes);
      }
    });

    // Se não encontrou horários válidos ou são muito restritivos, usar padrão
    if (earliest === 24 * 60 || latest === 0 || latest <= earliest) {
      return { 
        earliestTime: defaultStart, 
        latestTime: defaultEnd, 
        timeLabels: generateTimeLabels('08:00', '18:00'),
        allTimeSlots: generateTimeSlots('08:00', '18:00')
      };
    }

    // Garantir horário mínimo até 18:00
    latest = Math.max(latest, defaultEnd);

    // Arredondar para intervalos de 15 minutos
    earliest = Math.floor(earliest / 15) * 15;
    latest = Math.ceil(latest / 15) * 15;

    const startTime = `${Math.floor(earliest / 60).toString().padStart(2, '0')}:${(earliest % 60).toString().padStart(2, '0')}`;
    const endTime = `${Math.floor(latest / 60).toString().padStart(2, '0')}:${(latest % 60).toString().padStart(2, '0')}`;

    return {
      earliestTime: earliest,
      latestTime: latest,
      timeLabels: generateTimeLabels(startTime, endTime),
      allTimeSlots: generateTimeSlots(startTime, endTime)
    };
  }, [schedules, currentDate]);

  // Calcular posição da linha do horário atual
  const getCurrentTimePosition = useMemo(() => {
    const now = new Date();
    const today = format(new Date(), 'yyyy-MM-dd');
    const selectedDay = format(currentDate, 'yyyy-MM-dd');
    
    if (today !== selectedDay) {
      return null;
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    if (currentTotalMinutes < earliestTime || currentTotalMinutes > latestTime) {
      return null;
    }

    const minutesFromStart = currentTotalMinutes - earliestTime;
    const slotsFromStart = minutesFromStart / 15;
    const topPosition = slotsFromStart * 40;
    
    return topPosition;
  }, [currentTime, currentDate, earliestTime, latestTime]);

  // Buscar profissionais
  const fetchProfessionals = async () => {
    if (!user?.company_id) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/teams', {
        headers: {
          'company_id': user.company_id.toString(),
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const rawProfessionals = (response.data || []).map((professional: any) => ({
        id: professional.id,
        name: professional.name,
        url_avatar: professional.url_avatar,
        photo_url: professional.photo_url
      }));

      // Filtrar apenas profissionais com horários e serviços
      const checks = await Promise.all(
        rawProfessionals.map(async (p) => {
          try {
            const [scheduleRes, servicesRes] = await Promise.all([
              api.get(`/schedules/${p.id}`, {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  company_id: user?.company_id?.toString() || "0",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }),
              api.get(`/team-services/professional/${p.id}`, {
                headers: { company_id: user?.company_id?.toString() || "0" },
              }),
            ]);

            const hasSchedule = Array.isArray(scheduleRes.data?.schedules) && scheduleRes.data.schedules.length > 0;
            const hasServices = Array.isArray(servicesRes.data) && servicesRes.data.length > 0;
            return hasSchedule && hasServices ? p : null;
          } catch {
            return null;
          }
        })
      );

      const filteredProfessionals = checks.filter(Boolean) as Professional[];
      setProfessionals(filteredProfessionals);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar horários dos profissionais
  const fetchProfessionalsSchedules = async () => {
    if (professionals.length === 0) return;

    try {
      const schedulesPromises = professionals.map(async (professional) => {
        try {
          const response = await api.get(`/schedules/${professional.id}`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              company_id: user?.company_id?.toString() || "0",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          return {
            professional_id: professional.id,
            schedules: response.data?.schedules || []
          };
        } catch (error) {
          console.error(`Erro ao buscar horários do profissional ${professional.id}:`, error);
          return {
            professional_id: professional.id,
            schedules: []
          };
        }
      });

      const schedulesResults = await Promise.all(schedulesPromises);
      setSchedules(schedulesResults);
    } catch (error) {
      console.error('Erro ao buscar horários dos profissionais:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  // Buscar agendamentos de todos os profissionais
  const fetchAllAppointments = async () => {
    if (professionals.length === 0) return;

    try {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      const appointmentsPromises = professionals.map(async (professional) => {
        try {
          const response = await api.get(
            `/schedules/${professional.id}/date/${formattedDate}`,
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                company_id: user?.company_id?.toString() || "0",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          return response.data?.appointments || [];
        } catch (error) {
          console.error(`Erro ao buscar agendamentos do profissional ${professional.id}:`, error);
          return [];
        }
      });

      const appointmentsResults = await Promise.all(appointmentsPromises);
      const allAppointments = appointmentsResults.flat();
      setAppointments(allAppointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    }
  };

  // Função para obter posição do agendamento
  const getAppointmentPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const slotsFromStart = (startMinutes - earliestTime) / 15;
    const durationInSlots = (endMinutes - startMinutes) / 15;
    
    const top = slotsFromStart * 40;
    const height = durationInSlots * 40;
    
    return { top, height };
  };

  // Função para obter cor do agendamento
  const getAppointmentColor = (status: Agendamento['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-900';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'completed':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'free':
        return 'bg-gray-200 border-gray-400 text-gray-700 border-dashed opacity-80';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  // Verificar se um slot está disponível para o profissional
  const isSlotAvailable = (slotTime: string, professionalId: string) => {
    const professionalSchedules = schedules.find(s => s.professional_id === professionalId);
    const dayOfWeek = format(currentDate, 'EEEE');
    const professionalSchedule = professionalSchedules?.schedules.find(s => s.day_of_week === dayOfWeek);
    
    if (!professionalSchedule || professionalSchedule.is_day_off) {
      return false;
    }
    
    const [slotHour, slotMin] = slotTime.split(':').map(Number);
    const slotTotalMinutes = slotHour * 60 + slotMin;
    
    const [startHour, startMin] = professionalSchedule.start_time.split(':').map(Number);
    const [endHour, endMin] = professionalSchedule.end_time.split(':').map(Number);
    
    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;
    
    return slotTotalMinutes >= workStartMinutes && slotTotalMinutes < workEndMinutes;
  };

  // Navegação de data
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // Atualizar horário atual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.company_id) {
      fetchProfessionals();
    }
  }, [user?.company_id]);

  // Carregar schedules quando profissionais são carregados
  useEffect(() => {
    if (professionals.length > 0) {
      fetchProfessionalsSchedules();
    }
  }, [professionals.length]);

  // Carregar agendamentos quando schedules ou data mudarem
  useEffect(() => {
    if (professionals.length > 0 && schedules.length > 0) {
      fetchAllAppointments();
    }
  }, [schedules.length, currentDate, professionals.length]);

  if (isLoading && professionals.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#3D583F]/30 border-t-[#3D583F] mb-3"></div>
      </div>
    );
  }

  // Verificar se há dados válidos para renderizar
  if (!professionals || professionals.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-center px-4 py-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200"
                onClick={handlePrevDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200 flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#3D583F]" />
                    <span className="font-medium text-sm">
                      {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateChange}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum profissional encontrado</h3>
            <p className="text-gray-600">Verifique se há profissionais cadastrados com horários e serviços.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header simplificado - apenas data */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-center px-4 py-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200"
              onClick={handlePrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-4 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200 flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4 text-[#3D583F]" />
                  <span className="font-medium text-sm">
                    {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={handleDateChange}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-white hover:text-[#3D583F] transition-all duration-200"
              onClick={handleNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Layout unificado com scroll sincronizado */}
      <div className="flex-1 overflow-auto" ref={gridContainerRef}>
        <div className="flex gap-0 min-w-max">
          {/* Coluna de horários */}
          <div className="flex flex-col flex-shrink-0">
            {/* Header vazio para alinhamento */}
            <div className="h-12 w-20 bg-white border border-gray-200 border-b-0 rounded-tl-lg" />
            
            {/* Horários */}
            <Card className="w-20 rounded-none rounded-bl-lg">
              <div className="bg-gray-50">
                {timeLabels.map((time) => (
                  <div
                    key={time}
                    className="h-[80px] border-b flex items-start justify-center pt-1"
                  >
                    <span className="text-xs text-gray-600 font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Card principal com profissionais */}
          <Card className="flex-1 rounded-l-none">
          {/* Container para scroll sincronizado apenas no mobile */}
          <div className="max-md:overflow-x-auto">
            <div className="max-md:w-max">
              {/* Header com profissionais */}
              <div className="flex items-center border-b bg-white h-12">
                <div className="flex flex-1 max-md:flex-none">
                  {professionals.map((professional) => (
                    <div
                      key={professional.id}
                      className="flex-1 md:flex-none min-w-[140px] px-2 py-1 border-r last:border-r-0 flex items-center gap-2"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={professional.url_avatar || professional.photo_url} />
                        <AvatarFallback className="bg-[#3D583F] text-white text-xs">
                          {professional.name ? professional.name.split(' ').map((n: string) => n[0]).join('') : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {professional.name || 'Profissional'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid de slots dos profissionais */}
              <div className="flex relative md:overflow-x-auto md:min-w-max">
                {/* Linha do horário atual */}
                {getCurrentTimePosition !== null && (
                  <div
                    ref={currentTimeMarkerRef}
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: '#3D583F' }}></div>
                      <div className="flex-1 h-0.5 shadow-sm" style={{ backgroundColor: '#3D583F' }}></div>
                      <div className="text-white text-xs px-2 py-0.5 rounded-full shadow-lg font-medium" style={{ backgroundColor: '#3D583F' }}>
                        {format(currentTime, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                )}
                
                {professionals.map((professional) => {
                  const profAppointments = appointments.filter((apt) => 
                    apt.professional_id === professional.id || 
                    apt.professional_id === professional.id.toString() ||
                    apt.professional_id.toString() === professional.id.toString()
                  );
                  
                  return (
                    <div
                      key={professional.id}
                      className="flex-1 md:flex-none min-w-[140px] border-r last:border-r-0 relative"
                    >
                      {/* Linhas de horário clicáveis */}
                      {allTimeSlots.map((time) => {
                        const isAvailable = isSlotAvailable(time, professional.id);
                        
                        return (
                          <div
                            key={time}
                            className={`h-[40px] border-b border-gray-100 ${
                              isAvailable 
                                ? 'hover:bg-[#3D583F]/5 cursor-pointer' 
                                : 'bg-gray-50'
                            }`}
                            onClick={() => {
                              if (isAvailable) {
                                // Aqui você pode implementar a lógica de agendamento
                                toast.info(`Slot ${time} - ${professional.name || 'Profissional'}`);
                              }
                            }}
                          />
                        );
                      })}

                      {/* Agendamentos posicionados absolutamente */}
                      {profAppointments.map((appointment) => {
                        if (appointment.status === 'cancelled') return null;
                        
                        const { top, height } = getAppointmentPosition(
                          appointment.start_time?.slice(0, 5) || '09:00',
                          appointment.end_time?.slice(0, 5) || '09:15'
                        );
                        
                        return (
                          <div
                            key={appointment.id}
                            className={`absolute left-1 right-1 rounded-md border-2 p-1 text-xs overflow-hidden cursor-pointer transition-all hover:shadow-md ${getAppointmentColor(appointment.status)}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => {
                              toast.info(`Agendamento: ${appointment.client?.name || 'Cliente'}`);
                            }}
                          >
                            <div className="font-medium truncate">
                              {appointment.client?.name || 'Cliente'}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {appointment.start_time?.slice(0, 5) || '--:--'} - {appointment.end_time?.slice(0, 5) || '--:--'}
                            </div>
                            {appointment.services && appointment.services.length > 0 && (
                              <div className="text-xs opacity-75 truncate">
                                {appointment.services[0]?.service_name || 'Serviço'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
