[ApIgsReport Library](../globals.md) / Logger

# Interface: Logger

Defined in: [handler/logger.ts:126](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L126)

Central logging class for the APIGS Report Library.

`Logger` is a singleton that provides structured logging with levels,
colors, timestamps, and automatic metadata formatting. It includes
convenience methods for common scenarios like authentication success/failure,
HTTP request tracing, and performance timing.

**Usage:**

```typescript
import { logger } from 'apigsreport'

logger.info('Server started', { port: 3000 })
logger.error('Failed to connect', new Error('timeout'))

const end = logger.time('db-query')
// ... perform query
end() // logs duration
```

## Methods

### configure()

> **configure**(`options`): `void`

Defined in: [handler/logger.ts:199](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L199)

Reconfigures the logger at runtime.

#### Parameters

##### options

[`LoggerOptions`](../-internal-/interfaces/LoggerOptions.md)

Partial configuration options. Only provided fields are updated.

#### Returns

`void`

#### Example

```typescript
logger.configure({ level: 'trace', colors: false })
```

---

### error()

> **error**(`message`, `error?`, `meta?`): `void`

Defined in: [handler/logger.ts:303](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L303)

Logs an error message with optional error object and metadata.

If the error is an `ApigsError`, its `toJSON()` representation is merged
into the metadata. Stack traces are included if `showStack` is `true`.

#### Parameters

##### message

`string`

Error description.

##### error?

[`ApigsError`](../classes/ApigsError.md) \| `Error`

Optional error object (standard Error or ApigsError).

##### meta?

`Record`\<`string`, `unknown`\>

Additional context.

#### Returns

`void`

#### Example

```typescript
try { ... } catch (err) {
  logger.error('API call failed', err, { endpoint: '/reports' })
}
```

---

### warn()

> **warn**(`message`, `meta?`): `void`

Defined in: [handler/logger.ts:320](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L320)

Logs a warning message.

#### Parameters

##### message

`string`

Warning description.

##### meta?

`Record`\<`string`, `unknown`\>

Optional metadata.

#### Returns

`void`

---

### info()

> **info**(`message`, `meta?`): `void`

Defined in: [handler/logger.ts:330](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L330)

Logs an informational message.

#### Parameters

##### message

`string`

Info description.

##### meta?

`Record`\<`string`, `unknown`\>

Optional metadata.

#### Returns

`void`

---

### debug()

> **debug**(`message`, `meta?`): `void`

Defined in: [handler/logger.ts:340](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L340)

Logs a debug message (lower priority than `info`).

#### Parameters

##### message

`string`

Debug description.

##### meta?

`Record`\<`string`, `unknown`\>

Optional metadata.

#### Returns

`void`

---

### trace()

> **trace**(`message`, `meta?`): `void`

Defined in: [handler/logger.ts:350](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L350)

Logs a trace message (more detailed than `debug`).

#### Parameters

##### message

`string`

Trace description.

##### meta?

`Record`\<`string`, `unknown`\>

Optional metadata.

#### Returns

`void`

---

### verbose()

> **verbose**(`message`, `meta?`): `void`

Defined in: [handler/logger.ts:360](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L360)

Logs a verbose message (most detailed level).

#### Parameters

##### message

`string`

Verbose description.

##### meta?

`Record`\<`string`, `unknown`\>

Optional metadata.

#### Returns

`void`

---

### authSuccess()

> **authSuccess**(`username`, `endpoint`, `duration`): `void`

Defined in: [handler/logger.ts:371](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L371)

Logs a successful authentication event.

#### Parameters

##### username

`string`

Username that authenticated.

##### endpoint

`string`

Target SSRS endpoint.

##### duration

`number`

Request duration in milliseconds.

#### Returns

`void`

---

### authFailure()

> **authFailure**(`username`, `endpoint`, `errorCode`, `error`): `void`

Defined in: [handler/logger.ts:387](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L387)

Logs a failed authentication attempt.

#### Parameters

##### username

`string`

Username that failed.

##### endpoint

`string`

Target SSRS endpoint.

##### errorCode

`string`

Programmatic error code.

##### error

`Error`

The original error object.

#### Returns

`void`

---

### configLoaded()

> **configLoaded**(`source`, `path?`): `void`

Defined in: [handler/logger.ts:401](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L401)

Logs that configuration has been loaded from a source.

#### Parameters

##### source

`"env"` \| `"file"` \| `"default"`

Where the configuration came from (`'env'`, `'file'`, or `'default'`).

##### path?

`string`

Optional file path if source is `'file'`.

#### Returns

`void`

---

### configValidation()

> **configValidation**(`field`, `value`, `valid`): `void`

Defined in: [handler/logger.ts:412](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L412)

Logs validation of a single configuration field (trace level).

#### Parameters

##### field

`string`

Field name.

##### value

`unknown`

Value being validated.

##### valid

`boolean`

Whether validation passed.

#### Returns

`void`

---

### httpTrace()

> **httpTrace**(`method`, `url`, `headers?`, `body?`): `void`

Defined in: [handler/logger.ts:427](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L427)

Logs an outgoing HTTP request (trace level).

The request body is automatically redacted (set to `'[REDACTED]'`) to avoid
logging sensitive data.

#### Parameters

##### method

`string`

HTTP method (GET, POST, etc.).

##### url

`string`

Full request URL.

##### headers?

`Record`\<`string`, `string`\>

Request headers (optional).

##### body?

`unknown`

Request body (optional, will be redacted).

#### Returns

`void`

---

### httpResponse()

> **httpResponse**(`status`, `url`, `duration`, `size?`): `void`

Defined in: [handler/logger.ts:439](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L439)

Logs an HTTP response (trace level).

#### Parameters

##### status

`number`

HTTP status code.

##### url

`string`

Request URL.

##### duration

`number`

Request duration in milliseconds.

##### size?

`number`

Response body size in bytes (optional, will be converted to KB).

#### Returns

`void`

---

### group()

> **group**(`label`, `callback`): `void`

Defined in: [handler/logger.ts:487](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L487)

Groups log messages under a collapsible heading (when supported by the console).

If the current log level is below `'debug'`, the callback is executed
without grouping.

#### Parameters

##### label

`string`

Group heading.

##### callback

() => `void`

Function that contains the logs to be grouped.

#### Returns

`void`

#### Example

```typescript
logger.group('Request details', () => {
	logger.debug('Method: GET')
	logger.debug('URL: /api/report')
})
```

---

### time()

> **time**(`label`): () => `void`

Defined in: [handler/logger.ts:510](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L510)

Creates a performance timer that logs its duration when finished.

#### Parameters

##### label

`string`

Identifier for the timer (appears in log messages).

#### Returns

A function that, when called, ends the timer and logs the duration.

() => `void`

#### Example

```typescript
const done = logger.time('db-query')
const result = await db.query(sql)
done() // logs: Timer completed { label: 'db-query', duration: '123.45ms' }
```
