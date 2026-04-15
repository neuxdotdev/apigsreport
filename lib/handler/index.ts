/**
 * @fileoverview Barrel export for all core handler modules.
 *
 * This module serves as a central aggregation point for the library's foundational
 * components: custom error classes, the structured logger, environment variable
 * management, and encrypted configuration management.
 *
 * Importing from this barrel allows convenient access to all handler functionality:
 *
 * ```typescript
 * import { ConfigError, logger, envManager, configManager } from 'apigsreport/handler'
 * ```
 *
 * @module handler/index
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

// ----------------------------------------------------------------------------
// Error Handling
// ----------------------------------------------------------------------------

/**
 * Re‑exports all custom error classes and the `isApigsError` type guard.
 *
 * **Exported items:**
 * - `ApigsError` – Abstract base class for all library errors.
 * - `ConfigError` – Configuration (file/env) related errors.
 * - `AuthError` – Authentication failures (NTLM, session, credentials).
 * - `NetworkError` – HTTP and transport layer errors.
 * - `ValidationError` – Input validation failures.
 * - `CryptoError` – Encryption/decryption errors.
 * - `ExportError` – File system or export‑related errors.
 * - `isApigsError()` – Type guard to detect any library error.
 *
 * @see {@link ./error.js} for full documentation.
 */
export * from './error.js'

// ----------------------------------------------------------------------------
// Structured Logging
// ----------------------------------------------------------------------------

/**
 * Re‑exports the logger singleton and its associated types.
 *
 * **Exported items:**
 * - `logger` – Pre‑configured singleton logger instance.
 * - `Logger` – The `Logger` class (rarely needed directly).
 * - `LogLevel` – Type for log severity levels.
 * - `LoggerOptions` – Configuration interface for the logger.
 *
 * The logger supports levels: `silent`, `error`, `warn`, `info`, `debug`, `trace`, `verbose`.
 *
 * @example
 * ```typescript
 * import { logger } from 'apigsreport/handler'
 * logger.info('Server started', { port: 8080 })
 * ```
 *
 * @see {@link ./logger.js} for full documentation.
 */
export * from './logger.js'

// ----------------------------------------------------------------------------
// Environment Variable Management
// ----------------------------------------------------------------------------

/**
 * Re‑exports the environment variable manager and its types.
 *
 * **Exported items:**
 * - `envManager` – Singleton for loading and validating environment variables.
 * - `EnvManager` – The `EnvManager` class (rarely needed directly).
 * - `EnvConfig` – Type representing validated environment configuration.
 *
 * The manager reads `SSRS_BASE_URL`, `SSRS_USERNAME`, `SSRS_PASSWORD`, `SSRS_DOMAIN`,
 * `NODE_ENV`, and `LOG_LEVEL` from `process.env` (or an override) and validates them.
 *
 * @example
 * ```typescript
 * import { envManager } from 'apigsreport/handler'
 * const config = envManager.load()
 * console.log(config.SSRS_BASE_URL)
 * ```
 *
 * @see {@link ./env.js} for full documentation.
 */
export * from './env.js'

// ----------------------------------------------------------------------------
// Encrypted Configuration Management
// ----------------------------------------------------------------------------

/**
 * Re‑exports the encrypted configuration manager and its types.
 *
 * **Exported items:**
 * - `configManager` – Singleton for reading/writing encrypted `~/.apigsreportrc`.
 * - `ConfigManager` – The `ConfigManager` class (rarely needed directly).
 * - `ConfigFile` – Type for the runtime configuration object.
 * - `StoredConfig` – Type for the encrypted on‑disk format.
 *
 * The configuration file is encrypted with AES‑256‑GCM and protected by a master key
 * stored at `~/.config/apigsreport/.master_key`. Permissions are set to `0600`.
 *
 * @example
 * ```typescript
 * import { configManager } from 'apigsreport/handler'
 * const config = await configManager.getWithFallback()
 * ```
 *
 * @see {@link ./config.js} for full documentation.
 */
export * from './config.js'
