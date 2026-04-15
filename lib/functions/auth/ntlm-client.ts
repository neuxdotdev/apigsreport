/**
 * @fileoverview NTLM HTTP client for SSRS report execution.
 *
 * This module provides an HTTP client that handles NTLM authentication using
 * `axios-ntlm`. It supports automatic retries, configurable timeouts, and
 * specialised methods for executing SSRS reports and testing authentication.
 *
 * The client automatically constructs SSRS render URLs, sets appropriate
 * `Accept` headers, and handles both binary (PDF/Excel) and text responses.
 *
 * @module functions/auth/ntlm-client
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { URL } from 'node:url'
import { AxiosError } from 'axios'
import { NtlmClient } from 'axios-ntlm'
import { AuthError, NetworkError } from '../../handler/error.js'
import { logger } from '../../handler/logger.js'
import type { NtlmAuthOptions, HttpResponse, ReportRequest } from './types.js'

/**
 * HTTP client with NTLM authentication for SSRS API calls.
 *
 * `NtlmHttpClient` wraps `axios-ntlm` and provides:
 * - Automatic NTLM handshake for each request.
 * - Exponential backoff retries for transient failures.
 * - Special handling for report rendering (arraybuffer responses).
 * - Authentication testing without affecting the main client state.
 *
 * The client is stateless with respect to authentication – each request
 * performs its own NTLM handshake because NTLM is connection‑oriented.
 *
 * @public
 *
 * @example
 * ```typescript
 * import { NtlmHttpClient } from 'apigsreport'
 *
 * const client = new NtlmHttpClient({
 *   baseUrl: 'https://reportserver.company.com',
 *   timeout: 30000,
 *   retry: { attempts: 3, delayMs: 1000 }
 * })
 *
 * // Execute a report
 * const response = await client.executeReport(
 *   {
 *     reportPath: '/Sales/Report',
 *     format: 'PDF',
 *     parameters: { Year: 2025 }
 *   },
 *   { username: 'DOMAIN\\user', password: 'secret' }
 * )
 *
 * // Test authentication
 * const result = await client.testAuth({
 *   username: 'DOMAIN\\user',
 *   password: 'secret'
 * })
 * ```
 */
export class NtlmHttpClient {
	private readonly baseUrl: string
	private readonly defaultTimeout: number
	private readonly retryConfig: { attempts: number; delayMs: number }

	/**
	 * Creates a new NTLM HTTP client.
	 *
	 * @param options - Client configuration.
	 * @param options.baseUrl - Base URL of the SSRS server (e.g., `https://ssrs.company.com`).
	 * @param options.timeout - Default timeout in milliseconds for all requests (default: `30000`).
	 * @param options.retry - Retry settings.
	 * @param options.retry.attempts - Maximum number of retry attempts (default: `3`).
	 * @param options.retry.delayMs - Base delay in milliseconds before the first retry (default: `1000`).
	 *                                 Retries use exponential backoff: `delay * 2^(attempt-1)`.
	 *
	 * @throws {AuthError} If the `baseUrl` is invalid (malformed or unsupported protocol).
	 *
	 * @example
	 * ```typescript
	 * const client = new NtlmHttpClient({
	 *   baseUrl: 'https://ssrs.example.com',
	 *   timeout: 60000,
	 *   retry: { attempts: 5, delayMs: 500 }
	 * })
	 * ```
	 */
	constructor(options: {
		baseUrl: string
		timeout?: number
		retry?: { attempts: number; delayMs: number }
	}) {
		try {
			const url = new URL(options.baseUrl)
			if (!['http:', 'https:'].includes(url.protocol)) {
				throw new Error('Invalid protocol')
			}
			this.baseUrl = url.toString().replace(/\/$/, '')
		} catch (error) {
			logger.error('NtlmHttpClient: Invalid baseUrl', error as Error, {
				baseUrl: options.baseUrl,
			})
			throw new AuthError('Invalid base URL configuration', 'INVALID_BASE_URL', {
				context: { baseUrl: options.baseUrl },
				cause: error,
			})
		}
		this.defaultTimeout = options.timeout ?? 30000
		this.retryConfig = {
			attempts: options.retry?.attempts ?? 3,
			delayMs: options.retry?.delayMs ?? 1000,
		}
		logger.debug('NtlmHttpClient: Initialized (axios-ntlm)', {
			baseUrl: this.baseUrl,
			timeout: this.defaultTimeout,
			retry: this.retryConfig,
		})
	}

	/**
	 * Creates an `axios-ntlm` client instance for the given credentials.
	 *
	 * @param username - NTLM username (without domain prefix).
	 * @param password - NTLM password.
	 * @param domain - Optional domain (if not already part of username).
	 * @returns An axios-ntlm client configured with the credentials.
	 *
	 * @internal
	 */
	private getAxiosClient(username: string, password: string, domain?: string) {
		const options = {
			username,
			password,
			domain: domain ?? '',
		}
		return NtlmClient(options)
	}

	/**
	 * Performs an authenticated GET request.
	 *
	 * @typeParam T - Expected response body type.
	 * @param options - Request options (without explicit `url` field; use `path` instead).
	 * @returns A promise that resolves to the HTTP response.
	 *
	 * @throws {AuthError} If NTLM handshake fails (401).
	 * @throws {NetworkError} For other network or HTTP errors after retries.
	 *
	 * @example
	 * ```typescript
	 * const response = await client.get({
	 *   path: '/ReportServer/api/v2.0/Folders',
	 *   username: 'user',
	 *   password: 'pass',
	 *   domain: 'CORP'
	 * })
	 * ```
	 */
	async get<T = unknown>(
		options: Omit<NtlmAuthOptions, 'url'> & { path?: string },
	): Promise<HttpResponse<T>> {
		const url = options.path ? `${this.baseUrl}${options.path}` : this.baseUrl
		return this.request<T>('GET', { ...options, url })
	}

	/**
	 * Performs an authenticated POST request.
	 *
	 * @typeParam T - Expected response body type.
	 * @param options - Request options including optional `body` and `contentType`.
	 * @returns A promise that resolves to the HTTP response.
	 *
	 * @example
	 * ```typescript
	 * const response = await client.post({
	 *   path: '/ReportServer/api/v2.0/Reports',
	 *   username: 'user',
	 *   password: 'pass',
	 *   body: { name: 'NewReport' },
	 *   contentType: 'application/json'
	 * })
	 * ```
	 */
	async post<T = unknown>(
		options: Omit<NtlmAuthOptions, 'url'> & {
			path?: string
			body?: unknown
			contentType?: string
		},
	): Promise<HttpResponse<T>> {
		const url = options.path ? `${this.baseUrl}${options.path}` : this.baseUrl
		return this.request<T>('POST', {
			...options,
			url,
			headers: {
				...options.headers,
				'Content-Type': options.contentType ?? 'application/json',
			},
		})
	}

	/**
	 * Core request method that handles retries, NTLM, and response parsing.
	 *
	 * @typeParam T - Expected response body type.
	 * @param method - HTTP method (GET, POST, PUT, DELETE).
	 * @param options - Full NTLM authentication options including URL.
	 * @returns The HTTP response.
	 *
	 * @throws {NetworkError} After all retries are exhausted.
	 *
	 * @internal
	 */
	private async request<T>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		options: NtlmAuthOptions,
	): Promise<HttpResponse<T>> {
		const startTime = performance.now()
		const requestId = crypto.randomUUID?.() ?? Date.now().toString(36)
		logger.verbose('NtlmHttpClient: Request started', {
			requestId,
			method,
			url: options.url,
			username: options.username,
			timeout: options.timeout ?? this.defaultTimeout,
		})
		let ntlmUsername = options.username
		let ntlmDomain: string | undefined
		if (options.username.includes('\\')) {
			const parts = options.username.split('\\')
			ntlmDomain = parts[0]
			ntlmUsername = parts.slice(1).join('\\')
		}
		const client = this.getAxiosClient(ntlmUsername, options.password, ntlmDomain)
		let lastError: Error | undefined
		for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
			try {
				logger.trace('NtlmHttpClient: Attempt', {
					attempt,
					maxAttempts: this.retryConfig.attempts,
				})
				const axiosConfig: any = {
					method,
					url: options.url,
					timeout: options.timeout ?? this.defaultTimeout,
					headers: {
						'User-Agent': 'APiGSReport-Client/1.0',
						...options.headers,
					},
					responseType:
						method === 'GET' && options.url.includes('Render') ? 'arraybuffer' : 'text',
				}
				if (method === 'POST' && (options as any).body) {
					axiosConfig.data = (options as any).body
				}
				const response = await client(axiosConfig)
				const duration = performance.now() - startTime
				let body: T
				if (axiosConfig.responseType === 'arraybuffer') {
					body = Buffer.from(response.data) as unknown as T
				} else {
					body = response.data as T
				}
				const headers: Record<string, string | string[]> = {}
				for (const [key, value] of Object.entries(response.headers)) {
					if (value !== undefined) {
						headers[key] = value
					}
				}
				const result: HttpResponse<T> = {
					statusCode: response.status,
					headers,
					body,
					raw:
						axiosConfig.responseType === 'arraybuffer'
							? Buffer.from(response.data)
							: undefined,
					duration,
					url: response.config.url ?? options.url,
				}
				logger.httpResponse(response.status, options.url, duration)
				logger.verbose('NtlmHttpClient: Request successful', {
					requestId,
					statusCode: response.status,
					duration: `${duration.toFixed(2)}ms`,
					attempt,
				})
				return result
			} catch (error) {
				lastError = error as Error
				const duration = performance.now() - startTime
				const axiosError = error as AxiosError
				const status = axiosError.response?.status
				logger.warn('NtlmHttpClient: Request failed', {
					requestId,
					attempt,
					maxAttempts: this.retryConfig.attempts,
					error: axiosError.message,
					duration: `${duration.toFixed(2)}ms`,
				})
				// Do not retry on client errors (4xx except 429/408?)
				if (status === 401 || status === 403 || (status && status >= 400 && status < 500)) {
					logger.debug('NtlmHttpClient: Not retrying - non-recoverable error')
					break
				}
				if (attempt < this.retryConfig.attempts) {
					const delay = this.retryConfig.delayMs * Math.pow(2, attempt - 1)
					logger.trace('NtlmHttpClient: Waiting before retry', { delay: `${delay}ms` })
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
			}
		}
		const duration = performance.now() - startTime
		logger.error('NtlmHttpClient: All attempts failed', lastError, {
			requestId,
			url: options.url,
			attempts: this.retryConfig.attempts,
			duration: `${duration.toFixed(2)}ms`,
		})
		throw (
			lastError ??
			new NetworkError('Request failed after all retries', {
				url: options.url,
				context: { method, attempts: this.retryConfig.attempts },
			})
		)
	}

	/**
	 * Tests NTLM authentication without performing a full report request.
	 *
	 * Sends a GET request to `/ReportServer` and checks the response.
	 * A 200 (OK) or 401 (Unauthorized with challenge) indicates that NTLM
	 * is working. A 401 without challenge typically means invalid credentials.
	 *
	 * @param options - NTLM credentials.
	 * @returns An object indicating success and a human‑readable message.
	 *
	 * @example
	 * ```typescript
	 * const result = await client.testAuth({
	 *   username: 'DOMAIN\\user',
	 *   password: 'secret'
	 * })
	 * if (result.success) {
	 *   console.log('NTLM is functional')
	 * }
	 * ```
	 */
	async testAuth(options: {
		username: string
		password: string
		domain?: string
	}): Promise<{ success: boolean; message: string }> {
		const testUrl = `${this.baseUrl}/ReportServer`
		logger.info('NtlmHttpClient: Testing authentication', {
			url: testUrl,
			username: options.username,
			domain: options.domain,
		})
		try {
			const client = this.getAxiosClient(options.username, options.password, options.domain)
			const response = await client({
				method: 'GET',
				url: testUrl,
				timeout: 10000,
				headers: { Accept: 'text/html' },
			})
			const statusCode = response.status
			if (statusCode === 200 || statusCode === 401) {
				logger.authSuccess(options.username, testUrl, 0)
				return {
					success: true,
					message:
						statusCode === 200
							? 'Connected successfully'
							: 'Authentication challenge received (NTLM working)',
				}
			}
			logger.warn('NtlmHttpClient: Unexpected status code', { statusCode, url: testUrl })
			return { success: false, message: `Unexpected response: ${statusCode}` }
		} catch (error) {
			const axiosError = error as AxiosError
			if (axiosError.response?.status === 401) {
				logger.authFailure(options.username, testUrl, 'AUTH_401', axiosError)
				return { success: false, message: 'Auth error: Invalid credentials' }
			}
			logger.error('NtlmHttpClient: Connection test failed', axiosError, {
				url: testUrl,
				username: options.username,
			})
			return {
				success: false,
				message: axiosError.message || 'Unknown error',
			}
		}
	}

	/**
	 * Executes an SSRS report and returns the result.
	 *
	 * This method constructs the proper SSRS render URL with the report path,
	 * format, and parameters. It automatically sets the correct `Accept` header
	 * based on the requested format and returns the response body as a `Buffer`
	 * (or the generic type `T` if overridden).
	 *
	 * @typeParam T - Expected response body type (default: `Buffer`).
	 * @param request - Report request details.
	 * @param credentials - NTLM credentials for authentication.
	 * @returns The HTTP response containing the rendered report.
	 *
	 * @throws {NetworkError} If the request fails after retries.
	 *
	 * @example
	 * ```typescript
	 * const response = await client.executeReport(
	 *   {
	 *     reportPath: '/Finance/BalanceSheet',
	 *     format: 'EXCELOPENXML',
	 *     parameters: { FiscalYear: 2024 }
	 *   },
	 *   { username: 'DOMAIN\\user', password: 'secret' }
	 * )
	 * // response.body is a Buffer with the Excel file
	 * ```
	 */
	async executeReport<T = Buffer>(
		request: ReportRequest,
		credentials: { username: string; password: string; domain?: string },
	): Promise<HttpResponse<T>> {
		const encodedPath = encodeURIComponent(request.reportPath)
		const queryParts: string[] = [
			encodedPath,
			`rs:Command=Render`,
			`rs:Format=${request.format ?? 'PDF'}`,
		]
		if (request.parameters) {
			for (const [key, value] of Object.entries(request.parameters)) {
				if (key && value !== undefined && value !== null) {
					queryParts.push(
						`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
					)
				}
			}
		}
		const queryString = queryParts.join('&')
		const path = `/ReportServer?${queryString}`
		const fullUrl = `${this.baseUrl}${path}`
		logger.debug('NtlmHttpClient: Executing report request', {
			reportPath: request.reportPath,
			format: request.format,
			paramCount: Object.keys(request.parameters ?? {}).length,
			url: fullUrl,
		})
		return this.get<T>({
			path: `/ReportServer?${queryString}`,
			username: credentials.username,
			password: credentials.password,
			domain: credentials.domain,
			timeout: request.timeout,
			headers: {
				Accept: this.getAcceptHeader(request.format),
			},
		})
	}

	/**
	 * Returns the appropriate `Accept` header for a given report format.
	 *
	 * @param format - The report format (e.g., `'PDF'`, `'EXCELOPENXML'`).
	 * @returns The corresponding MIME type, or `'application/octet-stream'` for unknown formats.
	 *
	 * @internal
	 */
	private getAcceptHeader(format?: string): string {
		const map: Record<string, string> = {
			'PDF': 'application/pdf',
			'EXCELOPENXML': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'CSV': 'text/csv',
			'XML': 'application/xml',
			'HTML4.0': 'text/html',
		}
		return map[format ?? 'PDF'] ?? 'application/octet-stream'
	}
}
