/**
 * @fileoverview Custom error hierarchy for the APIGS Report Library.
 *
 * This module defines a family of error classes that provide structured,
 * serializable error information. All errors extend the abstract `ApigsError`
 * base class, which adds timestamps, context metadata, and safe JSON
 * serialization. Specific error types help distinguish between configuration
 * issues, authentication failures, network problems, validation errors,
 * cryptographic failures, and export errors.
 *
 * The `isApigsError` type guard allows reliable checking of any error originating
 * from this library.
 *
 * @module handler/error
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

/**
 * Abstract base class for all errors thrown by the APIGS Report Library.
 *
 * `ApigsError` extends the built‑in `Error` class and adds:
 * - A timestamp (ISO string) when the error was created.
 * - Optional structured context for debugging.
 * - A `toJSON()` method that includes the stack trace only in development mode.
 * - A marker property `isApigsError` for reliable type detection.
 *
 * @public
 * @abstract
 *
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (err) {
 *   if (err instanceof ApigsError) {
 *     console.error(err.toJSON())
 *   }
 * }
 * ```
 */
export abstract class ApigsError extends Error {
	/**
	 * ISO timestamp of when the error was instantiated.
	 *
	 * @example "2026-04-15T10:30:00.000Z"
	 */
	public readonly timestamp: string

	/**
	 * Optional additional context for debugging (e.g., request parameters,
	 * configuration keys, etc.). The contents are library‑specific.
	 */
	public readonly context?: Record<string, unknown> | undefined

	/**
	 * Marker property that is always `true` for any `ApigsError` instance.
	 * Used by the `isApigsError` type guard.
	 */
	public readonly isApigsError = true

	/**
	 * Creates a new `ApigsError`.
	 *
	 * @param message - Human‑readable error description.
	 * @param options - Optional settings.
	 * @param options.context - Structured metadata to attach to the error.
	 * @param options.cause - Underlying error that caused this one (e.g., a network exception).
	 */
	constructor(
		message: string,
		options?: {
			context?: Record<string, unknown> | undefined
			cause?: unknown
		},
	) {
		super(message, { cause: options?.cause })
		this.name = this.constructor.name
		this.timestamp = new Date().toISOString()
		this.context = options?.context
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		}
	}

	/**
	 * Converts the error to a plain object suitable for JSON serialization.
	 *
	 * The stack trace is included **only** when `NODE_ENV === 'development'`
	 * to avoid leaking internal paths in production logs.
	 *
	 * @returns A serializable representation of the error.
	 *
	 * @example
	 * ```typescript
	 * console.log(JSON.stringify(error.toJSON()))
	 * ```
	 */
	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			timestamp: this.timestamp,
			context: this.context,
			stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
		}
	}
}

/**
 * Error thrown when there is a problem with the library configuration.
 *
 * This includes missing configuration files, invalid environment variables,
 * schema validation failures, or incorrect settings.
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   await configManager.load()
 * } catch (err) {
 *   if (err instanceof ConfigError) {
 *     console.error('Configuration error:', err.message)
 *   }
 * }
 * ```
 */
export class ConfigError extends ApigsError {
	/**
	 * Creates a new configuration error.
	 *
	 * @param message - Specific error description.
	 * @param options - Additional context or cause.
	 */
	constructor(
		message: string,
		options?: { context?: Record<string, unknown> | undefined; cause?: unknown },
	) {
		super(`[CONFIG] ${message}`, options)
	}
}

/**
 * Error thrown when authentication with the SSRS server fails.
 *
 * This can happen due to invalid NTLM credentials, expired sessions,
 * missing domain information, or server‑side authentication rejections.
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   await authManager.initialize()
 * } catch (err) {
 *   if (err instanceof AuthError) {
 *     console.error(`Auth failed with code ${err.errorCode}: ${err.message}`)
 *   }
 * }
 * ```
 */
export class AuthError extends ApigsError {
	/**
	 * Machine‑readable error code for programmatic handling.
	 *
	 * Common codes: `'AUTH_401'`, `'AUTH_FAILED'`, `'NOT_AUTHENTICATED'`,
	 * `'CLIENT_NOT_READY'`, `'NOT_INITIALIZED'`.
	 */
	public readonly errorCode: string

	/**
	 * Creates a new authentication error.
	 *
	 * @param message - Human‑readable description.
	 * @param errorCode - Programmatic error identifier.
	 * @param options - Additional context or cause.
	 */
	constructor(
		message: string,
		errorCode: string,
		options?: { context?: Record<string, unknown> | undefined; cause?: unknown },
	) {
		super(`[AUTH] ${message}`, options)
		this.errorCode = errorCode
	}

	/**
	 * Extends the base `toJSON()` with the `errorCode` field.
	 *
	 * @returns Serializable error object including the error code.
	 */
	toJSON(): Record<string, unknown> {
		return {
			...super.toJSON(),
			errorCode: this.errorCode,
		}
	}
}

/**
 * Error thrown when a network request fails.
 *
 * This includes timeouts, connection refused, DNS errors, unexpected HTTP
 * status codes (4xx/5xx), and other transport‑level issues.
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   await client.renderReport(options)
 * } catch (err) {
 *   if (err instanceof NetworkError) {
 *     console.error(`Network error ${err.statusCode} on ${err.url}`)
 *   }
 * }
 * ```
 */
export class NetworkError extends ApigsError {
	/**
	 * HTTP status code if the error originated from an HTTP response.
	 */
	public readonly statusCode?: number | undefined

	/**
	 * The URL that was requested when the error occurred.
	 */
	public readonly url?: string | undefined

	/**
	 * Creates a new network error.
	 *
	 * @param message - Description of the network failure.
	 * @param options - Optional details.
	 * @param options.statusCode - HTTP status code (if applicable).
	 * @param options.url - Request URL.
	 * @param options.context - Additional metadata.
	 * @param options.cause - Underlying error (e.g., AxiosError).
	 */
	constructor(
		message: string,
		options?: {
			statusCode?: number | undefined
			url?: string | undefined
			context?: Record<string, unknown> | undefined
			cause?: unknown
		},
	) {
		super(`[NETWORK] ${message}`, options)
		this.statusCode = options?.statusCode
		this.url = options?.url
	}

	/**
	 * Extends the base `toJSON()` with `statusCode` and `url`.
	 *
	 * @returns Serializable error object including network details.
	 */
	toJSON(): Record<string, unknown> {
		return {
			...super.toJSON(),
			statusCode: this.statusCode,
			url: this.url,
		}
	}
}

/**
 * Error thrown when input validation fails.
 *
 * This occurs when a method receives invalid arguments – for example,
 * missing required fields, incorrect URL format, or unsupported report formats.
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   new ApigsReportClient({})
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error(`Field '${err.field}' is invalid: ${err.message}`)
 *   }
 * }
 * ```
 */
export class ValidationError extends ApigsError {
	/**
	 * Name of the field that failed validation.
	 */
	public readonly field: string

	/**
	 * The value that was provided (or `undefined` if missing).
	 */
	public readonly value: unknown

	/**
	 * Creates a new validation error.
	 *
	 * @param field - Name of the invalid field.
	 * @param value - The problematic value.
	 * @param message - Specific validation message.
	 * @param options - Additional context.
	 */
	constructor(
		field: string,
		value: unknown,
		message: string,
		options?: { context?: Record<string, unknown> | undefined },
	) {
		super(`[VALIDATION] ${field}: ${message}`, {
			...options,
			context: { ...options?.context, field, value },
		})
		this.field = field
		this.value = value
	}
}

/**
 * Error thrown when cryptographic operations fail.
 *
 * This includes issues with the master key (missing, corrupted, wrong length),
 * decryption failures (tampered data, incorrect key), or encryption errors.
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   const decrypted = decrypt(encryptedHex)
 * } catch (err) {
 *   if (err instanceof CryptoError) {
 *     console.error('Crypto operation failed:', err.message)
 *   }
 * }
 * ```
 */
export class CryptoError extends ApigsError {
	/**
	 * Creates a new cryptographic error.
	 *
	 * @param message - Description of the crypto failure.
	 * @param options - Additional context or cause.
	 */
	constructor(
		message: string,
		options?: { context?: Record<string, unknown> | undefined; cause?: unknown },
	) {
		super(`[CRYPTO] ${message}`, options)
	}
}

/**
 * Type guard to check whether an unknown error is an `ApigsError`.
 *
 * This function checks both the prototype chain (`instanceof`) and the presence
 * of the `isApigsError` marker property, making it reliable even when errors
 * cross module boundaries (e.g., different copies of the library).
 *
 * @param error - The value to test.
 * @returns `true` if the value is an `ApigsError` or a compatible object.
 *
 * @example
 * ```typescript
 * try {
 *   // ...
 * } catch (err) {
 *   if (isApigsError(err)) {
 *     console.error('Library error:', err.toJSON())
 *   } else {
 *     console.error('Unknown error:', err)
 *   }
 * }
 * ```
 */
export function isApigsError(error: unknown): error is ApigsError {
	return (
		error instanceof ApigsError ||
		(typeof error === 'object' && error !== null && 'isApigsError' in error)
	)
}

/**
 * Error thrown when exporting a report to a file fails.
 *
 * This includes file system errors (permission denied, disk full), invalid
 * output paths (path traversal attempts), or file already exists (when using
 * safe write mode).
 *
 * @public
 *
 * @example
 * ```typescript
 * try {
 *   await client.exportReport({ outputPath: '/etc/passwd' })
 * } catch (err) {
 *   if (err instanceof ExportError) {
 *     console.error('Export failed:', err.message)
 *   }
 * }
 * ```
 */
export class ExportError extends ApigsError {
	/**
	 * Creates a new export error.
	 *
	 * @param message - Description of the export failure.
	 * @param options - Additional context or cause.
	 */
	constructor(message: string, options?: { context?: Record<string, unknown>; cause?: unknown }) {
		super(`[EXPORT] ${message}`, options)
	}
}
