import { exists } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import process from 'node:process'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bitswap } from '@helia/block-brokers'
import {
  circuitRelayServer,
  circuitRelayTransport,
} from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { mdns } from '@libp2p/mdns'
import { tcp } from '@libp2p/tcp'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import { all } from '@libp2p/websockets/filters'
import { LevelBlockstore } from 'blockstore-level'
import { createConsola } from 'consola'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { omit } from 'remeda'

import { ComposedStorage, LRUStorage, LevelStorage, RocksDBStorage } from './storage'
import { join } from './utils'

import { OrbitDB } from './index'

import type { Libp2pOptions } from './vendor'

interface Entry {
  _id: string
  payload: string
}

const logger = createConsola({
  defaults: {
    tag: 'orbitdb',
    level: 5,
  },
})

const directory = '.data'
const address = 'new'

const options: Libp2pOptions = {
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/0/ws'],
  },
  peerDiscovery: [mdns()],
  transports: [
    tcp(),
    webRTC(),
    webSockets({ filter: all }),
    circuitRelayTransport(),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  connectionManager: {
    maxPeerAddrsToDial: 1000,
  },
  connectionGater: {
    denyDialMultiaddr: () => false,
  },
  services: {
    identify: identify(),
    circuitRelay: circuitRelayServer(),
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
      globalSignaturePolicy: 'StrictNoSign',
    }),
  },
}

async function main() {
  const dbPath = join(directory, 'orbitdb', address)
  await mkdir(dbPath, { recursive: true, mode: 0o777 })

  const ipfs = await createHelia({
    libp2p: await createLibp2p({ ...options }),
    blockstore: new LevelBlockstore(`${directory}/ipfs/blocks`),
    blockBrokers: [bitswap()],
  })
  const orbit = await OrbitDB.create({
    id: 'test',
    directory,
    ipfs,
  })

  const db = await orbit.open<'documents', Entry>('documents', address, {
    entryStorage: await ComposedStorage.create({
      storage1: LRUStorage.create<Uint8Array>({
        size: 1000,
      }),
      storage2: await RocksDBStorage.create<Uint8Array>({
        path: join(dbPath, 'entries'),
      }),
    }),
    headsStorage: await ComposedStorage.create({
      storage1: LRUStorage.create<Uint8Array>({
        size: 1000,
      }),
      storage2: await RocksDBStorage.create<Uint8Array>({
        path: join(dbPath, 'heads'),
      }),
    }),
    indexStorage: await ComposedStorage.create({
      storage1: LRUStorage.create<boolean>({
        size: 1000,
      }),
      storage2: await LevelStorage.create<boolean>({
        path: join(dbPath, 'indexes'),
      }),
    }),
  })

  db.events.addEventListener('update', (event) => {
    logger.log(JSON.stringify(omit(event.detail.entry, ['bytes']), null, 2))
  })

  while (true) {
    const command = await logger.prompt('Enter a command: ', {
      type: 'select',
      options: [
        'get',
        'put',
        'del',
        'close',
      ],
    })
    if (command === 'close') {
      await db.close()
      process.exit(0)
    }

    const id = await logger.prompt('Enter an ID: ', {
      type: 'text',
    })

    switch (command) {
      case 'put':
        await db.put<Entry>({
          _id: id,
          payload: await logger.prompt('Enter a payload: ', {
            type: 'text',
          }),
        })
        logger.log('Put', id)
        break
      case 'del':
        await db.del(id)
        logger.log('Deleted', id)
        break
      case 'get':
        await db
          .get(id)
          .then((result) => {
            if (result) {
              logger.log(JSON.stringify(result.value, null, 2))
            }
            else {
              logger.log('Not found')
            }
          })
          .catch((error) => {
            logger.error(error)
          })
        break
      default:
        logger.log('Unknown command')
        break
    }
  }
}

main()
  .catch((error) => {
    logger.error(error)
  })
  .finally(() => {
    logger.info('Done')
  })
