[ApIgsReport Library](../globals.md) / NtlmCredentials

# Interface: NtlmCredentials

Defined in: [functions/api/types.ts:144](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L144)

NTLM credentials required to authenticate with an SSRS server.

This is the main credential object used by `SsrsApiClient` and the
`renderReport` / `testAuth` functions.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [functions/api/types.ts:146](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L146)

Base URL of the SSRS server (e.g., `https://reportserver.company.com`)

---

### username

> **username**: `string`

Defined in: [functions/api/types.ts:149](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L149)

NTLM username (can include domain, e.g., `CORP\\john.doe`)

---

### password

> **password**: `string`

Defined in: [functions/api/types.ts:152](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L152)

NTLM password

---

### domain?

> `optional` **domain?**: `string`

Defined in: [functions/api/types.ts:155](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L155)

Optional domain (overrides domain part in `username`)

---

### workstation?

> `optional` **workstation?**: `string`

Defined in: [functions/api/types.ts:158](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L158)

Optional workstation name (rarely used)
