[ApIgsReport Library](../globals.md) / LogLevel

# Type Alias: LogLevel

> **LogLevel** = `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`

Defined in: [handler/logger.ts:30](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/logger.ts#L30)

Available logging severity levels.

Higher priority levels (e.g., `error`) are always shown when the current
level is set to a lower priority (e.g., `info`). The order from lowest to
highest priority is: `silent`, `error`, `warn`, `info`, `debug`, `trace`,
`verbose`.
