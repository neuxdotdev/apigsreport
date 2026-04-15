[ApIgsReport Library](../globals.md) / testAuth

# Function: testAuth()

> **testAuth**(`credentials`): `Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

Defined in: [functions/api/api.ts:104](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api.ts#L104)

Tests NTLM authentication against the SSRS server.

Sends a test request to the `/ReportServer` endpoint to verify that the
provided credentials are accepted by the server. This is useful for
configuration validation before attempting to render reports.

A successful test does **not** guarantee that a specific report exists or
that the user has permissions to access it; it only confirms that the NTLM
handshake completes and the server responds (either with `200` OK or a
`401` challenge, both indicating that NTLM is working).

## Parameters

### credentials

[`NtlmCredentials`](../interfaces/NtlmCredentials.md)

NTLM credentials to test.

## Returns

`Promise`\<\{ `success`: `boolean`; `message`: `string`; \}\>

A promise that resolves to an object with `success` (boolean) and
a human‑readable `message`.

## Example

```typescript
import { testAuth } from 'apigsreport'

const result = await testAuth({
	baseUrl: 'https://reportserver.company.com',
	username: 'DOMAIN\\user',
	password: 'password',
})

if (result.success) {
	console.log('Authentication works:', result.message)
} else {
	console.error('Authentication failed:', result.message)
}
```
