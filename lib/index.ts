/**
 * @fileoverview Main entry point for the APIGS Report Library.
 *
 * This module aggregates and re‑exports all public APIs of the library,
 * providing a single import entry for end users. It includes the high‑level
 * `ApigsReportClient`, standalone rendering functions, error classes,
 * configuration managers, logging utilities, and cryptographic helpers.
 *
 * **Typical usage:**
 * ```typescript
 * import { ApigsReportClient, renderReport, logger } from 'apigsreport'
 *
 * const client = new ApigsReportClient({
 *   baseUrl: 'https://ssrs.company.com',
 *   username: 'DOMAIN\\user',
 *   password: 'secret'
 * })
 *
 * const pdf = await client.exportReport({ format: 'PDF' })
 * ```
 *
 * @module index
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

// ----------------------------------------------------------------------------
// Core Client
// ----------------------------------------------------------------------------

/**
 * Re‑exports the main `ApigsReportClient` class and the `createClient` factory.
 *
 * `ApigsReportClient` is the recommended high‑level entry point for most use cases.
 * It bundles configuration validation, NTLM authentication, and report export into
 * a single easy‑to‑use class.
 *
 * @example
 * ```typescript
 * import { ApigsReportClient } from 'apigsreport'
 *
 * const client = new ApigsReportClient({
 *   baseUrl: 'https://reportserver.company.com',
 *   username: 'CORP\\john.doe',
 *   password: 'secure123',
 *   timeout: 60000
 * })
 *
 * const buffer = await client.exportReport({
 *   format: 'PDF',
 *   parameters: { AccountId: 12345 }
 * })
 * ```
 *
 * @see {@link ./lib.js} for full documentation.
 */
export { ApigsReportClient, createClient } from './lib.js'

/**
 * Re‑exports configuration and format types for the main client.
 *
 * - `ApigsReportConfig` – Configuration object for `ApigsReportClient`.
 * - `ReportFormat` – Supported output formats (`'PDF'`, `'EXCELOPENXML'`, etc.).
 *
 * @see {@link ./lib.js} for full documentation.
 */
export type { ApigsReportConfig, ReportFormat } from './lib.js'

/**
 * Re‑exports the `Formats` constants object.
 *
 * Provides named constants for report formats to avoid typos and improve
 * code readability.
 *
 * @example
 * ```typescript
 * import { Formats } from 'apigsreport'
 *
 * const format = Formats.PDF  // 'PDF'
 * ```
 *
 * @see {@link ./lib.js} for full documentation.
 */
export { Formats } from './lib.js'

// ----------------------------------------------------------------------------
// Error Classes
// ----------------------------------------------------------------------------

/**
 * Re‑exports all custom error classes and the `isApigsError` type guard.
 *
 * **Exported errors:**
 * - `ValidationError` – Invalid input arguments.
 * - `NetworkError` – HTTP/network failures.
 * - `ConfigError` – Configuration (file/env) issues.
 * - `AuthError` – NTLM authentication failures.
 * - `CryptoError` – Encryption/decryption errors.
 * - `ApigsError` – Abstract base class for all library errors.
 * - `ExportError` – File export errors.
 *
 * **Type guard:**
 * - `isApigsError()` – Checks if a value is any `ApigsError`.
 *
 * @example
 * ```typescript
 * import { AuthError, isApigsError } from 'apigsreport'
 *
 * try {
 *   await client.exportReport()
 * } catch (err) {
 *   if (err instanceof AuthError) {
 *     console.error(`Auth failed: ${err.errorCode}`)
 *   } else if (isApigsError(err)) {
 *     console.error(err.toJSON())
 *   }
 * }
 * ```
 *
 * @see {@link ./handler/error.js} for full documentation.
 */
export {
	ValidationError,
	NetworkError,
	ConfigError,
	AuthError,
	CryptoError,
	ApigsError,
	ExportError,
	isApigsError,
} from './handler/error.js'

// ----------------------------------------------------------------------------
// Configuration Managers
// ----------------------------------------------------------------------------

/**
 * Re‑exports the encrypted configuration manager singleton.
 *
 * `configManager` handles loading, saving, and securely clearing the
 * encrypted `~/.apigsreportrc` file. It is used internally by `AuthManager`
 * but can also be used directly for advanced configuration workflows.
 *
 * @example
 * ```typescript
 * import { configManager } from 'apigsreport'
 *
 * await configManager.save({
 *   SSRS_BASE_URL: 'https://ssrs.example.com',
 *   SSRS_USERNAME: 'user',
 *   SSRS_PASSWORD: 'secret'
 * })
 *
 * const config = await configManager.getWithFallback()
 * ```
 *
 * @see {@link ./handler/config.js} for full documentation.
 */
export { configManager } from './handler/config.js'

/**
 * Re‑exports the environment variable manager singleton.
 *
 * `envManager` reads and validates SSRS configuration from `process.env`.
 * It is used as a fallback when no encrypted config file exists.
 *
 * @example
 * ```typescript
 * import { envManager } from 'apigsreport'
 *
 * const env = envManager.load()
 * console.log(env.SSRS_BASE_URL)
 * ```
 *
 * @see {@link ./handler/env.js} for full documentation.
 */
export { envManager } from './handler/env.js'

// ----------------------------------------------------------------------------
// Logger
// ----------------------------------------------------------------------------

/**
 * Re‑exports the structured logger singleton and its types.
 *
 * The logger supports levels: `silent`, `error`, `warn`, `info`, `debug`,
 * `trace`, `verbose`. It automatically adapts to `NODE_ENV` and can be
 * reconfigured at runtime.
 *
 * **Exported items:**
 * - `logger` – Pre‑configured singleton logger instance.
 * - `Logger` – The `Logger` class (rarely needed).
 * - `LogLevel` – Type for log severity levels.
 *
 * @example
 * ```typescript
 * import { logger } from 'apigsreport'
 *
 * logger.info('Server started', { port: 3000 })
 * const end = logger.time('db-query')
 * // ... perform query
 * end() // logs duration
 * ```
 *
 * @see {@link ./handler/logger.js} for full documentation.
 */
export { logger, type Logger, type LogLevel } from './handler/logger.js'

// ----------------------------------------------------------------------------
// SSRS API Functions (Standalone)
// ----------------------------------------------------------------------------

/**
 * Re‑exports the low‑level SSRS rendering functions and client.
 *
 * **Exported functions:**
 * - `renderReport()` – Renders a report and returns the response.
 * - `testAuth()` – Tests NTLM authentication.
 *
 * **Exported class:**
 * - `SsrsApiClient` – Low‑level client for advanced use cases.
 *
 * **Exported types:**
 * - `RenderOptions` – Options for `renderReport()`.
 * - `SsrsResponse` – Structured response from a report request.
 * - `NtlmCredentials` – NTLM credential object.
 *
 * @example
 * ```typescript
 * import { renderReport, testAuth, Formats } from 'apigsreport'
 *
 * const authOk = await testAuth({
 *   baseUrl: 'https://ssrs.company.com',
 *   username: 'user',
 *   password: 'pass'
 * })
 *
 * if (authOk.success) {
 *   const response = await renderReport(
 *     { baseUrl: '...', username: '...', password: '...' },
 *     { reportPath: '/Sales/Report', format: Formats.PDF }
 *   )
 *   // response.body is a Buffer
 * }
 * ```
 *
 * @see {@link ./functions/api/index.js} for full documentation.
 */
export {
	renderReport,
	testAuth,
	SsrsApiClient,
	type RenderOptions,
	type SsrsResponse,
	type NtlmCredentials,
} from './functions/api/index.js'

// ----------------------------------------------------------------------------
// Cryptographic Utilities
// ----------------------------------------------------------------------------

/**
 * Re‑exports cryptographic helpers for encryption, decryption, and hashing.
 *
 * **Exported functions:**
 * - `encrypt()` – Encrypts a string using AES‑256‑GCM.
 * - `decrypt()` – Decrypts a previously encrypted hex string.
 * - `hash()` – Computes SHA‑256 hash (for integrity checks).
 * - `clearMasterKey()` – Zeroes the in‑memory master key.
 * - `getMasterKey()` – Retrieves or generates the master key.
 * - `getKeyPath()` – Returns the filesystem path of the master key.
 *
 * @example
 * ```typescript
 * import { encrypt, decrypt, hash } from 'apigsreport'
 *
 * const encrypted = encrypt('mySecret')
 * const decrypted = decrypt(encrypted)
 * const digest = hash('someValue')
 * ```
 *
 * @see {@link ./utils/crypto.js} for full documentation.
 */
export { encrypt, decrypt, hash, clearMasterKey, getMasterKey, getKeyPath } from './utils/crypto.js'
