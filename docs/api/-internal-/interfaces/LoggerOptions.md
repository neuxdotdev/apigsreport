[ApIgsReport Library](../../globals.md) / [\<internal\>](../index.md) / LoggerOptions

# Interface: LoggerOptions

Defined in: [handler/logger.ts:37](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L37)

Configuration options for the logger.

## Properties

### level?

> `optional` **level?**: [`LogLevel`](../../type-aliases/LogLevel.md)

Defined in: [handler/logger.ts:43](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L43)

Minimum log level to output. Messages with lower priority are ignored.

#### Default Value

`'info'` in production, `'verbose'` in development

---

### prefix?

> `optional` **prefix?**: `string`

Defined in: [handler/logger.ts:50](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L50)

Prefix string prepended to every log message.

#### Default Value

`'[APiGS]'`

---

### timestamp?

> `optional` **timestamp?**: `boolean`

Defined in: [handler/logger.ts:57](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L57)

Whether to include an ISO timestamp at the beginning of each log line.

#### Default Value

`true`

---

### colors?

> `optional` **colors?**: `boolean`

Defined in: [handler/logger.ts:64](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L64)

Whether to use ANSI color codes in terminal output.

#### Default Value

`true`

---

### showStack?

> `optional` **showStack?**: `boolean`

Defined in: [handler/logger.ts:71](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L71)

Whether to include stack traces when logging errors.

#### Default Value

`true` in development, `false` otherwise
