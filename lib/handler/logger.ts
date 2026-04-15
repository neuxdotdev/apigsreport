/**
 * @fileoverview Structured logging system for the APIGS Report Library.
 *
 * This module provides a flexible, colored, and context‑aware logger with
 * configurable log levels, timestamps, and pretty‑printed metadata. It is
 * designed for both development (verbose, colorful output) and production
 * (controlled, JSON‑friendly) environments.
 *
 * The logger is a singleton – use `logger` directly after importing. It
 * automatically adapts to `NODE_ENV` and can be reconfigured at runtime.
 *
 * @module handler/logger
 * @since 1.0.0
 * @see {@link https://github.com/neuxdotdev/apigsreport | Repository}
 */

import { inspect } from 'node:util'
import { ApigsError } from './error.js'

/**
 * Available logging severity levels.
 *
 * Higher priority levels (e.g., `error`) are always shown when the current
 * level is set to a lower priority (e.g., `info`). The order from lowest to
 * highest priority is: `silent`, `error`, `warn`, `info`, `debug`, `trace`,
 * `verbose`.
 *
 * @public
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'verbose'

/**
 * Configuration options for the logger.
 *
 * @public
 */
export interface LoggerOptions {
	/**
	 * Minimum log level to output. Messages with lower priority are ignored.
	 *
	 * @defaultValue `'info'` in production, `'verbose'` in development
	 */
	level?: LogLevel

	/**
	 * Prefix string prepended to every log message.
	 *
	 * @defaultValue `'[APiGS]'`
	 */
	prefix?: string

	/**
	 * Whether to include an ISO timestamp at the beginning of each log line.
	 *
	 * @defaultValue `true`
	 */
	timestamp?: boolean

	/**
	 * Whether to use ANSI color codes in terminal output.
	 *
	 * @defaultValue `true`
	 */
	colors?: boolean

	/**
	 * Whether to include stack traces when logging errors.
	 *
	 * @defaultValue `true` in development, `false` otherwise
	 */
	showStack?: boolean
}

/**
 * ANSI color codes for terminal output.
 *
 * @internal
 */
const COLOR_CODES: Record<string, string> = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	dimmed: '\x1b[2m',
	white: '\x1b[37m',
	bold: '\x1b[1m',
	reset: '\x1b[0m',
}

/**
 * Wraps a string with ANSI color codes if colors are enabled.
 *
 * @param text - The text to color.
 * @param color - The color name from `COLOR_CODES`.
 * @returns The colored string (or plain if colors disabled).
 *
 * @internal
 */
function applyColor(text: string, color: keyof typeof COLOR_CODES): string {
	return `${COLOR_CODES[color]}${text}${COLOR_CODES['reset']}`
}

/**
 * Central logging class for the APIGS Report Library.
 *
 * `Logger` is a singleton that provides structured logging with levels,
 * colors, timestamps, and automatic metadata formatting. It includes
 * convenience methods for common scenarios like authentication success/failure,
 * HTTP request tracing, and performance timing.
 *
 * **Usage:**
 * ```typescript
 * import { logger } from 'apigsreport'
 *
 * logger.info('Server started', { port: 3000 })
 * logger.error('Failed to connect', new Error('timeout'))
 *
 * const end = logger.time('db-query')
 * // ... perform query
 * end() // logs duration
 * ```
 *
 * @public
 */
export class Logger {
	private static instance: Logger
	private level: LogLevel
	private prefix: string
	private timestamp: boolean
	private colors: boolean
	private showStack: boolean

	/**
	 * Priority mapping for log levels (higher number = more verbose).
	 *
	 * @internal
	 */
	private readonly levelPriority: Record<LogLevel, number> = {
		silent: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		trace: 5,
		verbose: 6,
	}

	/**
	 * Private constructor – use `getInstance()` instead.
	 *
	 * @param options - Initial configuration (merged with environment defaults).
	 *
	 * @internal
	 */
	private constructor(options: LoggerOptions = {}) {
		this.level = options.level ?? (process.env.NODE_ENV === 'production' ? 'info' : 'verbose')
		this.prefix = options.prefix ?? '[APiGS]'
		this.timestamp = options.timestamp ?? true
		this.colors = options.colors ?? true
		this.showStack = options.showStack ?? process.env.NODE_ENV === 'development'
	}

	/**
	 * Returns the singleton logger instance.
	 *
	 * If the instance does not exist, it is created with the provided options.
	 * If options are supplied after the instance exists, they are applied via
	 * `configure()`.
	 *
	 * @param options - Optional configuration (applies to existing instance as well).
	 * @returns The global logger instance.
	 *
	 * @example
	 * ```typescript
	 * const log = Logger.getInstance({ level: 'debug' })
	 * ```
	 */
	static getInstance(options?: LoggerOptions): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(options)
		}
		if (options) {
			Logger.instance.configure(options)
		}
		return Logger.instance
	}

	/**
	 * Reconfigures the logger at runtime.
	 *
	 * @param options - Partial configuration options. Only provided fields are updated.
	 *
	 * @example
	 * ```typescript
	 * logger.configure({ level: 'trace', colors: false })
	 * ```
	 */
	configure(options: LoggerOptions): void {
		if (options.level !== undefined) this.level = options.level
		if (options.prefix !== undefined) this.prefix = options.prefix
		if (options.timestamp !== undefined) this.timestamp = options.timestamp
		if (options.colors !== undefined) this.colors = options.colors
		if (options.showStack !== undefined) this.showStack = options.showStack
	}

	/**
	 * Determines whether a log message of a given level should be output.
	 *
	 * @param level - The level of the message being considered.
	 * @returns `true` if the message's priority is ≤ the current configured level.
	 *
	 * @internal
	 */
	private shouldLog(level: LogLevel): boolean {
		return this.levelPriority[level] <= this.levelPriority[this.level]
	}

	/**
	 * Formats a log message with timestamp, prefix, level, and metadata.
	 *
	 * @param level - Log level of the message.
	 * @param message - Primary log text.
	 * @param meta - Optional structured metadata (pretty‑printed).
	 * @returns The fully formatted string ready for output.
	 *
	 * @internal
	 */
	private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
		const parts: string[] = []
		if (this.timestamp) {
			parts.push(applyColor(new Date().toISOString(), 'cyan'))
		}
		parts.push(applyColor(this.prefix, 'white'))
		parts.push(applyColor(`[${level.toUpperCase()}]`, 'bold'))
		if (meta && Object.keys(meta).length > 0) {
			parts.push(message)
			parts.push(applyColor(this.prettyMeta(meta), 'dimmed'))
		} else {
			parts.push(message)
		}
		return parts.join(' ')
	}

	/**
	 * Pretty‑prints metadata using Node.js `util.inspect()`.
	 *
	 * @param meta - Object to format.
	 * @returns Indented, colored string representation.
	 *
	 * @internal
	 */
	private prettyMeta(meta: Record<string, unknown>): string {
		return inspect(meta, {
			colors: this.colors,
			depth: 4,
			compact: false,
			breakLength: 80,
		})
	}

	/**
	 * Outputs a formatted log message to the appropriate console stream.
	 *
	 * @param level - Log level (affects stream: `error` → stderr, others → stdout).
	 * @param message - Primary message.
	 * @param meta - Optional metadata.
	 *
	 * @internal
	 */
	private print(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
		if (!this.shouldLog(level)) return
		const output = this.format(level, message, meta)
		switch (level) {
			case 'error':
				console.error(applyColor(output, 'red'))
				break
			case 'warn':
				console.warn(applyColor(output, 'yellow'))
				break
			default:
				console.log(output)
		}
	}

	/**
	 * Logs an error message with optional error object and metadata.
	 *
	 * If the error is an `ApigsError`, its `toJSON()` representation is merged
	 * into the metadata. Stack traces are included if `showStack` is `true`.
	 *
	 * @param message - Error description.
	 * @param error - Optional error object (standard Error or ApigsError).
	 * @param meta - Additional context.
	 *
	 * @example
	 * ```typescript
	 * try { ... } catch (err) {
	 *   logger.error('API call failed', err, { endpoint: '/reports' })
	 * }
	 * ```
	 */
	error(message: string, error?: Error | ApigsError, meta?: Record<string, unknown>): void {
		const errorMeta = {
			...meta,
			name: error?.name,
			message: error?.message,
			stack: this.showStack ? error?.stack : undefined,
			...(error instanceof ApigsError ? error.toJSON() : {}),
		}
		this.print('error', message, errorMeta)
	}

	/**
	 * Logs a warning message.
	 *
	 * @param message - Warning description.
	 * @param meta - Optional metadata.
	 */
	warn(message: string, meta?: Record<string, unknown>): void {
		this.print('warn', message, meta)
	}

	/**
	 * Logs an informational message.
	 *
	 * @param message - Info description.
	 * @param meta - Optional metadata.
	 */
	info(message: string, meta?: Record<string, unknown>): void {
		this.print('info', message, meta)
	}

	/**
	 * Logs a debug message (lower priority than `info`).
	 *
	 * @param message - Debug description.
	 * @param meta - Optional metadata.
	 */
	debug(message: string, meta?: Record<string, unknown>): void {
		this.print('debug', message, meta)
	}

	/**
	 * Logs a trace message (more detailed than `debug`).
	 *
	 * @param message - Trace description.
	 * @param meta - Optional metadata.
	 */
	trace(message: string, meta?: Record<string, unknown>): void {
		this.print('trace', message, meta)
	}

	/**
	 * Logs a verbose message (most detailed level).
	 *
	 * @param message - Verbose description.
	 * @param meta - Optional metadata.
	 */
	verbose(message: string, meta?: Record<string, unknown>): void {
		this.print('verbose', message, meta)
	}

	/**
	 * Logs a successful authentication event.
	 *
	 * @param username - Username that authenticated.
	 * @param endpoint - Target SSRS endpoint.
	 * @param duration - Request duration in milliseconds.
	 */
	authSuccess(username: string, endpoint: string, duration: number): void {
		this.info('✓ Authentication successful', {
			user: username,
			endpoint,
			duration: `${duration}ms`,
		})
	}

	/**
	 * Logs a failed authentication attempt.
	 *
	 * @param username - Username that failed.
	 * @param endpoint - Target SSRS endpoint.
	 * @param errorCode - Programmatic error code.
	 * @param error - The original error object.
	 */
	authFailure(username: string, endpoint: string, errorCode: string, error: Error): void {
		this.error('✗ Authentication failed', error, {
			user: username,
			endpoint,
			errorCode,
		})
	}

	/**
	 * Logs that configuration has been loaded from a source.
	 *
	 * @param source - Where the configuration came from (`'env'`, `'file'`, or `'default'`).
	 * @param path - Optional file path if source is `'file'`.
	 */
	configLoaded(source: 'env' | 'file' | 'default', path?: string): void {
		this.debug('Configuration loaded', { source, path })
	}

	/**
	 * Logs validation of a single configuration field (trace level).
	 *
	 * @param field - Field name.
	 * @param value - Value being validated.
	 * @param valid - Whether validation passed.
	 */
	configValidation(field: string, value: unknown, valid: boolean): void {
		this.trace('Config field validation', { field, value, valid })
	}

	/**
	 * Logs an outgoing HTTP request (trace level).
	 *
	 * The request body is automatically redacted (set to `'[REDACTED]'`) to avoid
	 * logging sensitive data.
	 *
	 * @param method - HTTP method (GET, POST, etc.).
	 * @param url - Full request URL.
	 * @param headers - Request headers (optional).
	 * @param body - Request body (optional, will be redacted).
	 */
	httpTrace(method: string, url: string, headers?: Record<string, string>, body?: unknown): void {
		this.trace('HTTP Request', { method, url, headers, body: body ? '[REDACTED]' : undefined })
	}

	/**
	 * Logs an HTTP response (trace level).
	 *
	 * @param status - HTTP status code.
	 * @param url - Request URL.
	 * @param duration - Request duration in milliseconds.
	 * @param size - Response body size in bytes (optional, will be converted to KB).
	 */
	httpResponse(status: number, url: string, duration: number, size?: number): void {
		this.trace('HTTP Response', {
			status,
			statusText: this.getStatusText(status),
			url,
			duration: `${duration}ms`,
			size: size ? `${Math.round(size / 1024)}KB` : undefined,
		})
	}

	/**
	 * Returns a human‑readable status text for common HTTP status codes.
	 *
	 * @param status - HTTP status code.
	 * @returns Short description (e.g., `'OK'` for 200).
	 *
	 * @internal
	 */
	private getStatusText(status: number): string {
		const texts: Record<number, string> = {
			200: 'OK',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			500: 'Server Error',
			502: 'Bad Gateway',
			503: 'Service Unavailable',
		}
		return texts[status] ?? 'Unknown'
	}

	/**
	 * Groups log messages under a collapsible heading (when supported by the console).
	 *
	 * If the current log level is below `'debug'`, the callback is executed
	 * without grouping.
	 *
	 * @param label - Group heading.
	 * @param callback - Function that contains the logs to be grouped.
	 *
	 * @example
	 * ```typescript
	 * logger.group('Request details', () => {
	 *   logger.debug('Method: GET')
	 *   logger.debug('URL: /api/report')
	 * })
	 * ```
	 */
	group(label: string, callback: () => void): void {
		if (this.shouldLog('debug')) {
			console.group?.(this.format('debug', `→ ${label}`))
			callback()
			console.groupEnd?.()
		} else {
			callback()
		}
	}

	/**
	 * Creates a performance timer that logs its duration when finished.
	 *
	 * @param label - Identifier for the timer (appears in log messages).
	 * @returns A function that, when called, ends the timer and logs the duration.
	 *
	 * @example
	 * ```typescript
	 * const done = logger.time('db-query')
	 * const result = await db.query(sql)
	 * done() // logs: Timer completed { label: 'db-query', duration: '123.45ms' }
	 * ```
	 */
	time(label: string): () => void {
		const start = performance.now()
		this.trace('Timer started', { label })
		return () => {
			const duration = performance.now() - start
			this.trace('Timer completed', { label, duration: `${duration.toFixed(2)}ms` })
		}
	}
}

/**
 * Pre‑configured singleton logger instance.
 *
 * This is the main entry point for logging in the library. It is ready to use
 * immediately after import.
 *
 * @public
 */
export const logger = Logger.getInstance()
