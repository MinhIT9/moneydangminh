import { cookies } from 'next/headers';
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/i18n/config';
import { translate, type MessageKey, type TranslationValues } from '@/i18n/messages';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(localeCookieName)?.value;

  return isLocale(savedLocale) ? savedLocale : defaultLocale;
}

export async function getTranslations() {
  const locale = await getLocale();

  return {
    locale,
    t: (key: MessageKey, values?: TranslationValues) => translate(locale, key, values),
  };
}
