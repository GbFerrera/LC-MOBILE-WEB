"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AgendaPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");

  // Mock data - in a real app this would come from a database
  const appointments = [
    {
      id: 1,
      clientName: "João Silva",
      service: "Corte + Barba",
      time: "09:00",
      duration: 60,
      price: 70.0,
      status: "confirmed",
    },
    {
      id: 2,
      clientName: "Carlos Mendes",
      service: "Corte Degradê",
      time: "11:00",
      duration: 45,
      price: 45.0,
      status: "confirmed",
    },
    {
      id: 3,
      clientName: "Pedro Alves",
      service: "Barba",
      time: "14:30",
      duration: 30,
      price: 35.0,
      status: "pending",
    },
  ];

  // Format the current date for display
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  // Capitalize the first letter of the formatted date
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Agenda</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-emerald-700 hover:bg-emerald-600"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          <h2 className="font-medium text-emerald-800">{capitalizedDate}</h2>
          <Button variant="ghost" size="sm" className="text-gray-600">
            Próximo
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </Button>
        </div>

        <Tabs
          defaultValue="day"
          className="w-full"
          onValueChange={(v) => setView(v as "day" | "week" | "month")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
          <TabsContent value="day" className="mt-4">
            <div className="space-y-3">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum agendamento para hoje</p>
                  <Button
                    variant="outline"
                    className="mt-4 text-emerald-700 border-emerald-200"
                  >
                    + Novo Agendamento
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="week">
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                <div key={i} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - d.getDay() + i);
                const isToday = new Date().getDate() === d.getDate();
                return (
                  <Button
                    key={i}
                    variant={isToday ? "default" : "ghost"}
                    className={`h-10 ${
                      isToday
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "hover:bg-emerald-50"
                    }`}
                  >
                    {d.getDate()}
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 space-y-3">
              {appointments.slice(0, 2).map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="month">
            <div className="mb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                className="rounded-md border"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Time Slots */}
      <div className="p-4">
        <h3 className="font-medium text-gray-700 mb-3">Horários Disponíveis</h3>
        <div className="grid grid-cols-3 gap-2">
          {["08:00", "08:30", "09:30", "10:00", "10:30", "13:00"].map(
            (time, i) => (
              <Button
                key={i}
                variant="outline"
                className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              >
                {time}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto p-4">
        <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-6 rounded-xl shadow-lg">
          + Novo Agendamento
        </Button>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: any }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="flex">
          <div
            className={`w-2 ${
              appointment.status === "confirmed"
                ? "bg-emerald-500"
                : "bg-amber-400"
            }`}
          ></div>
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{appointment.clientName}</h3>
                <p className="text-sm text-gray-600">{appointment.service}</p>
              </div>
              <div className="text-right">
                <span className="font-medium text-emerald-700">
                  R$ {appointment.price.toFixed(2).replace(".", ",")}
                </span>
                <p className="text-sm text-gray-500">
                  {appointment.duration} min
                </p>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                {appointment.time}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-500"
                >
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
