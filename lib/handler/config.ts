/**
 * @fileoverview Configuration manager for APIGS Report Library.
 *
 * This module provides a secure, encrypted configuration management system for
 * storing SSRS connection settings. It supports both environment variables and
 * an encrypted JSON file stored in the user's home directory.
 *
 * The configuration file is encrypted using AES-256-GCM and protected with
 * a master key stored in `~/.config/apigsreport/.master_key`. File permissions
 * are set to `0600` to prevent unauthorized access.
 *
 * @module handler/config
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { z } from 'zod'
import { encrypt, decrypt } from '../utils/crypto.js'
import { ConfigError, CryptoError } from './error.js'
import { logger } from './logger.js'
import { envManager } from './env.js'

/**
 * Zod schema for validating the runtime configuration file structure.
 *
 * This schema ensures that all required fields are present and properly formatted
 * before the configuration is used by the library.
 *
 * @internal
 */
const ConfigSchema = z.object({
	SSRS_BASE_URL: z
		.string()
		.url('Must be a valid URL')
		.refine((url) => url.startsWith('http'), 'Must start with http:// or https://'),
	SSRS_USERNAME: z.string().min(1, 'Username cannot be empty'),
	SSRS_PASSWORD: z.string().min(1, 'Password cannot be empty'),
	SSRS_DOMAIN: z
		.string()
		.regex(/^[a-zA-Z0-9.-]+$/, 'Domain can only contain alphanumeric, dots, and hyphens')
		.optional(),
	REQUEST_TIMEOUT: z.number().int().positive().default(30000),
	RETRY_ATTEMPTS: z.number().int().min(0).max(5).default(3),
	LOG_LEVEL: z
		.enum(['silent', 'error', 'warn', 'info', 'debug', 'trace', 'verbose'])
		.default('info'),
})

/**
 * Runtime configuration object after decryption and validation.
 *
 * This type represents the fully resolved configuration that the library uses.
 * Passwords are stored in plaintext only in memory and never written to disk.
 *
 * @public
 */
export type ConfigFile = z.infer<typeof ConfigSchema>

/**
 * Zod schema for the encrypted on‑disk configuration structure.
 *
 * The stored format includes encrypted password, integrity hash, and timestamps.
 * Passwords are never stored in plaintext.
 *
 * @internal
 */
const StoredConfigSchema = z.object({
	SSRS_BASE_URL: z.string(),
	SSRS_USERNAME: z.string(),
	SSRS_PASSWORD_ENCRYPTED: z.string(),
	SSRS_DOMAIN: z.string().optional(),
	SSRS_PASSWORD_HASH: z.string(),
	REQUEST_TIMEOUT: z.number().optional(),
	RETRY_ATTEMPTS: z.number().optional(),
	LOG_LEVEL: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

/**
 * Type representing the encrypted configuration as stored on disk.
 *
 * @public
 */
export type StoredConfig = z.infer<typeof StoredConfigSchema>

/**
 * Manages loading, saving, and accessing encrypted SSRS configuration.
 *
 * The `ConfigManager` is a singleton that handles the secure storage of
 * SSRS credentials and settings. It encrypts sensitive data using AES‑256‑GCM
 * and stores the configuration file at `~/.apigsreportrc` with restricted
 * permissions (`0600`). A master key is automatically generated and stored at
 * `~/.config/apigsreport/.master_key`.
 *
 * **Features:**
 * - Encrypted storage for passwords
 * - Integrity verification via SHA‑256 hash
 * - Fallback to environment variables in development
 * - Production mode that **requires** an existing config file
 * - Secure clearing of configuration (overwrites file before deletion)
 *
 * @example
 * ```typescript
 * import { configManager } from 'apigsreport'
 *
 * // Save configuration
 * await configManager.save({
 *   SSRS_BASE_URL: 'https://reportserver.company.com',
 *   SSRS_USERNAME: 'john.doe',
 *   SSRS_PASSWORD: 'secret123',
 *   SSRS_DOMAIN: 'CORP',
 *   REQUEST_TIMEOUT: 60000,
 *   RETRY_ATTEMPTS: 5,
 *   LOG_LEVEL: 'debug'
 * })
 *
 * // Load configuration with environment fallback
 * const config = await configManager.getWithFallback()
 * console.log(config.SSRS_BASE_URL)
 *
 * // Clear configuration securely
 * await configManager.clear()
 * ```
 *
 * @public
 */
export class ConfigManager {
	private static instance: ConfigManager
	private configPath: string
	private loadedConfig: ConfigFile | null = null

	/**
	 * Private constructor – use `getInstance()` instead.
	 *
	 * Initializes the configuration file path to `~/.apigsreportrc`.
	 *
	 * @internal
	 */
	private constructor() {
		this.configPath = join(homedir(), '.apigsreportrc')
		logger.trace('ConfigManager: Initialized', { configPath: this.configPath })
	}

	/**
	 * Returns the singleton instance of `ConfigManager`.
	 *
	 * @returns The global `ConfigManager` instance.
	 *
	 * @example
	 * ```typescript
	 * const manager = ConfigManager.getInstance()
	 * ```
	 */
	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager()
		}
		return ConfigManager.instance
	}

	/**
	 * Checks whether the configuration file exists on disk.
	 *
	 * @returns `true` if `~/.apigsreportrc` exists, otherwise `false`.
	 *
	 * @example
	 * ```typescript
	 * if (configManager.exists()) {
	 *   console.log('Config file found')
	 * }
	 * ```
	 */
	exists(): boolean {
		const exists = existsSync(this.configPath)
		logger.trace('ConfigManager: File existence check', {
			path: this.configPath,
			exists,
		})
		return exists
	}

	/**
	 * Loads and decrypts the configuration file from disk.
	 *
	 * This method reads the encrypted JSON file, validates its structure,
	 * decrypts the password, verifies its integrity using SHA‑256, and returns
	 * a fully resolved `ConfigFile` object.
	 *
	 * **Note:** The file must already exist – otherwise a `ConfigError` is thrown.
	 * For production‑safe loading with environment fallback, use `getWithFallback()`.
	 *
	 * @returns Resolved configuration object with decrypted password.
	 *
	 * @throws {ConfigError} If the configuration file does not exist, is malformed,
	 *                       or fails schema validation.
	 * @throws {CryptoError} If password decryption or integrity verification fails.
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   const config = await configManager.load()
	 *   console.log(`Loaded config for ${config.SSRS_USERNAME}`)
	 * } catch (error) {
	 *   console.error('Failed to load config', error)
	 * }
	 * ```
	 */
	async load(): Promise<ConfigFile> {
		logger.debug('ConfigManager: Loading config file', { path: this.configPath })
		const endTimer = logger.time('config-load')
		if (!existsSync(this.configPath)) {
			logger.error('ConfigManager: Config file not found', undefined, {
				path: this.configPath,
			})
			throw new ConfigError('Configuration file not found', {
				context: { path: this.configPath, mode: 'production' },
			})
		}
		try {
			const raw = readFileSync(this.configPath, 'utf-8')
			const parsed = JSON.parse(raw)
			logger.trace('ConfigManager: Raw config loaded', {
				keys: Object.keys(parsed),
				hasEncryptedPassword: !!parsed.SSRS_PASSWORD_ENCRYPTED,
			})
			const stored = StoredConfigSchema.parse(parsed)
			const decryptedPassword = decrypt(stored.SSRS_PASSWORD_ENCRYPTED)
			const { createHash } = await import('node:crypto')
			const computedHash = createHash('sha256').update(decryptedPassword).digest('hex')
			if (computedHash !== stored.SSRS_PASSWORD_HASH) {
				logger.error('ConfigManager: Password integrity check failed')
				throw new CryptoError('Password verification failed - config may be corrupted')
			}
			const config: ConfigFile = {
				SSRS_BASE_URL: stored.SSRS_BASE_URL,
				SSRS_USERNAME: stored.SSRS_USERNAME,
				SSRS_PASSWORD: decryptedPassword,
				SSRS_DOMAIN: stored.SSRS_DOMAIN,
				REQUEST_TIMEOUT: stored.REQUEST_TIMEOUT ?? 30000,
				RETRY_ATTEMPTS: stored.RETRY_ATTEMPTS ?? 3,
				LOG_LEVEL: (stored.LOG_LEVEL as any) ?? 'info',
			}
			ConfigSchema.parse(config)
			this.loadedConfig = config
			endTimer()
			logger.configLoaded('file', this.configPath)
			logger.debug('ConfigManager: Loaded successfully', {
				baseUrl: config.SSRS_BASE_URL,
				username: config.SSRS_USERNAME,
				hasDomain: !!config.SSRS_DOMAIN,
			})
			return config
		} catch (error) {
			endTimer()
			logger.error('ConfigManager: Load failed', error as Error, { path: this.configPath })
			if (error instanceof z.ZodError) {
				throw new ConfigError('Config file schema validation failed', {
					context: {
						errors: error.issues.map((e) => ({
							path: e.path.join('.'),
							message: e.message,
						})),
					},
					cause: error,
				})
			}
			if (error instanceof ConfigError || error instanceof CryptoError) {
				throw error
			}
			throw new ConfigError('Failed to load configuration', { cause: error })
		}
	}

	/**
	 * Encrypts and writes configuration to the file system.
	 *
	 * The method validates the input configuration, encrypts the password using
	 * AES‑256‑GCM, computes an integrity hash, and stores the data in
	 * `~/.apigsreportrc`. File permissions are set to `0o600` (read/write for
	 * owner only) by default.
	 *
	 * If the master key does not exist, it will be automatically generated
	 * (by the underlying `crypto.encrypt()` function).
	 *
	 * @param config - Configuration object to save. All fields except password are stored in plaintext.
	 * @param options - Optional settings.
	 * @param options.mode - File permissions as an octal number (default: `0o600`).
	 *
	 * @throws {ConfigError} If validation fails or writing to disk fails.
	 * @throws {CryptoError} If encryption fails.
	 *
	 * @example
	 * ```typescript
	 * await configManager.save({
	 *   SSRS_BASE_URL: 'https://ssrs.example.com',
	 *   SSRS_USERNAME: 'api_user',
	 *   SSRS_PASSWORD: 'very_secret',
	 *   LOG_LEVEL: 'debug'
	 * })
	 * ```
	 */
	async save(config: ConfigFile, options?: { mode?: number }): Promise<void> {
		logger.debug('ConfigManager: Saving config file', { path: this.configPath })
		const endTimer = logger.time('config-save')
		try {
			ConfigSchema.parse(config)
			const encryptedPassword = encrypt(config.SSRS_PASSWORD)
			const { createHash } = await import('node:crypto')
			const passwordHash = createHash('sha256').update(config.SSRS_PASSWORD).digest('hex')
			const now = new Date().toISOString()
			const stored: StoredConfig = {
				SSRS_BASE_URL: config.SSRS_BASE_URL,
				SSRS_USERNAME: config.SSRS_USERNAME,
				SSRS_PASSWORD_ENCRYPTED: encryptedPassword,
				SSRS_PASSWORD_HASH: passwordHash,
				SSRS_DOMAIN: config.SSRS_DOMAIN,
				REQUEST_TIMEOUT: config.REQUEST_TIMEOUT,
				RETRY_ATTEMPTS: config.RETRY_ATTEMPTS,
				LOG_LEVEL: config.LOG_LEVEL,
				createdAt: now,
				updatedAt: now,
			}
			const content = JSON.stringify(stored, null, 2)
			writeFileSync(this.configPath, content, 'utf-8')
			const mode = options?.mode ?? 0o600
			try {
				chmodSync(this.configPath, mode)
				logger.trace('ConfigManager: File permissions set', { mode: mode.toString(8) })
			} catch (permError) {
				logger.warn('ConfigManager: Could not set file permissions', {
					path: this.configPath,
					error: (permError as Error).message,
				})
			}
			this.loadedConfig = config
			endTimer()
			logger.info('ConfigManager: Configuration saved', {
				path: this.configPath,
				permissions: mode.toString(8),
			})
		} catch (error) {
			endTimer()
			logger.error('ConfigManager: Save failed', error as Error, { path: this.configPath })
			if (error instanceof z.ZodError) {
				throw new ConfigError('Invalid configuration data', {
					context: {
						errors: error.issues.map((e) => ({
							path: e.path.join('.'),
							message: e.message,
						})),
					},
					cause: error,
				})
			}
			throw new ConfigError('Failed to save configuration', { cause: error })
		}
	}

	/**
	 * Securely deletes the configuration file.
	 *
	 * This method overwrites the file content with zeros before unlinking it,
	 * preventing recovery of sensitive data from disk. If the file does not exist,
	 * the method returns silently.
	 *
	 * After clearing, the in‑memory cached configuration is also reset.
	 *
	 * @throws {ConfigError} If the deletion or overwrite operation fails.
	 *
	 * @example
	 * ```typescript
	 * await configManager.clear()
	 * console.log('Configuration removed securely')
	 * ```
	 */
	async clear(): Promise<void> {
		logger.debug('ConfigManager: Clearing configuration', { path: this.configPath })
		if (!existsSync(this.configPath)) {
			logger.warn('ConfigManager: Nothing to clear - file does not exist')
			return
		}
		try {
			const { writeFileSync, unlinkSync, statSync } = await import('node:fs')
			const stats = statSync(this.configPath)
			writeFileSync(this.configPath, Buffer.alloc(stats.size, 0))
			unlinkSync(this.configPath)
			this.loadedConfig = null
			logger.info('ConfigManager: Configuration cleared securely')
		} catch (error) {
			logger.error('ConfigManager: Clear failed', error as Error, { path: this.configPath })
			throw new ConfigError('Failed to clear configuration', { cause: error })
		}
	}

	/**
	 * Retrieves configuration using intelligent fallback based on `NODE_ENV`.
	 *
	 * **Production mode** (`NODE_ENV === 'production'`):
	 * - **Requires** an existing encrypted config file.
	 * - Environment variables are ignored.
	 *
	 * **Development mode** (default):
	 * - If config file exists, it is loaded.
	 * - Otherwise, environment variables are used (with default timeouts/retries).
	 *
	 * This method is the recommended way to obtain configuration in most applications.
	 *
	 * @returns A fully resolved `ConfigFile` object.
	 *
	 * @throws {ConfigError} In production if no config file exists, or if
	 *                       environment variables are incomplete in development fallback.
	 *
	 * @example
	 * ```typescript
	 * // In production: uses encrypted file
	 * // In development: uses file if present, else env vars
	 * const config = await configManager.getWithFallback()
	 * ```
	 */
	async getWithFallback(): Promise<ConfigFile> {
		const nodeEnv = process.env.NODE_ENV ?? 'development'
		logger.debug('ConfigManager: Getting config with fallback', { NODE_ENV: nodeEnv })
		if (nodeEnv === 'production') {
			if (!this.exists()) {
				throw new ConfigError('Production mode requires config file', {
					context: { path: this.configPath, NODE_ENV: 'production' },
				})
			}
			return this.load()
		}
		if (this.exists()) {
			logger.info('ConfigManager: Using config file in development mode')
			return this.load()
		}
		logger.info('ConfigManager: Falling back to environment variables')
		const envConfig = envManager.load()
		if (!envConfig.SSRS_BASE_URL || !envConfig.SSRS_USERNAME || !envConfig.SSRS_PASSWORD) {
			throw new ConfigError('Missing required SSRS configuration in environment', {
				context: {
					hasBaseUrl: !!envConfig.SSRS_BASE_URL,
					hasUsername: !!envConfig.SSRS_USERNAME,
					hasPassword: !!envConfig.SSRS_PASSWORD,
				},
			})
		}
		return {
			SSRS_BASE_URL: envConfig.SSRS_BASE_URL,
			SSRS_USERNAME: envConfig.SSRS_USERNAME,
			SSRS_PASSWORD: envConfig.SSRS_PASSWORD,
			SSRS_DOMAIN: envConfig.SSRS_DOMAIN,
			REQUEST_TIMEOUT: 30000,
			RETRY_ATTEMPTS: 3,
			LOG_LEVEL: envConfig.LOG_LEVEL,
		}
	}

	/**
	 * Returns NTLM credentials from the currently loaded configuration.
	 *
	 * This method combines domain and username into the standard `DOMAIN\username`
	 * format expected by NTLM authentication. If no configuration has been loaded
	 * (via `load()` or `getWithFallback()`), it returns `null`.
	 *
	 * @returns An object containing `username`, `password`, and `baseUrl`, or `null`
	 *          if no configuration is loaded.
	 *
	 * @example
	 * ```typescript
	 * const creds = configManager.getNtlmCredentials()
	 * if (creds) {
	 *   console.log(`Authenticating as ${creds.username}`)
	 * }
	 * ```
	 */
	getNtlmCredentials(): { username: string; password: string; baseUrl: string } | null {
		const config = this.loadedConfig
		if (!config) return null
		const ntlmUsername = config.SSRS_DOMAIN
			? `${config.SSRS_DOMAIN}\\${config.SSRS_USERNAME}`
			: config.SSRS_USERNAME
		logger.trace('ConfigManager: NTLM credentials prepared', {
			username: ntlmUsername,
			password: '[REDACTED]',
			baseUrl: config.SSRS_BASE_URL,
		})
		return {
			username: ntlmUsername,
			password: config.SSRS_PASSWORD,
			baseUrl: config.SSRS_BASE_URL,
		}
	}

	/**
	 * Returns the full filesystem path to the configuration file.
	 *
	 * @returns The path (usually `~/.apigsreportrc`).
	 *
	 * @example
	 * ```typescript
	 * console.log(`Config file location: ${configManager.getPath()}`)
	 * ```
	 */
	getPath(): string {
		return this.configPath
	}

	/**
	 * Resets the in‑memory cached configuration.
	 *
	 * This method clears the loaded configuration from memory without affecting
	 * the on‑disk file. Useful for testing or forcing a reload.
	 *
	 * @example
	 * ```typescript
	 * configManager.reset()
	 * // Next call to load() will read from disk again
	 * ```
	 */
	reset(): void {
		this.loadedConfig = null
		logger.debug('ConfigManager: Instance reset')
	}
}

/**
 * Singleton instance of the configuration manager.
 *
 * Use this exported constant instead of calling `ConfigManager.getInstance()`
 * directly.
 *
 * @public
 */
export const configManager = ConfigManager.getInstance()
