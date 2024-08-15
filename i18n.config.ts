export default defineI18nConfig (() => {
  return {
    defaultLocale: 'ru',
    availableLocales: [
      'ru',
      'en',
    ],

    sync: true,

    messages: {
      en: {
        auth: {
          title: 'Authorization',
          username: 'Username',
          password: 'Password',
          rememberMe: 'Remember me',
          login: 'Login',
        },
      },
      ru: {
        auth: {
          title: 'Авторизация',
          username: 'Имя пользователя',
          password: 'Пароль',
          rememberMe: 'Запомнить меня',
          login: 'Вход',
        },
      },
    },
  }
})
