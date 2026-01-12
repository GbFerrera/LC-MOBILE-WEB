// Service Worker para notificações PWA - Link Callendar
const CACHE_NAME = 'lc-notifications-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing notification service worker');
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating notification service worker');
  event.waitUntil(self.clients.claim());
});

// Listener para notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event);
  
  let notificationData = {
    title: 'Novo Agendamento',
    body: 'Você tem um novo agendamento',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'lc-appointment',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: '/agenda',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        tag: payload.tag || notificationData.tag,
        data: {
          ...notificationData.data,
          ...payload.data
        }
      };
    } catch (e) {
      console.log('[SW] Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Listener para clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/agenda';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Verificar se já existe uma janela aberta
        for (let client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não houver janela aberta, abrir uma nova
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Listener para fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed', event);
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: tag || 'lc-appointment',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false,
      data: data || { url: '/agenda' }
    });
  }
});
