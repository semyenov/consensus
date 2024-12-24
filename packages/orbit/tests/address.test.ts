import { describe, expect, it } from 'vitest'

import { OrbitDBAddress } from '../src/address'

describe('orbitDBAddress', () => {
  describe('create', () => {
    it('creates an OrbitDBAddress instance from a string', () => {
      const address = '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const result = OrbitDBAddress.create(address)
      expect(result)
        .toBeInstanceOf(OrbitDBAddress)
      expect(result.toString())
        .toBe(address)
    })

    it('returns the same instance if already an OrbitDBAddress', () => {
      const address = '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const instance = new OrbitDBAddress(address)
      const result = OrbitDBAddress.create(instance)
      expect(result)
        .toBe(instance)
    })
  })

  describe('constructor', () => {
    it('sets protocol, hash, and address properties', () => {
      const address = '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const instance = new OrbitDBAddress(address)
      expect(instance.protocol)
        .toBe('orbitdb')
      expect(instance.hash)
        .toBe('zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr')
      expect(instance.address)
        .toBe(address)
    })

    it('handles Windows-style paths', () => {
      const address = '\\orbitdb\\zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const instance = new OrbitDBAddress(address)
      expect(instance.hash)
        .toBe('zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr')
    })
  })

  describe('toString', () => {
    it('returns the full address string', () => {
      const address = '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const instance = new OrbitDBAddress(address)
      expect(instance.toString())
        .toBe(address)
    })
  })

  describe('isValidAddress', () => {
    it('returns true for valid addresses', () => {
      const validAddresses = [
        '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr',
        '\\orbitdb\\zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr',
      ]
      for (const address of validAddresses) {
        expect(OrbitDBAddress.isValidAddress(address))
          .toBe(true)
      }
    })

    it('returns false for invalid addresses', () => {
      const invalidAddresses = [
        '/ipfs/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr',
        'zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr',
        '/orbitdb/invalid-cid',
        '',
        '/orbitdb/',
      ]
      for (const address of invalidAddresses) {
        expect(OrbitDBAddress.isValidAddress(address))
          .toBe(false)
      }
    })
  })

  describe('parseAddress', () => {
    it('parses valid addresses', () => {
      const address = '/orbitdb/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      const result = OrbitDBAddress.parseAddress(address)
      expect(result)
        .toBeInstanceOf(OrbitDBAddress)
      expect(result.toString())
        .toBe(address)
    })

    it('throws an error for invalid addresses', () => {
      const invalidAddress = '/ipfs/zdpuAuSAkwdDRFqkpqrKm5tUkr81SgvPgvLEcxJsUHqHBKvfr'
      expect(() => OrbitDBAddress.parseAddress(invalidAddress))
        .toThrow('Not a valid OrbitDB address')
    })

    it('throws an error for empty addresses', () => {
      expect(() => OrbitDBAddress.parseAddress(''))
        .toThrow('Not a valid OrbitDB address')
    })
  })
})
