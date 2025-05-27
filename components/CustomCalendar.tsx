import React from 'react';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Função utilitária para combinar classes CSS
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CustomCalendarProps {
  date: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function CustomCalendar({ date, onDateChange }: CustomCalendarProps) {
  return (
    <CalendarComponent
      mode="single"
      selected={date}
      onSelect={onDateChange}
      className="rounded-md border"
      classNames={{
        day_selected: "!bg-white !text-emerald-800 !border-2 !border-emerald-600 !rounded-full",
        day: "h-9 w-9 p-0 font-normal text-center flex items-center justify-center",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
      }}
    />
  );
}
