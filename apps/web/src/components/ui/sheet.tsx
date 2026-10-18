'use client';

import { X } from '@phosphor-icons/react';
import * as Dialog from '@radix-ui/react-dialog';
import { duration, spring } from '@murshid/tokens';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Text } from './text';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The control that opens the sheet. Focus returns to it on close (WCAG 2.4.3). */
  trigger?: ReactNode;
  children?: ReactNode;
}

// Dismiss when dragged a third of the way down or flicked.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 500;

/**
 * A sheet for short tasks only (SPEC 4). It springs up, the page behind dims and settles back
 * to 96%, and it closes by dragging down, Escape, the backdrop or the visible close button.
 */
export function Sheet({ open, onOpenChange, title, description, trigger, children }: SheetProps) {
  const t = useTranslations('components');
  const reduce = useReducedMotion();

  // Scale the page behind (globals.css: [data-sheet='open'] #app-root).
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.sheet = 'open';
    else delete root.dataset.sheet;
    return () => {
      delete root.dataset.sheet;
    };
  }, [open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-ink/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.standard / 1000 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              // Without a description, tell Radix there is none (it links one automatically otherwise).
              {...(description ? {} : { 'aria-describedby': undefined })}
            >
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-reading flex-col rounded-t-sheet border border-card-edge bg-surface shadow-lift outline-none"
                initial={reduce ? { opacity: 0 } : { y: '100%' }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: '100%' }}
                transition={{ type: 'spring', ...spring.gentle }}
                drag={reduce ? false : 'y'}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={onDragEnd}
              >
                {/* The handle shows the sheet can be dragged; the close button is its visible twin. */}
                <div className="flex justify-center pt-3" aria-hidden>
                  <span className="h-1 w-10 rounded-full bg-ink/20" />
                </div>
                <div className="flex items-start gap-4 px-6 pt-2">
                  <div className="flex flex-1 flex-col gap-1 pt-2">
                    <Dialog.Title asChild>
                      <Text as="h2" role="title2">
                        {title}
                      </Text>
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description asChild>
                        <Text role="body" tone="muted">
                          {description}
                        </Text>
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <IconButton icon={X} label={t('close')} />
                  </Dialog.Close>
                </div>
                <div className="overflow-y-auto px-6 pt-4 pb-8">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
