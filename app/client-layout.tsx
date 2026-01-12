"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/auth";
import { Toaster, toast } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useEffect, useRef, useState } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { io, Socket } from "socket.io-client";

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  const socketRef = useRef<Socket | null>(null);
  const handledAppointmentsRef = useRef<Set<number | string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notifications, setNotifications] = useState<{
    title: string;
    time: string;
    profName?: string;
    clientName?: string;
  }[]>([]);

  function HeaderCompanyName() {
    const { currentCompanyName } = useCompanyContext();
    return <span className="text-lg font-bold">{currentCompanyName || "Link Callendar"}</span>;
  }

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isLoginRoute) {
      router.push("/Login");
    } else if (isAuthenticated && isLoginRoute) {
      router.push("/");
    }
  }, [isAuthenticated, loading, isLoginRoute, router]);

  // Conectar ao Socket para notificações (seguindo padrão do Link-Front)
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (typeof window === 'undefined') return;

    try {
      // Inicializar áudio (igual ao Link-Front)
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification-sound.mp3');
        audioRef.current.preload = 'auto';
        audioRef.current.volume = 0.7;
      }

      const token = localStorage.getItem("@linkCallendar:token");
      const storedUserStr = localStorage.getItem("@linkCallendar:user");

      let professionalId: string | undefined;
      let companyId: string | undefined;

      try {
        const parsed = storedUserStr ? JSON.parse(storedUserStr) : null;
        professionalId = parsed?.id ? String(parsed.id) : undefined;
        companyId = parsed?.company_id ? String(parsed.company_id) : undefined;
      } catch {
        professionalId = user?.id ? String(user.id) : undefined;
        companyId = user?.company_id ? String(user.company_id) : undefined;
      }

      if (!companyId) {
        companyId = user?.company_id ? String(user.company_id) : undefined;
      }

      const baseURL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3131';
      console.log('[socket] connecting to', baseURL, 'company', companyId);

      const socket = io(baseURL, {
        transports: ["websocket"],
        path: "/socket.io",
        auth: token ? { token } : undefined,
        query: companyId ? { company_id: companyId } : undefined,
      });

      socketRef.current = socket;


      const handleNewAppointment = (payload: any) => {
        const id = payload?.appointment?.id;
        if (id && handledAppointmentsRef.current.has(id)) {
          return;
        }
        if (id) handledAppointmentsRef.current.add(id);

        audioRef.current?.play().catch(() => {});

        const profName = payload?.professional?.name;
        const clientName = payload?.client?.name;
        const start = payload?.appointment?.start_time;
        const date = payload?.appointment?.appointment_date;
        const hour = typeof start === 'string' ? start.substring(0,5) : '';
        const d = typeof date === 'string' ? date.split('-').reverse().join('/') : '';
        const title = profName && clientName
          ? `Novo agendamento do profissional ${profName} com o cliente ${clientName}`
          : `Novo agendamento criado`;
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setNotifications((list) => [{ title, time, profName, clientName }, ...list].slice(0, 20));
        
        toast(title, {
          description: `${profName} • ${d} às ${hour}`,
        });
      };

      socket.on("appointments:new", handleNewAppointment);

      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('error');
        socket.off('disconnect');
        socket.off('appointments:new', handleNewAppointment);
        socket.disconnect();
      };
    } catch (e) {
      console.error('Erro ao inicializar socket de notificações:', e);
    }
  }, [loading, user?.company_id]);

  if (!isAuthenticated && !isLoginRoute) {
    return null;
  }

  if (isLoginRoute) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <CompanyProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full">
          <Sidebar variant="inset">
            <AppSidebar />
          </Sidebar>
          <SidebarInset>
            <div className="sticky top-0 z-10 border-b text-white" style={{ backgroundColor: "#3D583F" }}>
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="text-white">
                  <SidebarTrigger />
                </div>
                <HeaderCompanyName />
              </div>
            </div>
            <div className="">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
      <Toaster 
        position="top-center"
        richColors={true}
        expand={true}
        closeButton={true}
        theme="light"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #ccc',
          },
        }}
      />
    </AuthProvider>
  );
}
