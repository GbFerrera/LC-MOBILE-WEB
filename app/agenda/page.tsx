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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CircleX, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [lunchSlots, setLunchSlots] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingButton, setIsLoadingButton] = useState(false);

  // Estado do diálogo de agendamento
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do drawer de detalhes do agendamento
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

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

      console.log("Dados completos da API:", response.data);

      // A API agora retorna: { schedule: {...}, appointments: [...] }
      const appointments = response.data?.appointments || [];
      console.log("Agendamentos do dia:", appointments);
      setAppointments(appointments);
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

      // Calcular end_time baseado na duração total
      const endTime = new Date(date);
      endTime.setHours(
        parseInt(hours),
        parseInt(minutes) + totalDuration
      );
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
        services: selectedServices.map(service => ({
          service_id: parseInt(service.service_id?.toString() || service.service_id?.toString() || "0"),
          professional_id: user.id,
          quantity: quantity, // Adicionando a quantidade fixa como 1
        })),
      };

      console.log("Dados do agendamento:", appointmentData);

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

      toast.success("Agendamento criado com sucesso!");
      closeAppointmentDialog();

      // Recarregar os horários disponíveis
      fetchAppointments(user.id, date);
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
      } else {
        // Se não houver horários, retornamos array vazio
        setAvailableSlots([]);
        setLunchSlots([]);
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

  // Verifica se um slot deve ser exibido (não está no meio de um agendamento)
  const shouldShowSlot = (time: string) => {
    // Converte horário para minutos
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const currentTimeMinutes = timeToMinutes(time);

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
        containerClass: "bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 cursor-not-allowed shadow-md",
        timeClass: "text-orange-700",
        textClass: "text-orange-600",
        iconColor: "text-orange-500"
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
      timeZone: "UTC",
    };
    return new Date(date).toLocaleDateString("pt-BR", options);
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

  const formattedDate = formatDate(date);

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

    try {
      if (!formIntervals.start_time || !formIntervals.end_time) {
        toast.error("Por favor, preencha os horários de início e fim");
        return;
      }
      toast.success("Intervalo liberado com sucesso");
      await freeInterval();
      closeIntervalDrawer();

      if (user) {
        fetchAppointments(user.id, date);
      }
    } catch (error) {
      console.error("Erro ao configurar intervalo:", error);
      toast.error(error?.response?.data?.message || "Erro ao configurar intervalo");
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
            <div className="w-10"></div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {/* Renderizar slots disponíveis */}
                    {availableSlots
                      .filter(slot => shouldShowSlot(slot))
                      .map((slot) => {
                        const isBooked = isTimeSlotBooked(slot);
                        const isFree = isFreeInterval(slot);
                        const appointment = getAppointmentDetails(slot);
                        const freeInterval = getFreeIntervalDetails(slot);
                        const styles = getSlotStyles(slot);

                      return (
                        <div
                          key={slot}
                          className={`group relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${styles.containerClass}`}
                          onClick={
                            isBooked
                              ? () => {
                                  // Mostrar detalhes do agendamento no drawer
                                  if (appointment) {
                                    setSelectedAppointment(appointment);
                                    setIsDrawerOpen(true);
                                  }
                                }
                              : isFree
                              ? undefined // Intervalo livre não é clicável
                              : () => handleSlotClick(slot)
                          }
                          title={
                            isBooked
                              ? `Clique para ver detalhes - ${
                                  appointment?.client?.name || "Cliente"
                                }`
                              : isFree
                              ? "Horário de intervalo - Não disponível para agendamento"
                              : "Clique para agendar"
                          }
                        >
                          <div
                            className={`font-bold text-lg mb-1 ${styles.timeClass}`}
                          >
                            {slot}
                          </div>

                          {isBooked && appointment ? (
                            <>
                              <div className={`text-xs font-medium truncate mb-1 ${styles.textClass}`}>
                                {appointment.client?.name || "Cliente"}
                              </div>
                              <div className={`text-xs truncate mb-1 ${styles.iconColor}`}>
                                {appointment.services && appointment.services.length > 1 
                                  ? `${appointment.services.length} serviços`
                                  : appointment.services?.[0]?.service_name || "Serviço"
                                }
                              </div>
                              <div className={`flex items-center text-xs ${styles.iconColor}`}>
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                R$ {appointment.services?.[0]?.price || "0.00"}
                              </div>
                            </>
                          ) : isFree && freeInterval ? (
                            <>
                              <div className={`text-xs font-medium truncate mb-1 ${styles.textClass}`}>
                                Intervalo Livre
                              </div>
                              <div className={`text-xs truncate mb-1 ${styles.iconColor}`}>
                                {freeInterval.notes || "Intervalo"}
                              </div>
                              <div className={`flex items-center text-xs ${styles.iconColor}`}>
                                <CircleX className="mr-1" size={16} />
                                Bloqueado
                              </div>
                            </>
                          ) : !isBooked && !isFree ? (
                            <div className={`flex items-center text-xs font-medium ${styles.textClass}`}>
                              <svg
                                className="w-3 h-3 mr-1"
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
                              Disponível
                            </div>
                          ) : null}

                          {/* Hover effect indicator */}
                          {!isBooked && !isFree && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          )}
                          {isFree && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                Novo Agendamento
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Preencha os dados para criar um novo agendamento para{" "}
                <span className="font-semibold text-emerald-600">
                  {selectedSlot}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Data e Horário - Destacado */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
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
                    <div>
                      <p className="font-semibold text-emerald-800">
                        Data e Horário
                      </p>
                      <p className="text-emerald-700">
                        {date.toLocaleDateString("pt-BR")} às {selectedSlot}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente - Com busca */}
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

              {/* Serviços - Select com Dropdown Customizado */}
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

              {/* Observações */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
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
                      d="M7 8h10M7 12h4m-7 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
                    />
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
                    Salvando...
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
              {selectedAppointment?.client?.name || "Cliente"}
            </DrawerTitle>
            <DrawerDescription className="text-gray-600">
              {selectedAppointment?.services && selectedAppointment.services.length > 1 
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
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Telefone</span>
                    <span className="font-medium">
                      {selectedAppointment.client?.phone_number || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horário</span>
                    <span className="font-medium">
                      {selectedAppointment.start_time?.slice(0, 5)} -{" "}
                      {selectedAppointment.end_time?.slice(0, 5)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedAppointment.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : selectedAppointment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedAppointment.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedAppointment.status === "confirmed"
                        ? "Confirmado"
                        : selectedAppointment.status === "pending"
                        ? "Pendente"
                        : selectedAppointment.status === "completed"
                        ? "Concluído"
                        : "Cancelado"}
                    </span>
                  </div>

                  {/* Lista de Serviços */}
                  {selectedAppointment.services && selectedAppointment.services.length > 0 && (
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

          <DrawerFooter className="pt-4 border-t border-gray-100">
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
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    👤 Profissional
                  </Label>
                  <Input
                    id="professional_id"
                    type="text"
                    value={user?.name || "Usuário atual"}
                    disabled
                    className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed transition-all duration-200"
                  />
                </div>

                {/* Appointment Date */}
                <div>
                  <Label
                    htmlFor="appointment_date"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    📅 Data do Agendamento
                  </Label>
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
                    className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm"
                    required
                  />
                </div>

                {/* Start Time */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    🕐 Horário de Início
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
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    🕐 Horário de Fim
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

                {/* Notes */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    📝 Observações (opci)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Selecione o motivo do intervalo livre"
                    value={formIntervals.notes}
                    onChange={(e) =>
                      handleIntervalFormChange("notes", e.target.value)
                    }
                    className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-white shadow-sm min-h-[100px] resize-none"
                    rows={4}
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
