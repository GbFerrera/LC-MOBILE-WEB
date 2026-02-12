"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeftIcon,
  ClockIcon,
  LogOutIcon,
  ScissorsIcon,
  StoreIcon,
  PencilIcon,
  PlusIcon,
  CalendarOffIcon,
  CalendarDays,
  X,
  Calendar,
  Bell,
  BellOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

export default function AjustesPage() {
  const { user, updateUser, signOut } = useAuth();
  const router = useRouter();
  const { permission, isSupported, requestPermission, showNotification } = useNotifications();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceHoursDialogOpen, setIsServiceHoursDialogOpen] = useState(false);
  const [isCompanyDetailsDialogOpen, setIsCompanyDetailsDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isCreateServiceDialogOpen, setIsCreateServiceDialogOpen] = useState(false);
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isUpdatingService, setIsUpdatingService] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceHoursLoading, setServiceHoursLoading] = useState(false);
  const [companyDetailsLoading, setCompanyDetailsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isDayOffDialogOpen, setIsDayOffDialogOpen] = useState(false);
  const [selectedDayOffDate, setSelectedDayOffDate] = useState("");
  const [isCreatingDayOff, setIsCreatingDayOff] = useState(false);
  const [specificDayOffs, setSpecificDayOffs] = useState<string[]>([]);
  const [loadingDayOffs, setLoadingDayOffs] = useState(false);
  
  // Estados para intervalos livres
  const [isFreeIntervalDialogOpen, setIsFreeIntervalDialogOpen] = useState(false);
  const [selectedFreeIntervalDate, setSelectedFreeIntervalDate] = useState("");
  const [freeIntervalStartHour, setFreeIntervalStartHour] = useState("09");
  const [freeIntervalStartMinute, setFreeIntervalStartMinute] = useState("00");
  const [freeIntervalEndHour, setFreeIntervalEndHour] = useState("10");
  const [freeIntervalEndMinute, setFreeIntervalEndMinute] = useState("00");
  const [freeIntervalNotes, setFreeIntervalNotes] = useState("");
  const [isCreatingFreeInterval, setIsCreatingFreeInterval] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [serviceHours, setServiceHours] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone_number: "",
    position: "",
    password: ""
  });
  const [currentUserData, setCurrentUserData] = useState({
    name: user?.name || "Nome do profissional",
    email: user?.email || "email@dominio.com",
    phone_number: "",
    position: ""
  });
  const [newServiceForm, setNewServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: ""
  });

  const [editServiceForm, setEditServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: ""
  });

  // Horários padrão da semana (similar ao LC-FRONT)
  const defaultSchedules = [
    { day_of_week: 'Monday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Tuesday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Wednesday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Thursday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Friday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Saturday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
    { day_of_week: 'Sunday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: true }
  ];

  // Dados do barbeiro - agora usando estado local que pode ser atualizado
  const barberInfo = {
    name: currentUserData.name,
    businessName: companyDetails?.name,
    email: currentUserData.email || "email@exemplo.com",
    phone: currentUserData.phone_number || "(00) 00000-0000",
    avatarUrl: profilePhoto || "/barber-avatar.png",
  };

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

  // Fazer upload de foto de perfil
  const uploadProfilePhoto = async (base64Image: string) => {
    if (!user?.id) {
      toast.error("Usuário não identificado");
      return;
    }

    try {
      const response = await api.post(`/team-photos/${user.id}`, { base64Image }, {
        headers: {
          'company_id': user.company_id || '1'
        }
      });
      
      if (response.data?.photo_url) {
        setProfilePhoto(response.data.photo_url);
        toast.success("Foto de perfil atualizada com sucesso!");
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto de perfil:', error);
      toast.error(error.response?.data?.message || "Erro ao atualizar foto de perfil. Tente novamente.");
    }
  };

  // Buscar dados completos do usuário
  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(`/teams/${user.id}`);
      const userData = response.data;
      const userInfo = {
        name: userData.name || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        position: userData.position || ""
      };

      setEditForm({ ...userInfo, password: "" });
      setCurrentUserData(userInfo);

      if (userData.photo_url) {
        setProfilePhoto(userData.photo_url);
      }
    } catch (error: any) {
      console.log('Não foi possível buscar dados detalhados do usuário, usando dados do contexto de autenticação:', error.response?.status);
      // Usar dados do contexto de autenticação se a API falhar
      const fallbackData = {
        name: user.name || "",
        email: user.email || "",
        phone_number: "", // Não disponível no contexto
        position: "" // Não disponível no contexto
      };
      setEditForm({ ...fallbackData, password: "" });
      setCurrentUserData(fallbackData);
    }
  };

  // Effect para inicializar dados quando componente monta
  useEffect(() => {
    if (user?.id) {
      setCurrentUserData({
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        position: user.position || ""
      });
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        position: user.position || "",
        password: ""
      });
      
      // Carregar foto de perfil
      fetchProfilePhoto();
      
      // Carregar dias de folga específicos
      fetchSpecificDayOffs();
      viewDetailsCompany();
    }
  }, [user]);

  // Atualizar perfil
  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        position: editForm.position
      };

      // Só inclui senha se foi preenchida
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      // Adicionar headers necessários (company_id pode ser requerido)
      const config = {
        headers: {
          'company_id': user.company_id || '1' // Usa company_id do usuário ou fallback
        }
      };

      console.log('Tentando atualizar perfil:', { userId: user.id, updateData, headers: config.headers });

      const response = await api.put(`/teams/${user.id}`, updateData, config);

      toast.success("Perfil atualizado com sucesso!");
      setIsEditDialogOpen(false);

      // Atualizar dados no contexto de autenticação
      const updatedUserData = {
        name: editForm.name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        position: editForm.position
      };
      
      // Atualiza o contexto global (localStorage + state)
      updateUser(updatedUserData);
      
      // Atualizar dados locais também
      setCurrentUserData(updatedUserData);

      // Atualizar foto se vier na resposta
      if (response.data?.user?.photo_url) {
        setProfilePhoto(response.data.user.photo_url);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);

      // Melhor tratamento de erros
      if (error.response?.status === 404) {
        toast.error("Usuário não encontrado. Verifique se você tem permissão para editar este perfil.");
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Dados inválidos. Verifique os campos preenchidos.");
      } else {
        toast.error(error.response?.data?.message || "Erro ao atualizar perfil. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para controlar notificações PWA
  const handleNotificationToggle = async () => {
    if (!isSupported) {
      toast.error("Notificações não são suportadas neste dispositivo");
      return;
    }

    // Se já está ativado, informar como desativar
    if (permission === 'granted') {
      toast.info("Para desativar notificações, vá nas configurações do seu navegador/celular");
      return;
    }

    try {
      console.log('[Ajustes] Estado atual da permissão:', permission);
      console.log('[Ajustes] Solicitando permissão de notificação...');
      
      // Solicitar permissão diretamente (PWA nativo)
      // Isso vai abrir o popup nativo do Android/iOS
      const result = await Notification.requestPermission();
      console.log('[Ajustes] Resultado da permissão:', result);
      
      if (result === 'granted') {
        toast.success("Notificações ativadas com sucesso!");
        
        // Mostrar notificação de teste
        await showNotification({
          title: "Notificações Ativadas! 🎉",
          body: "Você receberá alertas de novos agendamentos",
          tag: "test-notification"
        });
      } else if (result === 'denied') {
        toast.error("Você negou a permissão. Para ativar, vá em Configurações > Notificações do seu celular");
      } else {
        toast.info("Permissão não concedida. Tente novamente");
      }
    } catch (error) {
      console.error('[Ajustes] Erro ao solicitar permissão:', error);
      toast.error("Erro ao solicitar permissão de notificações. Verifique se o app está instalado como PWA");
    }
  };

  // Configurações filtradas
  const settingButtons = [
    {
      id: "services",
      title: "Serviços e Preços",
      description: "Gerencie sua tabela de serviços",
      icon: ScissorsIcon,
      iconColor: "text-orange-600",
      bgColor: "bg-white",
    },
    {
      id: "schedule",
      title: "Horários de Atendimentos",
      description: "Defina seus horários de trabalho",
      icon: ClockIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-white",
    },
    {
      id: "business",
      title: "Dados da Barbearia",
      description: "Configure informações do negócio",
      icon: StoreIcon,
      iconColor: "text-emerald-600",
      bgColor: "bg-white",
    },
    {
      id: "notifications",
      title: "Notificações",
      description: permission === 'granted' 
        ? "Notificações ativadas" 
        : permission === 'denied'
          ? "Notificações bloqueadas"
          : "Receba alertas de novos agendamentos",
      icon: permission === 'granted' ? Bell : BellOff,
      iconColor: "text-purple-600",
      bgColor: "bg-white",
    },
  ];

  const handleLogout = () => {
    signOut();
    router.push("/Login");
  };

  // Buscar horários de funcionamento do usuário
  const fetchServiceHours = async () => {
    if (!user?.id) {
      toast.error("Usuário não identificado");
      return;
    }

    setServiceHoursLoading(true);
    try {
      const response = await api.get(`/schedules/${user.id}`, {
        headers: {
          company_id: user?.company_id
        }
      });
      
      if (!response.data.hasSchedule) {
        setServiceHours([]);
      } else {
        // Organizar os horários por dia da semana (similar ao LC-FRONT)
        const schedules = [...defaultSchedules];
        response.data.schedules.forEach((schedule: any) => {
          const index = schedules.findIndex(s => s.day_of_week === schedule.day_of_week);
          if (index !== -1) {
            schedules[index] = {
              ...schedule,
              // Se for dia de folga, mantém os horários como null
              start_time: schedule.is_day_off ? null : (schedule.start_time || "09:00"),
              end_time: schedule.is_day_off ? null : (schedule.end_time || "18:00"),
              // Preservar os valores nulos para os horários de almoço
              lunch_start_time: schedule.is_day_off ? null : schedule.lunch_start_time,
              lunch_end_time: schedule.is_day_off ? null : schedule.lunch_end_time
            };
          }
        });
        setServiceHours(schedules);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setServiceHours([]);
      } else {
        console.error('Erro ao buscar horários:', error);
        toast.error("Erro ao carregar horários de serviço");
      }
    } finally {
      setServiceHoursLoading(false);
    }
  };

  // Abrir modal de horários de funcionamento
  const handleScheduleClick = () => {
    setIsServiceHoursDialogOpen(true);
    fetchServiceHours();
  };

  // Formatar dia da semana
  const formatDayOfWeek = (dayOfWeek: string | number) => {
    // Se for string (como vem da API)
    if (typeof dayOfWeek === 'string') {
      const dayMap: { [key: string]: string } = {
        'Sunday': 'Domingo',
        'Monday': 'Segunda-feira',
        'Tuesday': 'Terça-feira',
        'Wednesday': 'Quarta-feira',
        'Thursday': 'Quinta-feira',
        'Friday': 'Sexta-feira',
        'Saturday': 'Sábado'
      };
      return dayMap[dayOfWeek] || dayOfWeek;
    }
    // Se for número (fallback)
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek] || 'N/A';
  };

  // Ordenar horários por dia da semana
  const sortSchedulesByDay = (schedules: any[]) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return schedules.sort((a, b) => {
      if (a.day_of_week && b.day_of_week) {
        return dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
      }
      return 0;
    });
  };

  // Formatar hora
  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    return time.substring(0, 5); // Remove seconds if present
  };

  // Buscar detalhes da empresa
  const viewDetailsCompany = async () => {
    if (!user?.company_id) {
      toast.error("ID da empresa não identificado");
      return;
    }

    setCompanyDetailsLoading(true);
    try {
      const response = await api.get(`/companies/details`, {
        headers: {
          company_id: user?.company_id
        }
      });
      setCompanyDetails(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da empresa:', error);
      toast.error("Erro ao carregar detalhes da empresa");
    } finally {
      setCompanyDetailsLoading(false);
    }
  };

  // Abrir modal de detalhes da empresa
  const handleCompanyDetailsClick = () => {
    setIsCompanyDetailsDialogOpen(true);
    viewDetailsCompany();
  };

  // Buscar serviços da empresa
  const fetchServices = async () => {
    if (!user?.company_id) {
      toast.error("ID da empresa não identificado");
      return;
    }

    setServicesLoading(true);
    try {
      const response = await api.get(`/team-services/professional/${user.id}`, {
        headers: {
          company_id: user?.company_id
        }
      });
      setServices(response.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar serviços:', error);
      toast.error("Erro ao carregar serviços");
    } finally {
      setServicesLoading(false);
    }
  };

  // Abrir modal de serviços
  const handleServicesClick = () => {
    setIsServicesDialogOpen(true);
    fetchServices();
  };

  // Formatar preço em reais
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numPrice || 0);
  };

  // Formatar duração em minutos
  const formatDuration = (duration: number) => {
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
    return `${duration}min`;
  };

  // Buscar dias de folga específicos
  const fetchSpecificDayOffs = async () => {
    if (!user?.id || !user?.company_id) return;
    
    setLoadingDayOffs(true);
    try {
      const response = await api.get(`/schedules/specific-days/${user.id}`, {
        headers: {
          company_id: user.company_id
        },
        params: {
          is_day_off: true
        }
      });

      // Extrair as datas dos dias de folga específicos
      const dayOffs = response.data.map((item: any) => item.date);
      setSpecificDayOffs(dayOffs);
    } catch (error) {
      console.error("Erro ao buscar dias de folga específicos:", error);
      setSpecificDayOffs([]);
    } finally {
      setLoadingDayOffs(false);
    }
  };

  // Remover um dia de folga específico
  const handleRemoveSpecificDayOff = async (date: string) => {
    if (!user?.id || !user?.company_id) return;
    
    try {
      await api.delete(`/schedules/specific-day-off/${user.id}`, {
        headers: {
          company_id: user.company_id
        },
        params: {
          date: date
        }
      });
      
      // Atualizar a lista de dias de folga
      setSpecificDayOffs(specificDayOffs.filter(d => d !== date));
      toast.success("Dia de folga removido com sucesso!");
      
      // Recarregar os dias de folga
      fetchSpecificDayOffs();
    } catch (error) {
      console.error("Erro ao remover dia de folga:", error);
      toast.error("Erro ao remover dia de folga");
    }
  };

  // Criar dia de folga
  const handleCreateDayOff = async () => {
    if (!user?.id || !user?.company_id) {
      toast.error("Usuário ou empresa não identificados");
      return;
    }

    if (!selectedDayOffDate) {
      toast.error("Selecione uma data para a folga");
      return;
    }

    // Verificar se a data já existe na lista de dias de folga
    if (specificDayOffs.includes(selectedDayOffDate)) {
      toast.error("Esta data já está cadastrada como dia de folga!");
      setSelectedDayOffDate("");
      return;
    }

    setIsCreatingDayOff(true);
    try {
      // Usar a mesma lógica do LC-FRONT que está funcionando
      const dayOffData = {
        professional_id: user.id,
        date: selectedDayOffDate
      };

      await api.post('/schedules/day-off', dayOffData, {
        headers: {
          company_id: user?.company_id
        }
      });

      // Atualizar a lista de dias de folga
      setSpecificDayOffs([...specificDayOffs, selectedDayOffDate]);
      toast.success("Dia de folga adicionado com sucesso!");
      setIsDayOffDialogOpen(false);
      setSelectedDayOffDate("");
      
      // Recarregar os horários e folgas
      fetchServiceHours();
      fetchSpecificDayOffs();
    } catch (error: any) {
      console.error('Erro ao criar dia de folga:', error);
      
      // Melhor tratamento de erro baseado no LC-FRONT
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Erro ao adicionar dia de folga");
      }
    } finally {
      setIsCreatingDayOff(false);
    }
  };

  // Função para atualizar horários semanais (similar ao LC-FRONT)
  const handleScheduleUpdate = async (schedules: any[]) => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const schedulesToSend = schedules.map(schedule => {
        // Se for dia de folga, todos os horários são null
        if (schedule.is_day_off) {
          return {
            ...schedule,
            start_time: null,
            end_time: null,
            lunch_start_time: null,
            lunch_end_time: null
          };
        }
        
        // Se não for dia de folga, mas não tiver horário de almoço
        if (!schedule.lunch_start_time && !schedule.lunch_end_time) {
          return {
            ...schedule,
            start_time: schedule.start_time || "09:00",
            end_time: schedule.end_time || "18:00",
            lunch_start_time: null,
            lunch_end_time: null
          };
        }
        
        // Caso normal: tem horário de trabalho e almoço
        return {
          ...schedule,
          start_time: schedule.start_time || "09:00",
          end_time: schedule.end_time || "18:00",
          lunch_start_time: schedule.lunch_start_time || "12:00",
          lunch_end_time: schedule.lunch_end_time || "13:00"
        };
      });

      await api.post(`/schedules`, {
        professional_id: user.id,
        schedules: schedulesToSend
      }, {
        headers: {
          company_id: user?.company_id,
        },
      });
      toast.success("Cronograma atualizado com sucesso!");
      
      // Recarregar os horários após atualização
      fetchServiceHours();
    } catch (error) {
      console.error("Erro ao atualizar cronograma:", error);
      toast.error("Erro ao atualizar cronograma");
    } finally {
      setSaving(false);
    }
  };

  // Função para toggle de dias de folga semanais (similar ao LC-FRONT)
  const handleDayOffToggle = async (day: string, checked: boolean) => {
    if (!serviceHours || serviceHours.length === 0) {
      // Se não há horários, criar com os padrões
      const newSchedules = defaultSchedules.map((schedule: any) => {
        if (schedule.day_of_week === day) {
          return {
            ...schedule,
            is_day_off: checked,
            start_time: checked ? null : "09:00",
            end_time: checked ? null : "18:00",
            lunch_start_time: checked ? null : "12:00",
            lunch_end_time: checked ? null : "13:00"
          };
        }
        return schedule;
      });
      
      setServiceHours(newSchedules);
      handleScheduleUpdate(newSchedules);
      return;
    }

    const newSchedules = serviceHours.map((schedule: any) => {
      if (schedule.day_of_week === day) {
        return {
          ...schedule,
          is_day_off: checked,
          start_time: checked ? null : "09:00",
          end_time: checked ? null : "18:00",
          lunch_start_time: checked ? null : "12:00",
          lunch_end_time: checked ? null : "13:00"
        };
      }
      return schedule;
    });

    setServiceHours(newSchedules);
    handleScheduleUpdate(newSchedules);
  };

  // Função para atualizar horários separadamente (início/fim/almoço)
  const handleTimeChange = (day: string, field: 'start_time' | 'end_time' | 'lunch_start_time' | 'lunch_end_time', value: string) => {
    if (!serviceHours || serviceHours.length === 0) return;

    const newSchedules = serviceHours.map((schedule: any) => {
      if (schedule.day_of_week === day && !schedule.is_day_off) {
        return {
          ...schedule,
          [field]: value
        };
      }
      return schedule;
    });

    setServiceHours(newSchedules);
    handleScheduleUpdate(newSchedules);
  };

  // Função para manipular a mudança de horário com horas e minutos separados
  const handleSeparateTimeChange = (day: string, field: 'start_time' | 'end_time' | 'lunch_start_time' | 'lunch_end_time', hour: string, minute: string) => {
    const formattedTime = `${hour}:${minute}`;
    handleTimeChange(day, field, formattedTime);
  };

  // Função para toggle de horário de almoço
  const handleLunchToggle = (day: string, checked: boolean) => {
    if (!serviceHours || serviceHours.length === 0) return;

    const newSchedules = serviceHours.map((schedule: any) => {
      if (schedule.day_of_week === day && !schedule.is_day_off) {
        return {
          ...schedule,
          lunch_start_time: checked ? "12:00" : null,
          lunch_end_time: checked ? "13:00" : null
        };
      }
      return schedule;
    });

    setServiceHours(newSchedules);
    handleScheduleUpdate(newSchedules);
  };

  // Função para criar intervalo livre
  const handleCreateFreeInterval = async () => {
    if (!user?.id || !user?.company_id) {
      toast.error("Usuário ou empresa não identificados");
      return;
    }

    if (!selectedFreeIntervalDate || !freeIntervalStartHour || !freeIntervalStartMinute || !freeIntervalEndHour || !freeIntervalEndMinute) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCreatingFreeInterval(true);
    try {
      const freeIntervalData = {
        professional_id: user.id,
        appointment_date: selectedFreeIntervalDate,
        start_time: `${freeIntervalStartHour}:${freeIntervalStartMinute}`,
        end_time: `${freeIntervalEndHour}:${freeIntervalEndMinute}`,
        notes: freeIntervalNotes
      };

      await api.post('/schedules/free-interval', freeIntervalData, {
        headers: {
          company_id: user.company_id
        }
      });

      toast.success("Intervalo livre criado com sucesso!");
      setIsFreeIntervalDialogOpen(false);
      setSelectedFreeIntervalDate("");
      setFreeIntervalStartHour("09");
      setFreeIntervalStartMinute("00");
      setFreeIntervalEndHour("10");
      setFreeIntervalEndMinute("00");
      setFreeIntervalNotes("");
      
      // Recarregar os horários
      fetchServiceHours();
    } catch (error: any) {
      console.error('Erro ao criar intervalo livre:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erro ao criar intervalo livre");
      }
    } finally {
      setIsCreatingFreeInterval(false);
    }
  };

  // Função para criar cronograma inicial se não existir
  const handleCreateSchedule = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      await api.post(`/schedules`, {
        professional_id: user.id,
        schedules: defaultSchedules
      }, {
        headers: {
          company_id: user?.company_id,
        },
      });
      
      setServiceHours(defaultSchedules);
      toast.success("Cronograma criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar cronograma:", error);
      toast.error("Erro ao criar cronograma");
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de edição de serviço
  const handleEditServiceClick = (service: any) => {
    setSelectedService(service);
    setEditServiceForm({
      name: service.service_name,
      description: service.service_description || "",
      price: service.base_price.toString(),
      duration: service.base_duration.toString()
    });
    setIsEditServiceDialogOpen(true);
  };

  // Atualizar serviço existente
  const handleUpdateService = async () => {
    if (!selectedService || !user?.company_id) {
      toast.error("Dados do serviço ou empresa não identificados");
      return;
    }

    if (!editServiceForm.name || !editServiceForm.price || !editServiceForm.duration) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsUpdatingService(true);
    try {
      const serviceData = {
        name: editServiceForm.name,
        description: editServiceForm.description,
        price: parseFloat(editServiceForm.price),
        duration: parseInt(editServiceForm.duration)
      };

      await api.put(`/service/${selectedService.service_id}`, serviceData, {
        headers: {
          company_id: user.company_id
        }
      });

      toast.success("Serviço atualizado com sucesso!");
      setIsEditServiceDialogOpen(false);
      
      // Recarregar a lista de serviços
      fetchServices();
    } catch (error: any) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error(error.response?.data?.error || "Erro ao atualizar serviço");
    } finally {
      setIsUpdatingService(false);
    }
  };

  // Criar novo serviço
  const handleCreateService = async () => {
    if (!user?.company_id) {
      toast.error("ID da empresa não identificado");
      return;
    }

    if (!newServiceForm.name || !newServiceForm.price || !newServiceForm.duration) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCreatingService(true);
    try {
      // 1. Criar o serviço
      const serviceData = {
        name: newServiceForm.name,
        description: newServiceForm.description,
        price: parseFloat(newServiceForm.price),
        duration: parseInt(newServiceForm.duration)
      };

      const serviceResponse = await api.post('/service', serviceData, {
        headers: {
          company_id: user.company_id
        }
      });

      console.log('Serviço criado:', serviceResponse.data);

      // 2. Pegar dados do profissional do localStorage
      const userDataString = localStorage.getItem('@linkCallendar:user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const professionalId = userData.id;

        console.log('Dados do usuário do localStorage:', userData);
        console.log('ID do profissional:', professionalId);

        // 3. Vincular o serviço ao profissional
        if (professionalId && serviceResponse.data?.id) {
          // Garantir que temos um ID válido do serviço
          const serviceId = typeof serviceResponse.data.id === 'object' 
            ? serviceResponse.data.id.id  // Se for um objeto {id: X}, pega o valor de X
            : serviceResponse.data.id;    // Se for um valor direto, usa ele mesmo

          console.log('Vinculando serviço ao profissional:', {
            team_id: professionalId,
            service_id: serviceId
          });

          try {
            const teamServiceResponse = await api.post("/team-services", {
              links: [{
                team_id: professionalId,
                service_id: Number(serviceId)
              }]
            }, {
              headers: {
                company_id: user.company_id
              }
            });

            console.log('Serviço vinculado ao profissional:', teamServiceResponse.data);
            toast.success("Serviço criado e vinculado ao seu perfil com sucesso!");
          } catch (linkError: any) {
            console.error('Erro ao vincular serviço ao profissional:', linkError);
            toast.success("Serviço criado, mas houve erro ao vincular ao seu perfil");
          }
        } else {
          console.warn('ID do profissional ou serviço não encontrado para vinculação');
          toast.success("Serviço criado com sucesso!");
        }
      } else {
        console.warn('Dados do usuário não encontrados no localStorage');
        toast.success("Serviço criado com sucesso!");
      }

      setIsCreateServiceDialogOpen(false);
      setNewServiceForm({ name: "", description: "", price: "", duration: "" });
      
      // Recarregar a lista de serviços
      fetchServices();
    } catch (error: any) {
      console.error('Erro ao criar serviço:', error);
      toast.error(error.response?.data?.error || "Erro ao criar serviço");
    } finally {
      setIsCreatingService(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="p-2 rounded-md text-[#3D583F] hover:bg-[#3D583F]/10">
              <ChevronLeftIcon className="h-7 w-7" />
            </Link>
            <h1 className="font-bold text-2xl tracking-wide">Ajustes</h1>
            <div className="w-7"></div>
          </div>
        </div>
      </header>

      <div className="border-b relative pb-20 text-white" style={{ backgroundColor: "#3D583F" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <Image src="/favicon.png" alt="" width={160} height={160} className="absolute top-6 left-8 opacity-20 rotate-12" aria-hidden />
          <Image src="/favicon.png" alt="" width={96} height={96} className="absolute top-14 right-16 opacity-15 -rotate-6" aria-hidden />
          <Image src="/favicon.png" alt="" width={200} height={200} className="absolute bottom-16 right-10 opacity-25 rotate-3" aria-hidden />
          <Image src="/favicon.png" alt="" width={120} height={120} className="absolute bottom-8 left-1/4 opacity-20 -rotate-3" aria-hidden />
          <Image src="/favicon.png" alt="" width={80} height={80} className="absolute top-1/2 left-10 -translate-y-1/2 opacity-10 rotate-6" aria-hidden />
          <Image src="/favicon.png" alt="" width={140} height={140} className="absolute top-24 right-1/4 opacity-20 rotate-12" aria-hidden />
          <Image src="/favicon.png" alt="" width={64} height={64} className="absolute bottom-6 right-1/3 opacity-15 -rotate-12" aria-hidden />
 

        </div>
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="flex items-start justify-end mb-4">
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-md border border-white bg-white bg-[#3D583F] hover:bg-white/10"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] w-[48vh] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                        Atualize suas informações pessoais.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nome
                        </Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Nova Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                          className="col-span-3"
                          placeholder="Deixe vazio para manter atual"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="bg-[#3D583F] hover:bg-[#365137] text-white"
                      >
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Services Dialog */}
                <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
                  <DialogContent className="z-[1000] w-[95vw] sm:w-[90vw] max-w-3xl border border-gray-200 shadow-xl bg-white rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-orange-100 rounded-2xl flex-shrink-0">
                            <ScissorsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                          </div>
                          <div className="min-w-0">
                            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                              Serviços e Preços
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1">
                              Gerencie seus serviços oferecidos
                            </DialogDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => setIsCreateServiceDialogOpen(true)}
                          size="sm"
                          className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md px-3 sm:px-4 py-2 w-full sm:w-auto text-sm"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Novo Serviço
                        </Button>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 sm:py-6">
                      {servicesLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-600 text-sm sm:text-base">Carregando serviços...</p>
                        </div>
                      ) : services.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {services.map((service, index) => (
                            <div key={service.id || index} className="group">
                              <div className="bg-white border border-[#3D583F]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-md transition-all duration-300 hover:border-[#3D583F]/30">
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <div className="w-3 h-3 bg-[#3D583F] rounded-full mt-1 sm:mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                                      {service.service_name}
                                    </h3>
                                    {service.service_description && (
                                      <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                                        {service.service_description}
                                      </p>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                      <div className="flex items-center gap-2 bg-[#3D583F]/10 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                                        <span className="text-[#3D583F] font-medium text-xs sm:text-sm">
                                          {formatPrice(service.base_price)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 bg-[#3D583F]/10 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                                        <span className="text-[#3D583F] font-medium text-xs sm:text-sm">
                                          {formatDuration(service.base_duration)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleEditServiceClick(service)}
                                    size="sm"
                                    variant="outline"
                                    className="border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10 w-full sm:w-auto mt-2 sm:mt-0 text-xs sm:text-sm"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ScissorsIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço cadastrado</h3>
                          <p className="text-gray-600 mb-6 max-w-sm mx-auto">Adicione seus serviços para começar a gerenciar agendamentos</p>
                          <Button
                            onClick={() => setIsCreateServiceDialogOpen(true)}
                            className="bg-[#3D583F] hover:bg-[#365137] text-white rounded-md"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Criar Primeiro Serviço
                          </Button>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => setIsServicesDialogOpen(false)}
                        variant="outline"
                        className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Fechar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Service Dialog */}
                <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
                  <DialogContent className="z-[1000] w-[95vw] sm:w-[90vw] max-w-md border-none shadow-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-[#3D583F]/10 rounded-xl shadow-lg">
                          <PencilIcon className="h-6 w-6 text-[#3D583F]" />
                        </div>
                        Editar Serviço
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Atualize as informações do serviço
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">                        
                        <div>
                          <Label htmlFor="edit-service-name" className="text-sm font-medium text-gray-700 mb-2 block">
                            Nome do Serviço *
                          </Label>
                          <Input
                            id="edit-service-name"
                            placeholder="Ex: Corte de Cabelo"
                            value={editServiceForm.name}
                            onChange={(e) => setEditServiceForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-service-description" className="text-sm font-medium text-gray-700 mb-2 block">
                            Descrição
                          </Label>
                          <Input
                            id="edit-service-description"
                            placeholder="Ex: Corte masculino com máquina e tesoura"
                            value={editServiceForm.description}
                            onChange={(e) => setEditServiceForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-service-price" className="text-sm font-medium text-gray-700 mb-2 block">
                              Preço (R$) *
                            </Label>
                            <Input
                              id="edit-service-price"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="30.00"
                              value={editServiceForm.price}
                              onChange={(e) => setEditServiceForm(prev => ({ ...prev, price: e.target.value }))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-service-duration" className="text-sm font-medium text-gray-700 mb-2 block">
                              Duração (min) *
                            </Label>
                            <Input
                              id="edit-service-duration"
                              type="number"
                              min="1"
                              placeholder="30"
                              value={editServiceForm.duration}
                              onChange={(e) => setEditServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-4 sm:pt-6 border-t border-gray-100 flex-col sm:flex-row gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditServiceDialogOpen(false);
                          setSelectedService(null);
                        }}
                        disabled={isUpdatingService}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUpdateService}
                        disabled={isUpdatingService}
                        className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                      >
                        {isUpdatingService ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Atualizando...
                          </>
                        ) : (
                          <>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Atualizar Serviço
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Create Service Dialog */}
                <Dialog open={isCreateServiceDialogOpen} onOpenChange={setIsCreateServiceDialogOpen}>
                  <DialogContent className="z-[1000] w-[95vw] sm:w-[90vw] max-w-md border-none shadow-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-[#3D583F]/10 rounded-xl shadow-lg">
                          <PlusIcon className="h-6 w-6 text-[#3D583F]" />
                        </div>
                        Criar Novo Serviço
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Adicione um novo serviço à sua barbearia
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">                        <div>
                          <Label htmlFor="service-name" className="text-sm font-medium text-gray-700 mb-2 block">
                            Nome do Serviço *
                          </Label>
                          <Input
                            id="service-name"
                            placeholder="Ex: Corte de Cabelo"
                            value={newServiceForm.name}
                            onChange={(e) => setNewServiceForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Label htmlFor="service-description" className="text-sm font-medium text-gray-700 mb-2 block">
                            Descrição
                          </Label>
                          <Input
                            id="service-description"
                            placeholder="Ex: Corte masculino com máquina e tesoura"
                            value={newServiceForm.description}
                            onChange={(e) => setNewServiceForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="service-price" className="text-sm font-medium text-gray-700 mb-2 block">
                              Preço (R$) *
                            </Label>
                            <Input
                              id="service-price"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="30.00"
                              value={newServiceForm.price}
                              onChange={(e) => setNewServiceForm(prev => ({ ...prev, price: e.target.value }))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label htmlFor="service-duration" className="text-sm font-medium text-gray-700 mb-2 block">
                              Duração (min) *
                            </Label>
                            <Input
                              id="service-duration"
                              type="number"
                              min="1"
                              placeholder="30"
                              value={newServiceForm.duration}
                              onChange={(e) => setNewServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-4 sm:pt-6 border-t border-gray-100 flex-col sm:flex-row gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateServiceDialogOpen(false);
                          setNewServiceForm({ name: "", description: "", price: "", duration: "" });
                        }}
                        disabled={isCreatingService}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateService}
                        disabled={isCreatingService}
                        className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                      >
                        {isCreatingService ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Criando...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Criar Serviço
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Service Hours Dialog */}
                <Dialog open={isServiceHoursDialogOpen} onOpenChange={setIsServiceHoursDialogOpen}>
                  <DialogContent className="z-[1000] sm:max-w-4xl border border-gray-200 shadow-xl bg-white w-[95vw] sm:w-[90vw] rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-100">
                      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-[#3D583F]/10 rounded-2xl">
                            <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#3D583F]" />
                          </div>
                          <div>
                            <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900">
                              Horários de Trabalho
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1">
                              Configure seus dias e horários de funcionamento
                            </DialogDescription>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => setIsFreeIntervalDialogOpen(true)}
                            size="sm"
                            variant="outline"
                            className="rounded-md border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10 px-3 sm:px-4 py-2 text-sm"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Intervalo Livre
                          </Button>
                          <Button
                            onClick={() => setIsDayOffDialogOpen(true)}
                            size="sm"
                            className="bg-[#3D583F] hover:bg-[#365137] text-white rounded-md px-3 sm:px-4 py-2 text-sm"
                          >
                            <CalendarOffIcon className="h-4 w-4 mr-2" />
                            Nova Folga
                          </Button>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-2 sm:px-0">
                      {serviceHoursLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-600">Carregando horários...</p>
                        </div>
                      ) : serviceHours.length > 0 ? (
                        <div className="space-y-6">
                          {/* Horários Semanais */}
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                              <h3 className="text-xl font-semibold text-gray-900">Dias da Semana</h3>
                            </div>
                            <div className="grid gap-4">
                              {sortSchedulesByDay(serviceHours.filter(s => s.day_of_week)).map((schedule, index) => (
                                <div key={index} className="group">
                                  <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${
                                    schedule.is_day_off
                                      ? 'border-red-200 hover:border-red-300'
                                      : 'border-[#3D583F]/20 hover:border-[#3D583F]/30'
                                    }`}>
                                    {/* Header do dia */}
                                    <div className="p-4 sm:p-6 border-b border-gray-100">
                                      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                          <div className={`w-3 h-3 rounded-full ${
                                            schedule.is_day_off ? 'bg-red-500' : 'bg-[#3D583F]'
                                          }`}></div>
                                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                            {formatDayOfWeek(schedule.day_of_week)}
                                          </h4>
                                        </div>
                                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                                          <span className="text-sm text-gray-600">Dia de folga</span>
                                          <Switch
                                            checked={schedule.is_day_off || false}
                                            onCheckedChange={(checked) => handleDayOffToggle(schedule.day_of_week, checked)}
                                            disabled={saving}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Conteúdo do dia */}
                                    {schedule.is_day_off ? (
                                      <div className="p-4 sm:p-6">
                                        <div className="bg-red-50 rounded-xl p-4">
                                          <p className="text-red-700 font-medium text-center">
                                            🏖️ Dia de descanso
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 sm:p-6 space-y-4">
                                        {/* Horários de Trabalho */}
                                        <div className="bg-[#3D583F]/10 rounded-xl p-4">
                                          <h5 className="text-[#3D583F] font-medium mb-3 flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4" />
                                            Horário de Trabalho
                                          </h5>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {/* Horário de Início */}
                                            <div>
                                              <label className="block text-xs font-medium text-[#3D583F] mb-2">
                                                Início
                                              </label>
                                              <div className="flex gap-1">
                                                <select
                                                  value={schedule.start_time ? schedule.start_time.split(':')[0] : "09"}
                                                  onChange={(e) => handleSeparateTimeChange(
                                                    schedule.day_of_week, 
                                                    "start_time", 
                                                    e.target.value, 
                                                    schedule.start_time ? schedule.start_time.split(':')[1] : "00"
                                                  )}
                                                  disabled={saving}
                                                  className="flex-1 p-2 text-sm border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white min-w-0"
                                                >
                                                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                                    <option key={hour} value={hour.toString().padStart(2, '0')}>
                                                      {hour.toString().padStart(2, '0')}
                                                    </option>
                                                  ))}
                                                </select>
                                                <span className="text-[#3D583F] self-center px-1">:</span>
                                                <select
                                                  value={schedule.start_time ? schedule.start_time.split(':')[1] : "00"}
                                                  onChange={(e) => handleSeparateTimeChange(
                                                    schedule.day_of_week, 
                                                    "start_time", 
                                                    schedule.start_time ? schedule.start_time.split(':')[0] : "09", 
                                                    e.target.value
                                                  )}
                                                  disabled={saving}
                                                  className="flex-1 p-2 text-sm border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white min-w-0"
                                                >
                                                  <option value="00">00</option>
                                                  <option value="15">15</option>
                                                  <option value="30">30</option>
                                                  <option value="45">45</option>
                                                </select>
                                              </div>
                                            </div>

                                            {/* Horário de Fim */}
                                            <div>
                                              <label className="block text-xs font-medium text-[#3D583F] mb-2">
                                                Fim
                                              </label>
                                              <div className="flex gap-1">
                                                <select
                                                  value={schedule.end_time ? schedule.end_time.split(':')[0] : "18"}
                                                  onChange={(e) => handleSeparateTimeChange(
                                                    schedule.day_of_week, 
                                                    "end_time", 
                                                    e.target.value, 
                                                    schedule.end_time ? schedule.end_time.split(':')[1] : "00"
                                                  )}
                                                  disabled={saving}
                                                  className="flex-1 p-2 text-sm border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white min-w-0"
                                                >
                                                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                                    <option key={hour} value={hour.toString().padStart(2, '0')}>
                                                      {hour.toString().padStart(2, '0')}
                                                    </option>
                                                  ))}
                                                </select>
                                                <span className="text-[#3D583F] self-center px-1">:</span>
                                                <select
                                                  value={schedule.end_time ? schedule.end_time.split(':')[1] : "00"}
                                                  onChange={(e) => handleSeparateTimeChange(
                                                    schedule.day_of_week, 
                                                    "end_time", 
                                                    schedule.end_time ? schedule.end_time.split(':')[0] : "18", 
                                                    e.target.value
                                                  )}
                                                  disabled={saving}
                                                  className="flex-1 p-2 text-sm border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white min-w-0"
                                                >
                                                  <option value="00">00</option>
                                                  <option value="15">15</option>
                                                  <option value="30">30</option>
                                                  <option value="45">45</option>
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Horário de Almoço */}
                                        <div className="bg-amber-50 rounded-xl p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-amber-800 font-medium flex items-center gap-2">
                                              🍽️ Horário de Almoço
                                            </h5>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-amber-700">
                                                {!!(schedule.lunch_start_time || schedule.lunch_end_time) ? "Ativado" : "Desativado"}
                                              </span>
                                              <Switch
                                                checked={!!(schedule.lunch_start_time || schedule.lunch_end_time)}
                                                onCheckedChange={(checked) => handleLunchToggle(schedule.day_of_week, checked)}
                                                disabled={saving}
                                                className="data-[state=checked]:bg-amber-600"
                                              />
                                            </div>
                                          </div>

                                          {!!(schedule.lunch_start_time || schedule.lunch_end_time) ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                              {/* Início do Almoço */}
                                              <div>
                                                <label className="block text-xs font-medium text-amber-700 mb-2">
                                                  Início do Almoço
                                                </label>
                                                <div className="flex gap-1">
                                                  <select
                                                    value={schedule.lunch_start_time ? schedule.lunch_start_time.split(':')[0] : "12"}
                                                    onChange={(e) => handleSeparateTimeChange(
                                                      schedule.day_of_week, 
                                                      "lunch_start_time", 
                                                      e.target.value, 
                                                      schedule.lunch_start_time ? schedule.lunch_start_time.split(':')[1] : "00"
                                                    )}
                                                    disabled={saving}
                                                    className="flex-1 p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white min-w-0"
                                                  >
                                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                                      <option key={hour} value={hour.toString().padStart(2, '0')}>
                                                        {hour.toString().padStart(2, '0')}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  <span className="text-amber-600 self-center px-1">:</span>
                                                  <select
                                                    value={schedule.lunch_start_time ? schedule.lunch_start_time.split(':')[1] : "00"}
                                                    onChange={(e) => handleSeparateTimeChange(
                                                      schedule.day_of_week, 
                                                      "lunch_start_time", 
                                                      schedule.lunch_start_time ? schedule.lunch_start_time.split(':')[0] : "12", 
                                                      e.target.value
                                                    )}
                                                    disabled={saving}
                                                    className="flex-1 p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white min-w-0"
                                                  >
                                                    <option value="00">00</option>
                                                    <option value="15">15</option>
                                                    <option value="30">30</option>
                                                    <option value="45">45</option>
                                                  </select>
                                                </div>
                                              </div>

                                              {/* Fim do Almoço */}
                                              <div>
                                                <label className="block text-xs font-medium text-amber-700 mb-2">
                                                  Fim do Almoço
                                                </label>
                                                <div className="flex gap-1">
                                                  <select
                                                    value={schedule.lunch_end_time ? schedule.lunch_end_time.split(':')[0] : "13"}
                                                    onChange={(e) => handleSeparateTimeChange(
                                                      schedule.day_of_week, 
                                                      "lunch_end_time", 
                                                      e.target.value, 
                                                      schedule.lunch_end_time ? schedule.lunch_end_time.split(':')[1] : "00"
                                                    )}
                                                    disabled={saving}
                                                    className="flex-1 p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white min-w-0"
                                                  >
                                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                                      <option key={hour} value={hour.toString().padStart(2, '0')}>
                                                        {hour.toString().padStart(2, '0')}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  <span className="text-amber-600 self-center px-1">:</span>
                                                  <select
                                                    value={schedule.lunch_end_time ? schedule.lunch_end_time.split(':')[1] : "00"}
                                                    onChange={(e) => handleSeparateTimeChange(
                                                      schedule.day_of_week, 
                                                      "lunch_end_time", 
                                                      schedule.lunch_end_time ? schedule.lunch_end_time.split(':')[0] : "13", 
                                                      e.target.value
                                                    )}
                                                    disabled={saving}
                                                    className="flex-1 p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white min-w-0"
                                                  >
                                                    <option value="00">00</option>
                                                    <option value="15">15</option>
                                                    <option value="30">30</option>
                                                    <option value="45">45</option>
                                                  </select>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center py-3">
                                              <p className="text-amber-700/70 text-sm">Horário de almoço desativado</p>
                                              <p className="text-amber-600/50 text-xs mt-1">Use o interruptor acima para ativar</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ClockIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum horário configurado</h3>
                          <p className="text-gray-600 mb-6 max-w-sm mx-auto">Crie seu cronograma de trabalho para definir quando você estará disponível</p>
                          <Button
                            onClick={handleCreateSchedule}
                            disabled={saving}
                            className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Criando...
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Criar Cronograma
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Dias de Folga Específicos */}
                    {!serviceHoursLoading && specificDayOffs.length > 0 && (
                      <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                          <h3 className="text-xl font-semibold text-gray-900">Folgas Específicas</h3>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {specificDayOffs.map((date) => {
                              const [year, month, day] = date.split('-');
                              const formattedDate = `${day}/${month}/${year}`;
                              
                              return (
                                <div key={date} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-red-300 transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="font-medium text-gray-900">{formattedDate}</span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveSpecificDayOff(date)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-all"
                                    title="Remover folga"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => setIsServiceHoursDialogOpen(false)}
                        variant="outline"
                        className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Fechar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Day Off Dialog */}
                <Dialog open={isDayOffDialogOpen} onOpenChange={setIsDayOffDialogOpen}>
                  <DialogContent className="z-[1000] sm:max-w-md border-none shadow-2xl bg-white">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-[#3D583F]/10 rounded-xl shadow-lg">
                          <CalendarOffIcon className="h-6 w-6 text-[#3D583F]" />
                        </div>
                        Adicionar Dia de Folga
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Selecione uma data específica para folga
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="day-off-date" className="text-sm font-medium text-gray-700 mb-2 block">
                          Data da Folga *
                        </Label>
                        <Input
                          id="day-off-date"
                          type="date"
                          value={selectedDayOffDate}
                          onChange={(e) => setSelectedDayOffDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
                          className="w-full"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDayOffDialogOpen(false);
                          setSelectedDayOffDate("");
                        }}
                        disabled={isCreatingDayOff}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateDayOff}
                        disabled={isCreatingDayOff || !selectedDayOffDate}
                        className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isCreatingDayOff ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <CalendarOffIcon className="h-4 w-4 mr-2" />
                            Adicionar Folga
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Free Interval Dialog */}
                <Dialog open={isFreeIntervalDialogOpen} onOpenChange={setIsFreeIntervalDialogOpen}>
                  <DialogContent className="z-[1000] sm:max-w-lg border-none shadow-2xl bg-white w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-[#3D583F]/10 rounded-xl shadow-lg">
                          <Calendar className="h-6 w-6 text-[#3D583F]" />
                        </div>
                        Criar Intervalo Livre
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Reserve um horário específico em uma data para intervalo livre
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Seleção de Data */}
                      <div>
                        <Label htmlFor="free-interval-date" className="text-sm font-medium text-gray-700 mb-2 block">
                          Data do Intervalo *
                        </Label>
                        <Input
                          id="free-interval-date"
                          type="date"
                          value={selectedFreeIntervalDate}
                          onChange={(e) => setSelectedFreeIntervalDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
                          className="w-full"
                        />
                      </div>

                      {/* Seleção de Horários */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Horário de Início *
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <select
                                value={freeIntervalStartHour}
                                onChange={(e) => setFreeIntervalStartHour(e.target.value)}
                                className="w-full p-2 border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white text-sm"
                              >
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <option key={hour} value={hour.toString().padStart(2, '0')}>
                                    {hour.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <span className="text-[#3D583F] self-center font-medium">:</span>
                            <div className="flex-1">
                              <select
                                value={freeIntervalStartMinute}
                                onChange={(e) => setFreeIntervalStartMinute(e.target.value)}
                                className="w-full p-2 border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white text-sm"
                              >
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Horário de Fim *
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <select
                                value={freeIntervalEndHour}
                                onChange={(e) => setFreeIntervalEndHour(e.target.value)}
                                className="w-full p-2 border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white text-sm"
                              >
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <option key={hour} value={hour.toString().padStart(2, '0')}>
                                    {hour.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <span className="text-[#3D583F] self-center font-medium">:</span>
                            <div className="flex-1">
                              <select
                                value={freeIntervalEndMinute}
                                onChange={(e) => setFreeIntervalEndMinute(e.target.value)}
                                className="w-full p-2 border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] bg-white text-sm"
                              >
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Observações */}
                      <div>
                        <Label htmlFor="free-interval-notes" className="text-sm font-medium text-gray-700 mb-2 block">
                          Observações (opcional)
                        </Label>
                        <textarea
                          id="free-interval-notes"
                          value={freeIntervalNotes}
                          onChange={(e) => setFreeIntervalNotes(e.target.value)}
                          placeholder="Motivo do intervalo livre (ex: reunião, pausa pessoal, etc.)"
                          rows={3}
                          className="w-full p-3 border border-[#3D583F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D583F] resize-none text-sm"
                        />
                      </div>

                      {/* Preview do Intervalo */}
                      {selectedFreeIntervalDate && (
                        <div className="bg-[#3D583F]/10 border border-[#3D583F]/20 rounded-xl p-4">
                          <h4 className="text-[#3D583F] font-medium mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Resumo do Intervalo
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-[#3D583F]">
                              <strong>Data:</strong> {new Date(selectedFreeIntervalDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-[#3D583F]">
                              <strong>Horário:</strong> {freeIntervalStartHour}:{freeIntervalStartMinute} às {freeIntervalEndHour}:{freeIntervalEndMinute}
                            </p>
                            {freeIntervalNotes && (
                              <p className="text-[#3D583F]">
                                <strong>Observações:</strong> {freeIntervalNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsFreeIntervalDialogOpen(false);
                          setSelectedFreeIntervalDate("");
                          setFreeIntervalStartHour("09");
                          setFreeIntervalStartMinute("00");
                          setFreeIntervalEndHour("10");
                          setFreeIntervalEndMinute("00");
                          setFreeIntervalNotes("");
                        }}
                        disabled={isCreatingFreeInterval}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateFreeInterval}
                        disabled={isCreatingFreeInterval || !selectedFreeIntervalDate}
                        className="bg-[#3D583F] hover:bg-[#365137] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isCreatingFreeInterval ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Criando...
                          </>
                        ) : (
                          <>
                            <Calendar className="h-4 w-4 mr-2" />
                            Criar Intervalo
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Company Details Dialog */}
                <Dialog open={isCompanyDetailsDialogOpen} onOpenChange={setIsCompanyDetailsDialogOpen}>
                  <DialogContent className="z-[1000] w-[95vw] sm:w-[90vw] max-w-lg border-none shadow-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-[#3D583F]/10 rounded-xl shadow-lg">
                          <StoreIcon className="h-6 w-6 text-[#3D583F]" />
                        </div>
                        Dados da Barbearia
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Informações da sua empresa
                      </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 overflow-y-auto">
                      {companyDetailsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D583F]/30 border-t-[#3D583F] mb-4"></div>
                          <p className="text-gray-500 font-medium">Carregando detalhes...</p>
                        </div>
                      ) : companyDetails ? (
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                          <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {/* Nome da Empresa */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-600">Nome da Empresa</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                                {companyDetails.name || 'Não informado'}
                              </span>
                            </div>

                            {/* Telefone */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-600">Telefone</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                                {companyDetails.phone_number || 'Não informado'}
                              </span>
                            </div>

                            {/* Endereço */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-2 sm:py-3 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">Endereço</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words sm:text-right sm:max-w-[60%]">
                                {companyDetails.address || 'Não informado'}
                              </span>
                            </div>

                            {/* Documento */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-600">Documento</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                                {companyDetails.document || 'Não informado'}
                              </span>
                            </div>

                            {/* Data de Criação */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-600">Empresa desde</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                                {companyDetails.created_at
                                  ? new Date(companyDetails.created_at).toLocaleDateString('pt-BR')
                                  : 'Não informado'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <StoreIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum detalhe encontrado</h3>
                          <p className="text-gray-500 mb-4">Não foi possível carregar os dados da empresa</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => setIsCompanyDetailsDialogOpen(false)}
                        className="px-6 py-2 bg-[#3D583F] hover:bg-[#365137] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Fechar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>



              <Button
                onClick={handleLogout}
                size="sm"
                variant="outline"
                className="rounded-md text-[#3D583F] border border-[#3D583F] hover:bg-[#3D583F]/10"
              >
                <LogOutIcon className="h-4 w-4 mr-1 text-[#3D583F]" />
                Sair
              </Button>
            </div>
          </div>
        </div>
        
        {/* Centered Overlapping Avatar */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl">
              <AvatarImage
                src={barberInfo.avatarUrl}
                alt={barberInfo.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-[#3D583F] text-white text-2xl font-semibold">
                {barberInfo.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-white hover:bg-gray-50 text-[#3D583F] rounded-full p-2 cursor-pointer shadow-lg border-2 border-white transition-all duration-200 hover:scale-105">
              <input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      const base64Data = base64String.split(',')[1];
                      setIsUploadingPhoto(true);
                      uploadProfilePhoto(base64Data)
                        .finally(() => setIsUploadingPhoto(false));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                disabled={isUploadingPhoto}
              />
              {isUploadingPhoto ? (
                <div className="h-4 w-4 border-2 border-[#3D583F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PencilIcon className="h-4 w-4" />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className=" min-h-screen pt-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Info Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{barberInfo.name}</h1>
            <p className="text-[#3D583F] font-medium mb-4">{companyDetails?.name}</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{barberInfo.email}</p>
              {barberInfo.phone && (
                <p className="text-sm text-gray-600">{barberInfo.phone}</p>
              )}
            </div>
          </div>

          {/* Settings Buttons - Vertical Stack */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-lg mx-auto mt-6 px-3 sm:px-4 pb-24">
          {settingButtons.map((setting, index) => (
            <Card
              key={setting.id}
              className="border border-[#3D583F]/20 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] cursor-pointer overflow-hidden bg-white"
            >
              <CardContent className="p-0">
                <div className={`bg-white p-3 sm:p-4 md:p-6 h-full`}> 
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Glass effect icon container */}
                    <div className="inline-flex p-2 sm:p-3 rounded-2xl bg-[#3D583F]/10 border border-[#3D583F]/20 shadow-lg flex-shrink-0">
                      <setting.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#3D583F]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 text-gray-800">
                        {setting.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-500 leading-relaxed">
                        {setting.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={
                        setting.id === 'notifications'
                          ? handleNotificationToggle
                          : setting.id === 'services'
                            ? handleServicesClick
                            : setting.id === 'schedule'
                              ? handleScheduleClick
                              : setting.id === 'business'
                                ? handleCompanyDetailsClick
                                : undefined
                      }
                      className={`${
                        setting.id === 'notifications' && permission === 'granted'
                          ? 'bg-green-600 hover:bg-green-700'
                          : setting.id === 'notifications' && permission === 'denied'
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-[#3D583F] hover:bg-[#365137]'
                      } hover:shadow-lg transition-all duration-300 text-white font-medium px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0`}
                    >
                      {setting.id === 'notifications'
                        ? permission === 'granted'
                          ? 'Ativado'
                          : permission === 'denied'
                            ? 'Bloqueado'
                            : 'Ativar'
                        : setting.id === 'services'
                          ? 'Ver Serviços'
                          : setting.id === 'schedule'
                            ? 'Horários'
                            : setting.id === 'business'
                              ? 'Detalhes'
                              : 'Configurar'
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="fixed bottom-0 left-0 w-full z-[30] bg-[#3D583F] text-center py-2 mt-5 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
        <p className="text-sm text-white font-medium">{companyDetails?.name || 'Barbearia Link'}</p>
        <p className="text-sm text-white mt-2">
          © 2025 Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
