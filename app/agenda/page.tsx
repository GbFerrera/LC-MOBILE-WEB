"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DayPicker } from "react-day-picker";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: number;
  name: string;
  phone: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}


interface Schedule {
  id: number;
  professional_id: number;
  company_id: number;
  date: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  is_day_off: boolean;
  created_at: string;
  updated_at: string;
}

interface ScheduleResponse {
  hasSchedule: boolean;
  schedules: Schedule[];
}

function generateTimeSlots(data: any, selectedDate: Date): string[] {
  // Verifica se temos dados válidos
  if (!data || !data.schedules || !Array.isArray(data.schedules)) {
    console.error('Dados inválidos recebidos:', data);
    return [];
  }

  // Mapear os dias da semana em inglês para português conforme retornado pela API
  const dayMap: { [key: number]: string } = {
    0: 'Sunday',
    1: 'Monday', 
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  // Obter o dia da semana da data selecionada
  const dayOfWeek = dayMap[selectedDate.getDay()];
  console.log('Dia da semana selecionado:', dayOfWeek);
  
  // Filtrar o schedule para o dia da semana atual
  const schedule = data.schedules.find((s: any) => s.day_of_week === dayOfWeek);
  
  console.log('Schedule encontrado para o dia:', schedule);
  
  // Verifica se encontrou schedule para o dia e se não é dia de folga
  if (!schedule || schedule.is_day_off || !schedule.start_time || !schedule.end_time) {
    console.log('Sem horários para este dia ou é dia de folga');
    return [];
  }

  // Extrai os horários de início, fim e almoço
  const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
  const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
  
  // Converte para minutos totais para facilitar os cálculos
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  // Verifica se há horário de almoço definido
  let lunchStartMinutes = null;
  let lunchEndMinutes = null;
  
  if (schedule.lunch_start_time && schedule.lunch_end_time) {
    const [lunchStartHour, lunchStartMinute] = schedule.lunch_start_time.split(':').map(Number);
    const [lunchEndHour, lunchEndMinute] = schedule.lunch_end_time.split(':').map(Number);
    lunchStartMinutes = lunchStartHour * 60 + lunchStartMinute;
    lunchEndMinutes = lunchEndHour * 60 + lunchEndMinute;
    console.log(`Horário de almoço: ${schedule.lunch_start_time} às ${schedule.lunch_end_time}`);
  }
  
  const slots: string[] = [];
  const slotDuration = 30; // 30 minutos por slot
  
  // Gera slots de 30 minutos dentro do horário de trabalho
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Verifica se o horário atual está dentro do intervalo de almoço
    const isLunchTime = lunchStartMinutes !== null && 
                        lunchEndMinutes !== null &&
                        minutes >= lunchStartMinutes && 
                        minutes < lunchEndMinutes;
    
    if (!isLunchTime) {
      slots.push(timeString);
    } else {
      // Se for o início do horário de almoço, pula para o final do horário de almoço
      if (lunchEndMinutes) {
        minutes = lunchEndMinutes - slotDuration;
      }
    }
  }

  return slots;
}

export default function AgendaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Estado do diálogo de agendamento
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do drawer de detalhes do agendamento
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    notes: '',
  });
  
  // Buscar agendamentos do dia
  const fetchAppointments = async (userId: string, date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const response = await api.get(`/schedules/${userId}/date/${formattedDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'company_id': user?.company_id?.toString() || '1',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Dados completos da API:', response.data);
      
      // A API agora retorna: { schedule: {...}, appointments: [...] }
      const appointments = response.data?.appointments || [];
      console.log('Agendamentos do dia:', appointments);
      setAppointments(appointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    }
  };

  // Carregar clientes, serviços e agendamentos
  useEffect(() => {
    const fetchClientsAndServices = async () => {
      if (!user) return;
      
      // Busca agendamentos do dia atual
      fetchAppointments(user.id, date);
      
      if (!user) return;
      
      try {
        // Buscar clientes
        const clientsResponse = await api.get('/clients', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'company_id': user?.company_id?.toString() || '0',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setClients(clientsResponse.data || []);
        
        // Buscar serviços
        const servicesResponse = await api.get('/service', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'company_id': user?.company_id?.toString() || '0',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Serviços carregados:', servicesResponse.data);
        setServices(servicesResponse.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar clientes e serviços');
      }
    };
    
    if (user) {
      fetchClientsAndServices();
    }
  }, [user]);

  useEffect(() => {
    // Atualiza os agendamentos quando a data mudar
    if (user) {
      fetchAppointments(user.id, date);
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetForm = () => {
    setFormData({
      client_id: '',
      service_id: '',
      notes: ''
    });
    setSelectedSlot('');
  };
  
  const openAppointmentDialog = (slot: string) => {
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };
  
  const closeAppointmentDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSlotClick = (time: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar");
      return;
    }
    openAppointmentDialog(time);
  };
  
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedSlot) return;
    
    try {
      setIsSubmitting(true);
      
      // Validar dados do formulário
      if (!formData.client_id || !formData.service_id) {
        throw new Error('Por favor, selecione o cliente e o serviço');
      }
      
      // Formatar a data e hora para o formato esperado pela API
      const formattedDate = date.toISOString().split('T')[0];
      const [hours, minutes] = selectedSlot.split(':');
      
      // Definir quantidade como 1 e status como 'confirmed' por padrão
      const quantity = 1;
      const status = 'confirmed';
      
      // Encontrar o serviço selecionado para obter a duração
      const selectedService = services.find(s => s.id.toString() === formData.service_id);
      if (!selectedService) {
        throw new Error('Serviço não encontrado');
      }
      
      // Calcular end_time baseado na duração do serviço
      const endTime = new Date(date);
      endTime.setHours(parseInt(hours), parseInt(minutes) + selectedService.duration);
      const formattedEndTime = endTime.toTimeString().slice(0, 5);

      // Criar o payload do agendamento
      const appointmentData = {
        client_id: parseInt(formData.client_id),
        professional_id: user.id,
        appointment_date: formattedDate,
        start_time: selectedSlot,
        end_time: formattedEndTime,
        status: status, // Usando o status 'confirmed' definido anteriormente
        notes: formData.notes || "",
        services: [
          {
            service_id: parseInt(formData.service_id),
            professional_id: user.id,
            quantity: quantity // Adicionando a quantidade fixa como 1
          }
        ]
      };

      console.log('Dados do agendamento:', appointmentData);

      // Fazer a requisição para criar o agendamento
      const response = await api.post('/appointments', appointmentData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'company_id': user.company_id?.toString() || '0',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data) {
        throw new Error('Erro ao criar agendamento: resposta inválida');
      }

      toast.success('Agendamento criado com sucesso!');
      closeAppointmentDialog();
      
      // Recarregar os horários disponíveis
      fetchAppointments(user.id, date);
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar agendamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar o ID do profissional do contexto de autenticação
      const professionalId = user?.id;
      if (!professionalId) {
        throw new Error("ID do profissional não encontrado");
      }

      // Formatar a data para o formato YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // Fazer a requisição para a API com os headers necessários
      const response = await api.get(`/schedules/${professionalId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'company_id': user?.company_id?.toString() || '0',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Dados recebidos da API:', response.data);
      
      // Se a API retornar horários, usamos eles
      if (response.data && response.data.schedules && response.data.schedules.length > 0) {
        const slots = generateTimeSlots(response.data, date);
        console.log('Slots gerados para', date.toLocaleDateString('pt-BR'), ':', slots);
        setAvailableSlots(slots);
      } else {
        // Se não houver horários, retornamos array vazio
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Erro ao buscar horários:', err);
      setError(err instanceof Error ? err.message : "Erro ao buscar horários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [date, user]);

  // Verifica se um horário está ocupado
  const isTimeSlotBooked = (time: string) => {
    return appointments.some(appt => {
      if (!appt.start_time) return false;
      // Formata o horário para garantir o mesmo formato (HH:MM)
      const apptTime = appt.start_time.includes('T') 
        ? appt.start_time.split('T')[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      return apptTime === time;
    });
  };
  
  // Busca detalhes do agendamento para um horário específico
  const getAppointmentDetails = (time: string) => {
    return appointments.find(appt => {
      if (!appt.start_time) return false;
      const apptTime = appt.start_time.includes('T') 
        ? appt.start_time.split('T')[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      return apptTime === time;
    });
  };
  
  // Formata a data para exibição (ex: "Terça-feira, 27 de maio de 2025")
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    };
    return new Date(date).toLocaleDateString('pt-BR', options);
  };
  
  const formattedDate = formatDate(date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white/80 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/10">
              <ChevronLeftIcon className="h-6 w-6" />
            </Link>
            <div className="text-center">
              <h1 className="font-bold text-2xl tracking-wide">Agenda</h1>
              <p className="text-emerald-100 text-sm mt-1">{formattedDate}</p>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Date Selector Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <h2 className="font-semibold text-white text-lg">Selecionar Data</h2>
              </div>
              <div className="p-6">
                {/* Custom Date Navigation */}
                <div className="space-y-4">
                  {/* Horizontal Date Selector */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {/* Previous Day Button */}
                    <button
                      onClick={() => {
                        const previousDay = new Date(date);
                        previousDay.setDate(date.getDate() - 1);
                        setDate(previousDay);
                      }}
                      className="p-2 rounded-lg bg-white border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5 text-gray-600 hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Current Date Display */}
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-100 rounded-lg p-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-gray-800">
                          {date.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          }).replace('.', '')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </div>
                      </div>
                    </div>

                    {/* Next Day Button */}
                    <button
                      onClick={() => {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        setDate(nextDay);
                      }}
                      className="p-2 rounded-lg bg-white border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5 text-gray-600 hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Today Button */}
                  <button
                    onClick={() => setDate(new Date())}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Hoje</span>
                    </span>
                  </button>

                  {/* Week Navigation */}
                  <div className="grid grid-cols-7 gap-1 mt-6">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
                      const currentWeekStart = new Date(date);
                      currentWeekStart.setDate(date.getDate() - date.getDay());
                      const weekDay = new Date(currentWeekStart);
                      weekDay.setDate(currentWeekStart.getDate() + index);
                      
                      const isSelected = weekDay.toDateString() === date.toDateString();
                      const isToday = weekDay.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setDate(weekDay)}
                          className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transform scale-105'
                              : isToday
                              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">{day}</div>
                          <div className="font-bold">{weekDay.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <h2 className="font-semibold text-white text-lg">Horários Disponíveis</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {availableSlots.length > 0 ? `${availableSlots.length} horários disponíveis` : 'Nenhum horário encontrado'}
                </p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Carregando horários...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-red-100 rounded-full p-4 mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 font-medium text-center">{error}</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium text-center">Nenhum horário disponível para este dia</p>
                    <p className="text-gray-500 text-sm mt-2 text-center">Selecione uma data diferente ou configure seus horários de trabalho</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {availableSlots.map((slot) => {
                      const isBooked = isTimeSlotBooked(slot);
                      const appointment = getAppointmentDetails(slot);
                      
                      return (
                        <div 
                          key={slot} 
                          className={`group relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                            isBooked 
                              ? 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 cursor-pointer shadow-md hover:shadow-lg' 
                              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 cursor-pointer shadow-md hover:shadow-lg active:scale-95'
                          }`}
                          onClick={isBooked ? () => {
                            // Mostrar detalhes do agendamento no drawer
                            if (appointment) {
                              setSelectedAppointment(appointment);
                              setIsDrawerOpen(true);
                            }
                          } : () => handleSlotClick(slot)}
                          title={isBooked ? `Clique para ver detalhes - ${appointment?.client?.name || 'Cliente'}` : 'Clique para agendar'}
                        >
                          <div className={`font-bold text-lg mb-1 ${
                            isBooked ? 'text-red-700' : 'text-emerald-700 group-hover:text-emerald-800'
                          }`}>
                            {slot}
                          </div>
                          
                          {isBooked && appointment ? (
                            <>
                              <div className="text-xs text-red-600 font-medium truncate mb-1">
                                {appointment.client?.name || 'Cliente'}
                              </div>
                              <div className="text-xs text-red-500 truncate mb-1">
                                {appointment.services?.[0]?.service_name || 'Serviço'}
                              </div>
                              <div className="flex items-center text-xs text-red-500">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                R$ {appointment.services?.[0]?.price || '0.00'}
                              </div>
                            </>
                          ) : !isBooked ? (
                            <div className="flex items-center text-xs text-emerald-600 group-hover:text-emerald-700 font-medium">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Disponível
                            </div>
                          ) : null}
                          
                          {/* Hover effect indicator */}
                          {!isBooked && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diálogo de Agendamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
          <form onSubmit={handleSubmitAppointment}>
            <DialogHeader className="text-center pb-6">
              <div className="mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-800">Novo Agendamento</DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Preencha os dados para criar um novo agendamento para <span className="font-semibold text-emerald-600">{selectedSlot}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              {/* Data e Horário - Destacado */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 rounded-lg p-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Data e Horário</p>
                      <p className="text-emerald-700">{date.toLocaleDateString('pt-BR')} às {selectedSlot}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Cliente *
                </Label>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onValueChange={(value) => handleSelectChange('client_id', value)}
                  required
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-lg">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div className="bg-emerald-100 rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-xs font-semibold text-emerald-600">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{client.name} - {client.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Serviço */}
              <div className="space-y-2">
                <Label htmlFor="service_id" className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                  </svg>
                  Serviço *
                </Label>
                <Select
                  name="service_id"
                  value={formData.service_id}
                  onValueChange={(value) => handleSelectChange('service_id', value)}
                  required
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-lg">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{service.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{service.duration} min</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m-7 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
                  </svg>
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Alguma observação importante?"
                  className="min-h-[80px] border-2 border-gray-200 focus:border-emerald-400 rounded-lg resize-none"
                />
              </div>
            </div>
            
            <DialogFooter className="pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeAppointmentDialog}
                disabled={isSubmitting}
                className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Agendar
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Drawer de Detalhes do Agendamento */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-xl font-bold text-gray-800">
              {selectedAppointment?.client?.name || 'Cliente'}
            </DrawerTitle>
            <DrawerDescription className="text-gray-600">
              {selectedAppointment?.services?.[0]?.service_name || 'Serviço'} • R$ {selectedAppointment?.services?.[0]?.price || '0.00'}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-6 pb-4 space-y-4">
            {selectedAppointment && (
              <>
                {/* Informações Principais */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Telefone</span>
                    <span className="font-medium">{selectedAppointment.client?.phone_number || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horário</span>
                    <span className="font-medium">
                      {selectedAppointment.start_time?.slice(0, 5)} - {selectedAppointment.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedAppointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : selectedAppointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedAppointment.status === 'confirmed' ? 'Confirmado' : 
                       selectedAppointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                  
                  {selectedAppointment.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 text-sm">Observações:</span>
                      <p className="text-gray-800 mt-1">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <DrawerFooter className="pt-4 border-t border-gray-100">
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Fechar</span>
                </span>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}