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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

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

  // Solicitar permissão de notificação
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (typeof window === 'undefined') return;

    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } else if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    requestNotificationPermission();
  }, [loading, isAuthenticated, isLoginRoute]);

  // Conectar ao Socket para notificações
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (typeof window === 'undefined') return;

    try {
      // Inicializar áudio
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

      const baseURL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.linkcallendar.com';
      console.log('[socket] connecting to', baseURL, 'company', companyId);

      const socket = io(baseURL, {
        transports: ["websocket"],
        path: "/socket.io",
        auth: token ? { token } : undefined,
        query: companyId ? { company_id: companyId } : undefined,
      });

      socketRef.current = socket;


      const showNativeNotification = async (title: string, body: string, tag?: string) => {
        if (typeof window === 'undefined') return;
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        try {
          // Tentar usar Service Worker para notificação nativa
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
              body,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: tag || 'lc-appointment',
              requireInteraction: false,
              silent: false,
              data: {
                url: '/agenda',
                appointmentId: tag
              }
            });
            return;
          }

          // Fallback: notificação direta
          new Notification(title, {
            body,
            icon: '/logo.png',
            tag: tag || 'lc-appointment',
            requireInteraction: false,
            silent: false
          });
        } catch (error) {
          console.log('[Notificação] Erro ao mostrar notificação nativa:', error);
        }
      };

      const handleNewAppointment = async (payload: any) => {
        const id = payload?.appointment?.id;
        if (id && handledAppointmentsRef.current.has(id)) {
          return;
        }
        if (id) handledAppointmentsRef.current.add(id);

        // Tocar som
        audioRef.current?.play().catch(() => {});

        const profName = payload?.professional?.name;
        const clientName = payload?.client?.name;
        const start = payload?.appointment?.start_time;
        const date = payload?.appointment?.appointment_date;
        const hour = typeof start === 'string' ? start.substring(0,5) : '';
        const d = typeof date === 'string' ? date.split('-').reverse().join('/') : '';
        
        const title = clientName
          ? `Novo agendamento com ${clientName}`
          : 'Novo agendamento criado';
        
        const body = profName && hour && d
          ? `${profName} • ${d} às ${hour}`
          : 'Novo agendamento';
        
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setNotifications((list) => [{ title, time, profName, clientName }, ...list].slice(0, 20));
        
        // Mostrar notificação nativa do sistema (iOS/Android)
        await showNativeNotification(title, body, id ? String(id) : undefined);
        
        // Toast como backup
        toast(title, {
          description: body,
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
