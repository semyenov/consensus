import { NuxtImg, NuxtLink } from '#components'

// Add them to main entry (useful for content usage)
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NuxtLink', NuxtLink)
  nuxtApp.vueApp.component('NuxtImg', NuxtImg)
})
