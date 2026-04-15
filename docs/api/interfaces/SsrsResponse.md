[ApIgsReport Library](../globals.md) / SsrsResponse

# Interface: SsrsResponse\<T\>

Defined in: [functions/api/types.ts:169](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L169)

Standardised response structure from an SSRS report request.

## Type Parameters

### T

`T` = `Buffer`

Type of the response body (default: `Buffer`).
For reports, `T` is always `Buffer` containing the binary data.

## Properties

### statusCode

> **statusCode**: `number`

Defined in: [functions/api/types.ts:171](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L171)

HTTP status code (e.g., `200` for success)

---

### headers

> **headers**: `Record`\<`string`, `string` \| `string`[]\>

Defined in: [functions/api/types.ts:174](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L174)

Response headers (header names are lowercased)

---

### body

> **body**: `T`

Defined in: [functions/api/types.ts:177](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L177)

Response body – typically a `Buffer` containing the rendered report

---

### duration

> **duration**: `number`

Defined in: [functions/api/types.ts:180](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L180)

Request duration in milliseconds (from start to response received)

---

### url

> **url**: `string`

Defined in: [functions/api/types.ts:183](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L183)

Final URL after any redirects (or the original request URL)
