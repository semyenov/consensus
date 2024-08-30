export interface StorageInstance<T> {
  put: (hash: string, data: T) => Promise<void>
  get: (hash: string) => Promise<T | null>
  del: (hash: string) => Promise<void>

  merge: (other: StorageInstance<T>) => Promise<void>

  close: () => Promise<void>
  clear: () => Promise<void>

  iterator: (options?: {
    amount: number
    reverse: boolean
  }) => AsyncIterable<[string, T]>
}
