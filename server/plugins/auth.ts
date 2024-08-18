export default defineNitroPlugin((app) => {
  app.hooks.hook(
    'edgedb:auth:callback' as any,
    () => {
      return console.log('auth callback!')
    },
  )
})
