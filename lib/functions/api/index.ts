/**
 * @fileoverview Barrel export for the SSRS API module.
 *
 * This module aggregates and re‑exports the public components of the SSRS API
 * subsystem, including the high‑level rendering functions, type definitions,
 * and the low‑level `SsrsApiClient` class.
 *
 * Importing from this barrel gives convenient access to everything needed
 * for rendering reports and testing authentication:
 *
 * ```typescript
 * import { renderReport, testAuth, Formats, SsrsApiClient } from 'apigsreport/functions/api'
 * ```
 *
 * @module functions/api/index
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

// ----------------------------------------------------------------------------
// High‑Level API Functions
// ----------------------------------------------------------------------------

/**
 * Re‑exports the primary SSRS rendering functions and format constants.
 *
 * **Exported items:**
 * - `renderReport()` – Renders an SSRS report and returns the response.
 * - `testAuth()` – Tests NTLM authentication against the SSRS server.
 * - `Formats` – Object with named constants for supported report formats
 *   (`PDF`, `EXCEL`, `CSV`, `XML`, `HTML`).
 *
 * @example
 * ```typescript
 * import { renderReport, testAuth, Formats } from 'apigsreport/functions/api'
 *
 * const authOk = await testAuth(credentials)
 * if (authOk.success) {
 *   const pdf = await renderReport(credentials, {
 *     reportPath: '/Sales/Report',
 *     format: Formats.PDF
 *   })
 * }
 * ```
 *
 * @see {@link ./api.js} for full documentation.
 */
export * from './api.js'

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

/**
 * Re‑exports all type definitions for the SSRS API.
 *
 * **Exported types:**
 * - `ReportFormat` – Union of supported output formats.
 * - `RenderOptions` – Options for rendering a report.
 * - `NtlmCredentials` – NTLM authentication credentials.
 * - `SsrsResponse<T>` – Standardised response structure.
 * - `NtlmAuthOptions` – Low‑level NTLM request options (advanced).
 *
 * @example
 * ```typescript
 * import type { RenderOptions, SsrsResponse } from 'apigsreport/functions/api'
 * ```
 *
 * @see {@link ./types.js} for full documentation.
 */
export * from './types.js'

// ----------------------------------------------------------------------------
// Low‑Level Client Class
// ----------------------------------------------------------------------------

/**
 * Re‑exports the `SsrsApiClient` class for advanced use cases.
 *
 * While the `renderReport` function is sufficient for most scenarios,
 * direct instantiation of `SsrsApiClient` allows you to reuse a single
 * client instance across multiple report requests (sharing the same
 * credentials and timeout configuration).
 *
 * @example
 * ```typescript
 * import { SsrsApiClient } from 'apigsreport/functions/api'
 *
 * const client = new SsrsApiClient({
 *   baseUrl: 'https://ssrs.company.com',
 *   username: 'DOMAIN\\user',
 *   password: 'pass'
 * })
 *
 * const report1 = await client.renderReport({ reportPath: '/R1', format: 'PDF' })
 * const report2 = await client.renderReport({ reportPath: '/R2', format: 'EXCELOPENXML' })
 * ```
 *
 * @see {@link ./api-client.js} for full documentation.
 */
export { SsrsApiClient } from './api-client.js'
