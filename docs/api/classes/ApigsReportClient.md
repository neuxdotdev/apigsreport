[ApIgsReport Library](../globals.md) / ApigsReportClient

# Class: ApigsReportClient

Defined in: [lib.ts:146](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L146)

High‑level client for exporting SSRS reports.

`ApigsReportClient` simplifies the entire workflow:

- Validates configuration on construction.
- Provides a simple `exportReport()` method that renders a predefined report
  (default path: `/IGS/WV_Kartu_Piutang_Wabot`).
- Optionally saves the output to a file (with safety checks).
- Includes a `testAuth()` method to verify credentials.

For reports with custom paths, use the standalone `renderReport()` function
instead.

## Example

```typescript
import { ApigsReportClient } from 'apigsreport'

const client = new ApigsReportClient({
	baseUrl: 'https://reportserver.company.com',
	username: 'CORP\\john.doe',
	password: 'secret123',
	timeout: 60000,
	logLevel: 'debug',
})

// Export PDF to memory
const pdfBuffer = await client.exportReport({
	format: 'PDF',
	parameters: { AccountId: 12345 },
})

// Export Excel and save to disk
await client.exportReport({
	format: 'EXCELOPENXML',
	outputPath: './report.xlsx',
})

// Test authentication
const authStatus = await client.testAuth()
console.log(authStatus.message)

// Clean up (optional)
client.destroy()
```

## Constructors

### Constructor

> **new ApigsReportClient**(`input`): `ApigsReportClient`

Defined in: [lib.ts:174](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L174)

Creates a new `ApigsReportClient` instance.

#### Parameters

##### input

`unknown`

Configuration object (see [ApigsReportConfig](../interfaces/ApigsReportConfig.md)).

#### Returns

`ApigsReportClient`

#### Throws

If the configuration is missing required fields or malformed.

#### Example

```typescript
const client = new ApigsReportClient({
	baseUrl: 'https://ssrs.example.com',
	username: 'DOMAIN\\user',
	password: 'pass',
})
```

## Methods

### exportReport()

> **exportReport**(`options?`): `Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

Defined in: [lib.ts:256](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L256)

Exports an SSRS report.

The method renders the report defined by the hardcoded path
`/IGS/WV_Kartu_Piutang_Wabot` (customise by using the low‑level `renderReport`
function instead). The report can be returned as a `Buffer` or saved directly
to disk.

#### Parameters

##### options?

Export options (format, parameters, optional output path).

###### format?

[`ReportFormat`](../type-aliases/ReportFormat.md)

###### parameters?

`Record`\<`string`, `string` \| `number` \| `boolean`\>

###### outputPath?

`string`

#### Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

A promise that resolves to a `Buffer` containing the rendered report.

#### Throws

If `outputPath` is invalid (path traversal attempts) or
the file already exists.

#### Throws

If authentication fails.

#### Throws

For network or server errors.

#### Example

```typescript
// Get PDF as Buffer
const buffer = await client.exportReport({ format: 'PDF' })

// Save Excel to disk
await client.exportReport({
	format: 'EXCELOPENXML',
	outputPath: './reports/balance.xlsx',
})
```

---

### testAuth()

> **testAuth**(): `Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

Defined in: [lib.ts:291](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L291)

Tests NTLM authentication against the SSRS server.

#### Returns

`Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

A promise that resolves to an object with `success` and a message.

#### Example

```typescript
const result = await client.testAuth()
if (!result.success) {
	console.error('Invalid credentials')
}
```

---

### destroy()

> **destroy**(): `void`

Defined in: [lib.ts:329](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L329)

Releases any resources held by the client.

Currently only logs the destruction; may be extended in future versions.

#### Returns

`void`
