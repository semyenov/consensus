// ErrNotFound is used to throw when a resource is not found
export const ErrNotFound = createError({
  statusCode: 404,
  statusMessage: 'Not found',
})

// ErrForbidden is used to throw when a resource is not found
export const ErrForbidden = createError({
  statusCode: 403,
  statusMessage: 'Forbidden',
})

// ErrUnauthorized is used to throw when a resource is not found
export const ErrUnauthorized = createError({
  statusCode: 401,
  statusMessage: 'Unauthorized',
})

// ErrBadRequest is used to throw when a resource is not found
export const ErrBadRequest = createError({
  statusCode: 400,
  statusMessage: 'Bad request',
})

// ErrUnsupportedMethod is used to throw when a resource is not found
export const ErrUnsupportedMethod = createError({
  statusCode: 405,
  statusMessage: 'Unsupported method',
})

// ErrInternalServer is used to throw when a resource is not found
export const ErrInternalServer = createError({
  statusCode: 500,
  statusMessage: 'Internal server error',
})

// ErrNoParamId is used to throw when a resource is not found
export const ErrNoParamId = createError({
  statusCode: 400,
  statusMessage: 'No param id',
})
