'use client';

import { ArrowsClockwise, Printer } from '@phosphor-icons/react';
import { newSpotCode } from '@murshid/core';
import { colors } from '@murshid/tokens';
import qrcode from 'qrcode-generator';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Mark } from '@/components/ui/mark';
import { Text } from '@/components/ui/text';

// Fajr Rise's printable "Your spot" card (Phase 7b): the mark, a QR code holding a random value,
// and one line. The person scans it in the setup on the phone and leaves it where they will go
// after waking; scanning it again stops the alarm. The value is made in the browser and kept
// nowhere. It never suggests a prayer mat, the wudu sink or a mosque (SPEC 13).

let current: string | null = null;
const listeners = new Set<() => void>();
const code = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  read: () => (current ??= newSpotCode()),
  renew() {
    current = newSpotCode();
    for (const listener of listeners) listener();
  },
};

/** The QR code as one path, a module a unit, with the quiet zone the standard asks for. */
function QrCode({ value }: { value: string }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  // Dark on light in every theme: scanners read it best that way.
  return (
    <svg
      viewBox={`-4 -4 ${n + 8} ${n + 8}`}
      className="size-56 rounded-control"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x={-4} y={-4} width={n + 8} height={n + 8} fill={colors.light.surface} />
      <path d={d} fill={colors.light.ink} />
    </svg>
  );
}

export function RiseCard({
  labels,
}: {
  labels: {
    title: string;
    line: string;
    how: string;
    print: string;
    another: string;
    note: string;
  };
}) {
  const value = useSyncExternalStore(code.subscribe, code.read, () => null);
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-reading flex-col items-center justify-center gap-8 px-4 py-12 print:py-0"
    >
      <article className="flex w-full max-w-sm flex-col items-center gap-5 rounded-sheet border border-hairline bg-surface p-8 text-center shadow-card print:border-ink print:shadow-none">
        <Mark size={48} className="text-ink" />
        <Text as="h1" role="title2">
          {labels.title}
        </Text>
        {value ? <QrCode value={value} /> : <div className="size-56" aria-hidden />}
        <Text role="headline">{labels.line}</Text>
        <Text role="callout" tone="muted">
          {labels.how}
        </Text>
      </article>
      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <Button icon={<Printer size={20} aria-hidden />} onClick={() => window.print()}>
          {labels.print}
        </Button>
        <Button
          icon={<ArrowsClockwise size={20} aria-hidden />}
          variant="secondary"
          onClick={code.renew}
        >
          {labels.another}
        </Button>
      </div>
      <Text role="caption" tone="muted" className="print:hidden">
        {labels.note}
      </Text>
    </main>
  );
}
