'use client';

import {
  CalendarBlank,
  Compass,
  HandHeart,
  PushPin,
  PushPinSlash,
  type Icon,
} from '@phosphor-icons/react';
import { MAX_PINNED, pinnedTools, togglePin, type ToolId } from '@murshid/core';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { updateSettings, useSettings } from '@/lib/settings';

// The Tools hub (SPEC 5.11): every occasional tool, each one tap away, and up to four pinned to
// Today's row. Fajr Rise lives on the phone, so the web lists the others.

/** The tools the web has, with where they open. */
export const webTools: {
  id: ToolId;
  href: '/qibla' | '/calendar' | '/remember/tasbih';
  icon: Icon;
}[] = [
  { id: 'qibla', href: '/qibla', icon: Compass },
  { id: 'calendar', href: '/calendar', icon: CalendarBlank },
  { id: 'tasbih', href: '/remember/tasbih', icon: HandHeart },
];
export const webToolIds = webTools.map((t) => t.id);

export function ToolsScreen() {
  const t = useTranslations('today.tools');
  const toast = useToast();
  const settings = useSettings();
  if (!settings) return null;
  const pinned = pinnedTools(settings.pinnedTools, webToolIds);

  const toggle = (id: ToolId) => {
    const next = togglePin(pinned, id);
    if (!next) return toast(t('full'));
    // Pins of tools this platform lacks (Fajr Rise) stay for the phone.
    const elsewhere = settings.pinnedTools.filter((p) => !webToolIds.includes(p));
    updateSettings((s) => ({ ...s, pinnedTools: [...next, ...elsewhere].slice(0, MAX_PINNED) }));
  };

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 pt-6 pb-12 md:pt-12"
    >
      <div className="flex flex-col gap-1">
        <Text as="h1" role="title1">
          {t('title')}
        </Text>
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
      </div>
      <ul className="flex flex-col divide-y divide-hairline rounded-card border border-card-edge bg-surface shadow-card">
        {webTools.map(({ id, href, icon: IconComponent }) => {
          const on = pinned.includes(id);
          return (
            <li key={id} className="flex min-h-16 items-center gap-2 pe-2">
              <Link
                href={href}
                className="flex min-h-16 flex-1 items-center gap-4 rounded-card px-4 py-3 hover:bg-ink/5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-lantern/10 text-lantern-ink">
                  <IconComponent size={22} aria-hidden />
                </span>
                <span className="flex flex-col">
                  <Text as="span" role="body">
                    {t(id)}
                  </Text>
                  <Text as="span" role="caption" tone="muted">
                    {t(`notes.${id}`)}
                  </Text>
                </span>
              </Link>
              <button
                type="button"
                aria-pressed={on}
                aria-label={on ? t('unpin') : t('pin')}
                title={on ? t('unpin') : t('pin')}
                onClick={() => toggle(id)}
                className={`flex size-touch items-center justify-center rounded-full ${
                  on ? 'text-lantern-ink' : 'text-ink-muted'
                } hover:bg-ink/5`}
              >
                {on ? (
                  <PushPin size={22} weight="fill" aria-hidden />
                ) : (
                  <PushPinSlash size={22} aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
