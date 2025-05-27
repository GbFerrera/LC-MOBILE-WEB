"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeftIcon, PlusIcon, SearchIcon, StarIcon } from "lucide-react";
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Clientes</h1>
          <div className="w-6"></div> {/* This maintains the layout by adding an empty div with the same width as the button */}
        </div>
      </header>

      {/* Search */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Client Tabs */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">Carregando clientes...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-gray-500">Nenhum cliente encontrado</div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>


    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center p-3">
          <Avatar className="h-12 w-12 mr-3 border border-gray-200">
            <AvatarFallback className="bg-emerald-100 text-emerald-800">
              {client.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium flex items-center">
                  {client.name}
                </h3>
                <p className="text-sm text-gray-600">{client.phone_number}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                  Cliente
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Cadastro: {new Date(client.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Agendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Detalhes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
