import type { Locale } from '@murshid/i18n';
import { getTranslations } from 'next-intl/server';
import { Text } from '@/components/ui/text';

/** Where a place's page sits (Prayer times › Country › City), the last step being this page. */
export async function PlacesTrail({
  locale,
  trail,
}: {
  locale: Locale;
  /** Each step's label, and its path below the locale (none for this page). */
  trail: { label: string; href?: string }[];
}) {
  const t = await getTranslations({ locale, namespace: 'places' });
  return (
    <nav aria-label={t('trail')}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((step, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <Text as="span" role="caption" tone="muted" aria-hidden>
                ›
              </Text>
            )}
            {step.href ? (
              <a
                href={`/${locale}${step.href}`}
                className="inline-flex min-h-touch items-center rounded-control text-caption text-lantern-ink hover:underline"
              >
                {step.label}
              </a>
            ) : (
              <Text as="span" role="caption" tone="muted" aria-current="page">
                {step.label}
              </Text>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
