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
import { api } from "@/services/api";
import { useNotificationSound } from "@/hooks/useNotificationSound";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function LayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  const socketRef = useRef<Socket | null>(null);
  const handledAppointmentsRef = useRef<Set<number | string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [, setNotifications] = useState<{
    title: string;
    time: string;
    profName?: string;
    clientName?: string;
  }[]>([]);
  
  const { playNotificationSound } = useNotificationSound();

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
    if (typeof window === "undefined") return;

    // Listener para mensagens do service worker (push notifications)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') {
        playNotificationSound();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    try {
      const alreadyRequested = localStorage.getItem("@linkCallendar:notifications_permission_requested");
      const isSupported = "Notification" in window;
      if (isSupported && Notification.permission === "default" && !alreadyRequested) {
        localStorage.setItem("@linkCallendar:notifications_permission_requested", "1");
        Notification.requestPermission()
          .then((p) => setNotificationPermission(p))
          .catch(() => {});
      } else if (isSupported) {
        setNotificationPermission(Notification.permission);
      }
    } catch {
    }

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
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

      const baseURL =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3131";

      const socket = io(baseURL, {
        transports: ["websocket"],
        path: "/socket.io",
        auth: token ? { token } : undefined,
        query: companyId ? { company_id: companyId } : undefined,
      });

      socketRef.current = socket;

      const showSystemNotification = async (title: string, body: string, tag?: string) => {
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        try {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
              body,
              icon: "/icon.png",
              badge: "/favicon.ico",
              tag: tag || "lc-appointment",
              requireInteraction: true,
            });
            return;
          }

          new Notification(title, {
            body,
            icon: "/icon.png",
            tag: tag || "lc-appointment",
          });
        } catch {
        }
      };

      const handleNewAppointment = (payload: any) => {
        const appointment = payload?.appointment;
        if (!appointment) return;

        const appointmentId = appointment?.id;
        if (
          appointmentId !== undefined &&
          handledAppointmentsRef.current.has(appointmentId)
        ) {
          return;
        }
        if (appointmentId !== undefined) {
          handledAppointmentsRef.current.add(appointmentId);
        }

        const payloadProfessionalId = appointment?.professional_id;
        if (
          professionalId &&
          payloadProfessionalId !== undefined &&
          String(payloadProfessionalId) !== String(professionalId)
        ) {
          return;
        }

        const profName = payload?.professional?.name;
        const clientName = payload?.client?.name;
        
        // Extrair horário e data do agendamento (não horário atual)
        const startTime = appointment?.start_time;
        const appointmentDate = appointment?.appointment_date;
        
        // Formatar horário do agendamento (HH:MM)
        const appointmentTime = typeof startTime === 'string' ? startTime.substring(0, 5) : '';
        
        // Formatar data do agendamento (DD/MM/YYYY)
        const formattedDate = typeof appointmentDate === 'string' 
          ? appointmentDate.split('-').reverse().join('/') 
          : '';

        const title =
          profName && clientName
            ? `Novo agendamento com ${clientName}`
            : "Novo agendamento criado";

        // Usar horário do agendamento na descrição
        const appointmentInfo = appointmentTime && formattedDate
          ? `${formattedDate} às ${appointmentTime}`
          : appointmentTime
          ? `Horário: ${appointmentTime}`
          : 'Novo agendamento';

        const systemBody =
          profName && clientName
            ? `${profName} • ${appointmentInfo}`
            : appointmentInfo;

        // Salvar horário atual para timestamp da notificação
        const notificationTime = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        setNotifications((list) =>
          [{ title, time: notificationTime, profName, clientName }, ...list].slice(0, 20)
        );

        // Reproduzir som da notificação
        playNotificationSound();

        showSystemNotification(title, systemBody, appointmentId !== undefined ? String(appointmentId) : undefined);

        toast(title, {
          description: systemBody,
        });
      };

      socket.on("appointments:new", handleNewAppointment);

      return () => {
        socket.off("appointments:new", handleNewAppointment);
        socket.disconnect();
        socketRef.current = null;
        
        // Cleanup do listener do service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        }
      };
    } catch {
      return;
    }
  }, [isAuthenticated, isLoginRoute, loading, user?.company_id, user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isLoginRoute) return;
    if (typeof window === 'undefined') return;

    const initPush = async () => {
      if (!('serviceWorker' in navigator)) return;
      if (!('PushManager' in window)) return;
      if (!('Notification' in window)) return;
      if (notificationPermission !== 'granted') return;

      const storedUserStr = localStorage.getItem('@linkCallendar:user');
      if (!storedUserStr) return;

      let professionalId: string | undefined;
      let companyId: string | undefined;

      try {
        const parsed = JSON.parse(storedUserStr);
        professionalId = parsed?.id ? String(parsed.id) : undefined;
        companyId = parsed?.company_id ? String(parsed.company_id) : undefined;
      } catch {
        professionalId = user?.id ? String(user.id) : undefined;
        companyId = user?.company_id ? String(user.company_id) : undefined;
      }

      if (!professionalId || !companyId) return;

      const reg = await navigator.serviceWorker.ready;

      const keyResponse = await api.get('/push/vapid-public-key');
      const publicKey = keyResponse?.data?.publicKey;
      if (!publicKey) return;

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await api.post(
        '/push/subscribe',
        {
          professional_id: parseInt(professionalId),
          subscription,
          user_agent: navigator.userAgent,
        },
        {
          headers: {
            company_id: companyId,
          },
        }
      );
    };

    initPush().catch(() => {});
  }, [isAuthenticated, isLoginRoute, loading, user?.company_id, user?.id, notificationPermission]);

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
