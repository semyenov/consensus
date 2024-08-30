import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bitswap } from '@helia/block-brokers'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import { all } from '@libp2p/websockets/filters'
import { MemoryBlockstore } from 'blockstore-core'
import { LevelBlockstore } from 'blockstore-level'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'

const isBrowser = () => typeof window !== 'undefined'

const Libp2pOptions = {
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0/ws'],
  },
  transports: [
    webSockets({
      filter: all,
    }),
    webRTC(),
    circuitRelayTransport({
      discoverRelays: 1,
    }),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => false,
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  },
}

/**
 * A basic Libp2p configuration for browser nodes.
 */
const Libp2pBrowserOptions = {
  addresses: {
    listen: ['/webrtc'],
  },
  transports: [
    webSockets({
      filter: all,
    }),
    webRTC(),
    circuitRelayTransport({
      discoverRelays: 1,
    }),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => false,
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  },
}

export default async ({ directory }: { directory?: string } = {}) => {
  const options = isBrowser()
    ? Libp2pBrowserOptions
    : Libp2pOptions

  const libp2p = await createLibp2p({ ...options })

  const blockstore = directory
    ? new LevelBlockstore(`${directory}/blocks`)
    : new MemoryBlockstore()

  const heliaOptions = {
    blockstore,
    libp2p,
    blockBrokers: [bitswap()],
  }

  return createHelia({ ...heliaOptions })
}
