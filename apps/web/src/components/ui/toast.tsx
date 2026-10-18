'use client';

import { X } from '@phosphor-icons/react';
import { motion as tokens, spring } from '@murshid/tokens';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Text } from './text';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** One calm toast at a time, at the top, announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('components');
  const [toast, setToast] = useState<{ id: number; message: string; action?: ToastAction } | null>(
    null,
  );

  const show = useCallback<ShowToast>(
    (message, action) => setToast({ id: Date.now(), message, action }),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), tokens.toastVisible);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', ...spring.gentle }}
              className="pointer-events-auto flex min-h-touch items-center gap-2 rounded-full bg-ink ps-6 pe-2 text-canvas shadow-lift"
            >
              <Text as="span" role="callout" tone="inherit">
                {toast.message}
              </Text>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onPress();
                    setToast(null);
                  }}
                  className="min-h-touch rounded-full bg-canvas/10 px-4 text-canvas hover:bg-canvas/20"
                >
                  <Text as="span" role="callout" tone="inherit" className="font-medium">
                    {toast.action.label}
                  </Text>
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label={t('dismiss')}
                className="flex size-touch items-center justify-center rounded-full hover:bg-canvas/10"
              >
                <X size={18} aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  return use(ToastContext);
}
