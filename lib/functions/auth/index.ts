/**
 * @fileoverview Barrel export for the authentication module.
 *
 * This module aggregates and re‑exports all public components of the
 * authentication subsystem, including types, the `AuthManager` class,
 * the `NtlmHttpClient`, and helper functions.
 *
 * Importing from this barrel gives convenient access to everything needed
 * for NTLM authentication and SSRS report execution:
 *
 * ```typescript
 * import { authManager, NtlmHttpClient, AuthConfigSchema } from 'apigsreport/functions/auth'
 * ```
 *
 * @module functions/auth/index
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

/**
 * Re‑exports all type definitions for the authentication module.
 *
 * **Exported items:**
 * - `NtlmAuthOptions` – Low‑level NTLM request options.
 * - `HttpResponse<T>` – Standardised HTTP response shape.
 * - `AuthResult` – Authentication result metadata.
 * - `ReportRequest` – SSRS report execution parameters.
 * - `AuthConfig` – Validated authentication configuration (inferred from Zod).
 * - `HttpNtlmRequestOptions` – Extended options for axios‑ntlm.
 *
 * Also re‑exports the `AuthConfigSchema` Zod schema for runtime validation.
 *
 * @see {@link ./types.js} for full documentation.
 */
export * from './types.js'

// ----------------------------------------------------------------------------
// Authentication Manager
// ----------------------------------------------------------------------------

/**
 * Re‑exports the `AuthManager` class, its singleton instance, and the `withAuth` helper.
 *
 * **Exported items:**
 * - `AuthManager` – Singleton class that manages NTLM authentication and sessions.
 * - `authManager` – Pre‑configured singleton instance (ready to use).
 * - `withAuth()` – Helper function to scope authentication to a single operation.
 *
 * @example
 * ```typescript
 * import { authManager, withAuth } from 'apigsreport/functions/auth'
 *
 * // Using the singleton directly
 * await authManager.initialize()
 * const report = await authManager.executeReport({ reportPath: '/Test', format: 'PDF' })
 *
 * // Using the scoped helper
 * const data = await withAuth(async (auth) => {
 *   return auth.get('/api/data')
 * })
 * ```
 *
 * @see {@link ./auth.js} for full documentation.
 */
export * from './auth.js'

// ----------------------------------------------------------------------------
// NTLM HTTP Client
// ----------------------------------------------------------------------------

/**
 * Re‑exports the low‑level NTLM HTTP client.
 *
 * **Exported items:**
 * - `NtlmHttpClient` – Core HTTP client with NTLM authentication, retries, and SSRS report execution.
 *
 * This client is typically used via `AuthManager`, but can be instantiated directly
 * for advanced scenarios where you need full control over the request lifecycle.
 *
 * @example
 * ```typescript
 * import { NtlmHttpClient } from 'apigsreport/functions/auth'
 *
 * const client = new NtlmHttpClient({ baseUrl: 'https://ssrs.company.com' })
 * const response = await client.executeReport(
 *   { reportPath: '/Sales/Report', format: 'PDF' },
 *   { username: 'user', password: 'pass' }
 * )
 * ```
 *
 * @see {@link ./ntlm-client.js} for full documentation.
 */
export * from './ntlm-client.js'
