"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BellIcon, CalendarIcon, SettingsIcon, UsersIcon, WalletIcon, LightbulbIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  // Mock data - in a real app this would come from a database
  const barberInfo = {
    name: "Samuel",
    businessName: "Barbearia Link",
    avatarUrl: "/barber-avatar.png",
    todayStats: {
      clients: 3,
      revenue: 1250.0,
    },
    upcomingAppointments: [],
    reminders: [
      {
        id: 1,
        type: "inventory",
        title: "Reposição de produtos",
        description: "Gel, pomada e shampoo com estoque baixo",
        icon: ShoppingBagIcon,
        color: "bg-amber-100 text-amber-700"
      },
      {
        id: 2,
        type: "birthday",
        title: "Aniversariante da semana",
        description: "Envie uma mensagem para Marco Antônio",
        icon: LightbulbIcon,
        color: "bg-blue-100 text-blue-700"
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 rounded-b-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-emerald-100">
              <AvatarImage src={barberInfo.avatarUrl} alt={barberInfo.name} />
              <AvatarFallback className="bg-emerald-600">
                {barberInfo.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-xl">{barberInfo.name}</h1>
              <p className="text-emerald-100 text-sm">{barberInfo.businessName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-emerald-700 hover:bg-emerald-600">
              <BellIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-emerald-700 hover:bg-emerald-600">
              <WalletIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="bg-white text-emerald-950 shadow-md border-none">
            <CardContent className="p-3">
              <p className="text-emerald-600 text-sm font-medium">Hoje</p>
              <h2 className="text-xl font-bold">{barberInfo.todayStats.clients} clientes</h2>
            </CardContent>
          </Card>
          <Card className="bg-white text-emerald-950 shadow-md border-none">
            <CardContent className="p-3">
              <p className="text-emerald-600 text-sm font-medium">Receita hoje</p>
              <h2 className="text-xl font-bold">R$ {barberInfo.todayStats.revenue.toFixed(2).replace('.', ',')}</h2>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Navigation */}
      <div className="grid grid-cols-4 gap-2 px-4 py-6">
        <Link href="/agenda" className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-emerald-700" />
          </div>
          <span className="text-xs font-medium text-gray-700">Agenda</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <UsersIcon className="h-6 w-6 text-emerald-700" />
          </div>
          <span className="text-xs font-medium text-gray-700">Clientes</span>
        </Link>
        <Link href="/financas" className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <WalletIcon className="h-6 w-6 text-emerald-700" />
          </div>
          <span className="text-xs font-medium text-gray-700">Finanças</span>
        </Link>
        <Link href="/ajustes" className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-emerald-700" />
          </div>
          <span className="text-xs font-medium text-gray-700">Ajustes</span>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="px-4 mb-4">
        <div className="bg-emerald-800 rounded-lg p-3">
          <h2 className="text-white font-semibold text-lg">Próximos Agendamentos</h2>
        </div>
        
        <div className="mt-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          {barberInfo.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {/* Appointment items would go here */}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Nenhum agendamento para hoje</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              Ver Agenda Completa
            </Button>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="px-4 mb-6">
        <div className="bg-emerald-800 rounded-lg p-3">
          <h2 className="text-white font-semibold text-lg">Lembretes</h2>
        </div>
        
        <div className="mt-3 space-y-3">
          {barberInfo.reminders.map((reminder) => (
            <Card key={reminder.id} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start p-4">
                  <div className={`${reminder.color} p-2 rounded-full mr-3`}>
                    <reminder.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{reminder.title}</h3>
                    <p className="text-sm text-gray-600">{reminder.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto px-4 mb-6">
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-6 rounded-xl shadow-lg">
          + Novo Agendamento
        </Button>
      </div>
    </div>
  );
}