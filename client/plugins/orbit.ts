import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bitswap } from '@helia/block-brokers'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import { all } from '@libp2p/websockets/filters'
import { webTransport } from '@libp2p/webtransport'
import { OrbitDB } from '@regioni/orbit'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'

import type { GossipsubEvents } from '@chainsafe/libp2p-gossipsub'
import type { PubSub, ServiceMap } from '@libp2p/interface'
import type { Libp2pOptions as Libp2pOptionsType } from 'libp2p'

export interface Libp2pServiceMap extends ServiceMap { pubsub: PubSub<GossipsubEvents> }
export type Libp2pOptions = Libp2pOptionsType<Libp2pServiceMap>

export default defineNuxtPlugin(async (nuxtApp) => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  const options: Libp2pOptions = {
    addresses: {
      listen: ['/webrtc'],
    },
    transports: [
      webRTC(),
      webTransport(),
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
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        globalSignaturePolicy: 'StrictNoSign',
      }),
    },
  }
  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({
    libp2p,
    blockBrokers: [bitswap()],
  })
  const orbit = await OrbitDB.create({
    id: 'test',
    ipfs,
  })

  nuxtApp.vueApp.provide('orbit', orbit)
})
