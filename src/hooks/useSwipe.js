// Hook utilitaire pour les gestes swipe — implémentation à l'étape 9 (Framer Motion).
import { useCallback } from 'react';

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 } = {}) {
  return useCallback(
    (_event, info) => {
      const offset = info?.offset?.x ?? 0;
      if (offset > threshold) onSwipeRight?.();
      else if (offset < -threshold) onSwipeLeft?.();
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );
}

export default useSwipe;
