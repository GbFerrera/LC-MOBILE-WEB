"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/auth";
import { Toaster, toast } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ColorProvider } from "@/contexts/ColorContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { io, Socket } from "socket.io-client";
import { useNotifications } from "@/hooks/use-notifications";
import { api } from "@/services/api";

interface CompanyAccessStatus {
  access_allowed: boolean;
  company_name: string;
  payment_status: string;
  last_access_date?: string;
  payment_due_date?: string;
  blocked_reason?: string;
}

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  const socketRef = useRef<Socket | null>(null);
  const handledAppointmentsRef = useRef<Set<number | string>>(new Set());
  const { permission, isSupported, requestPermission, showNotification, ensurePushSubscription } = useNotifications();
  const [companyAccessStatus, setCompanyAccessStatus] = useState<CompanyAccessStatus | null>(null);
  const [isCompanyAccessLoading, setIsCompanyAccessLoading] = useState(false);
  const [isCompanyBlocked, setIsCompanyBlocked] = useState(false);

  const companyId = user?.company_id ? Number(user.company_id) : undefined;

  const paymentLink = useMemo(() => {
    if (!companyId || !companyAccessStatus?.company_name) return "";
    return `https://pay.linkcallendar.com/empresa/${companyId}?name=${encodeURIComponent(companyAccessStatus.company_name)}`;
  }, [companyId, companyAccessStatus?.company_name]);

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

  const checkCompanyAccess = async () => {
    if (!companyId) {
      setCompanyAccessStatus(null);
      setIsCompanyBlocked(false);
      setIsCompanyAccessLoading(false);
      return;
    }

    try {
      setIsCompanyAccessLoading(true);
      const response = await api.get("/companies/check-access", {
        headers: {
          company_id: companyId.toString(),
        },
      });

      const status = response.data as CompanyAccessStatus;
      setCompanyAccessStatus(status);
      setIsCompanyBlocked(!status.access_allowed);

      if (!status.access_allowed) {
        toast.error(`Acesso bloqueado: ${status.blocked_reason || "Entre em contato com o suporte"}`);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setIsCompanyBlocked(true);
        const errorData = error.response.data || {};
        setCompanyAccessStatus({
          access_allowed: false,
          company_name: errorData.company_name || "Empresa",
          payment_status: errorData.payment_status || "unknown",
          blocked_reason: errorData.message || "Acesso bloqueado",
        });
        toast.error(errorData.message || "Acesso bloqueado");
        return;
      }

      toast.error("Erro ao verificar acesso da empresa");
    } finally {
      setIsCompanyAccessLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    checkCompanyAccess();
  }, [loading, isAuthenticated, isLoginRoute, companyId]);

  // Solicitar permissão de notificação ao autenticar
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;
    
    if (isSupported && permission === 'default') {
      requestPermission();
    }
  }, [loading, isAuthenticated, isLoginRoute, isSupported, permission, requestPermission, isCompanyBlocked]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;
    if (!isSupported) return;
    if (permission !== 'granted') return;

    ensurePushSubscription({ companyId: user?.company_id, teamId: user?.id }).catch(() => {});
  }, [loading, isAuthenticated, isLoginRoute, isSupported, permission, user?.company_id, user?.id, ensurePushSubscription, isCompanyBlocked]);

  // Conectar ao Socket para notificações de novos agendamentos
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;
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
        const professionalId = payload?.appointment?.professional_id;
        const myId = user?.id ? Number(user.id) : undefined;

        if (myId && professionalId && Number(professionalId) !== myId) {
          return;
        }
        
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
  }, [loading, isAuthenticated, isLoginRoute, user?.company_id, showNotification, isCompanyBlocked, user?.id]);

  if (!isAuthenticated && !isLoginRoute) {
    return null;
  }

  if (isLoginRoute) {
    return <div className="min-h-dvh w-full overflow-x-hidden overflow-y-auto">{children}</div>;
  }

  if (isCompanyAccessLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center px-6">
          <div className="text-lg font-semibold text-gray-800">Verificando acesso...</div>
          <div className="text-sm text-gray-600 mt-1">LinkCallendar</div>
        </div>
      </div>
    );
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
            <div className={isCompanyBlocked ? "pointer-events-none select-none" : ""}>{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {isCompanyBlocked && companyAccessStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="text-xl font-bold text-gray-900">Acesso suspenso</div>
            <div className="text-sm text-gray-600 mt-2">{companyAccessStatus.company_name}</div>
            <div className="text-sm text-gray-600 mt-4">
              {companyAccessStatus.blocked_reason || "O acesso ao sistema foi temporariamente suspenso."}
            </div>

            <div className="space-y-3 mt-6">
              <Button
                className="w-full bg-[#236F5D] hover:bg-[#1e5d4f]"
                onClick={() => {
                  const whatsappNumber = "556298516080";
                  const message = `Olá! Preciso reativar minha conta da empresa ${companyAccessStatus.company_name}. Gostaria de realizar o pagamento.`;
                  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, "_blank");
                }}
              >
                Falar no WhatsApp
              </Button>

              {paymentLink && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(paymentLink, "_blank")}
                >
                  Abrir link de pagamento
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => checkCompanyAccess()}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )}
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
      <ColorProvider>
        <LayoutContent>{children}</LayoutContent>
      </ColorProvider>
      <Toaster
        position="top-center"
        closeButton
        gap={14}
        offset={16}
        theme="light"
        toastOptions={{
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
