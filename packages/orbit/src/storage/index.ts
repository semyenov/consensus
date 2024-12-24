import { ComposedStorage, type ComposedStorageOptions } from './composed'
import { EdgeDBStorage, type EdgeDBStorageOptions } from './edgedb'
import { IPFSBlockStorage, type IPFSBlockStorageOptions } from './ipfs-block'
import { LevelStorage, type LevelStorageOptions } from './level'
import { LRUStorage, type LRUStorageOptions } from './lru'
import { MemoryStorage } from './memory'

import type { StorageInstance } from './types'

export {
  ComposedStorage,
  EdgeDBStorage,
  IPFSBlockStorage,
  LevelStorage,
  LRUStorage,
  MemoryStorage,
}

export type {
  ComposedStorageOptions,
  EdgeDBStorageOptions,
  IPFSBlockStorageOptions,
  LevelStorageOptions,
  LRUStorageOptions,
  StorageInstance,
}
