"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CircleX, Search, RefreshCw } from "lucide-react";

interface Client {
  id: number;
  name: string;
  phone: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_description: string;
  service_price: string;
  service_duration: number;
}

interface FitSlot {
  time: string;
  endTime: string;
  duration: number;
  isEncaixe: boolean;
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

// Funções utilitárias para lógica de encaixes
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const getNextStandardSlot = (minutes: number): number => {
  return Math.ceil(minutes / 15) * 15;
};

const isShortInterval = (startMinutes: number, endMinutes: number): boolean => {
  return (endMinutes - startMinutes) < 30 && (endMinutes - startMinutes) >= 15;
};

function generateTimeSlots(
  data: any,
  selectedDate: Date
): { availableSlots: string[]; lunchSlots: string[]; scheduleData: any } {
  // Verifica se temos dados válidos
  if (!data || !data.schedules || !Array.isArray(data.schedules)) {
    console.error("Dados inválidos recebidos:", data);
    return { availableSlots: [], lunchSlots: [], scheduleData: null };
  }

  // Mapear os dias da semana em inglês para português conforme retornado pela API
  const dayMap: { [key: number]: string } = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  // Obter o dia da semana da data selecionada
  const dayOfWeek = dayMap[selectedDate.getDay()];
  console.log("Dia da semana selecionado:", dayOfWeek);

  // Filtrar o schedule para o dia da semana atual
  const schedule = data.schedules.find((s: any) => s.day_of_week === dayOfWeek);

  console.log("Schedule encontrado para o dia:", schedule);

  // Verifica se encontrou schedule para o dia e se não é dia de folga
  if (
    !schedule ||
    schedule.is_day_off ||
    !schedule.start_time ||
    !schedule.end_time
  ) {
    console.log("Sem horários para este dia ou é dia de folga");
    return { availableSlots: [], lunchSlots: [], scheduleData: schedule };
  }

  // Extrai os horários de início, fim e almoço
  const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
  const [endHour, endMinute] = schedule.end_time.split(":").map(Number);

  // Converte para minutos totais para facilitar os cálculos
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Verifica se há horário de almoço definido
  let lunchStartMinutes = null;
  let lunchEndMinutes = null;

  if (schedule.lunch_start_time && schedule.lunch_end_time) {
    const [lunchStartHour, lunchStartMinute] = schedule.lunch_start_time
      .split(":")
      .map(Number);
    const [lunchEndHour, lunchEndMinute] = schedule.lunch_end_time
      .split(":")
      .map(Number);
    lunchStartMinutes = lunchStartHour * 60 + lunchStartMinute;
    lunchEndMinutes = lunchEndHour * 60 + lunchEndMinute;
    console.log(
      `Horário de almoço: ${schedule.lunch_start_time} às ${schedule.lunch_end_time}`
    );
  }

  const availableSlots: string[] = [];
  const lunchSlots: string[] = [];
  const slotDuration = 15; // 15 minutos por slot

  // Gera slots de 15 minutos dentro do horário de trabalho
  for (
    let minutes = startTotalMinutes;
    minutes < endTotalMinutes;
    minutes += slotDuration
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    // Verifica se o horário atual está dentro do intervalo de almoço
    const isLunchTime =
      lunchStartMinutes !== null &&
      lunchEndMinutes !== null &&
      minutes >= lunchStartMinutes &&
      minutes < lunchEndMinutes;

    if (isLunchTime) {
      lunchSlots.push(timeString);
    } else {
      availableSlots.push(timeString);
    }
  }

  return { availableSlots, lunchSlots, scheduleData: schedule };
}

export default function AgendaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<Date>(() => {
    // Garantir que a data seja criada no timezone local
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [lunchSlots, setLunchSlots] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingButton, setIsLoadingButton] = useState(false);

  // Estado do diálogo de agendamento
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFreeIntervalMode, setIsFreeIntervalMode] = useState(false);
  const [isEncaixe, setIsEncaixe] = useState(false);
  const [encaixeEndTime, setEncaixeEndTime] = useState<string>("");
  const [fitSlots, setFitSlots] = useState<FitSlot[]>([]);

  // Estado do drawer de detalhes do agendamento
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Estado do drawer de seleção de intervalo
  const [isIntervalDrawerOpen, setIsIntervalDrawerOpen] = useState(false);
  const [formIntervals, setFormIntervals] = useState({
    professional_id: user?.id || "",
    appointment_date: "",
    start_time: "",
    end_time: "",
    notes: "",
  });

  // Estado para busca de clientes
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Estado para dropdown de serviços
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // Filtrar clientes com base na busca
  const filteredClients = clients.filter((client) => {
    if (!clientSearch.trim()) return false; // Se não houver texto de busca, não mostra nenhum cliente
    
    const searchTerm = clientSearch.toLowerCase().trim();
    const nameMatch = client.name?.toLowerCase().includes(searchTerm);
    const phoneMatch = client.phone?.includes(searchTerm);
    
    return nameMatch || phoneMatch;
  });

  // Dados do formulário
  const [formData, setFormData] = useState({
    client_id: "",
    service_ids: [] as string[], // Array para múltiplos serviços
    notes: "",
  });

  // Função para detectar slots de encaixe
  const detectFitSlots = (availableSlots: string[], appointments: any[]): FitSlot[] => {
    const fitSlots: FitSlot[] = [];
    
    // Ordenar agendamentos por horário
    const sortedAppointments = appointments
      .filter(appt => appt.status !== "free" && appt.status !== "canceled")
      .sort((a, b) => {
        const timeA = timeToMinutes(a.start_time.slice(0, 5));
        const timeB = timeToMinutes(b.start_time.slice(0, 5));
        return timeA - timeB;
      });

    for (const appointment of sortedAppointments) {
      const endTimeStr = appointment.end_time.slice(0, 5);
      const endMinutes = timeToMinutes(endTimeStr);
      
      // Verificar se o agendamento termina em um horário não-padrão (não múltiplo de 15)
      const nextStandardSlotMinutes = getNextStandardSlot(endMinutes);
      
      if (nextStandardSlotMinutes > endMinutes) {
        const duration = nextStandardSlotMinutes - endMinutes;
        
        // Só criar encaixe se a duração for de pelo menos 10 minutos e máximo 30 minutos
        if (duration >= 10 && duration <= 30) {
          const fitStartTime = minutesToTime(endMinutes);
          const fitEndTime = minutesToTime(nextStandardSlotMinutes);
          
          // Verificar se não há conflito com outros agendamentos
          const hasConflict = sortedAppointments.some(otherAppt => {
            if (otherAppt.id === appointment.id) return false; // Não comparar consigo mesmo
            
            const otherStartMinutes = timeToMinutes(otherAppt.start_time.slice(0, 5));
            const otherEndMinutes = timeToMinutes(otherAppt.end_time.slice(0, 5));
            
            // Verificar sobreposição: o encaixe (endMinutes até nextStandardSlotMinutes) 
            // não deve sobrepor com outro agendamento (otherStartMinutes até otherEndMinutes)
            return (endMinutes < otherEndMinutes && nextStandardSlotMinutes > otherStartMinutes);
          });
          
          if (!hasConflict) {
            fitSlots.push({
              time: fitStartTime,
              endTime: fitEndTime,
              duration: duration,
              isEncaixe: true
            });
          }
        }
      }
    }
    
    return fitSlots;
  };

  // Buscar agendamentos do dia
  const fetchAppointments = async (userId: string, date: Date) => {
    try {
      const formattedDate = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      const response = await api.get(
        `/schedules/${userId}/date/${formattedDate}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            company_id: user?.company_id?.toString() || "1",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // A API retorna: { schedule: {...}, appointments: [...] }
      const appointments = response.data?.appointments || [];
      setAppointments(appointments);
      
      // Detectar slots de encaixe é feito no useEffect que monitora appointments
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
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
        const clientsResponse = await api.get("/clients", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            company_id: user?.company_id?.toString() || "0",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // Filtrar apenas clientes válidos com id definido
        const validClients = (clientsResponse.data || []).filter(client => client && client.id);
        setClients(validClients);

        // Buscar serviços - tentar diferentes endpoints
        let servicesResponse;
        let servicesData = [];
        
        const serviceEndpoints = ["/service", "/service"];
        
        for (const endpoint of serviceEndpoints) {
          try {
            console.log(`Tentando buscar serviços no endpoint: ${endpoint}`);
            servicesResponse = await api.get(endpoint, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                company_id: user?.company_id?.toString() || "0",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            
            console.log(`Resposta do endpoint ${endpoint}:`, servicesResponse);
            console.log(`Dados do endpoint ${endpoint}:`, servicesResponse.data);
            
            // Verificar se a resposta tem a estrutura esperada
            servicesData = servicesResponse.data;
            
            // Se a resposta for um objeto com uma propriedade que contém os serviços
            if (servicesData && typeof servicesData === 'object' && !Array.isArray(servicesData)) {
              // Tentar encontrar a propriedade que contém os serviços
              const possibleKeys = ['services', 'data', 'items', 'results'];
              for (const key of possibleKeys) {
                if (servicesData[key] && Array.isArray(servicesData[key])) {
                  servicesData = servicesData[key];
                  break;
                }
              }
            }
            
            // Se encontrou dados válidos, sair do loop
            if (Array.isArray(servicesData) && servicesData.length > 0) {
              console.log(`Serviços encontrados no endpoint ${endpoint}:`, servicesData);
              break;
            }
            
          } catch (endpointError) {
            console.error(`Erro no endpoint ${endpoint}:`, endpointError);
            if (endpoint === serviceEndpoints[serviceEndpoints.length - 1]) {
              // Se é o último endpoint, propagar o erro
              throw endpointError;
            }
          }
        }
        
        console.log("Dados processados dos serviços:", servicesData);
        
        // Normalizar e filtrar serviços válidos
        const validServices = Array.isArray(servicesData) 
          ? servicesData
              .filter(service => {
                console.log("Verificando serviço:", service);
                console.log("Tem ID?", !!service?.id);
                console.log("Tem service_id?", !!service?.service_id);
                
                // Verificar se tem id ou service_id
                return service && (service.id || service.service_id);
              })
              .map(service => {
                // Normalizar a estrutura do serviço
                const normalizedService = {
                  service_id: service.service_id || service.id,
                  service_name: service.service_name || service.service_name || service.title || `Serviço ${service.service_id || service.id}`,
                  service_duration: service.service_duration || service.duration || service.time || service.duration_minutes || 30,
                  service_price: service.service_price || service.price || service.value || service.cost || "0.00",
                  service_description: service.service_description || service.description || service.desc || '',
                  // Manter dados originais para debug
                  _original: service
                };
                
                console.log("Serviço normalizado:", normalizedService);
                return normalizedService;
              })
          : [];
        
        console.log("Serviços válidos filtrados:", validServices);
        console.log("Quantidade de serviços:", validServices.length);
        
        setServices(validServices);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        console.error("Detalhes do erro:", error.response?.data);
        console.error("Status do erro:", error.response?.status);
        
        if (error.response?.status === 404) {
          toast.error("Endpoint de serviços não encontrado. Verifique a API.");
        } else if (error.response?.status === 401) {
          toast.error("Não autorizado. Verifique o token de autenticação.");
        } else {
          toast.error("Erro ao carregar clientes e serviços");
        }
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

  // Recalcular encaixes quando slots ou agendamentos mudarem
  useEffect(() => {
    if (availableSlots.length > 0) {
      const detectedFitSlots = detectFitSlots(availableSlots, appointments);
      setFitSlots(detectedFitSlots);
    }
  }, [availableSlots, appointments]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para gerenciar seleção/deseleção de serviços
  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      const currentServices = prev.service_ids;
      const isSelected = currentServices.includes(serviceId);
      
      if (isSelected) {
        // Remove o serviço se já estiver selecionado
        return {
          ...prev,
          service_ids: currentServices.filter(id => id !== serviceId)
        };
      } else {
        // Adiciona o serviço se não estiver selecionado
        return {
          ...prev,
          service_ids: [...currentServices, serviceId]
        };
      }
    });
  };

  // Calcular preço total dos serviços selecionados
  const getTotalPrice = () => {
    return services
      .filter(service => formData.service_ids.includes(service.service_id?.toString() || service.service_id?.toString() || ""))
      .reduce((total, service) => total + (parseFloat(service.service_price) || 0), 0);
  };

  // Calcular duração total dos serviços selecionados
  const getTotalDuration = () => {
    return services
      .filter(service => formData.service_ids.includes(service.service_id?.toString() || service.service_id?.toString() || ""))
      .reduce((total, service) => total + (service.service_duration || 0), 0);
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      service_ids: [],
      notes: "",
    });
    setSelectedSlot("");
    setSelectedEndTime("");
    setIsFreeIntervalMode(false);
    setIsEncaixe(false);
    setEncaixeEndTime("");
  };

  const openAppointmentDialog = (slot: string, isEncaixeSlot = false, encaixeEnd?: string) => {
    setSelectedSlot(slot);
    setIsEncaixe(isEncaixeSlot);
    
    if (isEncaixeSlot && encaixeEnd) {
      setEncaixeEndTime(encaixeEnd);
      setSelectedEndTime(encaixeEnd);
    } else {
      // Calcular horário final padrão (15 minutos depois)
      const [hours, minutes] = slot.split(":").map(Number);
      const endTime = new Date();
      endTime.setHours(hours, minutes + 15);
      const formattedEndTime = endTime.toTimeString().slice(0, 5);
      setSelectedEndTime(formattedEndTime);
    }
    
    setIsDialogOpen(true);
  };

  const closeAppointmentDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSlotClick = (time: string, isEncaixeSlot = false, encaixeEnd?: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar");
      return;
    }
    openAppointmentDialog(time, isEncaixeSlot, encaixeEnd);
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedSlot) return;

    try {
      setIsSubmitting(true);

      // Se estiver no modo Intervalo Livre, usar lógica diferente
      if (isFreeIntervalMode) {
        // Validar se horário final foi selecionado
        if (!selectedEndTime) {
          throw new Error("Por favor, selecione o horário final do intervalo");
        }

        const intervalData = {
          professional_id: user.id,
          appointment_date: date.toISOString().split("T")[0],
          start_time: selectedSlot,
          end_time: selectedEndTime,
          notes: formData.notes || "Intervalo livre criado via slot",
        };

        const response = await api.post(
          "/schedules/free-interval",
          intervalData,
          {
            headers: {
              company_id: user?.company_id,
            },
          }
        );

        toast.success("Intervalo livre criado com sucesso!");
        closeAppointmentDialog();
        fetchAppointments(user.id, date);
        return;
      }

      // Validar dados do formulário para agendamento normal
      if (!formData.client_id || formData.service_ids.length === 0) {
        throw new Error("Por favor, selecione o cliente e pelo menos um serviço");
      }

      // Formatar a data e hora para o formato esperado pela API
      const formattedDate = date.toISOString().split("T")[0];
      const [hours, minutes] = selectedSlot.split(":");

      // Definir quantidade como 1 e status como 'confirmed' por padrão
      const quantity = 1;
      const status = "confirmed";

      // Encontrar os serviços selecionados e calcular duração total
      const selectedServices = services.filter(
        (s) => s.service_id && formData.service_ids.includes(s.service_id.toString())
      );
      if (selectedServices.length === 0) {
        throw new Error("Serviços não encontrados");
      }

      // Calcular duração total de todos os serviços
      const totalDuration = selectedServices.reduce((total, service) => total + (service.service_duration || 0), 0);

      // Calcular end_time baseado na duração total ou usar horário de encaixe
      let formattedEndTime;
      if (isEncaixe && encaixeEndTime) {
        formattedEndTime = encaixeEndTime;
      } else {
        const endTime = new Date(date);
        endTime.setHours(
          parseInt(hours),
          parseInt(minutes) + totalDuration
        );
        formattedEndTime = endTime.toTimeString().slice(0, 5);
      }

      // Criar o payload do agendamento
      const appointmentData = {
        client_id: parseInt(formData.client_id),
        professional_id: user.id,
        appointment_date: formattedDate,
        start_time: selectedSlot,
        end_time: formattedEndTime,
        status: status, // Usando o status 'confirmed' definido anteriormente
        notes: formData.notes || "",
        isEncaixe: isEncaixe, // Flag para indicar que é um encaixe
        services: selectedServices.map(service => ({
          service_id: parseInt(service.service_id?.toString() || service.service_id?.toString() || "0"),
          professional_id: user.id,
          quantity: quantity, // Adicionando a quantidade fixa como 1
        })),
      };

      // Enviar dados do agendamento para a API

      // Fazer a requisição para criar o agendamento
      const response = await api.post("/appointments", appointmentData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          company_id: user.company_id?.toString() || "0",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.data) {
        throw new Error("Erro ao criar agendamento: resposta inválida");
      }

      toast.success(`Agendamento ${isEncaixe ? 'de encaixe ' : ''}criado com sucesso!`);
      closeAppointmentDialog();

      // Recarregar os horários disponíveis
      // Pequeno delay para garantir que o backend processe
      setTimeout(async () => {
        await fetchAppointments(user.id, date);
      }, 500);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar agendamento"
      );
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
      const formattedDate = date.toISOString().split("T")[0];

      // Fazer a requisição para a API com os headers necessários
      const response = await api.get(`/schedules/${professionalId}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          company_id: user?.company_id?.toString() || "0",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Dados recebidos da API:", response.data);

      // Se a API retornar horários, usamos eles
      if (
        response.data &&
        response.data.schedules &&
        response.data.schedules.length > 0
      ) {
        const slotsData = generateTimeSlots(response.data, date);
        console.log(
          "Slots gerados para",
          date.toLocaleDateString("pt-BR"),
          ":",
          slotsData
        );
        setAvailableSlots(slotsData.availableSlots);
        setLunchSlots(slotsData.lunchSlots);
        setScheduleData(slotsData.scheduleData);
      } else {
        // Se não houver horários, retornamos array vazio
        setAvailableSlots([]);
        setLunchSlots([]);
        setScheduleData(null);
      }
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
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
    return appointments.some((appt) => {
      if (!appt.start_time || !appt.end_time || appt.status === "free") return false;
      
      // Formata os horários para garantir o mesmo formato (HH:MM)
      const startTime = appt.start_time.includes("T")
        ? appt.start_time.split("T")[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      const endTime = appt.end_time.includes("T")
        ? appt.end_time.split("T")[1].slice(0, 5)
        : appt.end_time.slice(0, 5);

      // Converte os horários para minutos para facilitar a comparação
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentTimeMinutes = timeToMinutes(time);
      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      // Verifica se o horário atual está dentro do intervalo do agendamento
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    });
  };

  // Verifica se um horário é um intervalo livre
  const isFreeInterval = (time: string) => {
    return appointments.some((appt) => {
      if (!appt.start_time || !appt.end_time || appt.status !== "free")
        return false;

      // Formata os horários para garantir o mesmo formato (HH:MM)
      const startTime = appt.start_time.includes("T")
        ? appt.start_time.split("T")[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      const endTime = appt.end_time.includes("T")
        ? appt.end_time.split("T")[1].slice(0, 5)
        : appt.end_time.slice(0, 5);

      // Converte os horários para minutos para facilitar a comparação
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentTimeMinutes = timeToMinutes(time);
      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      // Verifica se o horário atual está dentro do intervalo livre
      return (
        currentTimeMinutes >= startTimeMinutes &&
        currentTimeMinutes <= endTimeMinutes
      );
    });
  };

  // Verifica se um horário é um slot de encaixe
  const isFitSlot = (time: string) => {
    return fitSlots.some(fitSlot => fitSlot.time === time);
  };

  // Busca detalhes do slot de encaixe
  const getFitSlotDetails = (time: string) => {
    return fitSlots.find(fitSlot => fitSlot.time === time);
  };

  // Verifica se um slot deve ser exibido (não está no meio de um agendamento ou intervalo livre)
  const shouldShowSlot = (time: string) => {
    // Se é um slot de encaixe, sempre mostrar
    if (isFitSlot(time)) {
      return true;
    }

    // Converte horário para minutos
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const currentTimeMinutes = timeToMinutes(time);

    // Verifica se este slot está dentro de algum intervalo livre mesclado
    const mergedFreeIntervals = getMergedFreeIntervals();
    for (const freeInterval of mergedFreeIntervals) {
      const startTimeMinutes = timeToMinutes(freeInterval.start);
      const endTimeMinutes = timeToMinutes(freeInterval.end);

      // Se o slot atual está dentro do intervalo livre (inclusive no início e fim)
      if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
        return false; // Não mostrar este slot
      }
    }

    // Verifica se este slot está no meio de algum agendamento
    for (const appt of appointments) {
      if (!appt.start_time || !appt.end_time || appt.status === "free") continue;

      // Formata os horários para garantir o mesmo formato (HH:MM)
      const startTime = appt.start_time.includes("T")
        ? appt.start_time.split("T")[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      const endTime = appt.end_time.includes("T")
        ? appt.end_time.split("T")[1].slice(0, 5)
        : appt.end_time.slice(0, 5);

      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      // Se o slot atual está dentro do agendamento mas não é o slot inicial
      if (currentTimeMinutes > startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
        return false; // Não mostrar este slot
      }
    }

    return true; // Mostrar o slot
  };

  // Busca detalhes do intervalo livre para um horário específico
  const getFreeIntervalDetails = (time: string) => {
    return appointments.find((appt) => {
      if (!appt.start_time || !appt.end_time || appt.status !== "free")
        return false;

      // Formata os horários para garantir o mesmo formato (HH:MM)
      const startTime = appt.start_time.includes("T")
        ? appt.start_time.split("T")[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      const endTime = appt.end_time.includes("T")
        ? appt.end_time.split("T")[1].slice(0, 5)
        : appt.end_time.slice(0, 5);

      // Converte os horários para minutos para facilitar a comparação
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentTimeMinutes = timeToMinutes(time);
      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      // Verifica se o horário atual está dentro do intervalo livre
      return (
        currentTimeMinutes >= startTimeMinutes &&
        currentTimeMinutes <= endTimeMinutes
      );
    });
  };

  // Mescla intervalos livres consecutivos e retorna array com {start, end}
  const getMergedFreeIntervals = () => {
    const freeIntervals = appointments
      .filter(appt => appt.status === "free")
      .map(appt => ({
        start: appt.start_time.includes("T")
          ? appt.start_time.split("T")[1].slice(0, 5)
          : appt.start_time.slice(0, 5),
        end: appt.end_time.includes("T")
          ? appt.end_time.split("T")[1].slice(0, 5)
          : appt.end_time.slice(0, 5),
      }))
      .sort((a, b) => {
        const timeA = timeToMinutes(a.start);
        const timeB = timeToMinutes(b.start);
        return timeA - timeB;
      });

    if (freeIntervals.length === 0) return [];

    // Mesclar intervalos consecutivos ou sobrepostos
    const merged: Array<{ start: string; end: string }> = [];
    let current = { ...freeIntervals[0] };

    for (let i = 1; i < freeIntervals.length; i++) {
      const next = freeIntervals[i];
      const currentEndMinutes = timeToMinutes(current.end);
      const nextStartMinutes = timeToMinutes(next.start);

      // Se o próximo intervalo começa no mesmo horário ou antes do fim do atual, mesclar
      if (nextStartMinutes <= currentEndMinutes) {
        // Estender o intervalo atual até o fim do próximo (se for maior)
        const nextEndMinutes = timeToMinutes(next.end);
        if (nextEndMinutes > currentEndMinutes) {
          current.end = next.end;
        }
      } else {
        // Intervalos não são consecutivos, salvar o atual e começar novo
        merged.push({ ...current });
        current = { ...next };
      }
    }
    
    // Adicionar o último intervalo
    merged.push(current);

    return merged;
  };

  // Obtém lista de intervalos livres consolidados (apenas horários de início)
  const getConsolidatedFreeIntervals = () => {
    return getMergedFreeIntervals().map(interval => interval.start);
  };

  // Busca detalhes do agendamento para um horário específico
  const getAppointmentDetails = (time: string) => {
    return appointments.find((appt) => {
      if (!appt.start_time || !appt.end_time || appt.status === "free") return false;
      
      // Formata os horários para garantir o mesmo formato (HH:MM)
      const startTime = appt.start_time.includes("T")
        ? appt.start_time.split("T")[1].slice(0, 5)
        : appt.start_time.slice(0, 5);
      const endTime = appt.end_time.includes("T")
        ? appt.end_time.split("T")[1].slice(0, 5)
        : appt.end_time.slice(0, 5);

      // Converte os horários para minutos para facilitar a comparação
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const currentTimeMinutes = timeToMinutes(time);
      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      // Verifica se o horário atual está dentro do intervalo do agendamento
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    });
  };

  // Função para obter as classes de estilo baseadas no status do agendamento
  const getSlotStyles = (slot: string) => {
    const isBooked = isTimeSlotBooked(slot);
    const isFree = isFreeInterval(slot);
    const appointment = getAppointmentDetails(slot);

    if (isBooked && appointment) {
      // Cores baseadas no status do agendamento
      switch (appointment.status) {
        case 'confirmed':
          return {
            containerClass: "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 cursor-pointer shadow-md hover:shadow-lg",
            timeClass: "text-green-700",
            textClass: "text-green-600",
            iconColor: "text-green-500"
          };
        case 'pending':
          return {
            containerClass: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 cursor-pointer shadow-md hover:shadow-lg",
            timeClass: "text-yellow-700",
            textClass: "text-yellow-600",
            iconColor: "text-yellow-500"
          };
        case 'completed':
          return {
            containerClass: "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 cursor-pointer shadow-md hover:shadow-lg",
            timeClass: "text-blue-700",
            textClass: "text-blue-600",
            iconColor: "text-blue-500"
          };
        default:
          return {
            containerClass: "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 cursor-pointer shadow-md hover:shadow-lg",
            timeClass: "text-gray-700",
            textClass: "text-gray-600",
            iconColor: "text-gray-500"
          };
      }
    } else if (isFree) {
      return {
        containerClass: "bg-gray-200 text-gray-700 border-2 border-dashed border-gray-400 cursor-pointer shadow-sm opacity-80 hover:opacity-100",
        timeClass: "text-gray-700",
        textClass: "text-gray-600",
        iconColor: "text-gray-500"
      };
    } else {
      // Slot disponível (cinza)
      return {
        containerClass: "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-400 cursor-pointer shadow-md hover:shadow-lg active:scale-95",
        timeClass: "text-gray-700 group-hover:text-gray-800",
        textClass: "text-gray-600 group-hover:text-gray-700",
        iconColor: "text-gray-500"
      };
    }
  };

  // Formata a data para exibição (ex: "Terça-feira, 27 de maio de 2025")
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("pt-BR", options);
  };

  // Obtém horas disponíveis (que têm pelo menos um slot livre)
  const getAvailableHours = () => {
    const availableHours = new Set<string>();

    availableSlots.forEach((slot) => {
      const hour = slot.split(":")[0];
      // Verifica se o slot não está ocupado nem é intervalo livre
      if (!isTimeSlotBooked(slot) && !isFreeInterval(slot)) {
        availableHours.add(hour);
      }
    });

    return Array.from(availableHours).sort();
  };

  // Obtém minutos disponíveis para uma hora específica
  const getAvailableMinutes = (selectedHour: string) => {
    const availableMinutes = new Set<string>();

    availableSlots.forEach((slot) => {
      const [hour, minute] = slot.split(":");
      // Se a hora coincide e o slot está disponível
      if (
        hour === selectedHour &&
        !isTimeSlotBooked(slot) &&
        !isFreeInterval(slot)
      ) {
        availableMinutes.add(minute);
      }
    });

    return Array.from(availableMinutes).sort();
  };

  // Gera horários de fim válidos para intervalos livres (slots de 15 minutos)
  const getValidEndTimes = (startTime: string) => {
    if (!startTime) return [];
    
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTimes: string[] = [];
    
    // Gerar opções de horário final em intervalos de 15 minutos
    // Mínimo: 15 minutos depois do início
    // Máximo: até o final do expediente
    const maxEndMinutes = Math.max(...availableSlots.map(slot => {
      const [hour, minute] = slot.split(":").map(Number);
      return hour * 60 + minute + 15; // Último slot + 15 minutos
    }));
    
    for (let minutes = startTotalMinutes + 15; minutes <= maxEndMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      endTimes.push(timeString);
    }
    
    return endTimes;
  };

  const formattedDate = formatDate(date);

  // Função para atualizar status do agendamento
  const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const response = await api.patch(
        `/appointments/${appointmentId}/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            company_id: user.company_id?.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        // Se for cancelamento, fechar o drawer e recarregar
        if (newStatus === 'canceled') {
          setIsDrawerOpen(false);
          setSelectedAppointment(null);
          toast.success("Agendamento cancelado! Slot liberado para novo agendamento.");
        } else {
          // Atualizar o agendamento selecionado para outros status
          setSelectedAppointment((prev: any) => ({
            ...prev,
            status: newStatus,
          }));
          toast.success("Status atualizado com sucesso!");
        }
        
        // Recarregar agendamentos
        fetchAppointments(user.id, date);
        setIsStatusMenuOpen(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do agendamento");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Função para obter o texto do status em português
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "confirmed":
        return "Confirmado";
      case "completed":
        return "Concluído";
      case "canceled":
        return "Cancelado";
      case "free":
        return "Intervalo";
      default:
        return status;
    }
  };

  // Função para obter as cores do status (baseado nas imagens fornecidas)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-200 text-gray-700";
      case "confirmed":
        return "bg-green-200 text-gray-700";
      case "completed":
        return "bg-blue-200 text-gray-700";
      case "canceled":
        return "bg-red-200 text-gray-700";
      case "free":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  // Função para abrir WhatsApp do cliente
  const openWhatsApp = (phoneNumber: string, clientName: string) => {
    if (!phoneNumber) {
      toast.error("Número de telefone não disponível");
      return;
    }

    // Limpar o número: remover espaços, parênteses, hífens e adicionar código do país se necessário
    let cleanNumber = phoneNumber.replace(/[\s\(\)\-]/g, '');
    
    // Se não começar com 55 (Brasil), adicionar
    if (!cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }

    // Mensagem padrão personalizada
    const message = `Olá ${clientName}! Queremos conversar sobre o seu agendamento.`;
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp Web ou aplicativo
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const freeInterval = async () => {


    try {
      const response = await api.post(
        "/schedules/free-interval",
        formIntervals,
        {
          headers: {
            company_id: user?.company_id,
          },
        }
      );

      toast.success("Intervalo liberado com sucesso", response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao liberar intervalo");
    }
  };

  // Handlers para o drawer de seleção de intervalo
  const openIntervalDrawer = () => {
    setFormIntervals({
      professional_id: user?.id || "",
      appointment_date: date.toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      notes: "",
    });
    setIsIntervalDrawerOpen(true);
  };

  const closeIntervalDrawer = () => {
    setIsIntervalDrawerOpen(false);
  };

  const handleIntervalFormChange = (field: string, value: string) => {
    setFormIntervals((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIntervalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingButton(true);

    try {
      if (!formIntervals.start_time || !formIntervals.end_time) {
        toast.error("Por favor, preencha os horários de início e fim");
        setIsLoadingButton(false);
        return;
      }

      // Fazendo a requisição diretamente em vez de chamar freeInterval()
      const response = await api.post(
        "/schedules/free-interval",
        formIntervals,
        {
          headers: {
            company_id: user?.company_id,
          },
        }
      );

      toast.success("Intervalo liberado com sucesso");
      closeIntervalDrawer();

      if (user) {
        fetchAppointments(user.id, date);
      }
    } catch (error) {
      console.log("Erro ao configurar intervalo:", error);
      alert(error.response.data.message);
    } finally {
      setIsLoadingButton(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </Link>
            <div className="text-center">
              <h1 className="font-bold text-2xl tracking-wide">Agenda</h1>
              <p className="text-emerald-100 text-sm mt-1">{formattedDate}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
              onClick={async () => {
                if (user?.id) {
                  await fetchAppointments(user.id.toString(), date);
                  await fetchSchedules();
                }
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Date Selector Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
              <div className="flex justify-between bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <h2 className="font-semibold text-white text-lg">
                  Selecionar Data
                </h2>
                <Button
                  onClick={openIntervalDrawer}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Selecionar Intervalo
                </Button>
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
                      <svg
                        className="w-5 h-5 text-gray-600 hover:text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {/* Current Date Display */}
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-100 rounded-lg p-2">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-gray-800">
                          {date
                            .toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            .replace(".", "")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {date.toLocaleDateString("pt-BR", {
                            weekday: "long",
                          })}
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
                      <svg
                        className="w-5 h-5 text-gray-600 hover:text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Today Button */}
                  <button
                    onClick={() => setDate(new Date())}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Hoje</span>
                    </span>
                  </button>

                  {/* Week Navigation */}
                  <div className="grid grid-cols-7 gap-1 mt-6">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (day, index) => {
                        const currentWeekStart = new Date(date);
                        currentWeekStart.setDate(
                          date.getDate() - date.getDay()
                        );
                        const weekDay = new Date(currentWeekStart);
                        weekDay.setDate(currentWeekStart.getDate() + index);

                        const isSelected =
                          weekDay.toDateString() === date.toDateString();
                        const isToday =
                          weekDay.toDateString() === new Date().toDateString();

                        return (
                          <button
                            key={index}
                            onClick={() => setDate(weekDay)}
                            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transform scale-105"
                                : isToday
                                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                                : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">{day}</div>
                            <div className="font-bold">{weekDay.getDate()}</div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <h2 className="font-semibold text-white text-lg">
                  Horários Disponíveis
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {availableSlots.length > 0
                    ? `${availableSlots.length} horários disponíveis`
                    : "Nenhum horário encontrado"}
                </p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">
                      Carregando horários...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-red-100 rounded-full p-4 mb-4">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-red-600 font-medium text-center">
                      {error}
                    </p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium text-center">
                      Nenhum horário disponível para este dia
                    </p>
                    <p className="text-gray-500 text-sm mt-2 text-center">
                      Selecione uma data diferente ou configure seus horários de
                      trabalho
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Renderizar slots disponíveis, encaixes e horário de almoço */}
                    {(() => {
                      // Combinar slots disponíveis com slots de encaixe
                      const allSlots = [...availableSlots.filter(slot => shouldShowSlot(slot))];
                      
                      // Adicionar APENAS o primeiro slot de almoço (se houver)
                      if (lunchSlots.length > 0 && !allSlots.includes(lunchSlots[0])) {
                        allSlots.push(lunchSlots[0]);
                      }
                      
                      // Adicionar APENAS os horários de início dos intervalos livres consolidados
                      const consolidatedFreeStarts = getConsolidatedFreeIntervals();
                      consolidatedFreeStarts.forEach(freeStart => {
                        if (!allSlots.includes(freeStart)) {
                          allSlots.push(freeStart);
                        }
                      });
                      
                      // Adicionar slots de encaixe que não estão na lista de slots disponíveis
                      fitSlots.forEach(fitSlot => {
                        if (!allSlots.includes(fitSlot.time)) {
                          allSlots.push(fitSlot.time);
                        }
                      });
                      
                      // NOVO: Adicionar horários dos agendamentos normais existentes (incluindo horários não-padrão)
                      appointments.forEach(appointment => {
                        if (appointment.status !== 'canceled' && appointment.status !== 'free') {
                          const startTime = appointment.start_time.slice(0, 5); // "13:17:00" → "13:17"
                          if (!allSlots.includes(startTime)) {
                            // Adicionar slot de agendamento não-padrão
                            allSlots.push(startTime);
                          }
                        }
                      });
                      
                      // Ordenar todos os slots por horário
                      allSlots.sort((a, b) => {
                        const timeA = timeToMinutes(a);
                        const timeB = timeToMinutes(b);
                        return timeA - timeB;
                      });
                      
                      return allSlots;
                    })()
                      .map((slot) => {
                        const isBooked = isTimeSlotBooked(slot);
                        const consolidatedFreeStarts = getConsolidatedFreeIntervals();
                        const isFree = consolidatedFreeStarts.includes(slot);
                        const isEncaixe = isFitSlot(slot);
                        const isLunch = lunchSlots.includes(slot) && slot === lunchSlots[0];
                        const appointment = getAppointmentDetails(slot);
                        const freeInterval = getFreeIntervalDetails(slot);
                        const fitSlotDetails = getFitSlotDetails(slot);
                        
                        // Calcular horário de fim do almoço usando o horário exato do scheduleData
                        const lunchEndTime = isLunch && scheduleData?.lunch_end_time
                          ? scheduleData.lunch_end_time.slice(0, 5)
                          : null;
                        
                        // Calcular horário de fim do intervalo livre usando intervalos mesclados
                        const mergedIntervals = getMergedFreeIntervals();
                        const freeEndTime = isFree 
                          ? mergedIntervals.find(interval => interval.start === slot)?.end
                          : null;

                      return (
                        <div
                          key={slot}
                          className={`flex items-center justify-between w-full p-4 rounded-xl transition-all duration-200 ${
                            isLunch
                              ? "bg-amber-50 border-2 border-dashed border-amber-400 text-amber-800 opacity-80"
                              : isBooked && appointment && appointment.status !== 'canceled'
                              ? appointment.status === 'confirmed'
                                ? "bg-green-200 border-2 border-green-300 cursor-pointer hover:shadow-md text-gray-700"
                                : appointment.status === 'pending'
                                ? "bg-orange-200 border-2 border-orange-300 cursor-pointer hover:shadow-md text-gray-700"
                                : appointment.status === 'completed'
                                ? "bg-blue-200 border-2 border-blue-300 cursor-pointer hover:shadow-md text-gray-700"
                                : "bg-green-200 border-2 border-green-300 cursor-pointer hover:shadow-md text-gray-700"
                              : isFree
                              ? "bg-gray-200 text-gray-700 border-2 border-dashed border-gray-400 cursor-pointer shadow-sm opacity-80 hover:opacity-100"
                              : isEncaixe
                              ? "bg-yellow-50 border-2 border-dashed border-yellow-300 cursor-pointer hover:shadow-md text-gray-700"
                              : "bg-green-50 border-2 border-green-100 hover:border-green-200 cursor-pointer hover:shadow-md"
                          }`}
                          onClick={
                            isLunch
                              ? undefined // Não clicável para horário de almoço
                              : isBooked && appointment && appointment.status !== 'canceled'
                              ? () => {
                                  // Mostrar detalhes do agendamento no drawer
                                  setSelectedAppointment(appointment);
                                  setIsDrawerOpen(true);
                                }
                              : isFree
                              ? () => {
                                  // Mostrar detalhes do intervalo livre no drawer
                                  const freeInterval = getFreeIntervalDetails(slot);
                                  if (freeInterval) {
                                    setSelectedAppointment(freeInterval);
                                    setIsDrawerOpen(true);
                                  }
                                }
                              : isEncaixe && fitSlotDetails
                              ? () => handleSlotClick(slot, true, fitSlotDetails.endTime)
                              : () => handleSlotClick(slot)
                          }
                          title={
                            isLunch
                              ? "Horário de almoço"
                              : isBooked && appointment && appointment.status !== 'canceled'
                              ? `Clique para ver detalhes - ${
                                  appointment?.client?.name || "Cliente"
                                }`
                              : isFree
                              ? "Intervalo livre - Clique para ver detalhes ou cancelar"
                              : isEncaixe && fitSlotDetails
                              ? `Clique para encaixar (${fitSlotDetails.duration} min disponíveis)`
                              : "Clique para agendar"
                          }
                        >
                          {/* Lado esquerdo - Horário e ícone */}
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              isLunch
                                ? "bg-amber-200"
                                : isBooked && appointment && appointment.status !== 'canceled'
                                ? "bg-white/60"
                                : isFree
                                ? "bg-gray-300"
                                : isEncaixe
                                ? "bg-yellow-200"
                                : "bg-green-100"
                            }`}>
                              {isLunch ? (
                                <span className="text-lg">🍽️</span>
                              ) : (
                                <svg
                                  className={`w-5 h-5 ${
                                    isBooked && appointment && appointment.status !== 'canceled'
                                      ? "text-gray-600"
                                      : isFree
                                      ? "text-gray-700"
                                      : isEncaixe
                                      ? "text-yellow-700"
                                      : "text-green-600"
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className={`font-bold text-lg ${
                                isLunch
                                  ? "text-amber-800"
                                  : isBooked && appointment && appointment.status !== 'canceled'
                                  ? "text-gray-700"
                                  : isFree
                                  ? "text-gray-700"
                                  : isEncaixe
                                  ? "text-yellow-800"
                                  : "text-gray-700"
                              }`}>
                                {isLunch && lunchEndTime 
                                  ? `${slot} - ${lunchEndTime}` 
                                  : isFree && freeEndTime
                                  ? `${slot} - ${freeEndTime}`
                                  : isEncaixe && fitSlotDetails 
                                  ? `${slot} até ${fitSlotDetails.endTime}` 
                                  : slot
                                }
                              </div>
                              <div className={`text-sm ${
                                isLunch
                                  ? "text-amber-700"
                                  : isBooked && appointment && appointment.status !== 'canceled'
                                  ? "text-gray-600"
                                  : isFree
                                  ? "text-gray-600"
                                  : isEncaixe
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}>
                                {isLunch
                                  ? "Horário de Almoço"
                                  : isBooked && appointment && appointment.status !== 'canceled'
                                  ? `${appointment.client?.name || "Cliente"}`
                                  : isFree && freeInterval
                                  ? "Intervalo Livre"
                                  : isEncaixe && fitSlotDetails
                                  ? `Clique para encaixar (${fitSlotDetails.duration} min disponíveis)`
                                  : "Clique para agendar"
                                }
                              </div>
                              {isBooked && appointment && appointment.status !== 'canceled' && appointment.services?.[0] && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {appointment.services.length > 1 
                                    ? `${appointment.services.length} serviços`
                                    : appointment.services[0].service_name || "Serviço"
                                  }
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Lado direito - Botão ou informações */}
                          <div className="flex items-center">
                            {isLunch ? (
                              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-800 border border-amber-300">
                                Almoço
                              </div>
                            ) : isBooked && appointment && appointment.status !== 'canceled' ? (
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                appointment.status === 'confirmed'
                                  ? "bg-green-600 text-white"
                                  : appointment.status === 'pending'
                                  ? "bg-white text-gray-700 border border-gray-300"
                                  : appointment.status === 'completed'
                                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {getStatusText(appointment.status)}
                              </div>
                            ) : isFree ? (
                              <div className="text-gray-600">
                                <CircleX size={20} />
                              </div>
                            ) : isEncaixe ? (
                              <div className="text-yellow-600">
                                <span className="text-lg font-bold">+</span>
                              </div>
                            ) : (
                              <div className="text-green-600">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
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
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isFreeIntervalMode 
                  ? "bg-gradient-to-br from-emerald-100 to-teal-100" 
                  : "bg-gradient-to-br from-emerald-100 to-teal-100"
              }`}>
                <svg
                  className={`w-8 h-8 ${
                    isFreeIntervalMode ? "text-emerald-600" : "text-emerald-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isFreeIntervalMode 
                      ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    }
                  />
                </svg>
              </div>
              
              {/* Toggle Switch Minimalista */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-3 bg-gray-100 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setIsFreeIntervalMode(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      !isFreeIntervalMode
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Novo Agendamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFreeIntervalMode(true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isFreeIntervalMode
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Intervalo Livre
                  </button>
                </div>
              </div>

              <DialogTitle className={`text-2xl font-bold ${
                isFreeIntervalMode ? "text-emerald-800" : "text-gray-800"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {isFreeIntervalMode ? "Intervalo Livre" : "Novo Agendamento"}
                  {isEncaixe && !isFreeIntervalMode && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Encaixe
                    </span>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                {isFreeIntervalMode 
                  ? (
                    <>
                      Criar um intervalo livre para{" "}
                      <span className="font-semibold text-emerald-600">
                        {selectedSlot}
                      </span>
                    </>
                  ) : isEncaixe ? (
                    <>
                      Encaixar agendamento no horário{" "}
                      <span className="font-semibold text-yellow-700">
                        {selectedSlot} até {encaixeEndTime}
                      </span>
                    </>
                  ) : (
                    <>
                      Preencha os dados para criar um novo agendamento para{" "}
                      <span className="font-semibold text-emerald-600">
                        {selectedSlot}
                      </span>
                    </>
                  )
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Data e Horário - Destacado */}
              <div className={`rounded-xl p-4 border-2 ${
                isFreeIntervalMode 
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200" 
                  : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg p-2 ${
                      isFreeIntervalMode ? "bg-emerald-100" : "bg-emerald-100"
                    }`}>
                      <svg
                        className={`w-5 h-5 ${
                          isFreeIntervalMode ? "text-emerald-600" : "text-emerald-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isFreeIntervalMode ? "text-emerald-800" : "text-emerald-800"
                      }`}>
                        Data e Horário
                      </p>
                      <p className={`${
                        isFreeIntervalMode ? "text-emerald-700" : isEncaixe ? "text-yellow-700" : "text-emerald-700"
                      }`}>
                        {date.toLocaleDateString("pt-BR")} às {selectedSlot}
                        {isFreeIntervalMode && selectedEndTime && ` - ${selectedEndTime}`}
                        {isEncaixe && encaixeEndTime && ` - ${encaixeEndTime}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horário Final - Apenas para Intervalo Livre */}
              {isFreeIntervalMode && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-emerald-700 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Horário Final *
                  </Label>
                  <Select
                    value={selectedEndTime}
                    onValueChange={setSelectedEndTime}
                  >
                    <SelectTrigger className="h-12 border-2 border-emerald-200 focus:border-emerald-400 rounded-lg">
                      <SelectValue placeholder="Selecione o horário final" />
                    </SelectTrigger>
                    <SelectContent>
                      {getValidEndTimes(selectedSlot).map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-emerald-600">
                    Horários disponíveis em intervalos de 15 minutos
                  </p>
                </div>
              )}

              {/* Cliente - Com busca (apenas para agendamento normal) */}
              {!isFreeIntervalMode && (
              <div className="space-y-2">
                <Label
                  htmlFor="client_id"
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Cliente *
                </Label>
                <div className="relative">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search size={18} />
                    </div>
                    <Input
                      id="client_search"
                      name="client_id"
                      placeholder="Buscar cliente por nome ou telefone..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => {
                        // Se já tiver um cliente selecionado e o campo estiver preenchido com o nome do cliente,
                        // limpa o campo para facilitar uma nova busca
                        if (formData.client_id && clientSearch) {
                          setClientSearch("");
                        }
                        setShowClientDropdown(true);
                      }}
                      onBlur={() => {
                        // Pequeno delay para permitir que o clique no item da lista seja processado
                        setTimeout(() => setShowClientDropdown(false), 150);
                      }}
                      className="h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-lg pl-10 pr-10"
                      autoComplete="off"
                      required
                    />
                  </div>
                  {/* Indicador visual do cliente selecionado */}
                  {formData.client_id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="bg-emerald-100 rounded-full w-6 h-6 flex items-center justify-center mr-1">
                        <span className="text-xs font-semibold text-emerald-600">
                          {clients.find(c => c.id && c.id.toString() === formData.client_id)?.name?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                      </div>
                      <CircleX
                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-500"
                        onClick={() => {
                          handleSelectChange("client_id", "");
                          setClientSearch("");
                        }}
                      />
                    </div>
                  )}
                  {/* Mostrar resultados da busca abaixo do input */}
                  {clientSearch.trim() && showClientDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 animate-in fade-in-50 slide-in-from-top-5 duration-200">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <div 
                            key={client.id} 
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 transition-colors duration-150"
                            onClick={() => {
                              handleSelectChange("client_id", client.id?.toString() || "");
                              setClientSearch(client.name);
                              setShowClientDropdown(false);
                            }}
                          >
                            <div className="font-medium flex items-center">
                              <div className="bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                                <span className="text-xs font-semibold text-emerald-600">
                                  {client.name?.charAt(0)?.toUpperCase() || "C"}
                                </span>
                              </div>
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500 ml-7">{client.phone}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">
                          <div className="flex justify-center mb-2">
                            <Search size={18} className="text-gray-400" />
                          </div>
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Serviços - Select com Dropdown Customizado (apenas para agendamento normal) */}
              {!isFreeIntervalMode && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
                    />
                  </svg>
                  Serviços *
                </Label>
                
                {/* Select Customizado */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    className="w-full h-12 px-3 py-2 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-emerald-400 focus:border-emerald-400 focus:outline-none transition-colors duration-200 flex items-center justify-between"
                  >
                    <span className="flex-1 text-gray-900">
                      {formData.service_ids.length === 0 
                        ? "Selecione os serviços" 
                        : formData.service_ids.length === 1
                        ? `${services.find(s => s.service_id?.toString() === formData.service_ids[0])?.service_name || 'Serviço'}`
                        : `${formData.service_ids.length} serviços selecionados`
                      }
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        showServiceDropdown ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown */}
                  {showServiceDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {/* Cabeçalho */}
                      {formData.service_ids.length > 0 && (
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Resumo</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                {getTotalDuration()} min
                              </span>
                              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-semibold">
                                R$ {getTotalPrice().toFixed(2)} 
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Lista de serviços com scroll */}
                      <div className="max-h-64 overflow-y-auto">
                        {services.length > 0 ? (
                          services.map((service) => {
                            const isSelected = formData.service_ids.includes(service.service_id?.toString() || "");
                            return (
                              <div
                                key={service.service_id}
                                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                                  isSelected ? 'bg-emerald-50' : ''
                                }`}
                                onClick={() => handleServiceToggle(service.service_id?.toString() || "")}
                              >
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                
                                {/* Informações do serviço */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                      isSelected ? 'text-emerald-800' : 'text-gray-800'
                                    }`}>
                                      {service.service_name || 'Serviço'}
                                    </span>
                                    <div className="flex items-center space-x-2 ml-2">
                                      <span className="text-xs text-gray-500">
                                        {service.service_duration}min
                                      </span>
                                      <span className="text-xs text-gray-600 font-medium">
                                        R$ {service.service_price}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <span className="text-sm">Nenhum serviço disponível</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Resumo dos serviços selecionados (fora do dropdown) */}
                {formData.service_ids.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200 mt-2">
                    <div className="text-xs text-emerald-700">
                      <span className="font-medium">Selecionados: </span>
                      {services
                        .filter(service => formData.service_ids.includes(service.service_id?.toString() || ""))
                        .map(service => service.service_name)
                        .join(", ")}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className={`text-sm font-semibold flex items-center ${
                    isFreeIntervalMode ? "text-emerald-700" : "text-gray-700"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      isFreeIntervalMode ? "text-emerald-500" : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m-7 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
                    />
                  </svg>
                  {isFreeIntervalMode ? "Motivo do Intervalo" : "Observações"}
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={isFreeIntervalMode 
                    ? "Informe o motivo do intervalo livre (opcional)"
                    : "Alguma observação importante?"
                  }
                  className={`min-h-[80px] border-2 rounded-lg resize-none ${
                    isFreeIntervalMode 
                      ? "border-emerald-200 focus:border-emerald-400" 
                      : "border-gray-200 focus:border-emerald-400"
                  }`}
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
                className={`px-6 py-2 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFreeIntervalMode
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isFreeIntervalMode ? "Criando intervalo..." : "Salvando..."}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {isFreeIntervalMode ? "Criar Intervalo" : "Agendar"}
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
              {selectedAppointment?.status === "free" 
                ? "Intervalo Livre" 
                : selectedAppointment?.client?.name || "Cliente"
              }
            </DrawerTitle>
            <DrawerDescription className="text-gray-600">
              {selectedAppointment?.status === "free" 
                ? `${selectedAppointment?.start_time?.slice(0, 5)} - ${selectedAppointment?.end_time?.slice(0, 5)}`
                : selectedAppointment?.services && selectedAppointment.services.length > 1 
                ? `${selectedAppointment.services.length} serviços • R$ ${selectedAppointment.services.reduce((total, service) => total + (parseFloat(service.price) || 0), 0).toFixed(2)}`
                : `${selectedAppointment?.services?.[0]?.service_name || "Serviço"} • R$ ${selectedAppointment?.services?.[0]?.price || "0.00"}`
              }
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-4 space-y-4">
            {selectedAppointment && (
              <>
                {/* Informações Principais */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* Telefone - apenas para agendamentos normais */}
                  {selectedAppointment.status !== "free" && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Telefone</span>
                      <span className="font-medium">
                        {selectedAppointment.client?.phone_number || "N/A"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horário</span>
                    <span className="font-medium">
                      {selectedAppointment.start_time?.slice(0, 5)} -{" "}
                      {selectedAppointment.end_time?.slice(0, 5)}
                    </span>
                  </div>

                  {/* Para intervalos livres, mostrar Tipo em vez de Status */}
                  {selectedAppointment.status === "free" ? (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tipo</span>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20">
                        Intervalo Livre
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <div className="relative">
                      <button
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        disabled={isUpdatingStatus}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all duration-200 hover:shadow-md ${getStatusColor(selectedAppointment.status)} ${
                          isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                        }`}
                      >
                        <span>{getStatusText(selectedAppointment.status)}</span>
                        {isUpdatingStatus ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Menu de Status - Responsivo para Mobile */}
                      {isStatusMenuOpen && !isUpdatingStatus && (
                        <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-100 z-50 transform transition-transform duration-300 ease-out">
                          {/* Handle bar */}
                          <div className="flex justify-center pt-4 pb-3">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                          </div>
                          
                          {/* Header */}
                          <div className="px-6 pb-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 text-center">Alterar Status</h3>
                            <p className="text-base text-gray-600 text-center mt-2 font-medium">
                              {selectedAppointment.client?.name || "Cliente"}
                            </p>
                          </div>

                          {/* Options */}
                          <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
                            {/* Opção Pendente */}
                            <button
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'pending')}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
                                selectedAppointment.status === 'pending'
                                  ? 'bg-orange-200 border-orange-300 shadow-md'
                                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white border border-gray-300 text-gray-700 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">
                                  P
                                </div>
                                <span className="font-bold text-gray-800 text-left text-lg">Marcar como Pendente</span>
                              </div>
                              {selectedAppointment.status === 'pending' && (
                                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* Opção Confirmado */}
                            <button
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
                                selectedAppointment.status === 'confirmed'
                                  ? 'bg-green-200 border-green-300 shadow-md'
                                  : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">
                                  ✓
                                </div>
                                <span className="font-bold text-gray-800 text-left text-lg">Marcar como Confirmado</span>
                              </div>
                              {selectedAppointment.status === 'confirmed' && (
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* Opção Concluído */}
                            <button
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
                                selectedAppointment.status === 'completed'
                                  ? 'bg-blue-200 border-blue-300 shadow-md'
                                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 text-blue-700 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">
                                  ✓
                                </div>
                                <span className="font-bold text-gray-800 text-left text-lg">Marcar como Concluído</span>
                              </div>
                              {selectedAppointment.status === 'completed' && (
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* Opção Cancelado */}
                            <button
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'canceled')}
                              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-md"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center text-base font-bold shadow-sm">
                                  ✗
                                </div>
                                <span className="font-bold text-red-600 text-left text-lg">Cancelar Agendamento</span>
                              </div>
                              <div className="w-8 h-8 bg-red-100 border border-red-300 text-red-600 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            </button>
                          </div>

                          {/* Footer com botão fechar */}
                          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
                            <button
                              onClick={() => setIsStatusMenuOpen(false)}
                              className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Overlay para fechar o menu */}
                      {isStatusMenuOpen && (
                        <div
                          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                          onClick={() => setIsStatusMenuOpen(false)}
                        ></div>
                      )}
                    </div>
                    </div>
                  )}
                  {/* Lista de Serviços - apenas para agendamentos normais */}
                  {selectedAppointment.status !== "free" && selectedAppointment.services && selectedAppointment.services.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 text-sm mb-2 block">
                        {selectedAppointment.services.length > 1 ? 'Serviços:' : 'Serviço:'}
                      </span>
                      <div className="space-y-2">
                        {selectedAppointment.services.map((service, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                            <span className="text-gray-800 font-medium text-sm">
                              {service.service_name}
                            </span>
                            <span className="text-emerald-600 font-semibold text-sm">
                              R$ {service.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 text-sm">
                        Observações:
                      </span>
                      <p className="text-gray-800 mt-1">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DrawerFooter className="pt-4 border-t border-gray-100 space-y-3">
            {/* Botão WhatsApp - apenas para agendamentos normais */}
            {selectedAppointment?.status !== "free" && selectedAppointment?.client?.phone_number && (
              <Button
                onClick={() => openWhatsApp(
                  selectedAppointment.client.phone_number,
                  selectedAppointment.client.name || "Cliente"
                )}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                  </svg>
                  <span>Enviar WhatsApp</span>
                </span>
              </Button>
            )}
            
            {/* Botão Cancelar Intervalo - apenas para intervalos livres */}
            {selectedAppointment?.status === "free" && (
              <Button
                onClick={() => {
                  if (selectedAppointment) {
                    updateAppointmentStatus(selectedAppointment.id, "canceled");
                  }
                }}
                disabled={isUpdatingStatus}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm"
              >
                {isUpdatingStatus ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Cancelando...</span>
                  </span>
                ) : (
                  <span>Cancelar Intervalo</span>
                )}
              </Button>
            )}
            
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Fechar</span>
                </span>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de Seleção de Intervalo */}
      <Drawer
        open={isIntervalDrawerOpen}
        onOpenChange={setIsIntervalDrawerOpen}
      >
        <DrawerContent className="max-h-[90vh] bg-white">
          {/* Header Modernizado */}
          <div className="text-center pb-6 pt-8 px-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-emerald-100 to-teal-100">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-emerald-800">Intervalo Livre</h2>
            <p className="text-emerald-700 mt-2">Crie um intervalo livre em uma data específica</p>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[70vh]">
            <form
              onSubmit={handleIntervalSubmit}
              className="px-6 py-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Professional ID (Hidden/Display Only) */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="professional_id"
                    className="text-sm font-semibold text-emerald-700 mb-2 block flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profissional
                  </Label>
                  <Input
                    id="professional_id"
                    type="text"
                    value={user?.name || "Usuário atual"}
                    disabled
                    className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed transition-all duration-200"
                  />
                </div>

                {/* Data Destacada */}
                <div className="md:col-span-2">
                  <div className="rounded-xl p-4 border-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-lg p-2 bg-emerald-100">
                          <svg
                            className="w-5 h-5 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-emerald-800 mb-2">
                            Data do Intervalo Livre
                          </p>
                          <Input
                            id="appointment_date"
                            type="date"
                            value={formIntervals.appointment_date}
                            onChange={(e) =>
                              handleIntervalFormChange(
                                "appointment_date",
                                e.target.value
                              )
                            }
                            className="border-2 border-emerald-200 focus:border-emerald-400 rounded-lg bg-white shadow-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Time */}
                <div>
                  <Label className="text-sm font-semibold text-emerald-700 mb-2 block flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Horário de Início
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <Select
                        value={formIntervals.start_time.split(":")[0] || ""}
                        onValueChange={(hour) => {
                          const minute =
                            formIntervals.start_time.split(":")[1] || "00";
                          handleIntervalFormChange(
                            "start_time",
                            `${hour}:${minute}`
                          );
                        }}
                      >
                        <SelectTrigger className="w-20 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm">
                          <SelectValue placeholder="13" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableHours().map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select
                      value={formIntervals.start_time.split(":")[1] || ""}
                      onValueChange={(minute) => {
                        const hour =
                          formIntervals.start_time.split(":")[0] || "00";
                        handleIntervalFormChange(
                          "start_time",
                          `${hour}:${minute}`
                        );
                      }}
                    >
                      <SelectTrigger className="w-20 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <Label className="text-sm font-semibold text-emerald-700 mb-2 block flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Horário Final
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <Select
                        value={formIntervals.end_time.split(":")[0] || ""}
                        onValueChange={(hour) => {
                          const minute =
                            formIntervals.end_time.split(":")[1] || "00";
                          handleIntervalFormChange(
                            "end_time",
                            `${hour}:${minute}`
                          );
                        }}
                      >
                        <SelectTrigger className="w-20 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm">
                          <SelectValue placeholder="17" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableHours().map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select
                      value={formIntervals.end_time.split(":")[1] || ""}
                      onValueChange={(minute) => {
                        const hour =
                          formIntervals.end_time.split(":")[0] || "00";
                        handleIntervalFormChange(
                          "end_time",
                          `${hour}:${minute}`
                        );
                      }}
                    >
                      <SelectTrigger className="w-20 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm">
                        <SelectValue placeholder="00" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Observações */}
                <div className="md:col-span-2 space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-semibold text-emerald-700 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m-7 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
                      />
                    </svg>
                    Motivo do Intervalo
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Informe o motivo do intervalo livre (opcional)"
                    value={formIntervals.notes}
                    onChange={(e) =>
                      handleIntervalFormChange("notes", e.target.value)
                    }
                    className="min-h-[80px] border-2 rounded-lg resize-none border-emerald-200 focus:border-emerald-400"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Action Buttons */}
          <DrawerFooter className="pt-6 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-b-lg">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={handleIntervalSubmit}
                disabled={isLoadingButton}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Confirmar Intervalo</span>
                </span>
              </Button>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Cancelar</span>
                  </span>
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
