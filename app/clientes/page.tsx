"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeftIcon, PlusIcon, SearchIcon, StarIcon } from "lucide-react";
import Link from "next/link";

export default function ClientesPage() {
  // Mock data - in a real app this would come from a database
  const clients = [
    {
      id: 1,
      name: "João Silva",
      phone: "(11) 99876-5432",
      lastVisit: "21/05/2025",
      preferredService: "Corte + Barba",
      avatar: "/avatars/joao.png",
      favorite: true,
      visits: 12,
    },
    {
      id: 2,
      name: "Carlos Mendes",
      phone: "(11) 98765-4321",
      lastVisit: "15/05/2025",
      preferredService: "Corte Degradê",
      avatar: "/avatars/carlos.png",
      favorite: false,
      visits: 8,
    },
    {
      id: 3,
      name: "Pedro Alves",
      phone: "(11) 97654-3210",
      lastVisit: "10/05/2025",
      preferredService: "Barba",
      avatar: "/avatars/pedro.png",
      favorite: true,
      visits: 5,
    },
    {
      id: 4,
      name: "Marcos Oliveira",
      phone: "(11) 96543-2109",
      lastVisit: "05/05/2025",
      preferredService: "Corte Simples",
      avatar: "/avatars/marcos.png",
      favorite: false,
      visits: 3,
    },
    {
      id: 5,
      name: "Lucas Ferreira",
      phone: "(11) 95432-1098",
      lastVisit: "01/05/2025",
      preferredService: "Corte + Barba",
      avatar: "/avatars/lucas.png",
      favorite: false,
      visits: 2,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Clientes</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-emerald-700 hover:bg-emerald-600"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            <TabsTrigger value="recent">Recentes</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">
            <div className="space-y-3">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="favorites" className="mt-0">
            <div className="space-y-3">
              {clients
                .filter((client) => client.favorite)
                .map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="recent" className="mt-0">
            <div className="space-y-3">
              {clients
                .sort(
                  (a, b) =>
                    new Date(
                      b.lastVisit.split("/").reverse().join("-")
                    ).getTime() -
                    new Date(
                      a.lastVisit.split("/").reverse().join("-")
                    ).getTime()
                )
                .slice(0, 3)
                .map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto p-4">
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-6 rounded-xl shadow-lg">
          + Novo Cliente
        </Button>
      </div>
    </div>
  );
}

function ClientCard({ client }: { client: any }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center p-3">
          <Avatar className="h-12 w-12 mr-3 border border-gray-200">
            <AvatarImage src={client.avatar} alt={client.name} />
            <AvatarFallback className="bg-emerald-100 text-emerald-800">
              {client.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium flex items-center">
                  {client.name}
                  {client.favorite && (
                    <StarIcon className="h-4 w-4 text-amber-400 ml-1" />
                  )}
                </h3>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                  {client.visits} visitas
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Último: {client.lastVisit}
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
