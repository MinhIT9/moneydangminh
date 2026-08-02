export const locales = ['vi', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';
export const localeCookieName = 'heo_xinh_locale';

export const localeOptions: ReadonlyArray<{ value: Locale; label: string; shortLabel: string }> = [
  { value: 'vi', label: 'Tiếng Việt', shortLabel: 'VN' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
];

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
