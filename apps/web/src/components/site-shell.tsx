import { BookOpenText, HandHeart, SunHorizon, UserCircle } from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Locale } from '@murshid/i18n';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Text } from '@/components/ui/text';
import {
  barPlacement,
  contentClass,
  destinationKeys,
  railPlacement,
  tabBarClass,
  tabClass,
  type Destination,
} from '@/components/ui/tab-bar-markup';

// The four destinations around a public page (Phase 6), drawn on the server with the app's
// tab bar's look: a rail on the start side on desktop, the bar on small screens (SPEC 4).
// Plain links, so the page carries no script for them.

const icons: Record<Destination, Icon> = {
  today: SunHorizon,
  quran: BookOpenText,
  remember: HandHeart,
  you: UserCircle,
};
const paths: Record<Destination, string> = {
  today: '',
  quran: '/quran',
  remember: '/remember',
  you: '/you',
};

async function SiteNav({
  locale,
  active,
  rail,
  className,
}: {
  locale: Locale;
  active: Destination;
  rail: boolean;
  className: string;
}) {
  const t = await getTranslations({ locale, namespace: 'components.tabs' });
  return (
    <nav aria-label={t('label')} className={tabBarClass(rail, className)}>
      {destinationKeys.map((key) => {
        const selected = key === active;
        const IconComponent = icons[key];
        return (
          <a
            key={key}
            href={`/${locale}${paths[key]}`}
            aria-current={selected ? 'page' : undefined}
            className={tabClass(selected, rail)}
          >
            <IconComponent size={24} weight={selected ? 'fill' : 'regular'} aria-hidden />
            <Text
              as="span"
              role="caption"
              tone="inherit"
              className={selected ? 'font-medium' : undefined}
            >
              {t(key)}
            </Text>
          </a>
        );
      })}
    </nav>
  );
}

/** A public page within the destinations; reading fills small screens, without the bar. */
export function SiteShell({
  locale,
  active,
  immersive = false,
  children,
}: {
  locale: Locale;
  active: Destination;
  immersive?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <SiteNav locale={locale} active={active} rail className={railPlacement} />
      <div className={contentClass(immersive)}>{children}</div>
      {!immersive && (
        <SiteNav locale={locale} active={active} rail={false} className={barPlacement} />
      )}
    </div>
  );
}
