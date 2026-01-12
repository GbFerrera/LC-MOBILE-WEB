"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  data?: any;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Verificar suporte a notificações
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
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

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification
  };
}
