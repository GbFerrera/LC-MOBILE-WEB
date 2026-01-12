self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    try {
      data = { body: event.data ? event.data.text() : '' };
    } catch (e2) {
      data = {};
    }
  }

  // Extrair dados do agendamento se disponíveis
  const appointmentData = data.appointment_data || {};
  const startTime = appointmentData.start_time;
  const appointmentDate = appointmentData.appointment_date;
  const clientName = appointmentData.client_name;
  const professionalName = appointmentData.professional_name;

  // Formatar horário e data do agendamento
  const appointmentTime = typeof startTime === 'string' ? startTime.substring(0, 5) : '';
  const formattedDate = typeof appointmentDate === 'string' 
    ? appointmentDate.split('-').reverse().join('/') 
    : '';

  // Criar título e corpo da notificação com horário correto
  const title = data.title || (clientName ? `Novo agendamento com ${clientName}` : 'Link Callendar');
  
  let body = data.body;
  if (!body && appointmentTime && formattedDate) {
    const appointmentInfo = `${formattedDate} às ${appointmentTime}`;
    body = professionalName 
      ? `${professionalName} • ${appointmentInfo}`
      : appointmentInfo;
  } else if (!body) {
    body = 'Nova notificação';
  }

  const url = data.url || '/';

  const options = {
    body,
    icon: '/icon.png',
    badge: '/favicon.png',
    data: { url, appointmentData },
    tag: data.tag || (data.appointment_id ? `appointment-${data.appointment_id}` : 'lc-notification'),
    requireInteraction: true,
    silent: false, // Permitir som da notificação
    sound: '/notification-sound.mp3', // Som customizado (nem todos os browsers suportam)
  };

  // Tentar reproduzir som customizado via service worker
  const playSound = async () => {
    try {
      // Verificar se há clientes (janelas) abertas
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      
      if (clients.length > 0) {
        // Se há janelas abertas, enviar mensagem para reproduzir som
        clients.forEach(client => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            data: { title, body }
          });
        });
      } else {
        // Se não há janelas abertas, usar vibração como fallback
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      playSound()
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
