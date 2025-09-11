'use client';

import { useState } from 'react';
import useNotifications from '../../hooks/useNotifications';

export default function TesteNotificacoes() {
  const {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showTestNotification,
    scheduleNotification
  } = useNotifications();

  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('LC Mobile');
  const [body, setBody] = useState('Esta é uma notificação personalizada!');
  const [loading, setLoading] = useState(false);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const result = await requestPermission();
      setMessage(`Permissão: ${result}`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowNotification = async () => {
    setLoading(true);
    try {
      await showNotification(title, {
        body,
        icon: '/icon.png',
        badge: '/favicon.ico'
      });
      setMessage('Notificação enviada com sucesso!');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      await showTestNotification();
      setMessage('Notificação de teste enviada!');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleNotification = () => {
    try {
      scheduleNotification(
        'Notificação Agendada',
        {
          body: 'Esta notificação foi agendada para 5 segundos!',
          icon: '/icon.png'
        },
        5000
      );
      setMessage('Notificação agendada para 5 segundos!');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  };

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted': return 'Concedida ✅';
      case 'denied': return 'Negada ❌';
      default: return 'Não solicitada ⚠️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🔔 Teste de Notificações PWA
          </h1>

          {/* Status das Notificações */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Status</h2>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Suporte do Navegador:</span>
                <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                  {isSupported ? 'Suportado ✅' : 'Não Suportado ❌'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Permissão:</span>
                <span className={getPermissionColor()}>
                  {getPermissionText()}
                </span>
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4 mb-8">
            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={loading || !isSupported}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Solicitando...' : '🔔 Solicitar Permissão'}
              </button>
            )}

            {permission === 'granted' && (
              <>
                <button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Enviando...' : '🧪 Notificação de Teste Rápida'}
                </button>

                <button
                  onClick={handleScheduleNotification}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ⏰ Agendar Notificação (5s)
                </button>
              </>
            )}
          </div>

          {/* Notificação Personalizada */}
          {permission === 'granted' && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                📝 Notificação Personalizada
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Título:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o título da notificação"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Mensagem:
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite a mensagem da notificação"
                  />
                </div>
                <button
                  onClick={handleShowNotification}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Enviando...' : '📤 Enviar Notificação'}
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de Status */}
          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-center">{message}</p>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              📋 Instruções:
            </h3>
            <ul className="text-yellow-700 space-y-2 text-sm">
              <li>• Primeiro, clique em "Solicitar Permissão" para habilitar notificações</li>
              <li>• Use "Notificação de Teste Rápida" para um teste simples</li>
              <li>• Experimente agendar uma notificação para ver o delay</li>
              <li>• Personalize título e mensagem para testar diferentes conteúdos</li>
              <li>• As notificações funcionam mesmo com o app em segundo plano</li>
            </ul>
          </div>

          {/* Botão Voltar */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              ← Voltar ao App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}