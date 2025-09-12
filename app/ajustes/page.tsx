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
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AjustesPage() {
  const { user, signOut } = useAuth();
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
        phone_number: "",
        position: ""
      });
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        phone_number: "",
        position: "",
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

      // Atualizar dados localmente imediatamente
      const updatedData = {
        name: editForm.name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        position: editForm.position
      };
      setCurrentUserData(updatedData);

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
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
    },
    {
      id: "schedule",
      title: "Horário de Funcionamento",
      description: "Defina seus horários de trabalho",
      icon: ClockIcon,
      gradient: "from-indigo-500 to-blue-600",
      bgGradient: "from-indigo-50 to-blue-50",
    },
    {
      id: "business",
      title: "Dados da Barbearia",
      description: "Configure informações do negócio",
      icon: StoreIcon,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
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
      setServiceHours(response.data?.schedules || []);
    } catch (error: any) {
      console.error('Erro ao buscar horários:', error);
      toast.error("Erro ao carregar horários de serviço");
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Card Redesigned - Tamanho Ajustado */}
        <Card className="border-none shadow-lg overflow-hidden mb-8 bg-white max-w-3xl mx-auto">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 relative">
              {/* Header Profile Info */}
              <div className="flex items-center">
                <div className="relative mr-5">
                  <Avatar className="h-20 w-20 border-2 border-white/40 shadow-lg">
                    <AvatarImage
                      src={barberInfo.avatarUrl}
                      alt={barberInfo.name}
                      className="object-cover bg-gray-100"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-400 text-white text-2xl font-bold">
                      {barberInfo.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 cursor-pointer shadow-md transition-all duration-200 hover:scale-105">
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
                            // Remover o prefixo 'data:image/jpeg;base64,' para enviar apenas os dados
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
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <PencilIcon className="h-4 w-4" />
                    )}
                  </label>
                </div>
                <div className="text-white flex-1">
                  <h2 className="font-bold text-2xl tracking-wide mb-1">{barberInfo.name}</h2>
                  <p className="text-emerald-50 text-lg font-medium">
                    {companyDetails?.name}
                  </p>
                  <p className="text-emerald-100 text-sm">
                    {barberInfo.email}
                  </p>
                  {barberInfo.phone && (
                    <p className="text-emerald-100 text-xs">
                      {barberInfo.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-3 items-center justify-end mt-4">
                {/* Edit Profile Icon Button */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 h-10 w-10 rounded-lg"
                    >
                      <PencilIcon className="h-5 w-5" />
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
                  <DialogContent className="sm:max-w-2xl border-none shadow-2xl bg-white w-[48vh] rounded-2xl h-[80vh]">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                            <ScissorsIcon className="h-6 w-6 text-white" />
                          </div>
                          Serviços e Preços
                        </div>
                        <Button
                          onClick={() => setIsCreateServiceDialogOpen(true)}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Novo
                        </Button>
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Todos os serviços oferecidos pela sua barbearia
                      </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 overflow-y-auto">
                      {servicesLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600 mb-4"></div>
                          <p className="text-gray-500 font-medium">Carregando serviços...</p>
                        </div>
                      ) : services.length > 0 ? (
                        <div className="grid gap-4">
                          {services.map((service, index) => (
                            <div key={service.id || index} className="group">
                              <div className="p-5 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg"></div>
                                    <div className="flex-1">
                                       <h3 className="font-bold text-lg text-gray-800 mb-1">
                                         {service.service_name}
                                       </h3>
                                       {service.service_description && (
                                         <p className="text-sm text-gray-600 mb-3">
                                           {service.service_description}
                                         </p>
                                       )}
                                       <div className="flex items-center gap-4">
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                           💰 {formatPrice(service.base_price)}
                                         </span>
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                           ⏱️ {formatDuration(service.base_duration)}
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
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <ScissorsIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum serviço cadastrado</h3>
                          <p className="text-gray-500 mb-4">Cadastre seus serviços para começar a receber agendamentos</p>
                          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                            💡 Dica: Use o sistema administrativo para cadastrar serviços
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => setIsServicesDialogOpen(false)}
                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                  <DialogContent className="sm:max-w-lg border-none shadow-2xl bg-white w-[48vh] rounded-2xl h-[80vh]">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                            <ClockIcon className="h-6 w-6 text-white" />
                          </div>
                          Horários de Serviço
                        </div>
                        <Button
                          onClick={() => setIsDayOffDialogOpen(true)}
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          <CalendarOffIcon className="h-4 w-4 mr-1" />
                          Folga
                        </Button>
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 text-base">
                        Seus horários de trabalho configurados
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {serviceHoursLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                          <p className="text-gray-500 font-medium">Carregando horários...</p>
                        </div>
                      ) : serviceHours.length > 0 ? (
                        <div className="space-y-4">
                          {sortSchedulesByDay(serviceHours).map((schedule, index) => (
                            <div key={index} className="relative group">
                              <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] ${schedule.is_day_off
                                  ? 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-100'
                                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-100'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full shadow-lg ${schedule.is_day_off ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                      }`}></div>
                                    <div className="flex-1">
                                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                                        {schedule.day_of_week
                                          ? formatDayOfWeek(schedule.day_of_week)
                                          : schedule.date
                                            ? new Date(schedule.date).toLocaleDateString('pt-BR')
                                            : 'Data específica'
                                        }
                                      </h3>
                                      {schedule.is_day_off ? (
                                        <div className="flex items-center gap-2">
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                            🏖️ Dia de folga
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                              🕐 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                            </span>
                                          </div>
                                          {schedule.lunch_start_time && schedule.lunch_end_time && (
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                🍽️ Almoço: {formatTime(schedule.lunch_start_time)} - {formatTime(schedule.lunch_end_time)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {!schedule.is_day_off && (
                                    <div className="text-right">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${schedule.date
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {schedule.date ? '📅 Específico' : '🔄 Semanal'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <ClockIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum horário configurado</h3>
                          <p className="text-gray-500 mb-4">Configure seus horários de trabalho para começar</p>
                          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                            💡 Dica: Use a seção "Horário de Funcionamento" para configurar
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dias de Folga Específicos */}
                    {!serviceHoursLoading && specificDayOffs.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#236F5D]">
                          <CalendarDays className="w-5 h-5" />
                          <span>Dias de Folga Específicos</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {specificDayOffs.map((date) => {
                            // Converter YYYY-MM-DD para DD/MM/YYYY para exibição
                            const [year, month, day] = date.split('-');
                            const formattedDate = `${day}/${month}/${year}`;
                            
                            return (
                              <div key={date} className="flex items-center bg-red-50 rounded-full px-3 py-1.5 border border-red-200">
                                <span className="text-sm font-medium text-red-700 mr-2">{formattedDate}</span>
                                <button
                                  onClick={() => handleRemoveSpecificDayOff(date)}
                                  className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100 transition-colors"
                                  title="Remover dia de folga"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <DialogFooter className="pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => setIsServiceHoursDialogOpen(false)}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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



                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Buttons - Vertical Stack */}
        <div className="flex flex-col gap-4 w-full max-w-lg mx-auto mt-6 px-4 sm:px-0 pb-24">
          {settingButtons.map((setting, index) => (
            <Card
              key={setting.id}
              className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer overflow-hidden hover:shadow-emerald-200"
            >
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${setting.bgGradient} p-4 sm:p-6 h-full`}>
                  <div className="flex items-center gap-4">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${setting.gradient} shadow-lg flex-shrink-0`}>
                      <setting.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl mb-1 text-gray-800">
                        {setting.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
                      className={`bg-gradient-to-r ${setting.gradient} hover:shadow-lg transition-all duration-300 text-white font-semibold px-4 py-2 rounded-xl text-sm flex-shrink-0`}
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

        {/* App Version */}
        <div className="fixed bottom-0 left-0 w-full z-[999] bg-gradient-to-r from-emerald-600 to-teal-600 text-center py-2 mt-5 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
          <p className="text-sm text-white font-medium">{companyDetails?.name || 'Barbearia Link'}</p>
          <p className="text-sm text-white mt-2">
            © 2025 Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
