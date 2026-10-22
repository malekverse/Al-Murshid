import PrayerWidget, { type PrayerWidgetProps } from '@/widgets/prayer-widget';
import { COUNTDOWN_SLOT, type WidgetData } from './widget-data';

// iOS widgets (SPEC 5.9): a timeline of entries for the next two days, one at each prayer and at
// each half hour of the sky. SwiftUI runs each entry's countdown on its own.

const HORIZON = 48 * 60 * 60 * 1000;

function propsAt(data: WidgetData, at: number): PrayerWidgetProps | null {
  const rows = data.days.flat();
  const next = rows.findIndex((r) => r.at > at);
  if (next === -1) return null;
  const day = data.days[Math.floor(next / 5)] ?? [];
  const sky = [...data.sky].reverse().find((s) => s.from <= at) ?? data.sky[0];
  if (!sky) return null;
  const [before = '', after = ''] = data.text.in.split(COUNTDOWN_SLOT).map((s) => s.trim());
  return {
    empty: null,
    label: data.text.next,
    name: rows[next]!.name,
    time: rows[next]!.time,
    from: at,
    until: rows[next]!.at,
    before,
    after,
    rows: day.map((r, i) => ({ name: r.name, time: r.time, next: i === next % 5 })),
    top: sky.top,
    bottom: sky.bottom,
    ink: sky.ink,
    muted: sky.muted,
    accent: sky.accent,
  };
}

export function updateIosWidgets(data: WidgetData | null, now: Date): void {
  const start = now.getTime();
  const entries = data
    ? [start, ...data.sky.map((s) => s.from), ...data.days.flat().map((r) => r.at)]
        .filter((at) => at >= start && at < start + HORIZON)
        .sort((a, b) => a - b)
        .filter((at, i, all) => i === 0 || at !== all[i - 1])
        .flatMap((at) => {
          const props = propsAt(data, at);
          return props ? [{ date: new Date(at), props }] : [];
        })
    : [];
  if (entries.length > 0) {
    PrayerWidget.updateTimeline(entries);
  } else {
    PrayerWidget.updateSnapshot({
      empty: data?.text.empty ?? 'Al-Murshid',
      label: '',
      name: '',
      time: '',
      from: start,
      until: start,
      before: '',
      after: '',
      rows: [],
      top: '#0B1020',
      bottom: '#1C2541',
      ink: '#F2EFE8',
      muted: '#A39F96',
      accent: '#E8B25A',
    });
  }
}
