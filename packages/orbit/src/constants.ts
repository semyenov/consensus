export const DATABASE_PATH = './.orbitdb/databases'
export const KEYSTORE_PATH = './.orbitdb/keystore'

export const HEADS_PATH = 'log/_heads'
export const INDEX_PATH = 'log/_index'

export const SYNC_PROTOCOL = '/orbitdb/heads'
export const SYNC_TIMEOUT = 30000

export const ACCESS_CONTROLLER_IPFS_TYPE = 'ipfs'
export const ACCESS_CONTROLLER_ORBITDB_TYPE = 'orbitdb'

export const DATABASE_DOCUMENTS_TYPE = 'documents' as const
export const DATABASE_EVENTS_TYPE = 'events' as const
export const DATABASE_KEYVALUE_TYPE = 'keyvalue' as const
export const DATABASE_KEYVALUE_INDEXED_TYPE = 'keyvalue-indexed' as const
export const DATABASE_EDGEDB_TYPE = 'edgedb' as const

export const DATABASE_KEYVALUE_INDEXED_VALUE_ENCODING = 'json'

export const DATABASE_REFERENCES_COUNT = 16
export const DATABASE_CACHE_SIZE = 1000

export const DATABASE_DEFAULT_TYPE = 'events' as const

export const STORAGE_LEVEL_PATH = './.orbitdb/level'
export const STORAGE_LEVEL_VALUE_ENCODING = 'view'

export const STORAGE_LRU_SIZE = 10000000 // Increase this value
export const STORAGE_IPFS_BLOCKSTORAGE_TIMEOUT = 30000

export const IDENTITIES_PROVIDER_PUBLICKEY = 'publickey' as const
