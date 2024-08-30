export function posixJoin(...paths: string[]) {
  return (
    paths.join('/').replaceAll(/((?<=\/)\/+)|(^\.\/)|((?<=\/)\.\/)/g, '') || '.'
  )
}

export function win32Join(...paths: string[]) {
  return (
    paths
      .join('\\')
      .replaceAll('/', '\\')
      .replaceAll(/((?<=\\)\\+)|(^\.\\)|((?<=\\)\.\\)/g, '') || '.'
  )
}

export const join = posixJoin
