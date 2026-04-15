/**
 * @fileoverview Core type definitions for the SSRS API module.
 *
 * This module defines the fundamental types used for communicating with
 * SQL Server Reporting Services (SSRS) via the `SsrsApiClient` and the
 * higher‑level `renderReport` function. It includes report formats,
 * request/response structures, and NTLM credential interfaces.
 *
 * @module functions/api/types
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

/**
 * Supported SSRS report output formats.
 *
 * These values correspond to the `rs:Format` parameter in the SSRS Render command.
 *
 * @public
 */
export type ReportFormat = 'PDF' | 'EXCELOPENXML' | 'CSV' | 'XML' | 'HTML4.0'

/**
 * Low‑level options for an NTLM‑authenticated HTTP request.
 *
 * This interface is used by the internal HTTP client and is compatible with
 * the underlying `axios-ntlm` library. It includes the full URL, credentials,
 * and optional retry settings.
 *
 * @remarks
 * The `workstation` field is rarely needed; most SSRS servers ignore it.
 * The `retry` configuration is handled by the client, not by axios‑ntlm directly.
 *
 * @public
 */
export interface NtlmAuthOptions {
	/** Full request URL (e.g., `https://ssrs.company.com/ReportServer`) */
	url: string

	/** NTLM username (may include domain, e.g., `DOMAIN\\user`) */
	username: string

	/** NTLM password (plaintext, will be used in NTLM handshake) */
	password: string

	/** Optional domain (overrides domain embedded in `username`) */
	domain?: string | undefined

	/** Optional workstation name (defaults to hostname, rarely needed) */
	workstation?: string | undefined

	/** Custom HTTP headers to include in the request */
	headers?: Record<string, string> | undefined

	/** Request timeout in milliseconds (overrides client default) */
	timeout?: number | undefined

	/**
	 * Retry configuration for transient failures.
	 *
	 * @remarks
	 * Retries are implemented at the client level, not by axios‑ntlm.
	 */
	retry?:
		| {
				/** Maximum number of retry attempts */
				attempts: number
				/** Base delay in milliseconds (exponential backoff applies) */
				delayMs: number
		  }
		| undefined

	/**
	 * Allows additional properties for forward compatibility.
	 * @internal
	 */
	[key: string]: unknown
}

/**
 * Options for rendering an SSRS report.
 *
 * This interface is used by `SsrsApiClient.renderReport()` and the
 * standalone `renderReport()` function.
 *
 * @public
 */
export interface RenderOptions {
	/**
	 * Path to the report on the SSRS server.
	 *
	 * @example
	 * ```typescript
	 * reportPath: '/Sales/YearlySummary'
	 * reportPath: '/Finance/BalanceSheet'
	 * ```
	 */
	reportPath: string

	/** Desired output format (see {@link ReportFormat}) */
	format: ReportFormat

	/**
	 * Optional report parameters.
	 *
	 * Keys and values are URL‑encoded automatically. Values can be strings,
	 * numbers, or booleans (converted to string).
	 *
	 * @example
	 * ```typescript
	 * parameters: {
	 *   FiscalYear: 2025,
	 *   IncludeDetails: true,
	 *   Region: 'EMEA'
	 * }
	 * ```
	 */
	parameters?: Record<string, string | number | boolean> | undefined

	/**
	 * Optional workstation name (rarely needed).
	 *
	 * @remarks
	 * Most SSRS deployments ignore this field.
	 */
	workstation?: string | undefined

	/**
	 * Request timeout in milliseconds.
	 *
	 * @defaultValue Client's default timeout (usually `30000`)
	 */
	timeout?: number | undefined
}

/**
 * NTLM credentials required to authenticate with an SSRS server.
 *
 * This is the main credential object used by `SsrsApiClient` and the
 * `renderReport` / `testAuth` functions.
 *
 * @public
 */
export interface NtlmCredentials {
	/** Base URL of the SSRS server (e.g., `https://reportserver.company.com`) */
	baseUrl: string

	/** NTLM username (can include domain, e.g., `CORP\\john.doe`) */
	username: string

	/** NTLM password */
	password: string

	/** Optional domain (overrides domain part in `username`) */
	domain?: string | undefined

	/** Optional workstation name (rarely used) */
	workstation?: string | undefined
}

/**
 * Standardised response structure from an SSRS report request.
 *
 * @typeParam T - Type of the response body (default: `Buffer`).
 *                For reports, `T` is always `Buffer` containing the binary data.
 *
 * @public
 */
export interface SsrsResponse<T = Buffer> {
	/** HTTP status code (e.g., `200` for success) */
	statusCode: number

	/** Response headers (header names are lowercased) */
	headers: Record<string, string | string[]>

	/** Response body – typically a `Buffer` containing the rendered report */
	body: T

	/** Request duration in milliseconds (from start to response received) */
	duration: number

	/** Final URL after any redirects (or the original request URL) */
	url: string
}
