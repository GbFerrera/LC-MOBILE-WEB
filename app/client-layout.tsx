"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/auth";
import { Toaster } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useEffect, useRef } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ColorProvider } from "@/contexts/ColorContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { io, Socket } from "socket.io-client";
import { useNotifications } from "@/hooks/use-notifications";
import AccessGuard from "@/components/AccessGuard";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { DynamicHead } from "@/components/DynamicHead";

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  const socketRef = useRef<Socket | null>(null);
  const handledAppointmentsRef = useRef<Set<number | string>>(new Set());
  const { permission, isSupported, requestPermission, showNotification, ensurePushSubscription } = useNotifications();

  const companyId = user?.company_id ? Number(user.company_id) : undefined;
  const { isBlocked: isCompanyBlocked } = useCompanyAccess(companyId);

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

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;

    if (isSupported && permission === "default") {
      requestPermission();
    }
  }, [loading, isAuthenticated, isLoginRoute, isSupported, permission, requestPermission, isCompanyBlocked]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;
    if (!isSupported) return;
    if (permission !== "granted") return;

    ensurePushSubscription({ companyId: user?.company_id, teamId: user?.id }).catch(() => {});
  }, [loading, isAuthenticated, isLoginRoute, isSupported, permission, user?.company_id, user?.id, ensurePushSubscription, isCompanyBlocked]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (isCompanyBlocked) return;
    if (typeof window === "undefined") return;

    try {
      const token = localStorage.getItem("@linkCallendar:token");
      const storedUserStr = localStorage.getItem("@linkCallendar:user");

      let socketCompanyId: string | undefined;

      try {
        const parsed = storedUserStr ? JSON.parse(storedUserStr) : null;
        socketCompanyId = parsed?.company_id ? String(parsed.company_id) : undefined;
      } catch {
        socketCompanyId = user?.company_id ? String(user.company_id) : undefined;
      }

      if (!socketCompanyId) {
        socketCompanyId = user?.company_id ? String(user.company_id) : undefined;
      }

      const baseURL =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://api.linkcallendar.com";

      const socket = io(baseURL, {
        transports: ["websocket"],
        path: "/socket.io",
        auth: token ? { token } : undefined,
        query: socketCompanyId ? { company_id: socketCompanyId } : undefined,
      });

      socketRef.current = socket;

      const handleNewAppointment = async (payload: any) => {
        const id = payload?.appointment?.id;
        const professionalId = payload?.appointment?.professional_id;
        const myId = user?.id ? Number(user.id) : undefined;

        if (myId && professionalId && Number(professionalId) !== myId) {
          return;
        }

        if (id && handledAppointmentsRef.current.has(id)) {
          return;
        }
        if (id) handledAppointmentsRef.current.add(id);

        const profName = payload?.professional?.name;
        const clientName = payload?.client?.name;
        const start = payload?.appointment?.start_time;
        const date = payload?.appointment?.appointment_date;
        const hour = typeof start === "string" ? start.substring(0, 5) : "";
        const d = typeof date === "string" ? date.split("-").reverse().join("/") : "";

        const title = clientName
          ? `Novo agendamento com ${clientName}`
          : "Novo agendamento criado";

        const body = profName && hour && d ? `${profName} • ${d} às ${hour}` : "Novo agendamento";

        await showNotification({
          title,
          body,
          tag: id ? String(id) : undefined,
          data: {
            url: "/agenda",
            appointmentId: id,
            professional: profName,
            client: clientName,
            date: d,
            time: hour,
          },
        });
      };

      socket.on("appointments:new", handleNewAppointment);

      return () => {
        socket.off("appointments:new", handleNewAppointment);
        socket.disconnect();
      };
    } catch (e) {
      console.error("[Socket] Erro ao inicializar socket de notificações:", e);
    }
  }, [loading, isAuthenticated, isLoginRoute, user?.company_id, showNotification, isCompanyBlocked, user?.id]);

  if (!isAuthenticated && !isLoginRoute) {
    return null;
  }

  if (isLoginRoute) {
    return (
      <div className="min-h-dvh w-full max-w-full min-w-0 overflow-x-clip overflow-y-auto" data-pwa-content>
        <div className="hidden">
          <DynamicHead />
        </div>
        {children}
      </div>
    );
  }

  return (
    <AccessGuard companyId={companyId}>
      <CompanyProvider>
        <SidebarProvider defaultOpen>
          <div className="flex min-h-dvh w-full max-w-full min-w-0 overflow-x-clip" data-pwa-shell>
            <Sidebar variant="inset">
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="min-w-0 max-w-full overflow-x-clip">
              <div className="hidden">
                <DynamicHead />
              </div>
              <div className="sticky top-0 z-10 border-b bg-primary text-primary-foreground">
                <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <div className="shrink-0 text-primary-foreground">
                    <SidebarTrigger />
                  </div>
                  <div className="min-w-0 truncate">
                    <HeaderCompanyName />
                  </div>
                </div>
              </div>
              <div className="min-w-0 max-w-full overflow-x-clip" data-pwa-content>
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </CompanyProvider>
    </AccessGuard>
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
