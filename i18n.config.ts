export default defineI18nConfig(() => ({
  sync: true,
  legacy: false,
  locale: 'ru',
  defaultLocale: 'ru',
  fallbackLocale: 'en',
  availableLocales: ['ru', 'en'],
  pluralRules: {
    ru: (n: number) =>
      (n % 10 === 1 && n % 100 !== 11
        ? 0
        : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
            ? 1
            : 2)),
    en: (n: number) =>
      (n === 1
        ? 0
        : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
            ? 1
            : 2)),
  },
}))
