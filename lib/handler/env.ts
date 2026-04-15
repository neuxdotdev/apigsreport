/**
 * @fileoverview Environment variable manager for APIGS Report Library.
 *
 * This module provides a validated, type‑safe interface for reading SSRS configuration
 * from environment variables. It supports optional fields, default values, and
 * automatic validation of URL formats, domain patterns, and log levels.
 *
 * The manager caches the loaded configuration and provides helper methods to
 * retrieve NTLM credentials and sanitized config (with password redacted).
 *
 * @module handler/env
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { z } from 'zod'
import { ConfigError } from './error.js'
import { logger } from './logger.js'

/**
 * Zod schema for validating environment variables.
 *
 * All SSRS_* variables are optional; the library will fall back to other
 * configuration sources (like the encrypted config file) when they are missing.
 *
 * @internal
 */
const EnvSchema = z.object({
	SSRS_BASE_URL: z
		.string()
		.url('Must be a valid URL')
		.refine((url) => url.startsWith('http'), 'Must start with http:// or https://')
		.optional(),
	SSRS_USERNAME: z.string().min(1, 'Username cannot be empty').optional(),
	SSRS_PASSWORD: z.string().min(1, 'Password cannot be empty').optional(),
	SSRS_DOMAIN: z
		.string()
		.regex(/^[a-zA-Z0-9.-]+$/, 'Domain can only contain alphanumeric, dots, and hyphens')
		.optional(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	LOG_LEVEL: z
		.enum(['silent', 'error', 'warn', 'info', 'debug', 'trace', 'verbose'])
		.default('info'),
})

/**
 * Type representing the validated environment configuration.
 *
 * @public
 */
export type EnvConfig = z.infer<typeof EnvSchema>

/**
 * Manages loading, caching, and accessing environment variables for SSRS configuration.
 *
 * The `EnvManager` is a singleton that reads environment variables, validates them
 * against a strict schema, and provides convenient accessors. It automatically
 * caches the result so that subsequent calls are fast.
 *
 * **Supported environment variables:**
 * - `SSRS_BASE_URL` – Base URL of the SSRS server (must be http:// or https://)
 * - `SSRS_USERNAME` – NTLM username (can include domain as `DOMAIN\user`)
 * - `SSRS_PASSWORD` – NTLM password
 * - `SSRS_DOMAIN` – Optional domain (overrides domain in username)
 * - `NODE_ENV` – Runtime environment (`development`, `production`, `test`)
 * - `LOG_LEVEL` – Logging verbosity level
 *
 * **Usage example:**
 * ```bash
 * export SSRS_BASE_URL="https://reportserver.company.com"
 * export SSRS_USERNAME="CORP\\john.doe"
 * export SSRS_PASSWORD="secret123"
 * export LOG_LEVEL="debug"
 * ```
 *
 * @example
 * ```typescript
 * import { envManager } from 'apigsreport'
 *
 * // Load and validate environment variables
 * const env = envManager.load()
 * console.log(env.SSRS_BASE_URL) // "https://reportserver.company.com"
 *
 * // Check if complete SSRS configuration is present
 * if (envManager.hasSSRSConfig()) {
 *   const creds = envManager.getNtlmCredentials()
 *   // creds.username = "CORP\\john.doe"
 * }
 *
 * // Get sanitized config for logging (password redacted)
 * console.log(envManager.getSanitizedConfig())
 * ```
 *
 * @public
 */
export class EnvManager {
	private static instance: EnvManager
	private config: EnvConfig | null = null
	private loaded = false

	/**
	 * Private constructor – use `getInstance()` instead.
	 *
	 * @internal
	 */
	private constructor() {}

	/**
	 * Returns the singleton instance of `EnvManager`.
	 *
	 * @returns The global `EnvManager` instance.
	 *
	 * @example
	 * ```typescript
	 * const manager = EnvManager.getInstance()
	 * ```
	 */
	static getInstance(): EnvManager {
		if (!EnvManager.instance) {
			EnvManager.instance = new EnvManager()
		}
		return EnvManager.instance
	}

	/**
	 * Loads, validates, and caches environment variables.
	 *
	 * This method reads environment variables (or an optional override object),
	 * validates them using the `EnvSchema`, and stores the result in memory.
	 * Subsequent calls without an override return the cached configuration.
	 *
	 * **Validation rules:**
	 * - `SSRS_BASE_URL` must be a valid HTTP/HTTPS URL.
	 * - `SSRS_USERNAME` cannot be empty if provided.
	 * - `SSRS_PASSWORD` cannot be empty if provided.
	 * - `SSRS_DOMAIN` may only contain alphanumeric characters, dots, and hyphens.
	 * - `NODE_ENV` defaults to `'development'`.
	 * - `LOG_LEVEL` defaults to `'info'`.
	 *
	 * @param override - Optional object to use instead of `process.env`.
	 *                    Useful for testing.
	 *
	 * @returns The validated and normalized configuration object.
	 *
	 * @throws {ConfigError} If any environment variable fails validation.
	 *
	 * @example
	 * ```typescript
	 * // Load from real environment
	 * const config = envManager.load()
	 *
	 * // Load from test override
	 * const testConfig = envManager.load({
	 *   SSRS_BASE_URL: 'https://test.example.com',
	 *   SSRS_USERNAME: 'testuser',
	 *   SSRS_PASSWORD: 'testpass'
	 * })
	 * ```
	 */
	load(override?: Record<string, string | undefined>): EnvConfig {
		if (this.loaded && !override) {
			logger.trace('EnvManager: Returning cached config')
			return this.config!
		}
		logger.debug('EnvManager: Loading environment variables')
		const endTimer = logger.time('env-load')
		const raw = override ?? process.env
		const input: Record<string, unknown> = {
			NODE_ENV: raw['NODE_ENV'],
			LOG_LEVEL: raw['LOG_LEVEL'],
		}
		for (const [key, value] of Object.entries(raw)) {
			if (key.startsWith('SSRS_') && value !== undefined) {
				input[key] = value.trim()
			}
		}
		logger.trace('EnvManager: Raw input', { keys: Object.keys(input) })
		const result = EnvSchema.safeParse(input)
		if (!result.success) {
			const errors = result.error.issues.map((e) => ({
				field: e.path.join('.'),
				message: e.message,
				received: (e as any).received ?? (e as any).input ?? undefined,
			}))
			logger.error('EnvManager: Validation failed', undefined, { errors })
			throw new ConfigError('Environment variable validation failed', {
				context: { errors },
				cause: result.error,
			})
		}
		this.config = result.data
		this.loaded = true
		endTimer()
		logger.configLoaded('env')
		logger.debug('EnvManager: Loaded successfully', {
			hasBaseUrl: !!this.config?.SSRS_BASE_URL,
			hasCredentials: !!(this.config?.SSRS_USERNAME && this.config?.SSRS_PASSWORD),
		})
		return this.config
	}

	/**
	 * Checks whether a complete SSRS configuration is available in environment variables.
	 *
	 * A complete configuration requires `SSRS_BASE_URL`, `SSRS_USERNAME`, and
	 * `SSRS_PASSWORD` to be present and non‑empty. If the manager has not yet
	 * loaded the configuration, it will automatically call `load()`.
	 *
	 * @returns `true` if all required SSRS variables are present, otherwise `false`.
	 *
	 * @example
	 * ```typescript
	 * if (envManager.hasSSRSConfig()) {
	 *   // Proceed with report export using environment config
	 * } else {
	 *   console.warn('SSRS environment variables missing')
	 * }
	 * ```
	 */
	hasSSRSConfig(): boolean {
		if (!this.config) this.load()
		return !!(
			this.config?.SSRS_BASE_URL &&
			this.config?.SSRS_USERNAME &&
			this.config?.SSRS_PASSWORD
		)
	}

	/**
	 * Returns NTLM credentials formatted for `axios-ntlm`.
	 *
	 * This method combines `SSRS_DOMAIN` and `SSRS_USERNAME` into the standard
	 * `DOMAIN\username` format. If the manager has not yet loaded the configuration,
	 * it will automatically call `load()`.
	 *
	 * @returns An object with `username` and `password`, or `null` if
	 *          `SSRS_USERNAME` or `SSRS_PASSWORD` are missing.
	 *
	 * @example
	 * ```typescript
	 * const creds = envManager.getNtlmCredentials()
	 * if (creds) {
	 *   // creds.username = "CORP\\john.doe"
	 *   // creds.password = "secret123"
	 * }
	 * ```
	 */
	getNtlmCredentials(): { username: string; password: string } | null {
		if (!this.config) this.load()
		const { SSRS_USERNAME, SSRS_PASSWORD, SSRS_DOMAIN } = this.config ?? {}
		if (!SSRS_USERNAME || !SSRS_PASSWORD) {
			logger.warn('EnvManager: Credentials not fully configured')
			return null
		}
		const ntlmUsername = SSRS_DOMAIN ? `${SSRS_DOMAIN}\\${SSRS_USERNAME}` : SSRS_USERNAME
		logger.trace('EnvManager: NTLM credentials prepared', {
			username: ntlmUsername,
			password: '[REDACTED]',
			hasDomain: !!SSRS_DOMAIN,
		})
		return {
			username: ntlmUsername,
			password: SSRS_PASSWORD,
		}
	}

	/**
	 * Returns the configured SSRS base URL, if any.
	 *
	 * @returns The base URL string, or `null` if not set.
	 *
	 * @example
	 * ```typescript
	 * const baseUrl = envManager.getBaseUrl()
	 * if (baseUrl) {
	 *   console.log(`Connecting to ${baseUrl}`)
	 * }
	 * ```
	 */
	getBaseUrl(): string | null {
		if (!this.config) this.load()
		return this.config?.SSRS_BASE_URL ?? null
	}

	/**
	 * Resets the internal cache, forcing the next call to `load()` to re‑read
	 * environment variables.
	 *
	 * This is primarily useful for testing scenarios where environment variables
	 * change between test cases.
	 *
	 * @example
	 * ```typescript
	 * envManager.reset()
	 * const freshConfig = envManager.load() // Re-reads process.env
	 * ```
	 */
	reset(): void {
		this.config = null
		this.loaded = false
		logger.debug('EnvManager: Instance reset')
	}

	/**
	 * Returns a sanitized copy of the configuration suitable for logging.
	 *
	 * The returned object has the `SSRS_PASSWORD` field redacted (set to
	 * `'[REDACTED]'`) to avoid leaking secrets in logs.
	 *
	 * @returns A copy of the configuration with the password hidden.
	 *
	 * @example
	 * ```typescript
	 * console.log('Current env config:', envManager.getSanitizedConfig())
	 * // Output: { SSRS_BASE_URL: 'https://...', SSRS_USERNAME: 'john', SSRS_PASSWORD: '[REDACTED]', ... }
	 * ```
	 */
	getSanitizedConfig(): Record<string, unknown> {
		if (!this.config) this.load()
		const { SSRS_PASSWORD, ...safe } = this.config ?? {}
		return {
			...safe,
			SSRS_PASSWORD: SSRS_PASSWORD ? '[REDACTED]' : undefined,
		}
	}
}

/**
 * Singleton instance of the environment variable manager.
 *
 * Use this exported constant instead of calling `EnvManager.getInstance()` directly.
 *
 * @public
 */
export const envManager = EnvManager.getInstance()
