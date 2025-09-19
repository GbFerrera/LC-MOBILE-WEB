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
  ClockIcon
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
        
        const [clientsResponse, appointmentsResponse] = await Promise.all([
          api.get('/clients'),
          api.get('/appointments')
        ]);
        
        const clientsData = clientsResponse.data;
        const appointmentsData = appointmentsResponse.data;
        
        if (!Array.isArray(clientsData)) {
          throw new Error('Formato de dados de clientes inválido');
        }
        
        if (!Array.isArray(appointmentsData)) {
          throw new Error('Formato de dados de agendamentos inválido');
        }
        
        setClients(clientsData);
        setAppointments(appointmentsData);
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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 py-4">
        {/* Cabeçalho Compacto */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 text-white" />
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
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 px-3 ${
                showFilters 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
            
            {/* Botão Adicionar Cliente */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3"
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
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl p-3 mb-3 shadow-md border border-white/20">
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
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de clientes */}
        <div className="space-y-4 w-full">
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
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
                      <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
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
                />
              ))}
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
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
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
                            <span className="text-sm font-medium text-emerald-600">
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

function ClientCard({ client, getClientStatus, appointments, onShowAppointments }: { 
  client: Client;
  getClientStatus: (client: Client) => {
    status: "ativo" | "ocioso" | "inativo";
    color: string;
    bgColor: string;
  };
  appointments: any[];
  onShowAppointments: (appointments: any[]) => void;
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
              <Avatar className="h-12 w-12 ring-2 ring-emerald-100">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {client.name}
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
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer transition-colors"
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm font-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Agendar
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
                      <Avatar className="h-16 w-16 ring-4 ring-emerald-100">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <DrawerTitle className="text-xl font-bold text-gray-900">
                      {client.name}
                    </DrawerTitle>
                    <DrawerDescription className="text-emerald-600">
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
                      <div className="p-2 bg-green-100 rounded-full">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
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
