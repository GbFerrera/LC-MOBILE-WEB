"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, ChevronLeft, ChevronRight, User, Phone, 
  CalendarIcon, Clock, RefreshCw, Users, Search, CircleX, Loader2
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

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

  // Estados do dialog de criação de agendamento
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [formData, setFormData] = useState({ client_id: "", service_ids: [] as string[], notes: "" });

  // Estados do drawer de detalhes do agendamento
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Buscar clientes no backend com debounce
  useEffect(() => {
    if (!clientSearch.trim() || clientSearch.trim().length < 2) {
      setFilteredClients([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await api.get("/clients", {
          headers: { company_id: user?.company_id?.toString() || "0", Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { term: clientSearch.trim(), limit: 20 }
        });
        let results: any[] = [];
        if (Array.isArray(response.data)) results = response.data;
        else if (response.data?.clients) results = response.data.clients;
        setFilteredClients(results.filter(c => c && c.id));
      } catch { setFilteredClients([]); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [clientSearch, user?.company_id]);

  // Buscar serviços ao abrir dialog
  const fetchServices = useCallback(async () => {
    if (!user?.company_id) return;
    try {
      const response = await api.get("/service", {
        headers: { company_id: user.company_id.toString(), Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      let data = response.data;
      if (data && !Array.isArray(data)) {
        for (const key of ['services', 'data', 'items']) {
          if (Array.isArray(data[key])) { data = data[key]; break; }
        }
      }
      setServices(Array.isArray(data) ? data.filter(s => s?.service_id || s?.id).map(s => ({
        service_id: s.service_id || s.id,
        service_name: s.service_name || s.title || `Serviço ${s.service_id || s.id}`,
        service_duration: s.service_duration || s.duration || 30,
        service_price: s.service_price || s.price || "0.00",
      })) : []);
    } catch { setServices([]); }
  }, [user?.company_id]);

  const openSlotDialog = (slot: string, professionalId: string) => {
    setSelectedSlot(slot);
    setSelectedProfessionalId(professionalId);
    setFormData({ client_id: "", service_ids: [], notes: "" });
    setClientSearch("");
    setFilteredClients([]);
    fetchServices();
    setIsDialogOpen(true);
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const getTotalDuration = () => services.filter(s => formData.service_ids.includes(s.service_id?.toString())).reduce((t, s) => t + (s.service_duration || 0), 0);
  const getTotalPrice = () => services.filter(s => formData.service_ids.includes(s.service_id?.toString())).reduce((t, s) => t + parseFloat(s.service_price || "0"), 0);

  const handleCreateAppointment = async () => {
    if (!user || !selectedSlot) return;
    if (!formData.client_id || formData.service_ids.length === 0) {
      toast.error("Selecione o cliente e pelo menos um serviço");
      return;
    }
    try {
      setIsSubmitting(true);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const selectedSvcs = services.filter(s => formData.service_ids.includes(s.service_id?.toString()));
      const totalDuration = selectedSvcs.reduce((t, s) => t + (s.service_duration || 0), 0);
      const endTime = new Date(currentDate);
      endTime.setHours(hours, minutes + totalDuration);
      const formattedEndTime = endTime.toTimeString().slice(0, 5);

      await api.post("/appointments", {
        client_id: parseInt(formData.client_id),
        professional_id: selectedProfessionalId,
        appointment_date: formattedDate,
        start_time: selectedSlot,
        end_time: formattedEndTime,
        status: "confirmed",
        notes: formData.notes || "",
        services: selectedSvcs.map(s => ({
          service_id: parseInt(s.service_id?.toString() || "0"),
          professional_id: selectedProfessionalId,
          quantity: 1,
        })),
      }, {
        headers: { "Content-Type": "application/json", company_id: user.company_id?.toString() || "0", Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      toast.success("Agendamento criado!");
      setIsDialogOpen(false);
      fetchAllAppointments();
    } catch (error) {
      console.error("Erro ao criar:", error);
      toast.error("Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para atualizar status do agendamento
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    if (!user) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(
        `/appointments/${appointmentId}/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            company_id: user.company_id?.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (newStatus === 'canceled') {
        setIsDrawerOpen(false);
        setSelectedAppointment(null);
        toast.success("Agendamento cancelado!");
      } else {
        setSelectedAppointment((prev: any) => prev ? ({ ...prev, status: newStatus }) : null);
        toast.success("Status atualizado!");
      }
      fetchAllAppointments();
      setIsStatusMenuOpen(false);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "confirmed": return "Confirmado";
      case "completed": return "Concluído";
      case "canceled": return "Cancelado";
      case "free": return "Intervalo";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700 border-orange-300";
      case "confirmed": return "bg-green-100 text-green-700 border-green-300";
      case "completed": return "bg-blue-100 text-blue-700 border-blue-300";
      case "canceled": return "bg-red-100 text-red-700 border-red-300";
      case "free": return "bg-gray-100 text-gray-600 border-gray-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getAppointmentBorderColor = (status: string) => {
    switch (status) {
      case "pending": return "border-orange-400";
      case "confirmed": return "border-green-400";
      case "completed": return "border-blue-400";
      case "canceled": return "border-red-400";
      default: return "border-gray-300";
    }
  };

  const openWhatsApp = (phoneNumber: string, clientName: string) => {
    if (!phoneNumber) {
      toast.error("Telefone não disponível");
      return;
    }
    let clean = phoneNumber.replace(/[\s\(\)\-]/g, '');
    if (!clean.startsWith('55')) clean = '55' + clean;
    const msg = encodeURIComponent(`Olá ${clientName}! Queremos conversar sobre o seu agendamento.`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

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

  // Scroll automático para horário atual ao carregar
  useEffect(() => {
    if (getCurrentTimePosition === null || professionals.length === 0) return;
    
    const timer = setTimeout(() => {
      // Estratégia 1: scrollIntoView no marcador
      if (currentTimeMarkerRef.current) {
        try {
          currentTimeMarkerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        } catch {}
      }
      // Estratégia 2: scroll manual no container
      if (gridContainerRef.current) {
        const offset = Math.max(0, getCurrentTimePosition - 200);
        gridContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [getCurrentTimePosition, professionals.length]);

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

      {/* Layout com scroll sincronizado - container único */}
      <div className="flex-1 min-h-0 overflow-auto border-t border-gray-200" ref={gridContainerRef}>
        <div className="min-w-max">
          {/* Header sticky no topo - rola junto no eixo X */}
          <div className="flex sticky top-0 z-40 bg-white border-b border-gray-200">
            {/* Canto fixo (sticky left + top) */}
            <div className="h-12 w-16 shrink-0 border-r border-gray-200 sticky left-0 z-50 bg-white" />
            {/* Nomes dos profissionais */}
            <div className="flex flex-1 items-center h-12">
              {professionals.map((professional) => (
                <div
                  key={professional.id}
                  className="min-w-[140px] flex-1 px-2 py-1 border-r last:border-r-0 flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={professional.url_avatar || professional.photo_url} />
                    <AvatarFallback className="bg-[#3D583F] text-white text-[10px]">
                      {professional.name ? professional.name.split(' ').map((n: string) => n[0]).join('') : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {professional.name || 'Profissional'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Corpo: horários + grid */}
          <div className="flex isolate">
            {/* Coluna de horários - sticky left */}
            <div className="w-16 shrink-0 bg-gray-50 border-r border-gray-200 sticky left-0 z-30">
              {timeLabels.map((time) => (
                <div
                  key={time}
                  className="h-[80px] border-b border-gray-200 flex items-start justify-center pt-1"
                >
                  <span className="text-[11px] text-gray-500 font-medium">{time}</span>
                </div>
              ))}
            </div>

            {/* Grid dos profissionais */}
            <div className="flex-1 min-w-0 bg-white">
              <div className="flex relative">
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
                      <div className="text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg font-medium" style={{ backgroundColor: '#3D583F' }}>
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
                      className="min-w-[140px] flex-1 border-r last:border-r-0 relative"
                    >
                      {/* Linhas de horário clicáveis */}
                      {allTimeSlots.map((time) => {
                        const isAvailable = isSlotAvailable(time, professional.id);
                        
                        return (
                          <div
                            key={time}
                            className={`h-[40px] border-b border-gray-100 ${
                              isAvailable 
                                ? 'hover:bg-[#3D583F]/5 active:bg-[#3D583F]/10 cursor-pointer' 
                                : 'bg-gray-50/70'
                            }`}
                            onClick={() => {
                              if (isAvailable) {
                                openSlotDialog(time, professional.id.toString());
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
                            className={`absolute left-0.5 right-0.5 rounded-md border p-1 text-xs overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${getAppointmentColor(appointment.status)}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <div className="font-medium truncate text-[11px] leading-tight">
                              {appointment.client?.name || 'Cliente'}
                            </div>
                            <div className="text-[10px] opacity-75 truncate leading-tight">
                              {appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                            </div>
                            {height >= 60 && appointment.services && appointment.services.length > 0 && (
                              <div className="text-[10px] opacity-75 truncate leading-tight">
                                {appointment.services[0]?.service_name}
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
        </div>
      </div>

      {/* Dialog de Criação de Agendamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto p-0">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">Novo Agendamento</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {format(currentDate, "dd/MM/yyyy", { locale: ptBR })} &middot; {selectedSlot}
                {selectedProfessionalId && (
                  <> &middot; {professionals.find(p => p.id.toString() === selectedProfessionalId)?.name}</>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                  onFocus={() => {
                    if (formData.client_id && clientSearch) setClientSearch("");
                    setShowClientDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
                  className="h-11 border border-gray-200 rounded-lg pl-9 pr-9"
                  autoComplete="off"
                />
                {formData.client_id && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <CircleX
                      className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => { setFormData(prev => ({ ...prev, client_id: "" })); setClientSearch(""); }}
                    />
                  </div>
                )}
                {clientSearch.trim() && showClientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-auto border border-gray-100">
                    {filteredClients.length > 0 ? filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, client_id: client.id.toString() }));
                          setClientSearch(client.name);
                          setShowClientDropdown(false);
                          setClients(prev => prev.some(c => c.id === client.id) ? prev : [...prev, client]);
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#3D583F]/10 flex items-center justify-center mr-2.5 flex-shrink-0">
                          <span className="text-xs font-semibold text-[#3D583F]">{client.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                          {client.phone_number && <div className="text-xs text-gray-400">{client.phone_number}</div>}
                        </div>
                      </div>
                    )) : (
                      <div className="py-6 text-center text-sm text-gray-400">Nenhum cliente encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Serviços */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Serviços</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="w-full h-11 px-3 text-left bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-between"
                >
                  <span className={`text-sm ${formData.service_ids.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                    {formData.service_ids.length === 0
                      ? "Selecione os serviços"
                      : formData.service_ids.length === 1
                      ? services.find(s => s.service_id?.toString() === formData.service_ids[0])?.service_name || 'Serviço'
                      : `${formData.service_ids.length} serviços selecionados`}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showServiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showServiceDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg">
                    {formData.service_ids.length > 0 && (
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{getTotalDuration()} min</span>
                        <span className="text-xs font-semibold text-[#3D583F]">R$ {getTotalPrice().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="max-h-52 overflow-y-auto">
                      {services.length > 0 ? services.map((service) => {
                        const isSelected = formData.service_ids.includes(service.service_id?.toString() || "");
                        return (
                          <div
                            key={service.service_id}
                            className={`flex items-center px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-[#3D583F]/5' : 'hover:bg-gray-50'}`}
                            onClick={() => handleServiceToggle(service.service_id?.toString() || "")}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 flex-shrink-0 ${isSelected ? 'bg-[#3D583F] border-[#3D583F]' : 'border-gray-300'}`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-gray-800 flex-1">{service.service_name}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                              <span>{service.service_duration}min</span>
                              <span className="text-gray-600 font-medium">R$ {service.service_price}</span>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="py-6 text-center text-sm text-gray-400">Nenhum serviço disponível</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formData.service_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {services.filter(s => formData.service_ids.includes(s.service_id?.toString() || "")).map(s => (
                    <span key={s.service_id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#3D583F]/10 text-[#3D583F]">
                      {s.service_name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações (opcional)"
                className="min-h-[72px] border border-gray-200 rounded-lg resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="flex-1 h-11 rounded-lg border-gray-200 text-gray-600">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={isSubmitting || !formData.client_id || formData.service_ids.length === 0}
              className="flex-1 h-11 rounded-lg bg-[#3D583F] hover:bg-[#2d422f] text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </span>
              ) : "Agendar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawer de Detalhes do Agendamento */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh] rounded-t-3xl">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-lg font-bold text-gray-800">
              {selectedAppointment?.status === "free"
                ? "Intervalo Livre"
                : selectedAppointment?.client?.name || "Cliente"}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              {selectedAppointment?.status === "free"
                ? `${selectedAppointment?.start_time?.slice(0, 5)} - ${selectedAppointment?.end_time?.slice(0, 5)}`
                : selectedAppointment?.services && selectedAppointment.services.length > 1
                ? `${selectedAppointment.services.length} serviços`
                : selectedAppointment?.services?.[0]?.service_name || "Serviço"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-4 space-y-4">
            {selectedAppointment && (
              <>
                {/* Informações principais */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {selectedAppointment.status !== "free" && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Telefone</span>
                      <span className="font-medium text-sm">{selectedAppointment.client?.phone_number || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Horário</span>
                    <span className="font-medium text-sm">
                      {selectedAppointment.start_time?.slice(0, 5)} - {selectedAppointment.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  {selectedAppointment.status !== "free" ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="relative">
                        <button
                          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                          disabled={isUpdatingStatus}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${getStatusColor(selectedAppointment.status)} border`}
                        >
                          <span>{getStatusText(selectedAppointment.status)}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isStatusMenuOpen && !isUpdatingStatus && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                            {['pending', 'confirmed', 'completed', 'canceled'].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateAppointmentStatus(selectedAppointment.id, st)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                  selectedAppointment.status === st
                                    ? 'bg-gray-50 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {getStatusText(st)}
                                {selectedAppointment.status === st && (
                                  <svg className="w-4 h-4 text-[#3D583F] inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {isStatusMenuOpen && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tipo</span>
                      <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Intervalo Livre
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de serviços */}
                {selectedAppointment.status !== "free" && selectedAppointment.services && selectedAppointment.services.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 mb-2 block">
                      {selectedAppointment.services.length > 1 ? 'Serviços:' : 'Serviço:'}
                    </span>
                    <div className="space-y-2">
                      {selectedAppointment.services.map((service: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                          <span className="text-sm text-gray-800 font-medium">{service.service_name}</span>
                          <span className="text-sm text-emerald-600 font-semibold">R$ {service.price || service.service_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedAppointment.notes && (
                  <div>
                    <span className="text-sm text-gray-600 mb-1 block">Observações:</span>
                    <p className="text-sm text-gray-800 bg-white rounded-lg p-3 border border-gray-100">{selectedAppointment.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <DrawerFooter className="pt-4 border-t border-gray-200 space-y-3">
            {/* WhatsApp */}
            {selectedAppointment?.status !== "free" && selectedAppointment?.client?.phone_number && (
              <Button
                onClick={() => openWhatsApp(selectedAppointment.client.phone_number, selectedAppointment.client.name || "Cliente")}
                className="w-full h-11 bg-[#3D583F] hover:bg-[#2d422f] text-white font-medium rounded-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                </svg>
                WhatsApp
              </Button>
            )}

            {/* Cancelar intervalo */}
            {selectedAppointment?.status === "free" && (
              <Button
                onClick={() => updateAppointmentStatus(selectedAppointment.id, "canceled")}
                disabled={isUpdatingStatus}
                className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg"
              >
                {isUpdatingStatus ? "Cancelando..." : "Cancelar Intervalo"}
              </Button>
            )}

            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-11 rounded-lg border-gray-200 text-gray-600">
                Fechar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
