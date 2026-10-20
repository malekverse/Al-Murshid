'use client';

import type { LocationSetting } from '@murshid/data';
import { buttonClass } from '@/components/ui/button-markup';

// "Use this city" on a city's public page (Phase 6): the city becomes the place in this browser's
// settings (its country's method too, unless the person chose one), then the app opens at Today,
// or at onboarding's location step with the city already picked for a first visit.

export function UseCity({
  locale,
  location,
  method,
  label,
}: {
  locale: string;
  location: LocationSetting;
  method: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className={buttonClass({
        script: locale === 'ar' ? 'arabic' : 'latin',
        className: 'self-start',
      })}
      onClick={() => {
        let settings: Record<string, unknown> = {};
        try {
          settings = JSON.parse(localStorage.getItem('murshid-settings') ?? '{}') as Record<
            string,
            unknown
          >;
        } catch {
          // Unreadable settings start over; the app validates whatever it reads.
        }
        const next = {
          ...settings,
          location,
          method: settings.methodSource === 'user' ? settings.method : method,
        };
        try {
          localStorage.setItem('murshid-settings', JSON.stringify(next));
        } catch {
          // Storage blocked: the app asks for the place itself.
        }
        window.location.href =
          settings.onboarded === true ? `/${locale}` : `/${locale}/welcome#location`;
      }}
    >
      {label}
    </button>
  );
}
