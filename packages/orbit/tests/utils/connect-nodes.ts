import { type Multiaddr, multiaddr } from '@multiformats/multiaddr'
import { WebRTC } from '@multiformats/multiaddr-matcher'

import waitFor from './wait-for'

import type { HeliaInstance } from '../../src/vendor'

const RELAY_ID = '12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'

const isBrowser = () => typeof window !== 'undefined'
const defaultFilter = () => true

async function connectIpfsNodes(ipfs1: HeliaInstance, ipfs2: HeliaInstance, options = {
  filter: defaultFilter,
}) {
  if (isBrowser()) {
    let address1: Multiaddr | undefined

    await ipfs1.libp2p.dial(
      multiaddr(`/ip4/127.0.0.1/tcp/12345/ws/p2p/${RELAY_ID}`),
    )

    await waitFor(
      () => {
        address1 = ipfs1.libp2p
          .getMultiaddrs()
          .filter(ma => WebRTC.matches(ma))
          .pop()

        return address1 !== null
      },
      () => true,
    )

    await ipfs2.libp2p
      .dial(address1 as Multiaddr)
  }
  else {
    await ipfs2.libp2p.peerStore
      .save(ipfs1.libp2p.peerId, {
        multiaddrs: ipfs1.libp2p
          .getMultiaddrs()
          .filter(options.filter),
      })
    await ipfs2.libp2p
      .dial(ipfs1.libp2p.peerId)
  }
}

export default connectIpfsNodes
