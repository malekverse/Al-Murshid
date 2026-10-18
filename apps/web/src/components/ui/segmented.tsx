'use client';

import { spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
  lang?: string;
}

interface SegmentedProps<V extends string> {
  label: string;
  value: V;
  options: readonly SegmentOption<V>[];
  onChange: (value: V) => void;
}

/** A radio group drawn as a pill. Arrow keys follow the reading direction. */
export function Segmented<V extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<V>) {
  const id = useId();
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key !== forward && e.key !== back) return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = (index + (e.key === forward ? 1 : -1) + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex rounded-full border border-hairline bg-surface p-1 shadow-card dark:border-card-edge"
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className="relative flex min-h-touch min-w-touch items-center justify-center rounded-full px-4 text-callout transition-colors duration-(--duration-quick) ease-standard aria-checked:text-on-lantern not-aria-checked:text-ink-muted not-aria-checked:hover:text-ink"
          >
            {selected && (
              <motion.span
                layoutId={`${id}-thumb`}
                aria-hidden
                className="absolute inset-0 rounded-full bg-lantern"
                transition={reduce ? { duration: 0 } : { type: 'spring', ...spring.gentle }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
