// Service Worker personalizado para notificações

// Importar o service worker do Workbox
importScripts('/sw.js');

// Escutar eventos de push para notificações
self.addEventListener('push', function(event) {
  console.log('Push event recebido:', event);
  
  let notificationData = {
    title: 'LC Mobile',
    body: 'Você tem uma nova notificação!',
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

  // Se há dados no push, usar esses dados
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.log('Erro ao parsear dados do push:', e);
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Escutar cliques nas notificações
self.addEventListener('notificationclick', function(event) {
  console.log('Clique na notificação:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Abrir a aplicação
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Apenas fechar a notificação
    return;
  } else {
    // Clique na notificação (não em uma ação)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Escutar quando a notificação é fechada
self.addEventListener('notificationclose', function(event) {
  console.log('Notificação fechada:', event);
});

// Função para solicitar permissão de notificação
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'REQUEST_NOTIFICATION_PERMISSION') {
    // Enviar mensagem de volta para o cliente
    event.ports[0].postMessage({
      type: 'NOTIFICATION_PERMISSION_RESPONSE',
      permission: Notification.permission
    });
  }
  
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    const notificationData = {
      title: 'Teste de Notificação - LC Mobile',
      body: 'Esta é uma notificação de teste! 🎉',
      icon: '/icon.png',
      badge: '/favicon.ico',
      tag: 'test-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver App',
          icon: '/icon.png'
        },
        {
          action: 'dismiss',
          title: 'OK'
        }
      ]
    };
    
    self.registration.showNotification(
      notificationData.title,
      notificationData
    );
  }
});

console.log('Service Worker personalizado carregado com suporte a notificações!');