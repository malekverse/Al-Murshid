'use client';

import { Check, Minus, Plus } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from './ui/icon-button';
import { Sheet } from './ui/sheet';
import { Text } from './ui/text';

export interface Choice<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

/** A short list of choices in a sheet (SPEC 4: sheets are for short tasks like a setting). */
export function ChoiceSheet<V extends string>({
  open,
  onOpenChange,
  title,
  description,
  choices,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  choices: readonly Choice<V>[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <ul role="radiogroup" aria-label={title} className="flex flex-col">
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <li key={choice.value}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(choice.value);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex min-h-touch w-full items-center gap-4 rounded-control px-4 py-3 text-start hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-lantern',
                  selected && 'bg-lantern/10',
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <Text as="span" role="body" tone={selected ? 'lantern' : 'default'}>
                    {choice.label}
                  </Text>
                  {choice.hint && (
                    <Text as="span" role="caption" tone="muted">
                      {choice.hint}
                    </Text>
                  )}
                </span>
                {selected && (
                  <Check size={20} weight="bold" aria-hidden className="text-lantern-ink" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** − value + for small whole numbers (minute adjustments, the Hijri offset). */
export function Stepper({
  label,
  valueText,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  canDecrease = true,
  canIncrease = true,
}: {
  label: ReactNode;
  valueText: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease?: boolean;
  canIncrease?: boolean;
}) {
  return (
    <div className="flex min-h-touch items-center gap-3 px-4 py-2">
      <span className="min-w-0 flex-1">
        <Text as="span" role="body">
          {label}
        </Text>
      </span>
      <IconButton
        icon={Minus}
        label={decreaseLabel}
        variant="tinted"
        onClick={onDecrease}
        disabled={!canDecrease}
      />
      {/* A label that already says the value (the Hijri offset) needs no number between. */}
      {valueText !== '' && (
        <Text
          as="output"
          role="callout"
          aria-live="polite"
          className="min-w-16 text-center tabular"
        >
          {valueText}
        </Text>
      )}
      <IconButton
        icon={Plus}
        label={increaseLabel}
        variant="tinted"
        onClick={onIncrease}
        disabled={!canIncrease}
      />
    </div>
  );
}
