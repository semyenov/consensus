// ErrNotFound is used to throw when a resource is not found
export const ErrNotFound = createError({
  statusCode: 404,
  statusMessage: 'Not found',
})
