'use client';

import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Verificar se as notificações são suportadas
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Registrar o service worker
      navigator.serviceWorker.register('/custom-sw.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg);
          setRegistration(reg);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Notificações não são suportadas neste navegador');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      throw error;
    }
  };

  const showNotification = async (title, options = {}) => {
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação não concedida');
    }

    if (!registration) {
      throw new Error('Service Worker não registrado');
    }

    const defaultOptions = {
      body: 'Nova notificação',
      icon: '/icon.png',
      badge: '/favicon.ico',
      tag: 'lc-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    };

    const notificationOptions = { ...defaultOptions, ...options };

    try {
      await registration.showNotification(title, notificationOptions);
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      throw error;
    }
  };

  const showTestNotification = () => {
    if (!registration) {
      throw new Error('Service Worker não registrado');
    }

    // Enviar mensagem para o service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_TEST_NOTIFICATION'
      });
    }
  };

  const scheduleNotification = (title, options = {}, delay = 5000) => {
    setTimeout(() => {
      showNotification(title, options);
    }, delay);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showTestNotification,
    scheduleNotification
  };
};

export default useNotifications;