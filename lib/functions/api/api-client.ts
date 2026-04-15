/**
 * @fileoverview Low‑level SSRS API client with NTLM authentication.
 *
 * This module provides the `SsrsApiClient` class, which handles the direct
 * communication with an SSRS (SQL Server Reporting Services) server using
 * NTLM authentication. It constructs the correct render URLs, manages timeouts,
 * parses responses, and classifies errors.
 *
 * For most use cases, the higher‑level `renderReport()` function is recommended.
 * Use `SsrsApiClient` directly when you need to reuse a single client instance
 * across multiple report requests.
 *
 * @module functions/api/api-client
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { URL } from 'node:url'
import { AxiosError } from 'axios'
import { NtlmClient } from 'axios-ntlm'
import { AuthError, NetworkError } from '../../handler/error.js'
import { logger } from '../../handler/logger.js'
import type { RenderOptions, SsrsResponse, NtlmCredentials, ReportFormat } from './types.js'

/** @internal Default timeout for report rendering requests (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000

/** @internal Timeout for authentication test requests (10 seconds). */
const AUTH_TEST_TIMEOUT_MS = 10_000

/** @internal Set of supported URL protocols (HTTP and HTTPS). */
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:'])

/** @internal Set of valid report formats accepted by the SSRS server. */
const VALID_REPORT_FORMATS = new Set<ReportFormat>(['PDF', 'EXCELOPENXML', 'CSV', 'XML', 'HTML4.0'])

/**
 * Normalises a base URL by parsing it, validating the protocol, and removing trailing slashes.
 *
 * @param input - Raw base URL string (e.g., `'https://reportserver.company.com/'`).
 * @returns Normalised URL without trailing slash (e.g., `'https://reportserver.company.com'`).
 * @throws {AuthError} If the URL is invalid or uses an unsupported protocol.
 *
 * @internal
 */
function normalizeBaseUrl(input: string): string {
	try {
		const url = new URL(input)
		if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
			throw new Error(`Unsupported protocol: ${url.protocol}`)
		}
		return url.toString().replace(/\/$/, '')
	} catch (error) {
		throw new AuthError(`Invalid base URL: ${input}`, 'INVALID_URL', { cause: error })
	}
}

/**
 * Parses NTLM credentials, splitting the username if it contains a domain separator (`\`).
 *
 * @param username - Raw username (may include domain, e.g., `'CORP\\john.doe'`).
 * @param domain - Explicit domain (takes precedence over the username‑embedded domain).
 * @returns An object with `ntlmUsername` (without domain) and optional `ntlmDomain`.
 *
 * @internal
 */
function parseNtlmCredentials(
	username: string,
	domain?: string,
): { ntlmUsername: string; ntlmDomain?: string } {
	if (domain !== undefined) {
		return { ntlmUsername: username, ntlmDomain: domain }
	}
	if (username.includes('\\')) {
		const parts = username.split('\\')
		const ntlmDomain = parts[0] || undefined
		const ntlmUsername = parts.slice(1).join('\\') || username
		if (ntlmDomain) {
			return { ntlmUsername, ntlmDomain }
		}
		return { ntlmUsername }
	}
	return { ntlmUsername: username }
}

/**
 * Constructs the full SSRS render URL for a report.
 *
 * The URL format follows the SSRS `Render` command specification:
 * `{baseUrl}/ReportServer?{encodedPath}&rs:Command=Render&rs:Format={format}&{parameters}`
 *
 * @param baseUrl - Normalised base URL (without trailing slash).
 * @param reportPath - Path to the report on the server (e.g., `'/Sales/Report'`).
 * @param format - Desired output format (e.g., `'PDF'`, `'EXCELOPENXML'`).
 * @param parameters - Optional report parameters (key‑value pairs).
 * @returns The fully constructed URL.
 *
 * @internal
 */
function buildRenderUrl(
	baseUrl: string,
	reportPath: string,
	format: ReportFormat,
	parameters?: Record<string, string | number | boolean>,
): string {
	const encodedPath = encodeURIComponent(reportPath)
	const queryParts: string[] = [encodedPath, `rs:Command=Render`, `rs:Format=${format}`]
	if (parameters) {
		for (const [key, value] of Object.entries(parameters)) {
			if (key && value !== undefined && value !== null) {
				const encodedKey = encodeURIComponent(key)
				const encodedValue = encodeURIComponent(String(value))
				queryParts.push(`${encodedKey}=${encodedValue}`)
			}
		}
	}
	const queryString = queryParts.join('&')
	return `${baseUrl}/ReportServer?${queryString}`
}

/**
 * Returns the appropriate `Accept` HTTP header value for a given report format.
 *
 * @param format - The report format.
 * @returns MIME type corresponding to the format (e.g., `'application/pdf'`).
 *
 * @internal
 */
function getAcceptHeader(format: ReportFormat): string {
	const headers: Record<ReportFormat, string> = {
		'PDF': 'application/pdf',
		'EXCELOPENXML': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'CSV': 'text/csv',
		'XML': 'application/xml',
		'HTML4.0': 'text/html',
	}
	return headers[format] ?? 'application/octet-stream'
}

/**
 * Low‑level client for the SSRS ReportServer API with NTLM authentication.
 *
 * `SsrsApiClient` is a wrapper around `axios-ntlm` that handles:
 * - URL construction for the SSRS `Render` command.
 * - NTLM authentication handshake (per request).
 * - Response parsing (binary for reports, text for errors).
 * - Error classification (`AuthError` for 401, `NetworkError` for others).
 * - Optional timeout configuration.
 *
 * The client is stateless; each `renderReport()` call performs its own NTLM
 * handshake because NTLM is connection‑oriented.
 *
 * @public
 *
 * @example
 * ```typescript
 * import { SsrsApiClient } from 'apigsreport'
 *
 * const client = new SsrsApiClient({
 *   baseUrl: 'https://reportserver.company.com',
 *   username: 'CORP\\john.doe',
 *   password: 'secret'
 * })
 *
 * const pdfResponse = await client.renderReport({
 *   reportPath: '/Finance/BalanceSheet',
 *   format: 'PDF',
 *   parameters: { Year: 2025 }
 * })
 *
 * // pdfResponse.body is a Buffer containing the PDF
 * ```
 */
export class SsrsApiClient {
	private readonly normalizedBaseUrl: string
	private readonly defaultTimeout: number
	private readonly axiosClient: ReturnType<typeof NtlmClient>

	/**
	 * Creates a new SSRS API client.
	 *
	 * @param credentials - NTLM credentials (base URL, username, password, optional domain).
	 * @param timeout - Optional timeout in milliseconds for all requests (default: `30_000`).
	 *
	 * @throws {AuthError} If the base URL is invalid or the protocol is unsupported.
	 *
	 * @example
	 * ```typescript
	 * const client = new SsrsApiClient({
	 *   baseUrl: 'https://ssrs.example.com',
	 *   username: 'DOMAIN\\user',
	 *   password: 'pass'
	 * }, 60000)
	 * ```
	 */
	constructor(credentials: NtlmCredentials, timeout?: number) {
		this.normalizedBaseUrl = normalizeBaseUrl(credentials.baseUrl)
		this.defaultTimeout = timeout ?? DEFAULT_TIMEOUT_MS
		const { ntlmUsername, ntlmDomain } = parseNtlmCredentials(
			credentials.username,
			credentials.domain,
		)
		const clientOptions = {
			username: ntlmUsername,
			password: credentials.password,
			domain: ntlmDomain ?? '',
		}
		this.axiosClient = NtlmClient(clientOptions)
		logger.trace('SsrsApiClient: Initialized (axios-ntlm)', {
			baseUrl: this.normalizedBaseUrl,
			username: credentials.username,
			hasDomain: !!credentials.domain,
			timeout: this.defaultTimeout,
		})
	}

	/**
	 * Renders an SSRS report and returns the response.
	 *
	 * This method constructs the render URL, sends an authenticated GET request,
	 * and returns a structured response containing the report data (as a Buffer),
	 * HTTP status, headers, and timing information.
	 *
	 * @param options - Render options (report path, format, parameters, optional timeout).
	 * @returns A promise that resolves to the SSRS response.
	 *
	 * @throws {AuthError} If the format is unsupported or authentication fails (401).
	 * @throws {NetworkError} For network issues, timeouts, or HTTP errors (4xx/5xx).
	 *
	 * @example
	 * ```typescript
	 * const response = await client.renderReport({
	 *   reportPath: '/Sales/Quarterly',
	 *   format: 'EXCELOPENXML',
	 *   parameters: { Quarter: 1 }
	 * })
	 * ```
	 */
	async renderReport(options: RenderOptions): Promise<SsrsResponse> {
		const { reportPath, format, parameters, timeout } = options
		if (!VALID_REPORT_FORMATS.has(format)) {
			throw new AuthError(`Unsupported report format: ${format}`, 'INVALID_FORMAT')
		}
		const startTime = performance.now()
		const url = buildRenderUrl(this.normalizedBaseUrl, reportPath, format, parameters)
		logger.debug('SsrsApiClient: Rendering report', {
			reportPath,
			format,
			paramCount: parameters ? Object.keys(parameters).length : 0,
			url,
		})
		return this.executeRequest(url, timeout ?? this.defaultTimeout, startTime)
	}

	/**
	 * Tests NTLM authentication without rendering a report.
	 *
	 * Sends a GET request to `/ReportServer` with a short timeout. The test passes
	 * if the server responds with `200 OK` or `401 Unauthorized` (the latter
	 * indicates that NTLM negotiation is active). Any other status or network error
	 * is treated as failure.
	 *
	 * @returns A promise that resolves to an object with `success` and a message.
	 *
	 * @example
	 * ```typescript
	 * const result = await client.testAuth()
	 * if (result.success) {
	 *   console.log('NTLM is working')
	 * }
	 * ```
	 */
	async testAuth(): Promise<{ success: boolean; message: string }> {
		const testUrl = `${this.normalizedBaseUrl}/ReportServer`
		logger.debug('SsrsApiClient: Testing authentication', { url: testUrl })
		try {
			const response = await this.axiosClient.get(testUrl, {
				timeout: AUTH_TEST_TIMEOUT_MS,
				headers: { Accept: 'text/html' },
			})
			const statusCode = response.status
			if (statusCode === 200 || statusCode === 401) {
				logger.debug('SsrsApiClient: Auth test passed', { statusCode })
				return {
					success: true,
					message:
						statusCode === 200
							? 'Connected successfully'
							: 'Authentication challenge received (NTLM working)',
				}
			}
			logger.warn('SsrsApiClient: Unexpected auth status', { statusCode })
			return { success: false, message: `Unexpected response: ${statusCode}` }
		} catch (error) {
			const axiosError = error as AxiosError
			const status = axiosError.response?.status
			const message = axiosError.message
			logger.error('SsrsApiClient: Auth test failed', axiosError, { url: testUrl })
			if (status === 401 || message?.includes('401')) {
				return { success: false, message: 'Authentication failed - invalid credentials' }
			}
			return { success: false, message: `Connection error: ${message}` }
		}
	}

	/**
	 * Executes an authenticated GET request and processes the response.
	 *
	 * @param url - Full request URL.
	 * @param timeout - Timeout in milliseconds.
	 * @param startTime - High‑resolution timestamp (from `performance.now()`) for duration calculation.
	 * @returns Parsed SSRS response.
	 *
	 * @throws {AuthError} On 401 (authentication failure).
	 * @throws {NetworkError} On other HTTP errors, timeouts, or connection issues.
	 *
	 * @internal
	 */
	private async executeRequest(
		url: string,
		timeout: number,
		startTime: number,
	): Promise<SsrsResponse> {
		try {
			const response = await this.axiosClient.get(url, {
				timeout,
				responseType: 'arraybuffer',
				headers: {
					'Accept': getAcceptHeader(this.getFormatFromUrl(url)),
					'User-Agent': 'ApIgsReport-Client/1.0',
				},
			})
			const duration = performance.now() - startTime
			const statusCode = response.status
			const contentType = response.headers['content-type'] as string | undefined
			const bodyBuffer = Buffer.from(response.data as ArrayBuffer)
			logger.debug('SsrsApiClient: Response received', {
				statusCode,
				contentType,
				bodySize: bodyBuffer.length,
				duration: `${duration.toFixed(0)}ms`,
			})
			if (statusCode >= 400) {
				const bodyPreview = bodyBuffer.toString('utf-8').slice(0, 200)
				throw new NetworkError(`HTTP ${statusCode}: ${bodyPreview}`, {
					statusCode,
					url,
					context: { contentType },
				})
			}
			// Optional PDF header check (early warning for corrupted responses)
			if (contentType?.includes('application/pdf') && bodyBuffer.length > 0) {
				const header = bodyBuffer.subarray(0, 5).toString('ascii')
				if (header !== '%PDF-') {
					logger.warn('SsrsApiClient: PDF response does not start with %PDF-', { header })
				}
			}
			const headers: Record<string, string | string[]> = {}
			for (const [key, value] of Object.entries(response.headers)) {
				if (value !== undefined) {
					headers[key] = value
				}
			}
			return {
				statusCode,
				headers,
				body: bodyBuffer,
				duration,
				url: response.config.url ?? url,
			}
		} catch (error) {
			const duration = performance.now() - startTime
			const axiosError = error as AxiosError
			const status = axiosError.response?.status
			const responseData = axiosError.response?.data as ArrayBuffer | undefined
			const bodyPreview = responseData
				? Buffer.from(responseData).toString('utf-8').slice(0, 200)
				: undefined
			logger.error('SsrsApiClient: Request failed', axiosError, { url, duration })
			if (status === 401) {
				throw new AuthError('Authentication failed - invalid credentials', 'AUTH_401', {
					context: { url },
					cause: error,
				})
			}
			if (status === 404) {
				throw new NetworkError('Report not found', { statusCode: 404, url, cause: error })
			}
			if (axiosError.code === 'ECONNREFUSED') {
				throw new NetworkError('Connection refused - server may be down', {
					url,
					cause: error,
				})
			}
			if (axiosError.code === 'ETIMEDOUT' || axiosError.message.includes('timeout')) {
				throw new NetworkError('Request timeout', { url, cause: error })
			}
			throw new NetworkError(`HTTP request failed: ${axiosError.message}`, {
				statusCode: status,
				url,
				context: { bodyPreview },
				cause: error,
			})
		}
	}

	/**
	 * Extracts the report format from a render URL.
	 *
	 * @param url - The full render URL (contains `rs:Format=...`).
	 * @returns The format string, defaulting to `'PDF'` if not found or invalid.
	 *
	 * @internal
	 */
	private getFormatFromUrl(url: string): ReportFormat {
		const match = url.match(/rs:Format=([^&]+)/)
		if (match && VALID_REPORT_FORMATS.has(match[1] as ReportFormat)) {
			return match[1] as ReportFormat
		}
		return 'PDF'
	}
}
