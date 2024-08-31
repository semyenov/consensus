import {
  Documents,
  DocumentsDatabase,
  type DocumentsInstance,
  type DocumentsOptions,
} from './documents'
import {
  EdgeDB,
  EdgeDBDatabase,
  type EdgeDBInstance,
  type EdgeDBOptions,
} from './edgedb'
import {
  Events,
  EventsDatabase,
  type EventsInstance,
  type EventsOptions,
} from './events'
import {
  KeyValue,
  KeyValueDatabase,
  type KeyValueInstance,
} from './keyvalue'
import {
  KeyValueIndexed,
  KeyValueIndexedDatabase,
  type KeyValueIndexedInstance,
  type KeyValueIndexedOptions,
} from './keyvalue-indexed'

export interface DatabaseOperation<T> {
  op: 'PUT' | 'DEL' | 'ADD'
  key: string | null
  value: T | null
}

export interface DatabaseTypeMap<T = unknown> {
  'events': EventsDatabase<T>
  'documents': DocumentsDatabase<T>
  'keyvalue': KeyValueDatabase<T>
  'keyvalue-indexed': KeyValueIndexedDatabase<T>
  'edgedb': EdgeDBDatabase<T> // Add this line
}

export interface DatabaseType<T, D extends keyof DatabaseTypeMap<T>> {
  type: D
  create: (...args: any[]) => Promise<DatabaseTypeMap<T>[D]>
}

const databaseTypes: Record<
  string,
  () => Promise<DatabaseTypeMap<any>[keyof DatabaseTypeMap<any>]>
> = {}

export function useDatabaseType<T, D extends keyof DatabaseTypeMap<T>>(database: DatabaseType<T, D>) {
  if (!database.type) {
    throw new Error('Database type does not contain required field \'type\'.')
  }

  databaseTypes[database.type] = database.create
}

export function getDatabaseType<
  T = unknown,
  D extends keyof DatabaseTypeMap<T> = 'events',
>(type: D) {
  if (!type) {
    throw new Error('Type not specified')
  }

  if (!databaseTypes[type!]) {
    throw new Error(`Unsupported database type: '${type}'`)
  }

  return databaseTypes[type!]
}

useDatabaseType(EventsDatabase)
useDatabaseType(DocumentsDatabase)
useDatabaseType(KeyValueDatabase)
useDatabaseType(KeyValueIndexedDatabase)
useDatabaseType(EdgeDBDatabase)

export { Documents, Events, KeyValue, KeyValueIndexed, EdgeDB }
export type {
  DocumentsInstance,
  DocumentsOptions,
  EventsInstance,
  EventsOptions,
  KeyValueIndexedInstance,
  KeyValueIndexedOptions,
  KeyValueInstance,
  EdgeDBInstance,
  EdgeDBOptions,
}
