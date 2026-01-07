"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeftIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  UserIcon, 
  XIcon, 
  AlertTriangleIcon,
  UsersIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon,
  Camera,
  Upload,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, setupAPIInterceptors } from "@/services/api"
import { useAuth } from "@/hooks/auth";
import { parseISO } from "date-fns";

interface Client {
  id: number;
  company_id: number;
  document: string | null;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  profile_photo?: string | null;
  last_appointment?: {
    appointment_date: string;
    start_time: string;
    end_time: string;
  } | null;
}

export default function ClientesPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ativo' | 'ocioso' | 'inativo'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClientAppointments, setSelectedClientAppointments] = useState<any[]>([]);
  const [isAppointmentDrawerOpen, setIsAppointmentDrawerOpen] = useState(false);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [profilePhotosMap, setProfilePhotosMap] = useState<Record<number, string | null>>({});

  // Photo gallery states
  const [clientPhotos, setClientPhotos] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenPhotoIndex, setFullScreenPhotoIndex] = useState<number>(0);

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Configurar o interceptor para adicionar o company_id
        setupAPIInterceptors(user?.company_id ?? 0);
        
        const [clientsResponse, appointmentsResponse, clientPhotosResponse] = await Promise.all([
          api.get('/clients', {
            params: { limit, offset: 0 }
          }),
          api.get('/appointments'),
          api.get('/client-photos/all') // Buscar primeira foto de cada cliente
        ]);
        
        const clientsData = clientsResponse.data;
        const appointmentsData = appointmentsResponse.data;
        const clientPhotosData = clientPhotosResponse.data || [];
        
        const normalizedClients: Client[] = Array.isArray(clientsData) ? clientsData : (Array.isArray(clientsData?.clients) ? clientsData.clients : []);
        const normalizedTotal: number = Array.isArray(clientsData) ? normalizedClients.length : (typeof clientsData?.total === 'number' ? clientsData.total : normalizedClients.length);
        const initialOffset = normalizedClients.length;

        if (!Array.isArray(appointmentsData)) {
          throw new Error('Formato de dados de agendamentos inválido');
        }
        
        const mapPhotos = clientPhotosData.reduce((acc: Record<number, string | null>, photo: any) => {
          acc[photo.client_id] = photo.photo_url;
          return acc;
        }, {});
        setProfilePhotosMap(mapPhotos);
        
        const clientsWithPhotos = normalizedClients.map((client: Client) => ({
          ...client,
          profile_photo: mapPhotos[client.id] || null
        }));
        
        setClients(clientsWithPhotos);
        setAppointments(appointmentsData);
        setTotalClients(normalizedTotal);
        setOffset(initialOffset);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Não foi possível carregar os dados');
        setClients([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const loadMoreClients = async () => {
    if (isLoadingMore) return;
    if (clients.length >= totalClients) return;
    try {
      setIsLoadingMore(true);
      setupAPIInterceptors(user?.company_id ?? 0);
      const response = await api.get('/clients', {
        params: { limit, offset }
      });
      const data = response.data;
      const moreClients: Client[] = Array.isArray(data) ? data : (Array.isArray(data?.clients) ? data.clients : []);
      const clientsWithPhotos = moreClients.map((client: Client) => ({
        ...client,
        profile_photo: profilePhotosMap[client.id] || null
      }));
      setClients(prev => [...prev, ...clientsWithPhotos]);
      const newOffset = offset + moreClients.length;
      setOffset(newOffset);
    } catch (error) {
      console.error('Erro ao carregar mais clientes:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Função para determinar o status do cliente baseado no last_appointment
  const getClientStatus = (client: Client): {
    status: "ativo" | "ocioso" | "inativo";
    color: string;
    bgColor: string;
  } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function parseDateWithoutTime(dateString: string): Date {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    const lastAppointment = client.last_appointment;
    if (!lastAppointment || !lastAppointment.appointment_date) {
      return {
        status: "inativo",
        color: "text-red-700",
        bgColor: "bg-red-100",
      };
    }

    const appointmentDate = parseDateWithoutTime(lastAppointment.appointment_date);
    const diffInMs = today.getTime() - appointmentDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      // Agendamento futuro
      return {
        status: "ativo",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
      };
    } else if (diffInDays < 30) {
      // Último agendamento há menos de 30 dias
      return {
        status: "ativo",
        color: "text-emerald-700", 
        bgColor: "bg-emerald-100",
      };
    } else if (diffInDays <= 45) {
      // Último agendamento entre 30 e 45 dias
      return {
        status: "ocioso",
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
      };
    } else {
      // Último agendamento há mais de 45 dias
      return {
        status: "inativo",
        color: "text-red-700",
        bgColor: "bg-red-100",
      };
    }
  };

  // Photo gallery functions
  const loadClientPhotos = async (clientId: number) => {
    if (!user?.company_id) return;
    
    try {
      const response = await api.get(`/client-photos/${clientId}`, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      // Ordenar fotos para garantir que a primeira (foto de perfil) apareça primeiro
      const photos = response.data || [];
      const sortedPhotos = photos.sort((a: any, b: any) => {
        // Ordenar por data de criação (mais antiga primeiro = foto de perfil)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      // Se há uma foto de perfil do cliente, garantir que ela seja a primeira
      const client = clients.find(c => c.id === clientId);
      if (client?.profile_photo) {
        // Verificar se a foto de perfil já está na lista
        const profilePhotoIndex = sortedPhotos.findIndex((photo: any) => photo.photo_url === client.profile_photo);
        
        if (profilePhotoIndex > 0) {
          // Mover a foto de perfil para o início
          const profilePhoto = sortedPhotos.splice(profilePhotoIndex, 1)[0];
          sortedPhotos.unshift(profilePhoto);
        } else if (profilePhotoIndex === -1) {
          // Se a foto de perfil não está na lista, criar um objeto para ela
          const profilePhotoObj = {
            id: `profile-${clientId}`,
            client_id: clientId,
            photo_url: client.profile_photo,
            description: 'Foto de perfil',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          sortedPhotos.unshift(profilePhotoObj);
        }
      }
      
      setClientPhotos(sortedPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos do cliente:', error);
      setClientPhotos([]);
    }
  };

  const openPhotoGallery = async (clientId: number) => {
    setSelectedClientId(clientId);
    setIsPhotoGalleryOpen(true);
    await loadClientPhotos(clientId);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Salvar o arquivo para envio posterior
      setSelectedFile(file);
    }
  };

  const confirmPhotoUpload = async () => {
    if (selectedFile && selectedClientId && user?.company_id) {
      try {
        setIsUploadingPhoto(true);
        const base64Photo = await convertFileToBase64Photo(selectedFile);
        
        await api.post(`/client-photos/${selectedClientId}`, {
          base64Image: base64Photo,
          description: uploadDescription.trim() || ''
        }, {
          headers: {
            company_id: user.company_id.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Recarregar as fotos após o upload
        await loadClientPhotos(selectedClientId);
        
        // Limpar estados
        setPhotoPreview(null);
        setSelectedFile(null);
        setUploadDescription('');
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const cancelPhotoUpload = () => {
    setPhotoPreview(null);
    setSelectedFile(null);
    setUploadDescription('');
  };

  const convertFileToBase64Photo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deletePhoto = async (photoId: number) => {
    if (!selectedClientId || !user?.company_id) return;

    try {
      // Encontrar o índice da foto que será deletada
      const photoIndex = clientPhotos.findIndex(photo => photo.id === photoId);
      
      await api.delete(`/client-photos/photo/${photoId}`, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      await loadClientPhotos(selectedClientId);
      
      // Ajustar o índice do modal de tela cheia se necessário
      if (isFullScreenOpen && photoIndex !== -1) {
        if (clientPhotos.length <= 1) {
          // Se não há mais fotos, fechar o modal
          setIsFullScreenOpen(false);
        } else if (fullScreenPhotoIndex >= photoIndex) {
          // Se o índice atual é maior ou igual ao deletado, ajustar
          const newIndex = fullScreenPhotoIndex > 0 ? fullScreenPhotoIndex - 1 : 0;
          setFullScreenPhotoIndex(newIndex);
        }
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      alert('Erro ao deletar foto');
    }
  };

  const updatePhotoDescription = async (photoId: number, description: string) => {
    if (!selectedClientId || !user?.company_id) return;

    try {
      await api.put(`/client-photos/photo/${photoId}/description`, { description }, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      await loadClientPhotos(selectedClientId);
      setEditingPhotoId(null);
      setEditingDescription('');
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      alert('Erro ao atualizar descrição');
    }
  };

  // Filtrar clientes baseado na busca e status
  const filteredClients = clients.filter(client => {
    // Filtro por status
    if (selectedStatus !== 'all') {
      const clientStatus = getClientStatus(client);
      if (clientStatus.status !== selectedStatus) {
        return false;
      }
    }

    // Filtro por busca
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.phone_number.includes(search) ||
      (client.email && client.email.toLowerCase().includes(search)) ||
      (client.document && client.document.includes(search))
    );
  });

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto">
        {/* Cabeçalho Compacto */}
        <div className="flex items-center justify-between mb-4 bg-white w-full border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 rounded-full border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-500 text-xs">Gerencie seus clientes</p>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            {/* Botão Filtro */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-3 border-[#3D583F] text-[#3D583F] bg-white hover:bg-[#3D583F]/10"
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
            
            {/* Botão Adicionar Cliente */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 border-[#3D583F] text-[#3D583F] bg-white hover:bg-[#3D583F]/10"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <CreateClientDrawer onClientCreated={() => window.location.reload()} />
            </Drawer>
          </div>
        </div>

        {/* Filtros - Aparece apenas quando showFilters é true */}
        {showFilters && (
          <div className="bg-[#3D583F] rounded-xl p-3 mb-3 shadow-md border border-white/20">
            <div className="space-y-2">
              {/* Filtro por Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-white font-medium text-xs min-w-[50px]">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Status:
                </div>
                <div className="relative flex-1">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'ativo' | 'ocioso' | 'inativo')}
                    className="w-full h-9 rounded-lg border-0 bg-white/25 backdrop-blur-sm text-white text-sm font-medium focus:ring-1 focus:ring-white/40 focus:border-transparent transition-all duration-200 pr-8 pl-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(15px)',
                    }}
                  >
                    <option value="all" className="text-gray-900 font-medium">Todos</option>
                    <option value="ativo" className="text-gray-900 font-medium">🟢 Ativo</option>
                    <option value="ocioso" className="text-gray-900 font-medium">🟡 Ocioso</option>
                    <option value="inativo" className="text-gray-900 font-medium">🔴 Inativo</option>
                  </select>
                </div>
              </div>

              {/* Filtro por Cliente */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-white font-medium text-xs min-w-[50px]">
                  <UserIcon className="h-3.5 w-3.5" />
                  Cliente:
                </div>
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/80" />
                  <Input
                    type="text"
                    placeholder="Digite o nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 h-9 rounded-lg border-0 bg-white/25 backdrop-blur-sm text-white placeholder-white/80 focus:ring-1 focus:ring-white/40 focus:border-transparent transition-all duration-200 text-sm font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(15px)',
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão Limpar Filtros - Aparece quando não há resultados */}
        {filteredClients.length === 0 && !loading && (searchTerm || selectedStatus !== 'all') && (
          <div className="text-center mb-6">
            <div className="inline-flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <AlertTriangleIcon className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Não encontramos clientes com os filtros aplicados
                </p>
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10 hover:border-[#3D583F]/40"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de clientes */}
        <div className="space-y-4 w-full px-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-red-500 text-6xl mb-4 flex justify-center"><AlertTriangleIcon className="h-16 w-16 text-red-500" /></div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao Carregar</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                {searchTerm ? (
                  <>
                    <div className="text-gray-400 text-6xl mb-4"><SearchIcon className="h-16 w-16 mx-auto text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Resultado</h3>
                    <p className="text-gray-600 mb-4">Não encontramos clientes com "{searchTerm}"</p>
                    <Button 
                      onClick={() => setSearchTerm('')}
                      variant="outline" 
                      className="border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10"
                    >
                      Limpar Busca
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 text-6xl mb-4"><UsersIcon className="h-16 w-16 mx-auto text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Cliente</h3>
                    <p className="text-gray-600 mb-4">Você ainda não possui clientes cadastrados</p>
                    <Link href="/clientes/novo">
                      <Button className="bg-[#3D583F] hover:bg-[#365137] text-white">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Cadastrar Primeiro Cliente
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  getClientStatus={getClientStatus}
                  appointments={appointments}
                  onShowAppointments={(clientAppointments) => {
                    setSelectedClientAppointments(clientAppointments);
                    setIsAppointmentDrawerOpen(true);
                  }}
                  onOpenPhotoGallery={openPhotoGallery}
                />
              ))}
              {clients.length < totalClients && (
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={loadMoreClients}
                    disabled={isLoadingMore}
                    className="bg-[#3D583F] hover:bg-[#365137] text-white"
                  >
                    {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer de Detalhes dos Agendamentos */}
        <Drawer open={isAppointmentDrawerOpen} onOpenChange={setIsAppointmentDrawerOpen}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader className="text-center pb-4">
                <DrawerTitle className="text-xl font-bold text-gray-900">
                  Agendamentos dos Últimos 30 Dias
                </DrawerTitle>
                <DrawerDescription className="text-gray-600">
                  Histórico de agendamentos do cliente
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedClientAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum agendamento encontrado</p>
                  </div>
                ) : (
                  selectedClientAppointments.map((appointment: any, index: number) => (
                    <div key={appointment.id || index} className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={appointment.status === 'confirmed' ? 'default' : 
                                    appointment.status === 'completed' ? 'secondary' : 
                                    appointment.status === 'cancelled' ? 'destructive' : 'outline'}
                            className={
                              appointment.status === 'confirmed' ? 'bg-[#3D583F]/10 text-[#3D583F] border-[#3D583F]/30' :
                              appointment.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {appointment.status === 'confirmed' ? 'Confirmado' :
                             appointment.status === 'completed' ? 'Concluído' :
                             appointment.status === 'cancelled' ? 'Cancelado' :
                             appointment.status || 'Pendente'}
                          </Badge>
                          {appointment.professional_name && (
                            <span className="text-sm font-medium text-[#3D583F]">
                              {appointment.professional_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <ClockIcon className="h-3 w-3" />
                          {appointment.start_time} - {appointment.end_time}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Data:</strong> {parseISO(appointment.appointment_date).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {appointment.services && appointment.services.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Serviços:</p>
                          <div className="flex flex-wrap gap-1">
                            {appointment.services.map((service: any, serviceIndex: number) => (
                              <Badge key={serviceIndex} variant="outline" className="text-xs bg-white">
                                {service.service_name || service.name || 'Serviço'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <DrawerFooter className="pt-6">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Fechar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Photo Gallery Modal */}
      {isPhotoGalleryOpen && (
        <Drawer open={isPhotoGalleryOpen} onOpenChange={setIsPhotoGalleryOpen}>
          <DrawerContent className="h-[90vh]">
            <div className="mx-auto w-full max-w-sm h-full flex flex-col">
              <DrawerHeader className="text-center pb-4 flex-shrink-0">
                <DrawerTitle className="text-xl font-bold text-gray-900">
                  Galeria de Fotos
                </DrawerTitle>
                <DrawerDescription className="text-gray-600">
                  Gerencie as fotos do cliente
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-4 flex-1 overflow-y-auto min-h-0">
                <div className="space-y-4 pb-4">
                {/* Upload Section */}
                {!photoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        disabled={isUploadingPhoto}
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`cursor-pointer flex flex-col items-center space-y-2 ${
                          isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploadingPhoto ? 'Enviando...' : 'Clique para selecionar foto'}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Photo Preview Section */
                  <div className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Preview da foto"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    </div>
                    
                    {/* Description Input */}
                    <div>
                      <Input
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Adicione uma descrição (opcional)"
                        className="text-sm"
                        disabled={isUploadingPhoto}
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={confirmPhotoUpload}
                        disabled={isUploadingPhoto}
                        className="flex-1"
                        size="sm"
                      >
                        {isUploadingPhoto ? 'Enviando...' : 'Enviar Foto'}
                      </Button>
                      <Button
                        onClick={cancelPhotoUpload}
                        disabled={isUploadingPhoto}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Photos Grid */}
                {clientPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {clientPhotos.map((photo, index) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square relative overflow-hidden rounded-lg border">
                          <img
                            src={photo.photo_url}
                            alt={photo.description || `Foto ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              setFullScreenPhotoIndex(index);
                              setIsFullScreenOpen(true);
                            }}
                          />
                          
                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPhotoId(photo.id);
                                setEditingDescription(photo.description || '');
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePhoto(photo.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {editingPhotoId === photo.id ? (
                          <div className="mt-2 space-y-2">
                            <Input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              placeholder="Descrição da foto"
                              className="text-xs"
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updatePhotoDescription(photo.id, editingDescription)}
                                className="flex-1 h-8 text-xs"
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPhotoId(null);
                                  setEditingDescription('');
                                }}
                                className="flex-1 h-8 text-xs"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          photo.description && (
                            <p className="mt-2 text-xs text-gray-600 text-center">
                              {photo.description}
                            </p>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhuma foto adicionada ainda</p>
                  </div>
                )}
                </div>
              </div>
              
              <DrawerFooter className="pt-6 flex-shrink-0">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Fechar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Full Screen Photo Modal */}
      {isFullScreenOpen && clientPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              onClick={() => setIsFullScreenOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
              size="sm"
            >
              <XIcon className="h-4 w-4" />
            </Button>

            {/* Navigation Buttons */}
            {clientPhotos.length > 1 && (
              <>
                <Button
                  onClick={() => setFullScreenPhotoIndex(prev => 
                    prev === 0 ? clientPhotos.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setFullScreenPhotoIndex(prev => 
                    prev === clientPhotos.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Photo */}
            <img
              src={clientPhotos[fullScreenPhotoIndex]?.photo_url}
              alt={clientPhotos[fullScreenPhotoIndex]?.description || `Foto ${fullScreenPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Photo Info */}
            {clientPhotos[fullScreenPhotoIndex]?.description && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg max-w-md text-center">
                <p className="text-sm">{clientPhotos[fullScreenPhotoIndex].description}</p>
              </div>
            )}

            {/* Photo Counter */}
            {clientPhotos.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                {fullScreenPhotoIndex + 1} de {clientPhotos.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateClientDrawer({ onClientCreated }: { onClientCreated: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    document: '',
    birthday: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone_number.trim() || !formData.document.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (loading) return;
    
    try {
      setLoading(true);
      
      await api.post("/clients", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        document: formData.document.trim(),
        birthday: formData.birthday || undefined,
        password: "12345"
      }, {
        headers: {
          company_id: user?.company_id
        }
      });

      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        document: '',
        birthday: ''
      });
      
      alert('Cliente criado com sucesso!');
      onClientCreated();
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar cliente';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DrawerContent>
      <div className="mx-auto w-full max-w-sm">
        <DrawerHeader className="text-center pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">
            Novo Cliente
          </DrawerTitle>
          <DrawerDescription className="text-gray-600">
            Preencha as informações do cliente
          </DrawerDescription>
        </DrawerHeader>
        
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          {/* Nome - Campo obrigatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nome completo *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome do cliente"
              className="w-full"
              required
            />
          </div>

          {/* Data de nascimento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Data de nascimento
            </label>
            <Input
              type="date"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Email - Campo obrigatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Email do cliente"
              className="w-full"
              required
            />
          </div>

          {/* Telefone - Campo obrigatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Telefone *
            </label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="Telefone do cliente"
              className="w-full"
              required
            />
          </div>

          {/* CPF/CNPJ - Campo obrigatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              CPF/CNPJ *
            </label>
            <Input
              type="text"
              value={formData.document}
              onChange={(e) => handleInputChange('document', e.target.value)}
              placeholder="CPF ou CNPJ do cliente"
              className="w-full"
              required
            />
          </div>
        </form>
        
        <DrawerFooter className="pt-6">
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 disabled:bg-gray-300"
          >
            {loading ? 'Criando...' : 'Criar Cliente'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  );
}

function ClientCard({ client, getClientStatus, appointments, onShowAppointments, onOpenPhotoGallery }: { 
  client: Client;
  getClientStatus: (client: Client) => {
    status: "ativo" | "ocioso" | "inativo";
    color: string;
    bgColor: string;
  };
  appointments: any[];
  onShowAppointments: (appointments: any[]) => void;
  onOpenPhotoGallery: (clientId: number) => void;
}) {
  const initials = client.name
    .split(" ")
    .map((n: string) => n[0])
    .join("");
    
  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };
  
  const daysSinceCreated = Math.floor(
    (new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handler para agendamento
  const handleSchedule = () => {
    window.location.href = `/agenda?client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`;
  };

  // Função para contar e filtrar agendamentos dos últimos 30 dias
  const getClientAppointments = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointment.client_id === client.id && appointmentDate >= thirtyDaysAgo;
    });
  };

  const clientAppointments = getClientAppointments();
  const appointmentCount = clientAppointments.length;

  // Handler para mostrar agendamentos
  const handleShowAppointments = () => {
    if (appointmentCount > 0) {
      onShowAppointments(clientAppointments);
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          {/* Header com avatar e info básica */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-[#3D583F]/20">
                {client.profile_photo ? (
                  <AvatarImage 
                    src={client.profile_photo} 
                    alt={`Foto de ${client.name}`}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-[#3D583F] text-white font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {client.name && client.name.length > 18 ? `${client.name.slice(0, 10)}...` : client.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <PhoneIcon className="h-3 w-3" />
                  <span className="truncate">{formatPhone(client.phone_number)}</span>
                </div>
              </div>
            </div>
            
            {/* Status badge */}
            <div className="flex-shrink-0">
              {(() => {
                const clientStatus = getClientStatus(client);
                return (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${clientStatus.bgColor} ${clientStatus.color}`}>
                    {clientStatus.status}
                  </span>
                );
              })()}
            </div>
          </div>
          
          {/* Email se existir */}
          {client.email && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              <MailIcon className="h-3 w-3" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          
          {/* Badge de agendamentos dos últimos 30 dias */}
          {appointmentCount > 0 && (
            <div className="mb-3">
              <Badge 
                variant="secondary" 
                className="bg-[#3D583F]/10 text-[#3D583F] hover:bg-[#3D583F]/20 cursor-pointer transition-colors"
                onClick={handleShowAppointments}
              >
                <ClockIcon className="h-3 w-3 mr-1" />
                Agend. Mês: {appointmentCount}
              </Badge>
            </div>
          )}
          
          {/* Ações */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSchedule}
              className="flex-1 bg-[#3D583F] hover:bg-[#365137] text-white h-9 text-sm font-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Agendar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPhotoGallery(client.id)}
              className="px-3 h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Camera className="h-4 w-4" />
            </Button>
            
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader className="text-center pb-4">
                    <div className="mx-auto mb-4">
                      <Avatar className="h-16 w-16 ring-4 ring-[#3D583F]/20">
                        {client.profile_photo ? (
                          <AvatarImage 
                            src={client.profile_photo} 
                            alt={`Foto de ${client.name}`}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-[#3D583F] text-white font-bold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <DrawerTitle className="text-xl font-bold text-gray-900">
                      {client.name && client.name.length > 10 ? `${client.name.slice(0, 10)}...` : client.name}
                    </DrawerTitle>
                    <DrawerDescription className="text-[#3D583F]">
                      Informações completas
                    </DrawerDescription>
                  </DrawerHeader>
                  
                  <div className="px-4 space-y-3">
                    {/* Telefone */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <PhoneIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</p>
                        <p className="text-sm font-medium text-gray-900">{formatPhone(client.phone_number)}</p>
                      </div>
                    </div>
                    
                    {/* Email */}
                    {client.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <MailIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900 break-all">{client.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Documento */}
                    {client.document && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <UserIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documento</p>
                          <p className="text-sm font-medium text-gray-900">{client.document}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Data de Cadastro */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-[#3D583F]/10 rounded-full">
                        <CalendarIcon className="h-4 w-4 text-[#3D583F]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente desde</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {daysSinceCreated === 0 ? 'Cadastrado hoje' : 
                           daysSinceCreated === 1 ? 'Cadastrado há 1 dia' : 
                           daysSinceCreated < 30 ? `Cadastrado há ${daysSinceCreated} dias` :
                           `Cadastrado há ${Math.floor(daysSinceCreated / 30)} mês${Math.floor(daysSinceCreated / 30) > 1 ? 'es' : ''}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <DrawerFooter className="pt-6">
                    <Button 
                      onClick={handleSchedule}
                      className="w-full bg-[#3D583F] hover:bg-[#365137] text-white h-12"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Agendar Serviço
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="outline" className="w-full">
                        Fechar
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
