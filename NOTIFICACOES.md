# Sistema de Notificações PWA - Link Callendar

## 📱 Implementação Completa para iOS e Android

Este documento descreve o sistema de notificações nativas implementado para o aplicativo PWA Link Callendar.

## 🎯 Funcionalidades

- ✅ Notificações nativas em iOS e Android
- ✅ Integração com WebSocket para notificações em tempo real
- ✅ Service Worker otimizado para PWA
- ✅ Som de notificação personalizado
- ✅ Fallback para toast quando permissão negada
- ✅ Prevenção de notificações duplicadas
- ✅ Clique na notificação abre o app na página de agenda

## 📂 Arquivos Criados/Modificados

### 1. Service Worker (`/public/notification-sw.js`)
Service Worker dedicado para gerenciar notificações push:
- Listener para eventos `push`
- Listener para cliques em notificações
- Redirecionamento para página de agenda ao clicar
- Suporte a mensagens do cliente

### 2. Hook de Notificações (`/hooks/use-notifications.tsx`)
Hook customizado React que gerencia:
- Verificação de suporte a notificações
- Registro do Service Worker
- Solicitação de permissão
- Exibição de notificações nativas
- Reprodução de som
- Fallback para toast

### 3. Layout Principal (`/app/client-layout.tsx`)
Integração do sistema de notificações:
- Solicitação automática de permissão ao autenticar
- Conexão WebSocket para receber eventos
- Handler para novos agendamentos
- Prevenção de duplicatas

### 4. Manifest (`/public/manifest.json`)
Configurações PWA atualizadas:
- Referência ao Service Worker
- Configurações de ícones otimizadas
- Metadados para instalação

## 🚀 Como Funciona

### Fluxo de Notificação

1. **Autenticação**: Usuário faz login no app
2. **Permissão**: Sistema solicita permissão para notificações
3. **Service Worker**: Registra o SW de notificações
4. **WebSocket**: Conecta ao servidor via Socket.IO
5. **Evento**: Backend emite evento `appointments:new`
6. **Notificação**: Sistema exibe notificação nativa
7. **Som**: Toca som de alerta
8. **Clique**: Usuário clica e é redirecionado para `/agenda`

### Estrutura de Dados

```typescript
// Payload do WebSocket
{
  appointment: {
    id: number,
    start_time: string,
    appointment_date: string
  },
  professional: {
    name: string
  },
  client: {
    name: string
  }
}

// Notificação exibida
{
  title: "Novo agendamento com [Nome do Cliente]",
  body: "[Profissional] • [Data] às [Hora]",
  icon: "/logo.png",
  badge: "/logo.png",
  tag: "[ID do Agendamento]",
  data: {
    url: "/agenda",
    appointmentId: id,
    professional: name,
    client: name,
    date: date,
    time: time
  }
}
```

## 🔧 Configuração

### Requisitos

1. **HTTPS**: Notificações PWA requerem HTTPS (exceto localhost)
2. **Manifest**: Arquivo manifest.json configurado
3. **Service Worker**: SW registrado e ativo
4. **Permissão**: Usuário deve conceder permissão

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SOCKET_URL=https://api.linkcallendar.com
NEXT_PUBLIC_API_URL=https://api.linkcallendar.com
```

### Som de Notificação

Adicione o arquivo de som em `/public/notification-sound.mp3`

## 📱 Compatibilidade

### iOS (Safari)
- ✅ iOS 16.4+ com PWA instalado
- ✅ Notificações funcionam quando app está em background
- ⚠️ Requer instalação na tela inicial
- ⚠️ Não funciona no Safari browser (apenas PWA)

### Android (Chrome)
- ✅ Android 5.0+ com Chrome
- ✅ Notificações funcionam em background e foreground
- ✅ Funciona no browser e como PWA instalado
- ✅ Suporte completo a vibração

## 🐛 Troubleshooting

### Notificações não aparecem

1. **Verificar permissão**:
```javascript
console.log('Permissão:', Notification.permission);
```

2. **Verificar Service Worker**:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

3. **Verificar conexão WebSocket**:
```javascript
// Logs no console:
// [Socket] Conectando ao servidor...
// [Socket] Conectado com sucesso
```

### iOS não mostra notificações

- Verificar se o app está instalado na tela inicial
- Verificar se está rodando como PWA (não no Safari)
- Verificar se a permissão foi concedida
- Testar em iOS 16.4 ou superior

### Android não mostra notificações

- Verificar permissão do Chrome/navegador
- Verificar se notificações estão habilitadas no sistema
- Limpar cache e registrar SW novamente

## 🔍 Logs de Debug

O sistema inclui logs detalhados para debug:

```javascript
// Service Worker
[SW] Installing notification service worker
[SW] Activating notification service worker
[SW] Push notification received
[SW] Notification clicked

// Hook de Notificações
[Notifications] Service Worker registrado
[Notifications] Service Worker pronto
[Notifications] Permissão: granted
[Notifications] Usando Service Worker para notificação

// Socket
[Socket] Conectando ao servidor
[Socket] Conectado com sucesso
[Socket] Novo agendamento recebido
[Socket] Notificação enviada com sucesso
```

## 📝 Notas Importantes

1. **Duplicatas**: Sistema previne notificações duplicadas usando Set de IDs
2. **Fallback**: Se notificação falhar, mostra toast como backup
3. **Som**: Toca automaticamente, mas pode falhar se usuário não interagiu com a página
4. **HTTPS**: Obrigatório em produção (localhost funciona sem HTTPS)
5. **PWA**: Para melhor experiência, instalar como PWA na tela inicial

## 🎨 Personalização

### Alterar Som

Substitua `/public/notification-sound.mp3` pelo som desejado.

### Alterar Ícone

Substitua `/public/logo.png` pelo ícone desejado (recomendado: 512x512px).

### Alterar Comportamento ao Clicar

Edite `notification-sw.js`:

```javascript
self.addEventListener('notificationclick', (event) => {
  // Seu código customizado aqui
  const urlToOpen = '/sua-pagina-customizada';
});
```

## ✅ Checklist de Implementação

- [x] Service Worker criado e configurado
- [x] Hook de notificações implementado
- [x] Integração com WebSocket
- [x] Solicitação de permissão
- [x] Exibição de notificações nativas
- [x] Som de alerta
- [x] Prevenção de duplicatas
- [x] Redirecionamento ao clicar
- [x] Fallback para toast
- [x] Logs de debug
- [x] Manifest atualizado
- [x] Compatibilidade iOS/Android

## 🚀 Próximos Passos

1. Testar em dispositivos iOS reais (16.4+)
2. Testar em dispositivos Android reais
3. Adicionar arquivo de som personalizado
4. Configurar ícones otimizados (192x192, 512x512)
5. Testar em produção com HTTPS
6. Monitorar logs de erro
7. Coletar feedback dos usuários

---

**Desenvolvido para Link Callendar** 🔗📅
