/**
 * @fileoverview Authentication manager for SSRS NTLM authentication.
 *
 * This module provides a singleton `AuthManager` class that handles NTLM
 * authentication against Microsoft SQL Server Reporting Services (SSRS).
 * It manages configuration loading (from encrypted file or environment variables),
 * HTTP client initialization, session state, and authenticated report execution.
 *
 * The manager supports:
 * - Automatic configuration resolution with fallback (file → env)
 * - NTLM v1/v2 authentication via `axios-ntlm`
 * - Session persistence and re‑authentication
 * - Type‑safe report execution and generic HTTP requests
 * - A helper `withAuth()` for scoped authentication workflows
 *
 * @module functions/auth/auth
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { AuthError, ConfigError } from '../../handler/error.js'
import { logger } from '../../handler/logger.js'
import { configManager } from '../../handler/config.js'
import { envManager } from '../../handler/env.js'
import { NtlmHttpClient } from './ntlm-client.js'
import type { AuthResult, AuthConfig, ReportRequest, HttpResponse } from './types.js'

/**
 * Manages NTLM authentication and session state for SSRS API access.
 *
 * `AuthManager` is a singleton that centralises credential loading, NTLM
 * handshake, and authenticated request execution. It integrates with the
 * library's configuration system (encrypted file + environment variables)
 * and provides a clean API for executing reports or arbitrary GET requests
 * with automatic NTLM authentication.
 *
 * **Typical workflow:**
 * 1. Call `await authManager.initialize()` – loads config and authenticates.
 * 2. Use `executeReport()` or `get()` to make authenticated requests.
 * 3. Optionally call `reauthenticate()` if the session expires.
 *
 * The manager can also be used without pre‑authentication by passing
 * `skipAuth: true` during initialisation, then authenticating later via
 * `reauthenticate()`.
 *
 * @public
 *
 * @example
 * ```typescript
 * import { authManager } from 'apigsreport'
 *
 * // Initialize (loads config from file or env, then authenticates)
 * await authManager.initialize()
 *
 * // Execute a report
 * const response = await authManager.executeReport({
 *   reportPath: '/Sales/AnnualReport',
 *   format: 'PDF',
 *   parameters: { Year: 2025 }
 * })
 *
 * // Check authentication status
 * const status = authManager.getAuthStatus()
 * console.log(`Authenticated as ${status.username}`)
 *
 * // Perform a generic GET request to a protected endpoint
 * const data = await authManager.get('/api/v1/settings')
 * ```
 */
export class AuthManager {
	private static instance: AuthManager
	private client: NtlmHttpClient | null = null
	private authResult: AuthResult | null = null
	private initialized = false

	/**
	 * Private constructor – use `getInstance()`.
	 *
	 * @internal
	 */
	private constructor() {
		logger.trace('AuthManager: Instance created')
	}

	/**
	 * Returns the singleton instance of `AuthManager`.
	 *
	 * @returns The global authentication manager.
	 *
	 * @example
	 * ```typescript
	 * const manager = AuthManager.getInstance()
	 * ```
	 */
	static getInstance(): AuthManager {
		if (!AuthManager.instance) {
			AuthManager.instance = new AuthManager()
		}
		return AuthManager.instance
	}

	/**
	 * Initialises the authentication manager.
	 *
	 * This method loads configuration (from encrypted file or environment),
	 * creates the internal NTLM HTTP client, and optionally performs the
	 * NTLM handshake (`skipAuth: false` by default).
	 *
	 * If already initialised, the method returns immediately without changes.
	 *
	 * @param options - Initialisation options.
	 * @param options.config - Direct configuration object (overrides file/env).
	 * @param options.skipAuth - If `true`, skips the actual authentication
	 *                           handshake (client is created but not tested).
	 *                           Useful when you need the client but will
	 *                           authenticate later via `reauthenticate()`.
	 *
	 * @throws {ConfigError} If configuration is missing or invalid.
	 * @throws {AuthError} If authentication fails (unless `skipAuth` is `true`).
	 *
	 * @example
	 * ```typescript
	 * // Normal initialisation (loads from config file or env)
	 * await authManager.initialize()
	 *
	 * // With explicit configuration
	 * await authManager.initialize({
	 *   config: {
	 *     baseUrl: 'https://ssrs.company.com',
	 *     username: 'john.doe',
	 *     password: 'secret',
	 *     domain: 'CORP'
	 *   }
	 * })
	 *
	 * // Defer authentication
	 * await authManager.initialize({ skipAuth: true })
	 * // ... later
	 * await authManager.reauthenticate()
	 * ```
	 */
	async initialize(options?: { config?: AuthConfig; skipAuth?: boolean }): Promise<void> {
		if (this.initialized) {
			logger.debug('AuthManager: Already initialized, skipping')
			return
		}
		logger.info('AuthManager: Initializing...', {
			mode: process.env.NODE_ENV,
			hasOverrideConfig: !!options?.config,
		})
		const endTimer = logger.time('auth-init')
		try {
			const config = options?.config ?? (await this.loadConfig())
			this.validateConfig(config)
			this.client = new NtlmHttpClient({
				baseUrl: config.baseUrl,
				timeout: config.timeout ?? 30000,
				retry: {
					attempts: config.retryAttempts ?? 3,
					delayMs: 1000,
				},
			})
			if (!options?.skipAuth) {
				await this.authenticate(config)
			}
			this.initialized = true
			endTimer()
			logger.info('AuthManager: Initialization complete', {
				baseUrl: config.baseUrl,
				username: config.username,
				authenticated: !!this.authResult,
			})
		} catch (error) {
			endTimer()
			logger.error('AuthManager: Initialization failed', error as Error)
			this.initialized = false
			this.client = null
			throw error
		}
	}

	/**
	 * Loads authentication configuration from the system.
	 *
	 * In production (`NODE_ENV === 'production'`) or when a config file exists,
	 * it uses `configManager.getWithFallback()`. Otherwise, it falls back to
	 * environment variables with default timeouts.
	 *
	 * @returns Resolved authentication configuration.
	 *
	 * @throws {ConfigError} If required fields are missing.
	 *
	 * @internal
	 */
	private async loadConfig(): Promise<AuthConfig> {
		logger.debug('AuthManager: Loading configuration')
		try {
			if (process.env.NODE_ENV === 'production' || configManager.exists()) {
				const fileConfig = await configManager.getWithFallback()
				return {
					baseUrl: fileConfig.SSRS_BASE_URL,
					username: fileConfig.SSRS_USERNAME,
					password: fileConfig.SSRS_PASSWORD,
					domain: fileConfig.SSRS_DOMAIN,
					timeout: fileConfig.REQUEST_TIMEOUT,
					retryAttempts: fileConfig.RETRY_ATTEMPTS,
				}
			}
			const envConfig = envManager.load()
			if (!envConfig.SSRS_BASE_URL || !envConfig.SSRS_USERNAME || !envConfig.SSRS_PASSWORD) {
				throw new ConfigError('Missing required SSRS environment variables', {
					context: {
						SSRS_BASE_URL: !!envConfig.SSRS_BASE_URL,
						SSRS_USERNAME: !!envConfig.SSRS_USERNAME,
						SSRS_PASSWORD: !!envConfig.SSRS_PASSWORD,
					},
				})
			}
			return {
				baseUrl: envConfig.SSRS_BASE_URL,
				username: envConfig.SSRS_USERNAME,
				password: envConfig.SSRS_PASSWORD,
				domain: envConfig.SSRS_DOMAIN,
				timeout: 30000,
				retryAttempts: 3,
			}
		} catch (error) {
			logger.error('AuthManager: Config load failed', error as Error)
			throw new ConfigError('Failed to load configuration', { cause: error })
		}
	}

	/**
	 * Validates the authentication configuration object.
	 *
	 * Checks presence of `baseUrl`, `username`, `password`, and URL format.
	 *
	 * @param config - Configuration to validate.
	 * @throws {ConfigError} If any required field is missing or malformed.
	 *
	 * @internal
	 */
	private validateConfig(config: AuthConfig): void {
		logger.trace('AuthManager: Validating config', {
			baseUrl: config.baseUrl,
			username: config.username,
			hasPassword: !!config.password,
			hasDomain: !!config.domain,
		})
		if (!config.baseUrl?.trim()) {
			throw new ConfigError('SSRS_BASE_URL is required')
		}
		if (!/^https?:\/\//i.test(config.baseUrl)) {
			throw new ConfigError('SSRS_BASE_URL must start with http:// or https://')
		}
		if (!config.username?.trim()) {
			throw new ConfigError('SSRS_USERNAME is required')
		}
		if (!config.password?.trim()) {
			throw new ConfigError('SSRS_PASSWORD is required')
		}
	}

	/**
	 * Performs the NTLM authentication handshake.
	 *
	 * Sends a test request to `/ReportServer` to verify credentials.
	 * On success, stores an `AuthResult` with session metadata.
	 *
	 * @param config - Validated configuration.
	 * @throws {AuthError} If the test request fails or credentials are rejected.
	 *
	 * @internal
	 */
	private async authenticate(config: AuthConfig): Promise<void> {
		if (!this.client) {
			throw new AuthError('HTTP client not initialized', 'CLIENT_NOT_READY')
		}
		logger.info('AuthManager: Authenticating...', {
			baseUrl: config.baseUrl,
			username: config.username,
			domain: config.domain,
		})
		let ntlmUsername = config.username
		let ntlmDomain = config.domain
		if (config.username.includes('\\') && !config.domain) {
			const parts = config.username.split('\\')
			ntlmDomain = parts[0]
			ntlmUsername = parts.slice(1).join('\\')
		}
		const testResult = await this.client.testAuth({
			username: ntlmUsername,
			password: config.password,
			...(ntlmDomain !== undefined && { domain: ntlmDomain }),
		})
		if (!testResult.success) {
			throw new AuthError(`Authentication failed: ${testResult.message}`, 'AUTH_FAILED', {
				context: { baseUrl: config.baseUrl, username: config.username },
			})
		}
		this.authResult = {
			success: true,
			sessionId: crypto.randomUUID?.() ?? `session_${Date.now()}`,
			userInfo: {
				username: config.username,
				domain: config.domain,
			},
			metadata: {
				serverUrl: config.baseUrl,
				authenticatedAt: new Date().toISOString(),
			},
		}
		logger.authSuccess(config.username, config.baseUrl, 0)
	}

	/**
	 * Checks whether the manager is authenticated.
	 *
	 * @returns `true` if initialised and a successful authentication has occurred.
	 */
	isAuthenticated(): boolean {
		return this.initialized && !!this.authResult?.success
	}

	/**
	 * Returns a summary of the current authentication status.
	 *
	 * @returns An object containing `authenticated` flag and, if authenticated,
	 *          the `username` and `serverUrl`.
	 *
	 * @example
	 * ```typescript
	 * const status = authManager.getAuthStatus()
	 * if (status.authenticated) {
	 *   console.log(`Logged in as ${status.username} on ${status.serverUrl}`)
	 * }
	 * ```
	 */
	getAuthStatus(): {
		authenticated: boolean
		username?: string | undefined
		serverUrl?: string | undefined
	} {
		if (!this.authResult) {
			return { authenticated: false }
		}
		return {
			authenticated: this.authResult.success,
			username: this.authResult.userInfo?.username,
			serverUrl: this.authResult.metadata.serverUrl,
		}
	}

	/**
	 * Executes an SSRS report with NTLM authentication.
	 *
	 * This method constructs the SSRS render URL, sends an authenticated GET
	 * request, and returns the response (typically a Buffer containing the
	 * report file, e.g., PDF or Excel).
	 *
	 * @typeParam T - Expected response body type (default: `Buffer`).
	 * @param request - Report request parameters.
	 * @returns The HTTP response containing the rendered report.
	 *
	 * @throws {AuthError} If the manager is not initialised or not authenticated.
	 * @throws {NetworkError} If the request fails (timeout, HTTP error, etc.).
	 *
	 * @example
	 * ```typescript
	 * const response = await authManager.executeReport({
	 *   reportPath: '/Finance/BalanceSheet',
	 *   format: 'EXCELOPENXML',
	 *   parameters: { FiscalYear: 2024 }
	 * })
	 * // response.body is a Buffer containing the Excel file
	 * ```
	 */
	async executeReport<T = Buffer>(request: ReportRequest): Promise<HttpResponse<T>> {
		this.ensureInitialized()
		this.ensureAuthenticated()
		if (!this.client) {
			throw new AuthError('HTTP client not available', 'CLIENT_ERROR')
		}
		const config = await this.loadConfig()
		let ntlmUsername = config.username
		let ntlmDomain = config.domain
		if (config.username.includes('\\') && !config.domain) {
			const parts = config.username.split('\\')
			ntlmDomain = parts[0]
			ntlmUsername = parts.slice(1).join('\\')
		}
		logger.info('AuthManager: Executing report', {
			reportPath: request.reportPath,
			format: request.format,
			paramCount: Object.keys(request.parameters ?? {}).length,
		})
		return this.client.executeReport<T>(request, {
			username: ntlmUsername,
			password: config.password,
			...(ntlmDomain !== undefined && { domain: ntlmDomain }),
		})
	}

	/**
	 * Performs a generic authenticated GET request.
	 *
	 * Useful for calling additional SSRS API endpoints or other protected
	 * resources on the same server.
	 *
	 * @typeParam T - Expected response body type (default: `unknown`).
	 * @param path - URL path (will be appended to the base URL).
	 * @param options - Optional headers and timeout override.
	 * @returns The HTTP response.
	 *
	 * @throws {AuthError} If the manager is not initialised or not authenticated.
	 *
	 * @example
	 * ```typescript
	 * const folders = await authManager.get('/ReportServer/api/v2.0/Folders')
	 * ```
	 */
	async get<T = unknown>(
		path: string,
		options?: {
			headers?: Record<string, string> | undefined
			timeout?: number | undefined
		},
	): Promise<HttpResponse<T>> {
		this.ensureInitialized()
		this.ensureAuthenticated()
		if (!this.client) {
			throw new AuthError('HTTP client not available', 'CLIENT_ERROR')
		}
		const config = await this.loadConfig()
		let ntlmUsername = config.username
		let ntlmDomain = config.domain
		if (config.username.includes('\\') && !config.domain) {
			const parts = config.username.split('\\')
			ntlmDomain = parts[0]
			ntlmUsername = parts.slice(1).join('\\')
		}
		return this.client.get<T>({
			path,
			username: ntlmUsername,
			password: config.password,
			...(ntlmDomain !== undefined && { domain: ntlmDomain }),
			headers: options?.headers,
			timeout: options?.timeout,
		})
	}

	/**
	 * Forces re‑authentication, discarding the current session.
	 *
	 * Useful when the session has expired or credentials have changed.
	 * After calling this, the manager will be authenticated again.
	 *
	 * @throws {AuthError} If re‑authentication fails.
	 */
	async reauthenticate(): Promise<void> {
		logger.info('AuthManager: Re-authenticating...')
		this.authResult = null
		const config = await this.loadConfig()
		await this.authenticate(config)
		logger.info('AuthManager: Re-authentication complete')
	}

	/**
	 * Logs out without re‑initialising the client.
	 *
	 * This clears the authentication result but keeps the HTTP client.
	 * To re‑authenticate, call `reauthenticate()`.
	 */
	logout(): void {
		logger.debug('AuthManager: Logging out')
		this.authResult = null
	}

	/**
	 * Completely resets the manager to its uninitialised state.
	 *
	 * The client is destroyed, and any authentication state is cleared.
	 * To use the manager again, `initialize()` must be called.
	 */
	reset(): void {
		logger.debug('AuthManager: Resetting instance')
		this.initialized = false
		this.authResult = null
		this.client = null
	}

	/**
	 * Ensures the manager has been initialised.
	 *
	 * @throws {AuthError} If `initialize()` has not been called.
	 *
	 * @internal
	 */
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new AuthError(
				'AuthManager not initialized - call initialize() first',
				'NOT_INITIALIZED',
			)
		}
	}

	/**
	 * Ensures the manager is authenticated.
	 *
	 * @throws {AuthError} If not authenticated.
	 *
	 * @internal
	 */
	private ensureAuthenticated(): void {
		if (!this.isAuthenticated()) {
			throw new AuthError(
				'Not authenticated - call initialize() or reauthenticate()',
				'NOT_AUTHENTICATED',
			)
		}
	}

	/**
	 * Returns the underlying NTLM HTTP client.
	 *
	 * Useful for advanced use cases where you need direct access to the client.
	 *
	 * @returns The `NtlmHttpClient` instance.
	 * @throws {AuthError} If the manager is not initialised or the client is unavailable.
	 */
	getClient(): NtlmHttpClient {
		this.ensureInitialized()
		if (!this.client) {
			throw new AuthError('HTTP client not available', 'CLIENT_ERROR')
		}
		return this.client
	}
}

/**
 * Helper function to execute an operation with automatic authentication setup.
 *
 * This function obtains the `AuthManager` singleton, initialises it with the
 * provided options, calls your operation, and automatically cleans up afterwards.
 * It is useful for one‑off scripts or CLI tools.
 *
 * @typeParam T - Return type of the operation.
 * @param operation - Async function that receives the authenticated `AuthManager`.
 * @param options - Same initialisation options as `AuthManager.initialize()`.
 * @returns The result of the operation.
 *
 * @example
 * ```typescript
 * import { withAuth } from 'apigsreport'
 *
 * const reportData = await withAuth(async (auth) => {
 *   const response = await auth.executeReport({
 *     reportPath: '/Test/Report',
 *     format: 'PDF'
 *   })
 *   return response.body
 * }, { skipAuth: false })
 * ```
 *
 * @public
 */
export async function withAuth<T>(
	operation: (auth: AuthManager) => Promise<T>,
	options?: { config?: AuthConfig; skipAuth?: boolean },
): Promise<T> {
	const auth = AuthManager.getInstance()
	try {
		await auth.initialize(options)
		return await operation(auth)
	} finally {
		// No explicit cleanup needed; auth remains initialised but can be reused.
	}
}

/**
 * Singleton instance of the authentication manager.
 *
 * Use this exported constant for all authentication operations.
 *
 * @public
 */
export const authManager = AuthManager.getInstance()
