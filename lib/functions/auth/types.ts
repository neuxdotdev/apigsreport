/**
 * @fileoverview Type definitions for NTLM authentication and SSRS report handling.
 *
 * This module defines the core TypeScript interfaces, types, and Zod schemas
 * used by the authentication subsystem and the HTTP client. It includes
 * request/response shapes, authentication results, and configuration validation.
 *
 * @module functions/auth/types
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { z } from 'zod'

/**
 * Options for an NTLM‑authenticated HTTP request.
 *
 * These options are used by the low‑level `NtlmHttpClient` to perform
 * authenticated requests. The `url` must be absolute (including protocol and host).
 *
 * @public
 */
export interface NtlmAuthOptions {
	/** Full request URL (e.g., `https://ssrs.company.com/ReportServer`) */
	url: string

	/** NTLM username (optionally including domain, e.g., `DOMAIN\\user`) */
	username: string

	/** NTLM password (plaintext, will be sent via NTLM handshake) */
	password: string

	/** Optional domain (if not already part of `username`) */
	domain?: string | undefined

	/** Optional HTTP headers to include in the request */
	headers?: Record<string, string> | undefined

	/** Request timeout in milliseconds (default: `30000`) */
	timeout?: number | undefined

	/** Retry configuration for transient failures */
	retry?:
		| {
				/** Maximum number of retry attempts */
				attempts: number
				/** Base delay in milliseconds before the first retry (exponential backoff) */
				delayMs: number
		  }
		| undefined
}

/**
 * Standardised HTTP response structure used throughout the library.
 *
 * @typeParam T - Type of the response body (default: `unknown`).
 *                For binary data (reports), `T` is typically `Buffer`.
 *
 * @public
 */
export interface HttpResponse<T = unknown> {
	/** HTTP status code (e.g., `200`, `401`, `500`) */
	statusCode: number

	/** Response headers (header names are lowercased) */
	headers: Record<string, string | string[]>

	/** Parsed response body (type depends on the request) */
	body: T

	/** Raw response body as a Buffer (only for binary responses, otherwise `undefined`) */
	raw?: Buffer | undefined

	/** Request duration in milliseconds (from start to response received) */
	duration: number

	/** Final URL after any redirects (or the original URL) */
	url: string
}

/**
 * Result of a successful NTLM authentication.
 *
 * This object is stored internally by `AuthManager` and contains metadata
 * about the authenticated session.
 *
 * @public
 */
export interface AuthResult {
	/** Always `true` for a successful authentication */
	success: boolean

	/** Optional session identifier (generated locally, not from SSRS) */
	sessionId?: string | undefined

	/** Information about the authenticated user */
	userInfo?:
		| {
				/** Username used for authentication (as provided in config) */
				username: string
				/** Optional domain (if provided or extracted from username) */
				domain?: string | undefined
				/** Optional roles (currently not populated by SSRS) */
				roles?: string[] | undefined
		  }
		| undefined

	/** Metadata about the authentication event */
	metadata: {
		/** SSRS server URL that was authenticated against */
		serverUrl: string
		/** ISO timestamp when authentication succeeded */
		authenticatedAt: string
		/** Optional expiration time in seconds (NTLM does not provide this) */
		expiresIn?: number | undefined
	}
}

/**
 * Parameters for executing an SSRS report.
 *
 * This interface mirrors the SSRS `Render` command parameters.
 *
 * @public
 */
export interface ReportRequest {
	/** Path to the report on the SSRS server (e.g., `/Sales/AnnualReport`) */
	reportPath: string

	/** Optional report parameters (keys and values will be URL‑encoded) */
	parameters?: Record<string, string | number | boolean> | undefined

	/** Output format (default: `'PDF'` if omitted) */
	format?: 'PDF' | 'EXCELOPENXML' | 'CSV' | 'XML' | 'HTML4.0' | undefined

	/** Request timeout in milliseconds (overrides client default) */
	timeout?: number | undefined
}

/**
 * Zod schema for validating authentication configuration.
 *
 * This schema is used by `AuthManager` to ensure that the loaded configuration
 * (from file or environment) meets the required shape and constraints.
 *
 * @public
 */
export const AuthConfigSchema = z.object({
	/** Base URL of the SSRS server (must be a valid HTTP/HTTPS URL) */
	baseUrl: z.string().url(),

	/** NTLM username (can include domain, e.g., `CORP\\john.doe`) */
	username: z.string().min(1),

	/** NTLM password */
	password: z.string().min(1),

	/** Optional domain (overrides domain part in username) */
	domain: z.string().optional(),

	/** Request timeout in milliseconds (default: `30000`) */
	timeout: z.number().int().positive().default(30000),

	/** Number of retry attempts for transient network errors (0–5, default: `3`) */
	retryAttempts: z.number().int().min(0).max(5).default(3),
})

/**
 * Type inferred from `AuthConfigSchema`.
 *
 * Represents a validated authentication configuration object.
 *
 * @public
 */
export type AuthConfig = z.infer<typeof AuthConfigSchema>

/**
 * Extended NTLM request options (compatible with `axios-ntlm`).
 *
 * This interface provides additional options that are available in the
 * underlying `axios-ntlm` library, such as workstation, premd5, and redirect
 * handling. It is rarely needed directly but is exposed for advanced use cases.
 *
 * @public
 */
export interface HttpNtlmRequestOptions {
	/** Full request URL */
	url: string

	/** NTLM username */
	username: string

	/** NTLM password */
	password: string

	/** Optional domain */
	domain?: string | undefined

	/** Optional workstation name (default: hostname) */
	workstation?: string | undefined

	/** Optional HTTP headers */
	headers?: Record<string, string> | undefined

	/** Request timeout in milliseconds */
	timeout?: number | undefined

	/** Whether to use premd5 (older NTLM compatibility) */
	premd5?: boolean | undefined

	/** Whether to follow redirects (default: `true`) */
	allowRedirects?: boolean | undefined
}
