[ApIgsReport Library](../globals.md) / ApigsReportConfig

# Interface: ApigsReportConfig

Defined in: [lib.ts:51](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L51)

Configuration options for the `ApigsReportClient`.

All fields except `domain`, `timeout`, `retryAttempts`, and `logLevel` are required.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [lib.ts:53](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L53)

Base URL of the SSRS server (e.g., `https://reportserver.company.com`)

---

### username

> **username**: `string`

Defined in: [lib.ts:56](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L56)

NTLM username (may include domain, e.g., `CORP\\john.doe`)

---

### password

> **password**: `string`

Defined in: [lib.ts:59](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L59)

NTLM password

---

### domain?

> `optional` **domain?**: `string`

Defined in: [lib.ts:62](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L62)

Optional domain (overrides domain part in `username`)

---

### timeout?

> `optional` **timeout?**: `number`

Defined in: [lib.ts:65](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L65)

Request timeout in milliseconds (default: `30000`)

---

### retryAttempts?

> `optional` **retryAttempts?**: `number`

Defined in: [lib.ts:68](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L68)

Number of retry attempts for transient network errors (default: `3`)

---

### logLevel?

> `optional` **logLevel?**: `"silent"` \| `"error"` \| `"warn"` \| `"info"` \| `"debug"` \| `"trace"` \| `"verbose"`

Defined in: [lib.ts:71](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L71)

Logging verbosity level (default: `'info'`)
