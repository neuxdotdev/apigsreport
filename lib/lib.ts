/**
 * @fileoverview Main client and factory for the APIGS Report Library.
 *
 * This module provides the high‑level `ApigsReportClient` class, which wraps
 * all SSRS report export functionality with built‑in configuration validation,
 * NTLM authentication, and optional file saving. It is the recommended entry
 * point for most use cases.
 *
 * @module lib
 * @since 1.0.0
 * @license MIT
 *
 * Copyright (c) 2026 neuxdotdev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { logger } from './handler/logger.js'
import { ExportError, ValidationError } from './handler/error.js'
import {
	renderReport,
	testAuth,
	type NtlmCredentials,
	type ReportFormat,
	type RenderOptions,
} from './functions/api/index.js'

/**
 * Configuration options for the `ApigsReportClient`.
 *
 * All fields except `domain`, `timeout`, `retryAttempts`, and `logLevel` are required.
 *
 * @public
 */
export interface ApigsReportConfig {
	/** Base URL of the SSRS server (e.g., `https://reportserver.company.com`) */
	baseUrl: string

	/** NTLM username (may include domain, e.g., `CORP\\john.doe`) */
	username: string

	/** NTLM password */
	password: string

	/** Optional domain (overrides domain part in `username`) */
	domain?: string | undefined

	/** Request timeout in milliseconds (default: `30000`) */
	timeout?: number | undefined

	/** Number of retry attempts for transient network errors (default: `3`) */
	retryAttempts?: number | undefined

	/** Logging verbosity level (default: `'info'`) */
	logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'verbose' | undefined
}

/**
 * Options for the `exportReport` method.
 *
 * @public
 */
export interface ExportReportOptions {
	/** Output format (default: `'PDF'`) */
	format?: ReportFormat | undefined

	/** Report parameters (key‑value pairs, automatically URL‑encoded) */
	parameters?: Record<string, string | number | boolean> | undefined

	/** If provided, saves the report to this file path (overwrites only if file does not exist) */
	outputPath?: string | undefined
}

/** @internal Default timeout for report requests (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000

/** @internal Default number of retry attempts. */
const DEFAULT_RETRY_ATTEMPTS = 3

/** @internal Default log level. */
const DEFAULT_LOG_LEVEL: ApigsReportConfig['logLevel'] = 'info'

/**
 * High‑level client for exporting SSRS reports.
 *
 * `ApigsReportClient` simplifies the entire workflow:
 * - Validates configuration on construction.
 * - Provides a simple `exportReport()` method that renders a predefined report
 *   (default path: `/IGS/WV_Kartu_Piutang_Wabot`).
 * - Optionally saves the output to a file (with safety checks).
 * - Includes a `testAuth()` method to verify credentials.
 *
 * For reports with custom paths, use the standalone `renderReport()` function
 * instead.
 *
 * @public
 *
 * @example
 * ```typescript
 * import { ApigsReportClient } from 'apigsreport'
 *
 * const client = new ApigsReportClient({
 *   baseUrl: 'https://reportserver.company.com',
 *   username: 'CORP\\john.doe',
 *   password: 'secret123',
 *   timeout: 60000,
 *   logLevel: 'debug'
 * })
 *
 * // Export PDF to memory
 * const pdfBuffer = await client.exportReport({
 *   format: 'PDF',
 *   parameters: { AccountId: 12345 }
 * })
 *
 * // Export Excel and save to disk
 * await client.exportReport({
 *   format: 'EXCELOPENXML',
 *   outputPath: './report.xlsx'
 * })
 *
 * // Test authentication
 * const authStatus = await client.testAuth()
 * console.log(authStatus.message)
 *
 * // Clean up (optional)
 * client.destroy()
 * ```
 */
export class ApigsReportClient {
	/**
	 * Normalised and validated configuration (all fields required).
	 * @internal
	 */
	readonly #config: Required<ApigsReportConfig>

	/**
	 * NTLM credentials derived from the configuration.
	 * @internal
	 */
	readonly #credentials: NtlmCredentials

	/**
	 * Creates a new `ApigsReportClient` instance.
	 *
	 * @param input - Configuration object (see {@link ApigsReportConfig}).
	 * @throws {ValidationError} If the configuration is missing required fields or malformed.
	 *
	 * @example
	 * ```typescript
	 * const client = new ApigsReportClient({
	 *   baseUrl: 'https://ssrs.example.com',
	 *   username: 'DOMAIN\\user',
	 *   password: 'pass'
	 * })
	 * ```
	 */
	constructor(input: unknown) {
		this.#config = this.#validateAndNormalizeConfig(input)
		this.#credentials = {
			baseUrl: this.#config.baseUrl,
			username: this.#config.username,
			password: this.#config.password,
			...(this.#config.domain !== undefined && { domain: this.#config.domain }),
		}
		logger.info('ApigsReportClient initialized', {
			baseUrl: this.#config.baseUrl,
			username: this.#config.username,
			debug: this.#config.logLevel !== 'silent',
		})
	}

	/**
	 * Validates and normalises the user‑provided configuration.
	 *
	 * @param input - Raw input (expected to be an object).
	 * @returns A fully populated `Required<ApigsReportConfig>`.
	 * @throws {ValidationError} For any missing or invalid field.
	 *
	 * @internal
	 */
	#validateAndNormalizeConfig(input: unknown): Required<ApigsReportConfig> {
		if (typeof input !== 'object' || input === null) {
			throw new ValidationError('input', input, 'Must be a non-null object')
		}
		const cfg = input as Partial<ApigsReportConfig>
		const baseUrl = cfg.baseUrl?.trim()
		if (!baseUrl) {
			throw new ValidationError('baseUrl', cfg.baseUrl, 'Required and cannot be empty')
		}
		if (!/^https?:\/\//i.test(baseUrl)) {
			throw new ValidationError('baseUrl', baseUrl, 'Must start with http:// or https://')
		}
		const username = cfg.username?.trim()
		if (!username) {
			throw new ValidationError('username', cfg.username, 'Required and cannot be empty')
		}
		const password = cfg.password?.trim()
		if (!password) {
			throw new ValidationError('password', cfg.password, 'Required and cannot be empty')
		}
		return {
			baseUrl,
			username,
			password,
			domain: cfg.domain,
			timeout: cfg.timeout ?? DEFAULT_TIMEOUT_MS,
			retryAttempts: cfg.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
			logLevel: cfg.logLevel ?? DEFAULT_LOG_LEVEL,
		}
	}

	/**
	 * Exports an SSRS report.
	 *
	 * The method renders the report defined by the hardcoded path
	 * `/IGS/WV_Kartu_Piutang_Wabot` (customise by using the low‑level `renderReport`
	 * function instead). The report can be returned as a `Buffer` or saved directly
	 * to disk.
	 *
	 * @param options - Export options (format, parameters, optional output path).
	 * @returns A promise that resolves to a `Buffer` containing the rendered report.
	 * @throws {ExportError} If `outputPath` is invalid (path traversal attempts) or
	 *                       the file already exists.
	 * @throws {AuthError} If authentication fails.
	 * @throws {NetworkError} For network or server errors.
	 *
	 * @example
	 * ```typescript
	 * // Get PDF as Buffer
	 * const buffer = await client.exportReport({ format: 'PDF' })
	 *
	 * // Save Excel to disk
	 * await client.exportReport({
	 *   format: 'EXCELOPENXML',
	 *   outputPath: './reports/balance.xlsx'
	 * })
	 * ```
	 */
	async exportReport(options?: {
		format?: ReportFormat | undefined
		parameters?: Record<string, string | number | boolean> | undefined
		outputPath?: string | undefined
	}): Promise<Buffer> {
		const { format = 'PDF', parameters, outputPath: _outputPath } = options ?? {}
		const renderOpts: Omit<RenderOptions, 'timeout'> & { timeout?: number } = {
			reportPath: '/IGS/WV_Kartu_Piutang_Wabot',
			format,
			...(parameters !== undefined && { parameters }),
		}
		if (this.#config.timeout !== undefined) {
			renderOpts.timeout = this.#config.timeout
		}
		const response = await renderReport(this.#credentials, renderOpts)
		if (options?.outputPath) {
			await this.#saveToFile(response.body, options.outputPath)
			logger.info('Report saved to file', { path: options.outputPath })
		}
		return response.body
	}

	/**
	 * Tests NTLM authentication against the SSRS server.
	 *
	 * @returns A promise that resolves to an object with `success` and a message.
	 *
	 * @example
	 * ```typescript
	 * const result = await client.testAuth()
	 * if (!result.success) {
	 *   console.error('Invalid credentials')
	 * }
	 * ```
	 */
	async testAuth(): Promise<{ success: boolean; message: string }> {
		logger.debug('ApigsReportClient: Testing authentication')
		return testAuth(this.#credentials)
	}

	/**
	 * Safely writes a buffer to a file.
	 *
	 * - Prevents path traversal (rejects paths containing `..`, starting with `/etc`, or `C:\`).
	 * - Creates missing directories recursively.
	 * - Uses `wx` flag to fail if the file already exists.
	 *
	 * @param data - Buffer to write.
	 * @param path - Destination file path.
	 * @throws {ExportError} For invalid paths, existing files, or filesystem errors.
	 *
	 * @internal
	 */
	async #saveToFile(data: Buffer, path: string): Promise<void> {
		if (path.includes('..') || path.startsWith('/etc') || path.startsWith('C:\\')) {
			throw new ExportError('Invalid output path', { context: { path } })
		}
		const { writeFile, mkdir } = await import('node:fs/promises')
		const { dirname } = await import('node:path')
		await mkdir(dirname(path), { recursive: true })
		await writeFile(path, data, { flag: 'wx' }).catch((err) => {
			if (err.code === 'EEXIST') {
				throw new ExportError('Output file already exists', { context: { path } })
			}
			throw err
		})
	}

	/**
	 * Releases any resources held by the client.
	 *
	 * Currently only logs the destruction; may be extended in future versions.
	 */
	destroy(): void {
		logger.info('ApigsReportClient destroyed')
	}
}

/**
 * Factory function to create an `ApigsReportClient` instance.
 *
 * This is an alternative to using the `new` operator; it behaves identically.
 *
 * @param config - Configuration object (see {@link ApigsReportConfig}).
 * @returns A new `ApigsReportClient` instance.
 *
 * @example
 * ```typescript
 * import { createClient } from 'apigsreport'
 *
 * const client = createClient({
 *   baseUrl: 'https://ssrs.company.com',
 *   username: 'user',
 *   password: 'pass'
 * })
 * ```
 *
 * @public
 */
export function createClient(config: unknown): ApigsReportClient {
	return new ApigsReportClient(config)
}

// Re‑export commonly used types and utilities from other modules
export { ValidationError, ExportError } from './handler/error.js'
export { Formats, type ReportFormat } from './functions/api/index.js'
