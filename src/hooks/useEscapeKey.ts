import { useEffect } from 'react';

/**
 * Calls `onEscape` when the Escape key is pressed while `active` is true.
 * Used by modals / dropdowns so keyboard users can dismiss them.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
