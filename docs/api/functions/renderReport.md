[ApIgsReport Library](../globals.md) / renderReport

# Function: renderReport()

> **renderReport**(`credentials`, `options`): `Promise`\<[`SsrsResponse`](../interfaces/SsrsResponse.md)\<`Buffer`\<`ArrayBufferLike`\>\>\>

Defined in: [functions/api/api.ts:61](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api.ts#L61)

Renders an SSRS report and returns the response.

This is the primary function for exporting reports from an SSRS server.
It creates a temporary `SsrsApiClient` instance, performs the request,
and returns a structured response containing the report data (as a Buffer),
HTTP status, headers, duration, and final URL.

The report path must be the full path to the report on the SSRS server
(e.g., `/Sales/YearlySummary`). The format must be one of the supported
`ReportFormat` values (`'PDF'`, `'EXCELOPENXML'`, `'CSV'`, `'XML'`, `'HTML4.0'`).

## Parameters

### credentials

[`NtlmCredentials`](../interfaces/NtlmCredentials.md)

NTLM credentials for authentication.

### options

`Omit`\<[`RenderOptions`](../interfaces/RenderOptions.md), `"timeout"`\> & `object`

Report rendering options (report path, format, parameters, optional timeout).

## Returns

`Promise`\<[`SsrsResponse`](../interfaces/SsrsResponse.md)\<`Buffer`\<`ArrayBufferLike`\>\>\>

A promise that resolves to the SSRS response containing the report data.

## Throws

If NTLM authentication fails (invalid credentials, domain issues).

## Throws

If the request fails due to network issues, timeouts, or HTTP errors.

## Example

```typescript
import { renderReport, Formats } from 'apigsreport'

const pdfBuffer = await renderReport(
	{
		baseUrl: 'https://reportserver.company.com',
		username: 'CORP\\john.doe',
		password: 'secret123',
	},
	{
		reportPath: '/Finance/BalanceSheet',
		format: Formats.PDF,
		parameters: { FiscalYear: 2025, IncludeDetails: true },
	},
)

// Save to file or process the buffer
await fs.writeFile('balance.pdf', pdfBuffer.body)
```
