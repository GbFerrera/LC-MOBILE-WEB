"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  data?: any;
}

type NotificationSupportReason =
  | 'ok'
  | 'no_notification_api'
  | 'no_service_worker'
  | 'no_push_manager'
  | 'not_secure_context'
  | 'ios_requires_install';

type EnsurePushResult =
  | { ok: true }
  | { ok: false; reason: 'not_supported' | 'no_service_worker' | 'permission_denied' | 'missing_public_key' | 'api_error' | 'push_subscribe_error' | 'backend_subscribe_error'; message?: string };

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [supportReason, setSupportReason] = useState<NotificationSupportReason>('ok');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Verificar suporte a notificações
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      Boolean((navigator as any).standalone);
    
    const notificationApi = 'Notification' in window;
    const serviceWorkerApi = 'serviceWorker' in navigator;
    const pushApi = 'PushManager' in window;
    const secureContext = Boolean((window as any).isSecureContext);

    let reason: NotificationSupportReason = 'ok';
    if (!secureContext) reason = 'not_secure_context';
    else if (!notificationApi) reason = 'no_notification_api';
    else if (!serviceWorkerApi) reason = 'no_service_worker';
    else if (!pushApi) reason = 'no_push_manager';
    else if (isIOS && !isStandalone) reason = 'ios_requires_install';

    setSupportReason(reason);
    setIsSupported(reason === 'ok');
    
    if (notificationApi) {
      setPermission(Notification.permission);
    }

    // Inicializar áudio de notificação
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7;
    }
  }, []);

  // Registrar Service Worker
  useEffect(() => {
    if (!isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/notification-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('[Notifications] Service Worker registrado:', reg);
        setRegistration(reg);

        // Aguardar o Service Worker estar pronto
        await navigator.serviceWorker.ready;
        console.log('[Notifications] Service Worker pronto');

      } catch (error) {
        console.error('[Notifications] Erro ao registrar Service Worker:', error);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  const refreshPushState = useCallback(async () => {
    if (!registration) {
      setIsPushEnabled(null);
      return;
    }

    try {
      const sub = await registration.pushManager.getSubscription();
      setIsPushEnabled(Boolean(sub));
    } catch {
      setIsPushEnabled(null);
    }
  }, [registration]);

  useEffect(() => {
    if (!registration) return;
    refreshPushState();
  }, [registration, refreshPushState]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.log('[Notifications] Notificações não suportadas');
      return 'denied';
    }

    if (permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[Notifications] Permissão:', result);
      return result;
    } catch (error) {
      console.error('[Notifications] Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }, [isSupported, permission]);

  // Mostrar notificação nativa
  const showNotification = useCallback(async (payload: NotificationPayload) => {
    console.log('[Notifications] Tentando mostrar notificação:', payload);

    // Tocar som
    try {
      await audioRef.current?.play();
    } catch (e) {
      console.log('[Notifications] Não foi possível tocar o som');
    }

    // Verificar permissão
    if (permission !== 'granted') {
      console.log('[Notifications] Permissão não concedida, solicitando...');
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        console.log('[Notifications] Permissão negada, mostrando apenas toast');
        toast(payload.title, { description: payload.body });
        return;
      }
    }

    try {
      // Tentar usar Service Worker (melhor para PWA)
      if (registration) {
        console.log('[Notifications] Usando Service Worker para notificação');
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: payload.tag || 'lc-appointment',
          requireInteraction: false,
          silent: false,
          data: payload.data || { url: '/agenda' }
        } as any);
        console.log('[Notifications] Notificação mostrada via Service Worker');
        return;
      }

      // Fallback: Notification API direta
      console.log('[Notifications] Usando Notification API direta');
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/logo.png',
        tag: payload.tag || 'lc-appointment',
        requireInteraction: false,
        silent: false
      } as any);

      notification.onclick = () => {
        window.focus();
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
        notification.close();
      };

      console.log('[Notifications] Notificação mostrada via API direta');

    } catch (error) {
      console.error('[Notifications] Erro ao mostrar notificação:', error);
      // Fallback final: toast
      toast(payload.title, { description: payload.body });
    }
  }, [permission, registration, requestPermission]);

  const ensurePushSubscription = useCallback(async (params?: { companyId?: number | string; teamId?: number | string; clientId?: number | string }): Promise<EnsurePushResult> => {
    if (!isSupported) return { ok: false, reason: 'not_supported' };
    if (!registration) return { ok: false, reason: 'no_service_worker' };

    let currentPermission = permission;
    if (currentPermission !== 'granted') {
      currentPermission = await requestPermission();
    }
    if (currentPermission !== 'granted') return { ok: false, reason: 'permission_denied' };

    const companyId = params?.companyId;
    const headers = companyId ? { company_id: String(companyId) } : undefined;

    let publicKey: string | undefined;
    try {
      const { data } = await api.get('/web-push/public-key', { headers });
      publicKey = data?.publicKey as string | undefined;
    } catch (e: any) {
      return { ok: false, reason: 'api_error', message: e?.message };
    }
    if (!publicKey) return { ok: false, reason: 'missing_public_key' };

    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      try {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      } catch (e: any) {
        const msg = e?.name && e?.message ? `${e.name}: ${e.message}` : e?.message;
        return { ok: false, reason: 'push_subscribe_error', message: msg };
      }
    }

    try {
      await api.post('/web-push/subscribe', {
        subscription: sub,
        team_id: params?.teamId,
        client_id: params?.clientId,
        company_id: companyId,
      }, { headers });
    } catch (e: any) {
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message || e?.message;
      const msg = status ? `${status}: ${apiMsg}` : apiMsg;
      return { ok: false, reason: 'backend_subscribe_error', message: msg };
    }

    setIsPushEnabled(true);
    return { ok: true };
  }, [isSupported, registration, permission, requestPermission]);

  const disablePushSubscription = useCallback(async (params?: { companyId?: number | string }) => {
    if (!registration) return { ok: false, reason: 'no_service_worker' as const };

    const sub = await registration.pushManager.getSubscription();
    if (!sub) {
      setIsPushEnabled(false);
      return { ok: true as const };
    }

    const companyId = params?.companyId;
    const headers = companyId ? { company_id: String(companyId) } : undefined;

    try {
      await api.post('/web-push/unsubscribe', { endpoint: sub.endpoint }, { headers });
    } catch {
    }

    await sub.unsubscribe();
    setIsPushEnabled(false);
    return { ok: true as const };
  }, [registration]);

  return {
    permission,
    isSupported,
    supportReason,
    isPushEnabled,
    requestPermission,
    showNotification,
    ensurePushSubscription,
    disablePushSubscription,
    refreshPushState,
  };
}
