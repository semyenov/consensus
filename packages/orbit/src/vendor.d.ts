import type { GossipsubEvents } from '@chainsafe/libp2p-gossipsub'
import type { keys as CryptoKeys } from '@libp2p/crypto'
import type { PubSub, ServiceMap } from '@libp2p/interface'
import type { HeliaLibp2p } from 'helia'
import type { Libp2p, Libp2pOptions as Libp2pOptionsType } from 'libp2p'

export type Secp256k1PrivateKey = CryptoKeys.Secp256k1PrivateKey
export type Secp256k1PublicKey = CryptoKeys.Secp256k1PublicKey
export interface Libp2pServiceMap extends ServiceMap { pubsub: PubSub<GossipsubEvents> }
export type Libp2pOptions = Libp2pOptionsType<Libp2pServiceMap>
export type Libp2pInstance = Libp2p<Libp2pServiceMap>
export type HeliaInstance = HeliaLibp2p<Libp2pInstance>

export type { PeerId, PublicKey, KeyType, PrivateKey } from '@libp2p/interface'
