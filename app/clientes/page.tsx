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
import { ChevronLeftIcon, PlusIcon, SearchIcon, StarIcon, PhoneIcon, MailIcon, CalendarIcon, UserIcon, XIcon, UsersIcon, EyeIcon, AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, setupAPIInterceptors } from "@/services/api"
import { useAuth } from "@/hooks/auth";

interface Client {
  id: number;
  company_id: number;
  document: string | null;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export default function ClientesPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Configurar o interceptor para adicionar o company_id
        setupAPIInterceptors(user?.company_id ?? 0);
        
        const response = await api.get('/clients');
        const data = response.data;
        
        if (!Array.isArray(data)) {
          throw new Error('Formato de dados inválido');
        }
        
        setClients(data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        setError('Não foi possível carregar os clientes');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filtrar clientes baseado na busca
  const filteredClients = clients.filter(client => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 transition-colors duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-600 text-sm">Gerencie sua base de clientes</p>
            </div>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="relative w-full mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar clientes..."
            className="pl-10 w-full max-w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de clientes */}
        <div className="space-y-4 w-full">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
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

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm w-full max-w-full overflow-hidden">
      <CardContent className="p-0 max-w-full">
        <div className="p-4 sm:p-6 w-full">
          {/* Layout Responsivo: Vertical em mobile, horizontal em desktop */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar com gradiente */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-4 border-white shadow-lg ring-2 ring-emerald-100">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base sm:text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-w-0">
              {/* Cabeçalho do cliente - Stack em mobile */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors" title={client.name}>
                    {client.name.length > 8 ? `${client.name.substring(0, 8)}...` : client.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 w-full">
                    <span className="text-sm text-gray-600 font-medium truncate flex items-center gap-1">
                      <PhoneIcon className="h-3 w-3 text-blue-500" /> {formatPhone(client.phone_number)}
                    </span>
                    {client.email && (
                      <span className="text-sm text-gray-600 truncate flex items-center gap-1">
                        <MailIcon className="h-3 w-3 text-blue-500" /> {client.email}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 justify-center sm:justify-end flex-shrink-0">
                  <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                    <StarIcon className="h-3 w-3 text-yellow-300" /> Cliente
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                    {daysSinceCreated === 0 ? 'Hoje' : 
                     daysSinceCreated === 1 ? '1 dia' : 
                     daysSinceCreated < 30 ? `${daysSinceCreated} dias` :
                     `${Math.floor(daysSinceCreated / 30)} mês${Math.floor(daysSinceCreated / 30) > 1 ? 'es' : ''}`
                    }
                  </span>
                </div>
              </div>
              
              {/* Botões de ação - Centralizados em mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={handleSchedule}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm flex-1 sm:flex-none px-4 py-2"
                >
                  <CalendarIcon className="h-4 w-4 mr-1 text-white" /> Agendar
                </Button>
                
                {/* Drawer para Ver Mais */}
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 text-xs sm:text-sm flex-1 sm:flex-none px-4 py-2"
                    >
                      <EyeIcon className="h-4 w-4 mr-1 text-emerald-700" /> Ver Mais
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader className="text-center">
                        <div className="mx-auto mb-4">
                          <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-4 ring-emerald-100">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xl">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <DrawerTitle className="text-2xl font-bold text-gray-900">
                          {client.name}
                        </DrawerTitle>
                        <DrawerDescription className="text-emerald-600 font-medium">
                          Detalhes do Cliente
                        </DrawerDescription>
                      </DrawerHeader>
                      
                      <div className="px-4 pb-6">
                        <div className="space-y-4">
                          {/* Telefone */}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <PhoneIcon className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Telefone</p>
                              <p className="text-sm text-gray-600">{formatPhone(client.phone_number)}</p>
                            </div>
                          </div>
                          
                          {/* Email */}
                          {client.email && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <MailIcon className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Email</p>
                                <p className="text-sm text-gray-600">{client.email}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Documento */}
                          {client.document && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <UserIcon className="h-5 w-5 text-orange-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Documento</p>
                                <p className="text-sm text-gray-600">{client.document}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Data de Cadastro */}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Cadastrado em</p>
                              <p className="text-sm text-gray-600">
                                {new Date(client.created_at).toLocaleDateString('pt-BR')} 
                                <span className="text-xs text-gray-500 ml-2">
                                  ({daysSinceCreated === 0 ? 'hoje' : 
                                    daysSinceCreated === 1 ? 'há 1 dia' : 
                                    daysSinceCreated < 30 ? `há ${daysSinceCreated} dias` :
                                    `há ${Math.floor(daysSinceCreated / 30)} mês${Math.floor(daysSinceCreated / 30) > 1 ? 'es' : ''}`
                                  })
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DrawerFooter>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSchedule}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <CalendarIcon className="h-4 w-4 mr-1 text-white" /> Agendar Serviço
                          </Button>
                          <DrawerClose asChild>
                            <Button variant="outline" className="flex-1">
                              Fechar
                            </Button>
                          </DrawerClose>
                        </div>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
