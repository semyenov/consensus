import type { HeliaInstance, PeerId } from '../../src/vendor'

function waitForPeers(ipfs: HeliaInstance, peersToWait: PeerId[], topic: string) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const peers = await ipfs.libp2p.services.pubsub.getPeers(topic)
        const peerIds = peers.map(peer => peer.toString())
        const peerIdsToWait = peersToWait.map(peer => peer.toString())

        const hasAllPeers = peerIdsToWait.map(e =>
          peerIds.includes(e),
        )
          .filter(e => e === false).length === 0

        // FIXME: Does not fail on timeout, not easily fixable
        if (hasAllPeers) {
          clearInterval(interval)
          resolve(true)
        }
      }
      catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, 200)
  })
}

export default waitForPeers
