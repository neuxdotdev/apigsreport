/**
 * @fileoverview High‑level SSRS report rendering API.
 *
 * This module provides simple, promise‑based functions for rendering SSRS reports
 * and testing NTLM authentication. It wraps the `SsrsApiClient` class and offers
 * a convenient functional interface for one‑off report exports.
 *
 * The module also exports the `Formats` object (constants for supported report formats),
 * type definitions, and the `SsrsApiClient` class for advanced use cases.
 *
 * @module functions/api/api
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { SsrsApiClient } from './api-client.js'
import type { RenderOptions, SsrsResponse, NtlmCredentials, ReportFormat } from './types.js'

/**
 * Renders an SSRS report and returns the response.
 *
 * This is the primary function for exporting reports from an SSRS server.
 * It creates a temporary `SsrsApiClient` instance, performs the request,
 * and returns a structured response containing the report data (as a Buffer),
 * HTTP status, headers, duration, and final URL.
 *
 * The report path must be the full path to the report on the SSRS server
 * (e.g., `/Sales/YearlySummary`). The format must be one of the supported
 * `ReportFormat` values (`'PDF'`, `'EXCELOPENXML'`, `'CSV'`, `'XML'`, `'HTML4.0'`).
 *
 * @param credentials - NTLM credentials for authentication.
 * @param options - Report rendering options (report path, format, parameters, optional timeout).
 * @returns A promise that resolves to the SSRS response containing the report data.
 *
 * @throws {AuthError} If NTLM authentication fails (invalid credentials, domain issues).
 * @throws {NetworkError} If the request fails due to network issues, timeouts, or HTTP errors.
 *
 * @example
 * ```typescript
 * import { renderReport, Formats } from 'apigsreport'
 *
 * const pdfBuffer = await renderReport(
 *   {
 *     baseUrl: 'https://reportserver.company.com',
 *     username: 'CORP\\john.doe',
 *     password: 'secret123'
 *   },
 *   {
 *     reportPath: '/Finance/BalanceSheet',
 *     format: Formats.PDF,
 *     parameters: { FiscalYear: 2025, IncludeDetails: true }
 *   }
 * )
 *
 * // Save to file or process the buffer
 * await fs.writeFile('balance.pdf', pdfBuffer.body)
 * ```
 *
 * @public
 */
export async function renderReport(
	credentials: NtlmCredentials,
	options: Omit<RenderOptions, 'timeout'> & { timeout?: number },
): Promise<SsrsResponse> {
	const client = new SsrsApiClient(credentials, options.timeout)
	return client.renderReport(options)
}

/**
 * Tests NTLM authentication against the SSRS server.
 *
 * Sends a test request to the `/ReportServer` endpoint to verify that the
 * provided credentials are accepted by the server. This is useful for
 * configuration validation before attempting to render reports.
 *
 * A successful test does **not** guarantee that a specific report exists or
 * that the user has permissions to access it; it only confirms that the NTLM
 * handshake completes and the server responds (either with `200` OK or a
 * `401` challenge, both indicating that NTLM is working).
 *
 * @param credentials - NTLM credentials to test.
 * @returns A promise that resolves to an object with `success` (boolean) and
 *          a human‑readable `message`.
 *
 * @example
 * ```typescript
 * import { testAuth } from 'apigsreport'
 *
 * const result = await testAuth({
 *   baseUrl: 'https://reportserver.company.com',
 *   username: 'DOMAIN\\user',
 *   password: 'password'
 * })
 *
 * if (result.success) {
 *   console.log('Authentication works:', result.message)
 * } else {
 *   console.error('Authentication failed:', result.message)
 * }
 * ```
 *
 * @public
 */
export async function testAuth(
	credentials: NtlmCredentials,
): Promise<{ success: boolean; message: string }> {
	const client = new SsrsApiClient(credentials)
	return client.testAuth()
}

/**
 * Constants for supported SSRS report formats.
 *
 * This object provides named constants to avoid typos and improve code readability.
 * Use these values as the `format` field in `RenderOptions`.
 *
 * @public
 */
export const Formats = {
	/** Portable Document Format (`.pdf`) */
	PDF: 'PDF' as const,

	/** Microsoft Excel Open XML (`.xlsx`) */
	EXCEL: 'EXCELOPENXML' as const,

	/** Comma‑Separated Values (`.csv`) */
	CSV: 'CSV' as const,

	/** Extensible Markup Language (`.xml`) */
	XML: 'XML' as const,

	/** HTML 4.0 document (`.html`) */
	HTML: 'HTML4.0' as const,
} as const

// ----------------------------------------------------------------------------
// Type Re‑exports
// ----------------------------------------------------------------------------

/**
 * Re‑export of commonly used types for convenience.
 *
 * @public
 */
export type { RenderOptions, SsrsResponse, NtlmCredentials, ReportFormat }

/**
 * Re‑export of the `SsrsApiClient` class for advanced use cases.
 *
 * While the `renderReport` function is sufficient for most scenarios,
 * direct instantiation of `SsrsApiClient` allows you to reuse a single
 * client instance across multiple report requests (sharing the same
 * credentials and timeout configuration).
 *
 * @example
 * ```typescript
 * import { SsrsApiClient } from 'apigsreport'
 *
 * const client = new SsrsApiClient({
 *   baseUrl: 'https://ssrs.company.com',
 *   username: 'user',
 *   password: 'pass'
 * })
 *
 * const report1 = await client.renderReport({ reportPath: '/R1', format: 'PDF' })
 * const report2 = await client.renderReport({ reportPath: '/R2', format: 'EXCELOPENXML' })
 * ```
 *
 * @public
 */
export { SsrsApiClient }
