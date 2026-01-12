# Debug: Notificações PWA - Localhost vs Produção

## 🔍 Problemas Comuns em Produção

### 1. **HTTPS Obrigatório**
- **Push Notifications** só funcionam em HTTPS
- **Service Workers** só funcionam em HTTPS (exceto localhost)
- **Verificar**: Seu domínio de produção tem certificado SSL válido?

### 2. **Variáveis de Ambiente**
```bash
# Verificar se estão definidas em produção:
NEXT_PUBLIC_API_URL=https://api.linkcallendar.com
NEXT_PUBLIC_SOCKET_URL=wss://api.linkcallendar.com

# Backend (VAPID Keys):
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_SUBJECT=mailto:seu@email.com
```

### 3. **URLs de WebSocket**
- **Localhost**: `ws://localhost:3131` ✅
- **Produção**: `wss://api.linkcallendar.com` (WSS obrigatório)

### 4. **Service Worker**
- **Localhost**: Funciona mesmo sem HTTPS
- **Produção**: Precisa HTTPS + domínio válido

## 🛠️ Checklist de Debug

### ✅ **1. Verificar HTTPS**
```javascript
// No console do browser em produção:
console.log('HTTPS:', location.protocol === 'https:');
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('Push Manager:', 'PushManager' in window);
```

### ✅ **2. Verificar Variáveis de Ambiente**
```javascript
// No console do browser:
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
```

### ✅ **3. Verificar WebSocket**
```javascript
// No Network tab do DevTools:
// Deve mostrar conexão WSS (não WS) em produção
```

### ✅ **4. Verificar VAPID Keys**
```bash
# No backend, verificar se as variáveis estão definidas:
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
```

### ✅ **5. Verificar Service Worker**
```javascript
// No console:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW Registrations:', regs);
});
```

## 🔧 Soluções por Problema

### **Problema: WebSocket não conecta**
```javascript
// client-layout.tsx - linha 121-124
const baseURL = 
  process.env.NEXT_PUBLIC_SOCKET_URL ||     // wss://api.linkcallendar.com
  process.env.NEXT_PUBLIC_API_URL ||        // https://api.linkcallendar.com  
  "http://localhost:3131";                  // fallback local

// ❌ Problema: Em produção pode estar usando HTTP em vez de WSS
// ✅ Solução: Definir NEXT_PUBLIC_SOCKET_URL=wss://api.linkcallendar.com
```

### **Problema: Push Subscription falha**
```javascript
// Erro comum: DOMException: Registration failed
// Causa: HTTPS inválido ou VAPID keys incorretas
```

### **Problema: Service Worker não registra**
```javascript
// next.config.js - linha 5
disable: process.env.NODE_ENV === 'development' || process.env.TURBOPACK,

// ❌ Problema: SW desabilitado em development
// ✅ Solução: Em produção deve estar habilitado
```

## 📋 Comandos de Debug

### **1. Testar WebSocket manualmente**
```javascript
// No console do browser em produção:
const socket = io('wss://api.linkcallendar.com', {
  transports: ['websocket'],
  path: '/socket.io'
});

socket.on('connect', () => console.log('✅ WebSocket conectado'));
socket.on('connect_error', (err) => console.log('❌ Erro:', err));
```

### **2. Testar Push Subscription**
```javascript
// No console:
navigator.serviceWorker.ready.then(reg => {
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'SUA_VAPID_PUBLIC_KEY'
  });
}).then(sub => {
  console.log('✅ Push subscription:', sub);
}).catch(err => {
  console.log('❌ Erro push:', err);
});
```

### **3. Verificar Notificações**
```javascript
// Testar notificação manual:
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification('Teste', { body: 'Funcionando!' });
    }
  });
}
```

## 🎯 Próximos Passos

1. **Verificar HTTPS** no domínio de produção
2. **Configurar variáveis de ambiente** corretas
3. **Testar WebSocket** com WSS
4. **Verificar VAPID keys** no backend
5. **Testar Service Worker** em produção
6. **Verificar logs** do backend para push notifications

## 📞 Logs Importantes

### **Frontend (Console)**
```javascript
// Adicionar logs no client-layout.tsx:
console.log('[DEBUG] Socket URL:', baseURL);
console.log('[DEBUG] Push permission:', Notification.permission);
console.log('[DEBUG] SW registered:', !!navigator.serviceWorker.controller);
```

### **Backend (appointmentsController.js)**
```javascript
// Verificar logs de push notification:
console.log('[PUSH] Sending to professional:', professional_id);
console.log('[PUSH] Notification data:', notification);
```
