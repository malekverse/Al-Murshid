'use client';

import * as RadixSlider from '@radix-ui/react-slider';
import { useDirection } from '@/lib/use-direction';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** Read aloud instead of the raw number, e.g. "150%". */
  valueText?: string;
  disabled?: boolean;
}

/** Single-value slider. Fills from the start side and follows the reading direction (SPEC 7). */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  valueText,
  disabled,
}: SliderProps) {
  const dir = useDirection();

  return (
    <RadixSlider.Root
      dir={dir}
      value={[value]}
      onValueChange={([v]) => v !== undefined && onChange(v)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="relative flex min-h-touch w-full touch-none select-none items-center data-disabled:opacity-40"
    >
      <RadixSlider.Track className="relative h-2 grow overflow-hidden rounded-full bg-ink/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-lantern" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label={label}
        aria-valuetext={valueText}
        className="block size-7 rounded-full border border-hairline bg-surface shadow-lift transition-transform duration-(--duration-instant) ease-standard active:scale-110 dark:border-card-edge"
      />
    </RadixSlider.Root>
  );
}
