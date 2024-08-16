import en from './languages/en.json'
import ru from './languages/ru.json'

export default defineI18nConfig (() => {
  return {
    sync: true,
    defaultLocale: 'ru',
    availableLocales: [
      'russian',
      'english',
    ],
    messages: {
      en,
      ru,
    },
  }
})
