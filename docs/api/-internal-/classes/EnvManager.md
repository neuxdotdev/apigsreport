[ApIgsReport Library](../../globals.md) / [\<internal\>](../index.md) / EnvManager

# Class: EnvManager

Defined in: [handler/env.ts:96](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L96)

Manages loading, caching, and accessing environment variables for SSRS configuration.

The `EnvManager` is a singleton that reads environment variables, validates them
against a strict schema, and provides convenient accessors. It automatically
caches the result so that subsequent calls are fast.

**Supported environment variables:**

- `SSRS_BASE_URL` – Base URL of the SSRS server (must be http:// or https://)
- `SSRS_USERNAME` – NTLM username (can include domain as `DOMAIN\user`)
- `SSRS_PASSWORD` – NTLM password
- `SSRS_DOMAIN` – Optional domain (overrides domain in username)
- `NODE_ENV` – Runtime environment (`development`, `production`, `test`)
- `LOG_LEVEL` – Logging verbosity level

**Usage example:**

```bash
export SSRS_BASE_URL="https://reportserver.company.com"
export SSRS_USERNAME="CORP\\john.doe"
export SSRS_PASSWORD="secret123"
export LOG_LEVEL="debug"
```

## Example

```typescript
import { envManager } from 'apigsreport'

// Load and validate environment variables
const env = envManager.load()
console.log(env.SSRS_BASE_URL) // "https://reportserver.company.com"

// Check if complete SSRS configuration is present
if (envManager.hasSSRSConfig()) {
	const creds = envManager.getNtlmCredentials()
	// creds.username = "CORP\\john.doe"
}

// Get sanitized config for logging (password redacted)
console.log(envManager.getSanitizedConfig())
```

## Methods

### getInstance()

> `static` **getInstance**(): `EnvManager`

Defined in: [handler/env.ts:118](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L118)

Returns the singleton instance of `EnvManager`.

#### Returns

`EnvManager`

The global `EnvManager` instance.

#### Example

```typescript
const manager = EnvManager.getInstance()
```

---

### load()

> **load**(`override?`): `object`

Defined in: [handler/env.ts:160](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L160)

Loads, validates, and caches environment variables.

This method reads environment variables (or an optional override object),
validates them using the `EnvSchema`, and stores the result in memory.
Subsequent calls without an override return the cached configuration.

**Validation rules:**

- `SSRS_BASE_URL` must be a valid HTTP/HTTPS URL.
- `SSRS_USERNAME` cannot be empty if provided.
- `SSRS_PASSWORD` cannot be empty if provided.
- `SSRS_DOMAIN` may only contain alphanumeric characters, dots, and hyphens.
- `NODE_ENV` defaults to `'development'`.
- `LOG_LEVEL` defaults to `'info'`.

#### Parameters

##### override?

`Record`\<`string`, `string` \| `undefined`\>

Optional object to use instead of `process.env`.
Useful for testing.

#### Returns

`object`

The validated and normalized configuration object.

##### SSRS_BASE_URL?

> `optional` **SSRS_BASE_URL?**: `string`

##### SSRS_USERNAME?

> `optional` **SSRS_USERNAME?**: `string`

##### SSRS_PASSWORD?

> `optional` **SSRS_PASSWORD?**: `string`

##### SSRS_DOMAIN?

> `optional` **SSRS_DOMAIN?**: `string`

##### NODE_ENV

> **NODE_ENV**: `"development"` \| `"production"` \| `"test"`

##### LOG_LEVEL

> **LOG_LEVEL**: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`

#### Throws

If any environment variable fails validation.

#### Example

```typescript
// Load from real environment
const config = envManager.load()

// Load from test override
const testConfig = envManager.load({
	SSRS_BASE_URL: 'https://test.example.com',
	SSRS_USERNAME: 'testuser',
	SSRS_PASSWORD: 'testpass',
})
```

---

### hasSSRSConfig()

> **hasSSRSConfig**(): `boolean`

Defined in: [handler/env.ts:220](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L220)

Checks whether a complete SSRS configuration is available in environment variables.

A complete configuration requires `SSRS_BASE_URL`, `SSRS_USERNAME`, and
`SSRS_PASSWORD` to be present and non‑empty. If the manager has not yet
loaded the configuration, it will automatically call `load()`.

#### Returns

`boolean`

`true` if all required SSRS variables are present, otherwise `false`.

#### Example

```typescript
if (envManager.hasSSRSConfig()) {
	// Proceed with report export using environment config
} else {
	console.warn('SSRS environment variables missing')
}
```

---

### getNtlmCredentials()

> **getNtlmCredentials**(): \{ `username`: `string`; `password`: `string`; \} \| `null`

Defined in: [handler/env.ts:248](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L248)

Returns NTLM credentials formatted for `axios-ntlm`.

This method combines `SSRS_DOMAIN` and `SSRS_USERNAME` into the standard
`DOMAIN\username` format. If the manager has not yet loaded the configuration,
it will automatically call `load()`.

#### Returns

\{ `username`: `string`; `password`: `string`; \} \| `null`

An object with `username` and `password`, or `null` if
`SSRS_USERNAME` or `SSRS_PASSWORD` are missing.

#### Example

```typescript
const creds = envManager.getNtlmCredentials()
if (creds) {
	// creds.username = "CORP\\john.doe"
	// creds.password = "secret123"
}
```

---

### getBaseUrl()

> **getBaseUrl**(): `string` \| `null`

Defined in: [handler/env.ts:280](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L280)

Returns the configured SSRS base URL, if any.

#### Returns

`string` \| `null`

The base URL string, or `null` if not set.

#### Example

```typescript
const baseUrl = envManager.getBaseUrl()
if (baseUrl) {
	console.log(`Connecting to ${baseUrl}`)
}
```

---

### reset()

> **reset**(): `void`

Defined in: [handler/env.ts:298](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L298)

Resets the internal cache, forcing the next call to `load()` to re‑read
environment variables.

This is primarily useful for testing scenarios where environment variables
change between test cases.

#### Returns

`void`

#### Example

```typescript
envManager.reset()
const freshConfig = envManager.load() // Re-reads process.env
```

---

### getSanitizedConfig()

> **getSanitizedConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [handler/env.ts:318](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/env.ts#L318)

Returns a sanitized copy of the configuration suitable for logging.

The returned object has the `SSRS_PASSWORD` field redacted (set to
`'[REDACTED]'`) to avoid leaking secrets in logs.

#### Returns

`Record`\<`string`, `unknown`\>

A copy of the configuration with the password hidden.

#### Example

```typescript
console.log('Current env config:', envManager.getSanitizedConfig())
// Output: { SSRS_BASE_URL: 'https://...', SSRS_USERNAME: 'john', SSRS_PASSWORD: '[REDACTED]', ... }
```
