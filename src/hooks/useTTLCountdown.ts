import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { decrementTTLs, removeExpiredKeys } from '@/store/slices/keysSlice';

/**
 * Hook para gerenciar o countdown automático de TTL das chaves
 * Decrementa TTL a cada segundo e remove chaves expiradas
 */
export const useTTLCountdown = (enabled: boolean = true) => {
  const dispatch = useDispatch<AppDispatch>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Atualiza TTL a cada segundo
    intervalRef.current = setInterval(() => {
      dispatch(decrementTTLs());
      dispatch(removeExpiredKeys());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, dispatch]);
};
