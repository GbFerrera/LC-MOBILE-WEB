"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AjustesPage() {
  const { user, updateUser, signOut } = useAuth();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceHoursDialogOpen, setIsServiceHoursDialogOpen] = useState(false);
  const [isCompanyDetailsDialogOpen, setIsCompanyDetailsDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isCreateServiceDialogOpen, setIsCreateServiceDialogOpen] = useState(false);
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
      title: "Horário de Funcionamento",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ChevronLeftIcon className="h-7 w-7" />
            </Link>
            <h1 className="font-bold text-2xl tracking-wide">Ajustes</h1>
            <div className="w-7"></div>
          </div>
        </div>
      </header>

      {/* Full Width Profile Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 relative pb-20">
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="flex items-start justify-end mb-4">
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent"
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
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Services Dialog */}
                <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
                  <DialogContent className="sm:max-w-3xl border border-gray-200 shadow-xl bg-white/95 backdrop-blur-sm w-[90vw] rounded-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 rounded-2xl">
                            <ScissorsIcon className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">
                              Serviços e Preços
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 mt-1">
                              Gerencie seus serviços oferecidos
                            </DialogDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => setIsCreateServiceDialogOpen(true)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Novo Serviço
                        </Button>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-6">
                      {servicesLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-600">Carregando serviços...</p>
                        </div>
                      ) : services.length > 0 ? (
                        <div className="space-y-4">
                          {services.map((service, index) => (
                            <div key={service.id || index} className="group">
                              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:border-orange-200">
                                <div className="flex items-start gap-4">
                                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                      {service.service_name}
                                    </h3>
                                    {service.service_description && (
                                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                                        {service.service_description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                                        <span className="text-emerald-600 font-medium text-sm">
                                          {formatPrice(service.base_price)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                                        <span className="text-blue-600 font-medium text-sm">
                                          {formatDuration(service.base_duration)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
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

                {/* Create Service Dialog */}
                <Dialog open={isCreateServiceDialogOpen} onOpenChange={setIsCreateServiceDialogOpen}>
                  <DialogContent className="sm:max-w-md border-none shadow-2xl bg-white w-[48vh] rounded-2xl h-[80vh]">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                          <PlusIcon className="h-6 w-6 text-white" />
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

                        <div className="grid grid-cols-2 gap-4">
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

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateServiceDialogOpen(false);
                          setNewServiceForm({ name: "", description: "", price: "", duration: "" });
                        }}
                        disabled={isCreatingService}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateService}
                        disabled={isCreatingService}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                  <DialogContent className="sm:max-w-4xl border border-gray-200 shadow-xl bg-white/95 backdrop-blur-sm w-[90vw] rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-2xl">
                            <ClockIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">
                              Horários de Trabalho
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 mt-1">
                              Configure seus dias e horários de funcionamento
                            </DialogDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => setIsDayOffDialogOpen(true)}
                          size="sm"
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-4 py-2"
                        >
                          <CalendarOffIcon className="h-4 w-4 mr-2" />
                          Nova Folga
                        </Button>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-6">
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
                                  <div className={`bg-white border rounded-2xl p-6 transition-all duration-300 hover:shadow-md ${
                                    schedule.is_day_off
                                      ? 'border-red-200 hover:border-red-300'
                                      : 'border-emerald-200 hover:border-emerald-300'
                                    }`}>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${
                                          schedule.is_day_off ? 'bg-red-500' : 'bg-emerald-500'
                                        }`}></div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                          {formatDayOfWeek(schedule.day_of_week)}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Dia de folga</span>
                                        <Switch
                                          checked={schedule.is_day_off || false}
                                          onCheckedChange={(checked) => handleDayOffToggle(schedule.day_of_week, checked)}
                                          disabled={saving}
                                        />
                                      </div>
                                    </div>
                                    {schedule.is_day_off ? (
                                      <div className="bg-red-50 rounded-xl p-4">
                                        <p className="text-red-700 font-medium text-center">
                                          🏖️ Dia de descanso
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="bg-emerald-50 rounded-xl p-4">
                                          <div className="flex items-center justify-center gap-2">
                                            <span className="text-emerald-700 font-medium">
                                              {formatTime(schedule.start_time)} → {formatTime(schedule.end_time)}
                                            </span>
                                          </div>
                                        </div>
                                        {schedule.lunch_start_time && schedule.lunch_end_time && (
                                          <div className="bg-amber-50 rounded-xl p-3">
                                            <div className="flex items-center justify-center gap-2">
                                              <span className="text-amber-700 text-sm">
                                                🍽️ Almoço: {formatTime(schedule.lunch_start_time)} - {formatTime(schedule.lunch_end_time)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
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
                  <DialogContent className="sm:max-w-md border-none shadow-2xl bg-white">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                          <CalendarOffIcon className="h-6 w-6 text-white" />
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
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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

                {/* Company Details Dialog */}
                <Dialog open={isCompanyDetailsDialogOpen} onOpenChange={setIsCompanyDetailsDialogOpen}>
                  <DialogContent className="sm:max-w-lg border-none shadow-2xl bg-white w-[48vh] rounded-2xl h-[80vh]">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                          <StoreIcon className="h-6 w-6 text-white" />
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
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                          <p className="text-gray-500 font-medium">Carregando detalhes...</p>
                        </div>
                      ) : companyDetails ? (
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="grid grid-cols-1 gap-4">
                            {/* Nome da Empresa */}
                            <div className="flex items-center justify-between py-3 border-b border-gray-200">
                              <span className="text-sm font-medium text-gray-600">Nome da Empresa</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {companyDetails.name || 'Não informado'}
                              </span>
                            </div>

                            {/* Telefone */}
                            <div className="flex items-center justify-between py-3 border-b border-gray-200">
                              <span className="text-sm font-medium text-gray-600">Telefone</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {companyDetails.phone_number || 'Não informado'}
                              </span>
                            </div>

                            {/* Endereço */}
                            <div className="flex items-center justify-between py-3 border-b border-gray-200">
                              <span className="text-sm font-medium text-gray-600">Endereço</span>
                              <span className="text-sm font-semibold text-gray-900 text-right">
                                {companyDetails.address || 'Não informado'}
                              </span>
                            </div>

                            {/* Documento */}
                            <div className="flex items-center justify-between py-3 border-b border-gray-200">
                              <span className="text-sm font-medium text-gray-600">Documento</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {companyDetails.document || 'Não informado'}
                              </span>
                            </div>

                            {/* Data de Criação */}
                            <div className="flex items-center justify-between py-3">
                              <span className="text-sm font-medium text-gray-600">Empresa desde</span>
                              <span className="text-sm font-semibold text-gray-900">
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
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent"
              >
                <LogOutIcon className="h-4 w-4 mr-1" />
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
              <AvatarFallback className="bg-emerald-600 text-white text-2xl font-semibold">
                {barberInfo.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-white hover:bg-gray-50 text-emerald-600 rounded-full p-2 cursor-pointer shadow-lg border-2 border-white transition-all duration-200 hover:scale-105">
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
                <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PencilIcon className="h-4 w-4" />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen pt-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Info Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{barberInfo.name}</h1>
            <p className="text-emerald-600 font-medium mb-4">{companyDetails?.name}</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{barberInfo.email}</p>
              {barberInfo.phone && (
                <p className="text-sm text-gray-600">{barberInfo.phone}</p>
              )}
            </div>
          </div>

          {/* Settings Buttons - Vertical Stack */}
          <div className="flex flex-col gap-4 w-full max-w-lg mx-auto mt-6 px-4 sm:px-0 pb-24">
          {settingButtons.map((setting, index) => (
            <Card
              key={setting.id}
              className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] cursor-pointer overflow-hidden bg-white/70 backdrop-blur-sm"
            >
              <CardContent className="p-0">
                <div className={`${setting.bgColor} p-4 sm:p-6 h-full`}>
                  <div className="flex items-center gap-4">
                    {/* Glass effect icon container */}
                    <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex-shrink-0 hover:bg-white/30 transition-all duration-300">
                      <setting.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${setting.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg sm:text-xl mb-1 text-gray-800">
                        {setting.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                        {setting.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={
                        setting.id === 'services'
                          ? handleServicesClick
                          : setting.id === 'schedule'
                            ? handleScheduleClick
                            : setting.id === 'business'
                              ? handleCompanyDetailsClick
                              : undefined
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all duration-300 text-white font-medium px-4 py-2 rounded-xl text-sm flex-shrink-0"
                    >
                      {setting.id === 'services'
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
      <div className="fixed bottom-0 left-0 w-full z-[999] bg-gradient-to-r from-emerald-600 to-teal-600 text-center py-2 mt-5 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
        <p className="text-sm text-white font-medium">{companyDetails?.name || 'Barbearia Link'}</p>
        <p className="text-sm text-white mt-2">
          © 2025 Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
