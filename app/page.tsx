"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BellIcon,
  CalendarIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
  LightbulbIcon,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";

interface Service {
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  document: string;
}

interface Schedule {
  id: number;
  professional_id: number;
  company_id: number;
  date: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  is_day_off: boolean;
  created_at: string;
  updated_at: string;
  is_specific_date: boolean;
}

interface Appointment {
  id: number;
  client: Client;
  services: Service[];
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}

interface ScheduleResponse {
  schedule: Schedule;
  appointments: Appointment[];
}

export default function Home() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        const userId = user?.id || "0";

        const response = await api.get(
          `/schedules/${userId}/date/${formattedDate}`
        );
        setScheduleData(response.data);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
        setError("Não foi possível carregar os agendamentos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Mock data - in a real app this would come from a database
  const barberInfo = {
    name: user?.name || "",
    avatarUrl: "/placeholder-avatar.jpg",
    reminders: [
      {
        id: 1,
        title: "Comprar produtos",
        description: "Repor estoque de gel e pomada",
        icon: ShoppingBagIcon,
        color: "bg-blue-100 text-blue-600",
      },
      {
        id: 2,
        title: "Manutenção",
        description: "Fazer manutenção nas máquinas",
        icon: LightbulbIcon,
        color: "bg-yellow-100 text-yellow-600",
      },
    ],
  };

  const appointments = scheduleData?.appointments || [];
  const schedule = scheduleData?.schedule;

  // Atualiza o horário atual a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const verifyUser = () => {
    if (!user) {
      router.push("/login");
    }
  };
  useEffect(() => {
    verifyUser();
  }, [user]);

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
              <p className="text-emerald-100 text-sm">
                {!isLoading && schedule && (
                  <span className="block text-emerald-200 mt-1">
                    {schedule.is_day_off
                      ? "Hoje é dia de folga"
                      : `Horário: ${schedule.start_time} - ${schedule.end_time}`}
                    {" • "}
                    {appointments.length}{" "}
                    {appointments.length === 1 ? "agendamento" : "agendamentos"}{" "}
                    hoje
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-emerald-700 hover:bg-emerald-600"
            >
              <BellIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-emerald-700 hover:bg-emerald-600"
            >
              <WalletIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Agendamentos Hoje</div>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : appointments.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Horário de Trabalho</div>
                <div className="text-lg font-medium">
                  {isLoading || !schedule
                    ? "..."
                    : schedule.is_day_off
                    ? "Dia de folga"
                    : `${schedule.start_time} - ${schedule.end_time}`}
                </div>
              </CardContent>
            </Card>
          </div>
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
          <h2 className="text-white font-semibold text-lg">
            Próximos Agendamentos
          </h2>
        </div>

        <div className="mt-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center p-3 border rounded-lg"
                >
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              <p>{error}</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-start p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 w-16 font-medium text-gray-900">
                    {appointment.start_time.slice(0, 5)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{appointment.client.name}</div>
                    <div className="text-sm text-gray-500">
                      {appointment.services
                        .map((s) => s.service_name)
                        .join(", ")}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {appointment.status === "pending"
                        ? "Pendente"
                        : "Confirmado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Nenhum agendamento para hoje</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/agenda">
              <Button
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Ver Agenda Completa
              </Button>
            </Link>
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
            <Card
              key={reminder.id}
              className="border-none shadow-sm overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex items-start p-4">
                  <div className={`${reminder.color} p-2 rounded-full mr-3`}>
                    <reminder.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{reminder.title}</h3>
                    <p className="text-sm text-gray-600">
                      {reminder.description}
                    </p>
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
