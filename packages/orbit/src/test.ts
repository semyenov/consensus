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

import { ComposedStorage, RocksDBStorage } from './storage'

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

const directory = './orbitdb'
const options: Libp2pOptions = {
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/0/ws'],
  },
  // logger: {
  //   forComponent(name: string) {
  //     const l = (formatter: string, ...args: []) => {
  //       logger.info(formatter, { label: name, ...args })
  //     }

  //     l.enabled = true
  //     l.error = (formatter: string, ...args: []) => {
  //       logger.error(formatter, { label: name, ...args })
  //     }
  //     l.trace = (formatter: string, ...args: []) => {
  //       logger.debug(formatter, { label: name, ...args })
  //     }

  //     return l
  //   },
  // },
  peerDiscovery: [
    mdns(),
    // bootstrap({
    //   list: ['/ip4/192.168.10.53/tcp/41613/ws/p2p/12D3KooWHrQf4KmPEJEwY53NdzQ5woniNq6Jt7So8fEYScjUWeQQ'],
    // }),
  ],
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
  const ipfs = await createHelia({
    libp2p: await createLibp2p({ ...options }),
    blockstore: new LevelBlockstore(`${directory}/ipfs/blocks`),
    blockBrokers: [bitswap()],
  })
  const orbit = await OrbitDB.create({
    id: 'test',
    directory: './orbitdb',
    ipfs,
  })

  const db = await orbit.open<'documents', Entry>('documents', 'new', {
    entryStorage: ComposedStorage.create({
      storage1: await RocksDBStorage.create<Uint8Array>({
        path: `${directory}/entries1`,
      }),
      storage2: await RocksDBStorage.create<Uint8Array>({
        path: `${directory}/entries2`,
      }),
    }),
  })

  db.events.addEventListener('update', (entry) => {
    logger.log(entry.detail.entry.payload)
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
        await db.put({
          _id: id,
          payload: await logger.prompt('Enter a payload: ', {
            type: 'text',
          }),
        })
        break
      case 'del':
        await db.del(id)
        logger.log('Deleted', id)
        break
      case 'get':
        await db.get(id)
          .then((result) => {
            if (result) {
              logger.log(result.value)
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
