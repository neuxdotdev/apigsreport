[ApIgsReport Library](../globals.md) / SsrsApiClient

# Class: SsrsApiClient

Defined in: [functions/api/api-client.ts:174](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api-client.ts#L174)

Low‑level client for the SSRS ReportServer API with NTLM authentication.

`SsrsApiClient` is a wrapper around `axios-ntlm` that handles:

- URL construction for the SSRS `Render` command.
- NTLM authentication handshake (per request).
- Response parsing (binary for reports, text for errors).
- Error classification (`AuthError` for 401, `NetworkError` for others).
- Optional timeout configuration.

The client is stateless; each `renderReport()` call performs its own NTLM
handshake because NTLM is connection‑oriented.

## Example

```typescript
import { SsrsApiClient } from 'apigsreport'

const client = new SsrsApiClient({
	baseUrl: 'https://reportserver.company.com',
	username: 'CORP\\john.doe',
	password: 'secret',
})

const pdfResponse = await client.renderReport({
	reportPath: '/Finance/BalanceSheet',
	format: 'PDF',
	parameters: { Year: 2025 },
})

// pdfResponse.body is a Buffer containing the PDF
```

## Constructors

### Constructor

> **new SsrsApiClient**(`credentials`, `timeout?`): `SsrsApiClient`

Defined in: [functions/api/api-client.ts:196](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api-client.ts#L196)

Creates a new SSRS API client.

#### Parameters

##### credentials

[`NtlmCredentials`](../interfaces/NtlmCredentials.md)

NTLM credentials (base URL, username, password, optional domain).

##### timeout?

`number`

Optional timeout in milliseconds for all requests (default: `30_000`).

#### Returns

`SsrsApiClient`

#### Throws

If the base URL is invalid or the protocol is unsupported.

#### Example

```typescript
const client = new SsrsApiClient(
	{
		baseUrl: 'https://ssrs.example.com',
		username: 'DOMAIN\\user',
		password: 'pass',
	},
	60000,
)
```

## Methods

### renderReport()

> **renderReport**(`options`): `Promise`\<[`SsrsResponse`](../interfaces/SsrsResponse.md)\<`Buffer`\<`ArrayBufferLike`\>\>\>

Defined in: [functions/api/api-client.ts:239](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api-client.ts#L239)

Renders an SSRS report and returns the response.

This method constructs the render URL, sends an authenticated GET request,
and returns a structured response containing the report data (as a Buffer),
HTTP status, headers, and timing information.

#### Parameters

##### options

[`RenderOptions`](../interfaces/RenderOptions.md)

Render options (report path, format, parameters, optional timeout).

#### Returns

`Promise`\<[`SsrsResponse`](../interfaces/SsrsResponse.md)\<`Buffer`\<`ArrayBufferLike`\>\>\>

A promise that resolves to the SSRS response.

#### Throws

If the format is unsupported or authentication fails (401).

#### Throws

For network issues, timeouts, or HTTP errors (4xx/5xx).

#### Example

```typescript
const response = await client.renderReport({
	reportPath: '/Sales/Quarterly',
	format: 'EXCELOPENXML',
	parameters: { Quarter: 1 },
})
```

---

### testAuth()

> **testAuth**(): `Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

Defined in: [functions/api/api-client.ts:273](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api-client.ts#L273)

Tests NTLM authentication without rendering a report.

Sends a GET request to `/ReportServer` with a short timeout. The test passes
if the server responds with `200 OK` or `401 Unauthorized` (the latter
indicates that NTLM negotiation is active). Any other status or network error
is treated as failure.

#### Returns

`Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

A promise that resolves to an object with `success` and a message.

#### Example

```typescript
const result = await client.testAuth()
if (result.success) {
	console.log('NTLM is working')
}
```
