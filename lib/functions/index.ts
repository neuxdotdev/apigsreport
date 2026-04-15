/**
 * @fileoverview Barrel export for the authentication module as a namespace.
 *
 * This module re‑exports the entire authentication subsystem under the `auth`
 * namespace. It provides a convenient way to import all authentication-related
 * components (manager, client, types, helpers) from a single namespace.
 *
 * **Usage example:**
 * ```typescript
 * import * as auth from 'apigsreport/functions/auth'
 *
 * // Access the singleton manager
 * await auth.authManager.initialize()
 *
 * // Use the helper function
 * await auth.withAuth(async (manager) => {
 *   return manager.executeReport({ reportPath: '/Test', format: 'PDF' })
 * })
 *
 * // Access types
 * const creds: auth.NtlmCredentials = { ... }
 * ```
 *
 * @module functions/auth/index
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

/**
 * Authentication module namespace.
 *
 * The `auth` namespace aggregates:
 * - `authManager` – Singleton instance of `AuthManager`.
 * - `AuthManager` – The `AuthManager` class.
 * - `withAuth()` – Helper for scoped authentication.
 * - `NtlmHttpClient` – Low‑level NTLM HTTP client.
 * - All types: `AuthConfig`, `AuthResult`, `ReportRequest`, `HttpResponse`, etc.
 * - `AuthConfigSchema` – Zod schema for runtime validation.
 *
 * @example
 * ```typescript
 * import { auth } from 'apigsreport'
 *
 * // Initialize and authenticate
 * await auth.authManager.initialize()
 *
 * // Execute a report
 * const response = await auth.authManager.executeReport({
 *   reportPath: '/Finance/BalanceSheet',
 *   format: 'PDF'
 * })
 *
 * // Check status
 * console.log(auth.authManager.getAuthStatus())
 * ```
 *
 * @public
 */
export * as auth from './auth/index.js'
