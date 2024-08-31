import { ComposedStorage, type ComposedStorageOptions } from './composed.js'
import { IPFSBlockStorage, type IPFSBlockStorageOptions } from './ipfs-block.js'
import { LevelStorage, type LevelStorageOptions } from './level.js'
import { LRUStorage, type LRUStorageOptions } from './lru.js'
import { MemoryStorage } from './memory.js'
import { RocksDBStorage } from './rocksdb.js'

import type { StorageInstance } from './types.js'

export {
  ComposedStorage,
  IPFSBlockStorage,
  LevelStorage,
  LRUStorage,
  MemoryStorage,
  RocksDBStorage,
}

export type {
  ComposedStorageOptions,
  IPFSBlockStorageOptions,
  LevelStorageOptions,
  LRUStorageOptions,
  StorageInstance,
}
