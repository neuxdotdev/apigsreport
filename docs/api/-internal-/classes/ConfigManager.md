[ApIgsReport Library](../../globals.md) / [\<internal\>](../index.md) / ConfigManager

# Class: ConfigManager

Defined in: [handler/config.ts:131](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L131)

Manages loading, saving, and accessing encrypted SSRS configuration.

The `ConfigManager` is a singleton that handles the secure storage of
SSRS credentials and settings. It encrypts sensitive data using AES‑256‑GCM
and stores the configuration file at `~/.apigsreportrc` with restricted
permissions (`0600`). A master key is automatically generated and stored at
`~/.config/apigsreport/.master_key`.

**Features:**

- Encrypted storage for passwords
- Integrity verification via SHA‑256 hash
- Fallback to environment variables in development
- Production mode that **requires** an existing config file
- Secure clearing of configuration (overwrites file before deletion)

## Example

```typescript
import { configManager } from 'apigsreport'

// Save configuration
await configManager.save({
	SSRS_BASE_URL: 'https://reportserver.company.com',
	SSRS_USERNAME: 'john.doe',
	SSRS_PASSWORD: 'secret123',
	SSRS_DOMAIN: 'CORP',
	REQUEST_TIMEOUT: 60000,
	RETRY_ATTEMPTS: 5,
	LOG_LEVEL: 'debug',
})

// Load configuration with environment fallback
const config = await configManager.getWithFallback()
console.log(config.SSRS_BASE_URL)

// Clear configuration securely
await configManager.clear()
```

## Methods

### getInstance()

> `static` **getInstance**(): `ConfigManager`

Defined in: [handler/config.ts:158](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L158)

Returns the singleton instance of `ConfigManager`.

#### Returns

`ConfigManager`

The global `ConfigManager` instance.

#### Example

```typescript
const manager = ConfigManager.getInstance()
```

---

### exists()

> **exists**(): `boolean`

Defined in: [handler/config.ts:177](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L177)

Checks whether the configuration file exists on disk.

#### Returns

`boolean`

`true` if `~/.apigsreportrc` exists, otherwise `false`.

#### Example

```typescript
if (configManager.exists()) {
	console.log('Config file found')
}
```

---

### load()

> **load**(): `Promise`\<\{ `SSRS_BASE_URL`: `string`; `SSRS_USERNAME`: `string`; `SSRS_PASSWORD`: `string`; `SSRS_DOMAIN?`: `string`; `REQUEST_TIMEOUT`: `number`; `RETRY_ATTEMPTS`: `number`; `LOG_LEVEL`: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`; \}\>

Defined in: [handler/config.ts:212](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L212)

Loads and decrypts the configuration file from disk.

This method reads the encrypted JSON file, validates its structure,
decrypts the password, verifies its integrity using SHA‑256, and returns
a fully resolved `ConfigFile` object.

**Note:** The file must already exist – otherwise a `ConfigError` is thrown.
For production‑safe loading with environment fallback, use `getWithFallback()`.

#### Returns

`Promise`\<\{ `SSRS_BASE_URL`: `string`; `SSRS_USERNAME`: `string`; `SSRS_PASSWORD`: `string`; `SSRS_DOMAIN?`: `string`; `REQUEST_TIMEOUT`: `number`; `RETRY_ATTEMPTS`: `number`; `LOG_LEVEL`: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`; \}\>

Resolved configuration object with decrypted password.

#### Throws

If the configuration file does not exist, is malformed,
or fails schema validation.

#### Throws

If password decryption or integrity verification fails.

#### Example

```typescript
try {
	const config = await configManager.load()
	console.log(`Loaded config for ${config.SSRS_USERNAME}`)
} catch (error) {
	console.error('Failed to load config', error)
}
```

---

### save()

> **save**(`config`, `options?`): `Promise`\<`void`\>

Defined in: [handler/config.ts:306](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L306)

Encrypts and writes configuration to the file system.

The method validates the input configuration, encrypts the password using
AES‑256‑GCM, computes an integrity hash, and stores the data in
`~/.apigsreportrc`. File permissions are set to `0o600` (read/write for
owner only) by default.

If the master key does not exist, it will be automatically generated
(by the underlying `crypto.encrypt()` function).

#### Parameters

##### config

Configuration object to save. All fields except password are stored in plaintext.

###### SSRS_BASE_URL

`string` = `...`

###### SSRS_USERNAME

`string` = `...`

###### SSRS_PASSWORD

`string` = `...`

###### SSRS_DOMAIN?

`string` = `...`

###### REQUEST_TIMEOUT

`number` = `...`

###### RETRY_ATTEMPTS

`number` = `...`

###### LOG_LEVEL

`"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"` = `...`

##### options?

Optional settings.

###### mode?

`number`

File permissions as an octal number (default: `0o600`).

#### Returns

`Promise`\<`void`\>

#### Throws

If validation fails or writing to disk fails.

#### Throws

If encryption fails.

#### Example

```typescript
await configManager.save({
	SSRS_BASE_URL: 'https://ssrs.example.com',
	SSRS_USERNAME: 'api_user',
	SSRS_PASSWORD: 'very_secret',
	LOG_LEVEL: 'debug',
})
```

---

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [handler/config.ts:380](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L380)

Securely deletes the configuration file.

This method overwrites the file content with zeros before unlinking it,
preventing recovery of sensitive data from disk. If the file does not exist,
the method returns silently.

After clearing, the in‑memory cached configuration is also reset.

#### Returns

`Promise`\<`void`\>

#### Throws

If the deletion or overwrite operation fails.

#### Example

```typescript
await configManager.clear()
console.log('Configuration removed securely')
```

---

### getWithFallback()

> **getWithFallback**(): `Promise`\<\{ `SSRS_BASE_URL`: `string`; `SSRS_USERNAME`: `string`; `SSRS_PASSWORD`: `string`; `SSRS_DOMAIN?`: `string`; `REQUEST_TIMEOUT`: `number`; `RETRY_ATTEMPTS`: `number`; `LOG_LEVEL`: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`; \}\>

Defined in: [handler/config.ts:424](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L424)

Retrieves configuration using intelligent fallback based on `NODE_ENV`.

**Production mode** (`NODE_ENV === 'production'`):

- **Requires** an existing encrypted config file.
- Environment variables are ignored.

**Development mode** (default):

- If config file exists, it is loaded.
- Otherwise, environment variables are used (with default timeouts/retries).

This method is the recommended way to obtain configuration in most applications.

#### Returns

`Promise`\<\{ `SSRS_BASE_URL`: `string`; `SSRS_USERNAME`: `string`; `SSRS_PASSWORD`: `string`; `SSRS_DOMAIN?`: `string`; `REQUEST_TIMEOUT`: `number`; `RETRY_ATTEMPTS`: `number`; `LOG_LEVEL`: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`; \}\>

A fully resolved `ConfigFile` object.

#### Throws

In production if no config file exists, or if
environment variables are incomplete in development fallback.

#### Example

```typescript
// In production: uses encrypted file
// In development: uses file if present, else env vars
const config = await configManager.getWithFallback()
```

---

### getNtlmCredentials()

> **getNtlmCredentials**(): \{ `username`: `string`; `password`: `string`; `baseUrl`: `string`; \} \| `null`

Defined in: [handler/config.ts:479](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L479)

Returns NTLM credentials from the currently loaded configuration.

This method combines domain and username into the standard `DOMAIN\username`
format expected by NTLM authentication. If no configuration has been loaded
(via `load()` or `getWithFallback()`), it returns `null`.

#### Returns

\{ `username`: `string`; `password`: `string`; `baseUrl`: `string`; \} \| `null`

An object containing `username`, `password`, and `baseUrl`, or `null`
if no configuration is loaded.

#### Example

```typescript
const creds = configManager.getNtlmCredentials()
if (creds) {
	console.log(`Authenticating as ${creds.username}`)
}
```

---

### getPath()

> **getPath**(): `string`

Defined in: [handler/config.ts:507](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L507)

Returns the full filesystem path to the configuration file.

#### Returns

`string`

The path (usually `~/.apigsreportrc`).

#### Example

```typescript
console.log(`Config file location: ${configManager.getPath()}`)
```

---

### reset()

> **reset**(): `void`

Defined in: [handler/config.ts:523](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/config.ts#L523)

Resets the in‑memory cached configuration.

This method clears the loaded configuration from memory without affecting
the on‑disk file. Useful for testing or forcing a reload.

#### Returns

`void`

#### Example

```typescript
configManager.reset()
// Next call to load() will read from disk again
```
