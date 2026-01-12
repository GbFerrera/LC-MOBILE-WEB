import { useCallback, useRef, useEffect } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar o áudio uma única vez (como no Link-Front)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7;
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    // Usar a mesma abordagem do Link-Front: simples e eficaz
    audioRef.current?.play().catch(() => {});
  }, []);

  return { playNotificationSound };
};
