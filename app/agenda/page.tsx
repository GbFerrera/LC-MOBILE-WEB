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

function generateTimeSlots(data: any): string[] {
  // Verifica se temos dados válidos
  if (!data) {
    console.error('Dados inválidos recebidos:', data);
    return [];
  }

  // Verifica se temos um array de agendas ou um objeto único
  const schedule = Array.isArray(data.schedules) ? data.schedules[0] : data;
  
  console.log('Schedule para gerar slots:', schedule);
  
  // Verifica se temos horários de início e fim
  if (!schedule || !schedule.start_time || !schedule.end_time) {
    console.error('Horários de início ou fim não encontrados:', schedule);
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
      
      console.log('Agendamentos do dia:', response.data);
      setAppointments(Array.isArray(response.data) ? response.data : []);
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
        const slots = generateTimeSlots(response.data);
        console.log('Slots gerados:', slots);
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Agenda</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Calendar */}
      <div className="p-4 bg-white border-b">
        <style jsx global>{`
          .rdp-day_selected {
            border: 2px solid #059669 !important;
            border-radius: 50% !important;
            background-color: white !important;
            color: #065f46 !important;
          }
          .rdp-day_selected:hover {
            background-color: #ecfdf5 !important;
            color: #065f46 !important;
          }
        `}</style>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          className="rounded-md border"
        />
      </div>

      {/* Available Slots */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">Carregando horários...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center text-gray-500">Nenhum horário disponível para este dia</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availableSlots.map((slot) => {
              const isBooked = isTimeSlotBooked(slot);
              const appointment = appointments.find(appt => {
                if (!appt.start_time) return false;
                const apptTime = appt.start_time.includes('T') 
                  ? appt.start_time.split('T')[1].slice(0, 5)
                  : appt.start_time.slice(0, 5);
                return apptTime === slot;
              });
              
              return (
                <div 
                  key={slot} 
                  className={`p-3 mb-2 border rounded-lg cursor-pointer transition-colors ${
                    isBooked 
                      ? 'bg-red-50 border-red-200 text-red-600' 
                      : 'hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300'
                  }`}
                  onClick={!isBooked ? () => handleSlotClick(slot) : undefined}
                  title={isBooked ? `Agendado para ${appointment?.client_name || 'Cliente'}` : 'Clique para agendar'}
                >
                  <div className="font-medium">{slot}</div>
                  {isBooked && (
                    <div className="text-xs mt-1 truncate">
                      {appointment?.client_name || 'Cliente'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Diálogo de Agendamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmitAppointment}>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo agendamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_id" className="text-right">
                  Cliente *
                </Label>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onValueChange={(value) => handleSelectChange('client_id', value)}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service_id" className="text-right">
                  Serviço *
                </Label>
                <Select
                  name="service_id"
                  value={formData.service_id}
                  onValueChange={(value) => handleSelectChange('service_id', value)}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} - {service.duration} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Alguma observação importante?"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Data
                </Label>
                <div className="col-span-3 text-sm">
                  {date.toLocaleDateString('pt-BR')} às {selectedSlot}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeAppointmentDialog}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Salvando...' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}