import { ComposedStorage, type ComposedStorageOptions } from './composed'
import { EdgeDBStorage, type EdgeDBStorageOptions } from './edgedb'
import { IPFSBlockStorage, type IPFSBlockStorageOptions } from './ipfs-block'
import { LevelStorage, type LevelStorageOptions } from './level'
import { LRUStorage, type LRUStorageOptions } from './lru'
import { MemoryStorage } from './memory'
import { RocksDBStorage, type RocksDBStorageOptions } from './rocksdb'

import type { StorageInstance } from './types'

export {
  ComposedStorage,
  EdgeDBStorage,
  IPFSBlockStorage,
  LevelStorage,
  LRUStorage,
  MemoryStorage,
  RocksDBStorage,
}

export type {
  ComposedStorageOptions,
  EdgeDBStorageOptions,
  IPFSBlockStorageOptions,
  LevelStorageOptions,
  LRUStorageOptions,
  RocksDBStorageOptions,
  StorageInstance,
}
