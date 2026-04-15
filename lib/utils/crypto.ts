/**
 * @fileoverview Cryptographic utilities for the APIGS Report Library.
 *
 * This module provides AES‑256‑GCM encryption and decryption for sensitive
 * configuration data (passwords), along with SHA‑256 hashing and secure
 * master key management. The master key is automatically generated and stored
 * in the user's home directory (`~/.config/apigsreport/.master_key`) with
 * `0600` permissions.
 *
 * **Security features:**
 * - AES‑256‑GCM (authenticated encryption) with 12‑byte nonces and 16‑byte auth tags.
 * - Master key generated via `crypto.randomBytes()`.
 * - Automatic key file creation with restricted permissions.
 * - Zeroisation of master key from memory via `clearMasterKey()`.
 * - Integrity verification via separate SHA‑256 hash (used by config manager).
 *
 * @module utils/crypto
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs'
import { CryptoError } from '../handler/error.js'
import { logger } from '../handler/logger.js'

/** @internal AES‑256‑GCM algorithm identifier. */
const ALGORITHM = 'aes-256-gcm'

/** @internal Key length in bytes (256 bits). */
const KEY_LENGTH = 32

/** @internal Nonce length in bytes (96 bits, recommended for GCM). */
const NONCE_LENGTH = 12

/** @internal Authentication tag length in bytes (128 bits). */
const AUTH_TAG_LENGTH = 16

/**
 * In‑memory cached master key.
 * @internal
 */
let masterKey: Buffer | null = null

/**
 * Retrieves the master encryption key, loading from disk or generating a new one.
 *
 * The master key is stored at `~/.config/apigsreport/.master_key` as a hex string.
 * If the file does not exist, a cryptographically secure random key is generated,
 * saved with `0600` permissions, and cached in memory. Subsequent calls return
 * the cached key.
 *
 * **Important:** The key is never logged or exposed outside this module.
 *
 * @returns The master key as a `Buffer` (32 bytes).
 *
 * @throws {CryptoError} If the existing key file has an invalid length or cannot be read.
 *
 * @example
 * ```typescript
 * import { getMasterKey } from 'apigsreport/utils/crypto'
 *
 * const key = getMasterKey()
 * console.log(`Key length: ${key.length} bytes`)
 * ```
 *
 * @public
 */
export function getMasterKey(): Buffer {
	if (masterKey) return masterKey
	const keyPath = getKeyPath()
	logger.trace('Crypto: Loading master key', { path: keyPath })
	if (existsSync(keyPath)) {
		try {
			const hex = readFileSync(keyPath, 'utf-8').trim()
			const key = Buffer.from(hex, 'hex')
			if (key.length !== KEY_LENGTH) {
				throw new Error(`Invalid key length: ${key.length} bytes, expected ${KEY_LENGTH}`)
			}
			masterKey = key
			logger.debug('Crypto: Master key loaded from file')
			return key
		} catch (error) {
			logger.error('Crypto: Failed to load master key', error as Error)
			throw new CryptoError('Failed to load encryption key', { cause: error })
		}
	}
	logger.info('Crypto: Generating new master key')
	const newKey = randomBytes(KEY_LENGTH)
	const dir = dirname(keyPath)
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}
	writeFileSync(keyPath, newKey.toString('hex'), 'utf-8')
	try {
		chmodSync(keyPath, 0o600)
		logger.trace('Crypto: Key file permissions set to 600')
	} catch (permError) {
		logger.warn('Crypto: Could not set key file permissions', {
			path: keyPath,
			error: (permError as Error).message,
		})
	}
	masterKey = newKey
	logger.debug('Crypto: New master key generated and saved')
	return newKey
}

/**
 * Returns the absolute filesystem path to the master key file.
 *
 * The path is: `~/.config/apigsreport/.master_key`
 *
 * @returns The full path to the master key file.
 *
 * @example
 * ```typescript
 * import { getKeyPath } from 'apigsreport/utils/crypto'
 *
 * console.log(`Master key stored at: ${getKeyPath()}`)
 * ```
 *
 * @public
 */
export function getKeyPath(): string {
	return join(homedir(), '.config', 'apigsreport', '.master_key')
}

/**
 * Encrypts a plaintext string using AES‑256‑GCM.
 *
 * The encryption process:
 * 1. Retrieves the master key (generates if missing).
 * 2. Generates a random 12‑byte nonce.
 * 3. Encrypts the plaintext using AES‑256‑GCM.
 * 4. Extracts the 16‑byte authentication tag.
 * 5. Concatenates `nonce + authTag + ciphertext`.
 * 6. Returns the result as a hex string.
 *
 * @param plaintext - The string to encrypt (UTF‑8 encoded).
 * @returns Hex‑encoded ciphertext that includes nonce, auth tag, and encrypted data.
 *
 * @throws {CryptoError} If encryption fails (e.g., invalid key, algorithm error).
 *
 * @example
 * ```typescript
 * import { encrypt, decrypt } from 'apigsreport/utils/crypto'
 *
 * const secret = 'mySuperSecretPassword'
 * const encrypted = encrypt(secret)
 * console.log(`Encrypted: ${encrypted}`)
 *
 * const decrypted = decrypt(encrypted)
 * console.log(decrypted === secret) // true
 * ```
 *
 * @public
 */
export function encrypt(plaintext: string): string {
	const key = getMasterKey()
	const nonce = randomBytes(NONCE_LENGTH)
	logger.trace('Crypto: Encrypting', {
		plaintextLength: plaintext.length,
		nonce: nonce.toString('hex').substring(0, 16) + '...',
	})
	const cipher = createCipheriv(ALGORITHM, key, nonce, {
		authTagLength: AUTH_TAG_LENGTH,
	})
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
	const authTag = cipher.getAuthTag()
	const result = Buffer.concat([nonce, authTag, ciphertext])
	logger.trace('Crypto: Encryption complete', {
		outputLength: result.length,
		nonceLength: NONCE_LENGTH,
		authTagLength: AUTH_TAG_LENGTH,
		ciphertextLength: ciphertext.length,
	})
	return result.toString('hex')
}

/**
 * Decrypts a previously AES‑256‑GCM encrypted hex string.
 *
 * The decryption process:
 * 1. Retrieves the master key.
 * 2. Decodes the hex string to a Buffer.
 * 3. Extracts nonce (first 12 bytes), auth tag (next 16 bytes), and ciphertext.
 * 4. Verifies the authentication tag (integrity check).
 * 5. Decrypts and returns the plaintext.
 *
 * @param ciphertextHex - Hex‑encoded ciphertext produced by `encrypt()`.
 * @returns The original plaintext string.
 *
 * @throws {CryptoError} If the ciphertext is too short, corrupted, tampered,
 *                       or decryption fails for any reason.
 *
 * @example
 * ```typescript
 * import { decrypt } from 'apigsreport/utils/crypto'
 *
 * const decrypted = decrypt('a1b2c3...')
 * ```
 *
 * @public
 */
export function decrypt(ciphertextHex: string): string {
	const key = getMasterKey()
	const data = Buffer.from(ciphertextHex, 'hex')
	logger.trace('Crypto: Decrypting', {
		inputLength: data.length,
		ciphertextHex: ciphertextHex.substring(0, 32) + '...',
	})
	if (data.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
		throw new CryptoError('Invalid ciphertext: too short', {
			context: { length: data.length, minLength: NONCE_LENGTH + AUTH_TAG_LENGTH },
		})
	}
	const nonce = data.subarray(0, NONCE_LENGTH)
	const authTag = data.subarray(NONCE_LENGTH, NONCE_LENGTH + AUTH_TAG_LENGTH)
	const ciphertext = data.subarray(NONCE_LENGTH + AUTH_TAG_LENGTH)
	const decipher = createDecipheriv(ALGORITHM, key, nonce, {
		authTagLength: AUTH_TAG_LENGTH,
	})
	decipher.setAuthTag(authTag)
	try {
		const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
		logger.trace('Crypto: Decryption complete', {
			plaintextLength: plaintext.length,
		})
		return plaintext.toString('utf-8')
	} catch (error) {
		logger.error('Crypto: Decryption failed', error as Error)
		throw new CryptoError('Decryption failed - data may be corrupted or tampered', {
			cause: error,
		})
	}
}

/**
 * Computes a SHA‑256 hash of the input string.
 *
 * This function is used for integrity verification (e.g., password hashes
 * stored in the config file). It is **not** suitable for password storage
 * because it lacks salting and is fast; use dedicated password hashing
 * libraries for user authentication.
 *
 * @param value - The string to hash.
 * @returns Hexadecimal representation of the SHA‑256 digest.
 *
 * @example
 * ```typescript
 * import { hash } from 'apigsreport/utils/crypto'
 *
 * const digest = hash('myValue')
 * console.log(digest) // 64 hex characters
 * ```
 *
 * @public
 */
export function hash(value: string): string {
	return createHash('sha256').update(value, 'utf-8').digest('hex')
}

/**
 * Securely zeroes the in‑memory master key and clears the reference.
 *
 * After calling this function, the next call to `getMasterKey()`, `encrypt()`,
 * or `decrypt()` will reload (or regenerate) the key from disk.
 *
 * This is useful for long‑running applications that want to reduce the
 * lifetime of sensitive key material in memory.
 *
 * @example
 * ```typescript
 * import { clearMasterKey, encrypt } from 'apigsreport/utils/crypto'
 *
 * // Use encryption...
 * const encrypted = encrypt('data')
 *
 * // Clear key from memory when no longer needed
 * clearMasterKey()
 *
 * // Next encrypt() will reload key from disk
 * const encrypted2 = encrypt('more data')
 * ```
 *
 * @public
 */
export function clearMasterKey(): void {
	if (masterKey) {
		masterKey.fill(0)
		masterKey = null
		logger.debug('Crypto: Master key cleared from memory')
	}
}
