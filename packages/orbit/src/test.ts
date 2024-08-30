import { type GossipSub, gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bitswap } from '@helia/block-brokers'
import { bootstrap } from '@libp2p/bootstrap'
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
import { createLogger } from '@regioni/lib-logger'
import { LevelBlockstore } from 'blockstore-level'
import { createHelia } from 'helia'
import { type Libp2pOptions, createLibp2p } from 'libp2p'

import { OrbitDB } from './index.js'

const logger = createLogger({
  defaultMeta: {
    service: 'orbitdb',
    label: 'test',
  },
})

const directory = './orbitdb'
const options: Libp2pOptions<{
  pubsub: GossipSub
}> = {
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
    bootstrap({
      list: ['/ip4/192.168.10.53/tcp/41613/ws/p2p/12D3KooWHrQf4KmPEJEwY53NdzQ5woniNq6Jt7So8fEYScjUWeQQ'],
    }),
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
    denyDialMultiaddr: () => {
      return false
    },
  },
  services: {
    identify: identify(),
    circuitRelay: circuitRelayServer(),
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
    }) as unknown as GossipSub,
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

  const db = await orbit.open<{ _id: string, test: string }, 'documents'>(
    'documents',
    '/orbitdb/zdpuAqDgvEBDFh2xdNMwzAYJXg17J46Z25yMYHsMuiZpJcbT6',
  )

  db.events.addEventListener('update', (entry) => {
    console.log(entry)
  })

  console.log(db)
  // db.put({ _id: 'test', test: 'test' })

  // const result = await db.get('test')
  // console.log(result)
}

main()
