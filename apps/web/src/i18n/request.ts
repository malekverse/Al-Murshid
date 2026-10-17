import { getMessages, isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const param = await rootParams.locale();
    if (!isLocale(param)) notFound();
    locale = param;
  }
  if (!isLocale(locale)) notFound();

  return {
    locale,
    messages: getMessages(locale),
    // Prayer pages set a real time zone per city; elsewhere dates are calendar-only.
    timeZone: 'UTC',
  };
});
