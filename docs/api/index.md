# apigsreport

> **Pure TypeScript library for SSRS (SQL Server Reporting Services) API automation with NTLM authentication — reliable, fully typed, and encryption‑aware.**

<p align="center">
  <a href="https://www.npmjs.com/package/apigsreport"><img src="https://img.shields.io/npm/v/apigsreport.svg?style=flat-square&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/apigsreport"><img src="https://img.shields.io/npm/dm/apigsreport?style=flat-square&logo=npm" alt="npm downloads"></a>
  <a href="https://github.com/neuxdotdev/apigsreport/blob/main/license"><img src="https://img.shields.io/github/license/neuxdotdev/apigsreport?style=flat-square" alt="license"></a>
  <a href="https://github.com/neuxdotdev/apigsreport/actions"><img src="https://img.shields.io/github/actions/workflow/status/neuxdotdev/apigsreport/build.yml?branch=main&style=flat-square&logo=github" alt="build"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6.0-blue?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3+-black?style=flat-square&logo=bun" alt="Bun"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-%3E%3D24-green?style=flat-square&logo=node.js" alt="Node"></a>
  <a href="https://prettier.io"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square&logo=prettier" alt="code style"></a>
  <a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs welcome"></a>
</p>

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Library API](#library-api)
    - [`ApigsReportClient`](#apigsreportclient)
    - [`renderReport` & `testAuth`](#renderreport-testauth)
    - [`SsrsApiClient`](#ssrsapiclient)
    - [`ConfigManager` & `EnvManager`](#configmanager-envmanager)
    - [`Logger`](#logger)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Encrypted Config File](#encrypted-config-file)
- [Logging & Debugging](#logging-debugging)
- [Development](#development)
    - [Project Structure](#project-structure)
    - [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
# Using Bun (recommended)
bun add apigsreport

# Using npm
npm install apigsreport
```

**Prerequisites:** Node.js >=24 or Bun >=1.3.

---

## Quick Start

### Simple report export

```typescript
import { ApigsReportClient } from 'apigsreport'

const client = new ApigsReportClient({
	baseUrl: 'https://reportserver.company.com',
	username: 'DOMAIN\\john.doe',
	password: 'secure123',
})

// Export a PDF report (default report path is /IGS/WV_Kartu_Piutang_Wabot)
const pdfBuffer = await client.exportReport({
	format: 'PDF',
	parameters: { AccountId: '12345' },
})

// Save to file
await client.exportReport({
	format: 'EXCELOPENXML',
	outputPath: './report.xlsx',
})
```

### Using low‑level API with custom report path

```typescript
import { renderReport, testAuth } from 'apigsreport'

const credentials = {
	baseUrl: 'https://reportserver.company.com',
	username: 'DOMAIN\\john.doe',
	password: 'secure123',
}

// Test authentication
const auth = await testAuth(credentials)
console.log(auth.success ? 'OK' : 'Failed')

// Render any report
const response = await renderReport(credentials, {
	reportPath: '/Sales/YearlySummary',
	format: 'PDF',
	parameters: { Year: 2025 },
})

console.log(`Got ${response.body.length} bytes, status ${response.statusCode}`)
```

---

## Library API

The library exports both a high‑level client and lower‑level functions.

### `ApigsReportClient`

Main client that bundles configuration validation, authentication, and report export.

```typescript
class ApigsReportClient {
	constructor(config: ApigsReportConfig)
	exportReport(options?: ExportReportOptions): Promise<Buffer>
	testAuth(): Promise<{ success: boolean; message: string }>
	destroy(): void
}
```

**`ApigsReportConfig`**:

| Field           | Type     | Default     | Description                          |
| --------------- | -------- | ----------- | ------------------------------------ |
| `baseUrl`       | `string` | required    | SSRS server root URL                 |
| `username`      | `string` | required    | NTLM username (can include domain)   |
| `password`      | `string` | required    | NTLM password                        |
| `domain`        | `string` | `undefined` | Optional domain (overrides username) |
| `timeout`       | `number` | `30000`     | Request timeout (ms)                 |
| `retryAttempts` | `number` | `3`         | Number of retries on network errors  |
| `logLevel`      | `string` | `'info'`    | One of `'silent'`, `'error'`, …      |

**`ExportReportOptions`**:

| Field        | Type                                                     | Default | Description                   |
| ------------ | -------------------------------------------------------- | ------- | ----------------------------- |
| `format`     | `'PDF' \| 'EXCELOPENXML' \| 'CSV' \| 'XML' \| 'HTML4.0'` | `'PDF'` | Output format                 |
| `parameters` | `Record<string, string \| number \| boolean>`            | `{}`    | Report parameters             |
| `outputPath` | `string`                                                 | –       | If given, writes file to disk |

> **Note:** The default report path is hardcoded to `/IGS/WV_Kartu_Piutang_Wabot`. For other reports use the low‑level `renderReport` function.

### `renderReport` & `testAuth`

Standalone functions for one‑off requests.

```typescript
function renderReport(credentials: NtlmCredentials, options: RenderOptions): Promise<SsrsResponse>

function testAuth(credentials: NtlmCredentials): Promise<{ success: boolean; message: string }>
```

**`NtlmCredentials`**:

```typescript
interface NtlmCredentials {
	baseUrl: string
	username: string
	password: string
	domain?: string
	workstation?: string
}
```

**`RenderOptions`**:

```typescript
interface RenderOptions {
	reportPath: string
	format: ReportFormat
	parameters?: Record<string, string | number | boolean>
	timeout?: number
}
```

**`SsrsResponse`**:

```typescript
interface SsrsResponse<T = Buffer> {
	statusCode: number
	headers: Record<string, string | string[]>
	body: T
	duration: number
	url: string
}
```

### `SsrsApiClient`

Low‑level HTTP client for SSRS that handles NTLM authentication, URL building, and error classification.

```typescript
class SsrsApiClient {
	constructor(credentials: NtlmCredentials, timeout?: number)
	renderReport(options: RenderOptions): Promise<SsrsResponse>
	testAuth(): Promise<{ success: boolean; message: string }>
}
```

### `ConfigManager` & `EnvManager`

Helpers for loading configuration from environment variables or an encrypted `.apigsreportrc` file.

```typescript
import { configManager, envManager } from 'apigsreport'

// Load from environment (development fallback)
const envConfig = envManager.load()

// Load from encrypted file (production)
const fileConfig = await configManager.getWithFallback()

// Save encrypted config
await configManager.save({
	SSRS_BASE_URL: 'https://...',
	SSRS_USERNAME: 'user',
	SSRS_PASSWORD: 'secret',
	// ...
})
```

### `Logger`

Built‑in logger with levels, timers, and structured output.

```typescript
import { logger } from 'apigsreport'

logger.info('Export started', { report: '/Sales' })
const end = logger.time('export')
// ... perform work
end() // logs duration
```

---

## Error Handling

All errors thrown by the library extend `ApigsError` and include:

- `timestamp` – ISO string
- `context` – additional debugging info
- `toJSON()` – serializable for logs

```typescript
import { isApigsError, AuthError, NetworkError } from 'apigsreport'

try {
	await client.exportReport()
} catch (err) {
	if (err instanceof AuthError) {
		console.error('Authentication failed:', err.errorCode)
	} else if (err instanceof NetworkError) {
		console.error(`HTTP ${err.statusCode} on ${err.url}`)
	} else if (isApigsError(err)) {
		console.error(err.toJSON())
	}
}
```

**Error types**:

| Class             | Code               | When                                                     |
| ----------------- | ------------------ | -------------------------------------------------------- |
| `ValidationError` | `VALIDATION_ERROR` | Invalid constructor arguments or missing fields          |
| `ConfigError`     | `CONFIG_ERROR`     | Missing / corrupted config file or environment variables |
| `AuthError`       | `AUTH_*`           | NTLM failure, invalid credentials, 401 response          |
| `NetworkError`    | `NETWORK_ERROR`    | Timeout, ECONNREFUSED, 404, 5xx, etc.                    |
| `CryptoError`     | `CRYPTO_ERROR`     | Master key or encryption/decryption failure              |
| `ExportError`     | `EXPORT_ERROR`     | File write errors, output path validation                |

---

## Configuration

### Environment Variables

Set these variables for quick development or when no config file exists:

| Variable          | Required | Description                       |
| ----------------- | -------- | --------------------------------- |
| `SSRS_BASE_URL`   | ✅       | e.g. `https://reportserver`       |
| `SSRS_USERNAME`   | ✅       | NTLM username (`DOMAIN\user`)     |
| `SSRS_PASSWORD`   | ✅       | NTLM password                     |
| `SSRS_DOMAIN`     | ❌       | Domain (optional, overrides)      |
| `REQUEST_TIMEOUT` | ❌       | milliseconds, default `30000`     |
| `RETRY_ATTEMPTS`  | ❌       | default `3`                       |
| `LOG_LEVEL`       | ❌       | default `'info'`                  |
| `NODE_ENV`        | ❌       | `'production'` forces config file |

### Encrypted Config File

In production, the library expects an encrypted JSON file at `~/.apigsreportrc`.  
The file is encrypted using AES‑256‑GCM with a master key stored at `~/.config/apigsreport/.master_key`.

**Creating the config file programmatically:**

```typescript
import { configManager } from 'apigsreport'

await configManager.save({
	SSRS_BASE_URL: 'https://ssrs.company.com',
	SSRS_USERNAME: 'john.doe',
	SSRS_PASSWORD: 'supersecret',
	SSRS_DOMAIN: 'CORP',
	REQUEST_TIMEOUT: 60000,
	RETRY_ATTEMPTS: 5,
	LOG_LEVEL: 'debug',
})
```

The file will be created with `0600` permissions.  
The master key is automatically generated the first time you encrypt data.

**Fallback behaviour:**

- If `NODE_ENV === 'production'` → config file must exist; environment variables are ignored.
- Otherwise (development) → try config file, fallback to environment variables.

---

## Logging & Debugging

Enable detailed logging by setting `LOG_LEVEL=trace` in your environment or via `logger.configure()`:

```typescript
import { logger } from 'apigsreport'

logger.configure({ level: 'trace', colors: true, timestamp: true })
```

The logger outputs:

- HTTP request/response traces (method, URL, status, duration)
- Authentication success/failure events
- Configuration loading details
- Encryption/decryption steps (without exposing secrets)

**Correlation IDs** are automatically generated for each request – they appear in debug logs to help trace issues.

---

## Development

```bash
git clone https://github.com/neuxdotdev/apigsreport.git
cd apigsreport
bun install

# Full rebuild (clean, typecheck, bundle, format)
bun run rebuild

# Run tests (Vitest)
bun run test

# Run tests with coverage
bun run test:coverage

# Build library only (CJS, ESM, types)
bun run build:lib:prod

# Generate API documentation
bun run docs:full
```

### Project Structure

```
.
├── lib/
│   ├── functions/          # SSRS API & NTLM client logic
│   │   ├── api/            # SsrsApiClient, renderReport, types
│   │   └── auth/           # AuthManager, NtlmHttpClient
│   ├── handler/            # Config, Env, Logger, custom Errors
│   ├── utils/              # crypto (AES‑256‑GCM, master key)
│   ├── lib.ts              # ApigsReportClient, createClient
│   └── index.ts            # Public exports
├── tests/                  # Vitest tests (unit + coverage)
├── build/                  # Output (CJS, ESM, .d.ts)
├── package.json
├── tsconfig.json
└── rollup.config.mjs
```

### Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `bun run clean`          | Remove `build/` and cache                |
| `bun run typecheck`      | Run `tsc --noEmit`                       |
| `bun run format`         | Format all files with Prettier           |
| `bun run build:lib:prod` | Bundle library for production (minified) |
| `bun run test`           | Run Vitest tests                         |
| `bun run test:coverage`  | Run tests with coverage report           |
| `bun run docs:full`      | Generate TypeDoc site and serve locally  |
| `bun run rebuild`        | Clean → build → format                   |
| `bun run version:patch`  | Bump patch version                       |
| `bun run release`        | Publish to npm (runs `prepublishOnly`)   |

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/your-feature`).
3. Commit changes using [Conventional Commits](https://www.conventionalcommits.org/).
4. Run `bun run rebuild` to ensure everything passes.
5. Push and open a Pull Request.

Please ensure your code passes type checking, formatting, and all tests.

---

## License

**MIT License** – see [LICENSE](_media/license) for details.

---

## Credits

- Built with [axios-ntlm](https://github.com/cedws/axios-ntlm) for NTLM authentication.
- Optimised for [Bun](https://bun.sh) runtime and Node.js.
- Inspired by the need for a robust, type‑safe SSRS client.

---

> **Repository**: https://github.com/neuxdotdev/apigsreport  
> **Issues**: https://github.com/neuxdotdev/apigsreport/issues  
> **npm**: https://www.npmjs.com/package/apigsreport  
> **Documentation**: https://neuxdotdev.github.io/apigsreport/
