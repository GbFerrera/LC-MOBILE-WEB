"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/auth";
import { Toaster, toast } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useEffect, useRef } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { io, Socket } from "socket.io-client";
import { useNotifications } from "@/hooks/use-notifications";

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  const socketRef = useRef<Socket | null>(null);
  const handledAppointmentsRef = useRef<Set<number | string>>(new Set());
  const { permission, isSupported, requestPermission, showNotification } = useNotifications();

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

  // Solicitar permissão de notificação ao autenticar
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    
    if (isSupported && permission === 'default') {
      requestPermission();
    }
  }, [loading, isAuthenticated, isLoginRoute, isSupported, permission, requestPermission]);

  // Conectar ao Socket para notificações de novos agendamentos
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem("@linkCallendar:token");
      const storedUserStr = localStorage.getItem("@linkCallendar:user");

      let companyId: string | undefined;

      try {
        const parsed = storedUserStr ? JSON.parse(storedUserStr) : null;
        companyId = parsed?.company_id ? String(parsed.company_id) : undefined;
      } catch {
        companyId = user?.company_id ? String(user.company_id) : undefined;
      }

      if (!companyId) {
        companyId = user?.company_id ? String(user.company_id) : undefined;
      }

      const baseURL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.linkcallendar.com';
      console.log('[Socket] Conectando ao servidor:', baseURL, 'Empresa:', companyId);

      const socket = io(baseURL, {
        transports: ["websocket"],
        path: "/socket.io",
        auth: token ? { token } : undefined,
        query: companyId ? { company_id: companyId } : undefined,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Conectado com sucesso');
      });

      socket.on('connect_error', (error) => {
        console.error('[Socket] Erro de conexão:', error);
      });

      const handleNewAppointment = async (payload: any) => {
        console.log('[Socket] Novo agendamento recebido:', payload);

        const id = payload?.appointment?.id;
        
        // Evitar duplicatas
        if (id && handledAppointmentsRef.current.has(id)) {
          console.log('[Socket] Agendamento já processado, ignorando');
          return;
        }
        if (id) handledAppointmentsRef.current.add(id);

        // Extrair dados do agendamento
        const profName = payload?.professional?.name;
        const clientName = payload?.client?.name;
        const start = payload?.appointment?.start_time;
        const date = payload?.appointment?.appointment_date;
        const hour = typeof start === 'string' ? start.substring(0, 5) : '';
        const d = typeof date === 'string' ? date.split('-').reverse().join('/') : '';
        
        const title = clientName
          ? `Novo agendamento com ${clientName}`
          : 'Novo agendamento criado';
        
        const body = profName && hour && d
          ? `${profName} • ${d} às ${hour}`
          : 'Novo agendamento';
        
        // Mostrar notificação nativa usando o hook
        await showNotification({
          title,
          body,
          tag: id ? String(id) : undefined,
          data: {
            url: '/agenda',
            appointmentId: id,
            professional: profName,
            client: clientName,
            date: d,
            time: hour
          }
        });

        console.log('[Socket] Notificação enviada com sucesso');
      };

      socket.on("appointments:new", handleNewAppointment);

      return () => {
        console.log('[Socket] Desconectando...');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('error');
        socket.off('disconnect');
        socket.off('appointments:new', handleNewAppointment);
        socket.disconnect();
      };
    } catch (e) {
      console.error('[Socket] Erro ao inicializar socket de notificações:', e);
    }
  }, [loading, isAuthenticated, isLoginRoute, user?.company_id, showNotification]);

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
