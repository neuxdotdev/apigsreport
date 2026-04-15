# ApIgsReport Library v1.0.1

## Fileoverview

Main entry point for the APIGS Report Library.

This module aggregates and re‑exports all public APIs of the library,
providing a single import entry for end users. It includes the high‑level
`ApigsReportClient`, standalone rendering functions, error classes,
configuration managers, logging utilities, and cryptographic helpers.

**Typical usage:**

```typescript
import { ApigsReportClient, renderReport, logger } from 'apigsreport'

const client = new ApigsReportClient({
	baseUrl: 'https://ssrs.company.com',
	username: 'DOMAIN\\user',
	password: 'secret',
})

const pdf = await client.exportReport({ format: 'PDF' })
```

## Since

1.0.0

## See

[Repository](https://github.com/neuxdotdev/apigsreport)

## Functions

- [renderReport](functions/renderReport.md)
- [testAuth](functions/testAuth.md)
- [isApigsError](functions/isApigsError.md)
- [createClient](functions/createClient.md)
- [getMasterKey](functions/getMasterKey.md)
- [getKeyPath](functions/getKeyPath.md)
- [encrypt](functions/encrypt.md)
- [decrypt](functions/decrypt.md)
- [hash](functions/hash.md)
- [clearMasterKey](functions/clearMasterKey.md)

## Classes

- [SsrsApiClient](classes/SsrsApiClient.md)
- [ApigsError](classes/ApigsError.md)
- [ConfigError](classes/ConfigError.md)
- [AuthError](classes/AuthError.md)
- [NetworkError](classes/NetworkError.md)
- [ValidationError](classes/ValidationError.md)
- [CryptoError](classes/CryptoError.md)
- [ExportError](classes/ExportError.md)
- [ApigsReportClient](classes/ApigsReportClient.md)

## Interfaces

- [RenderOptions](interfaces/RenderOptions.md)
- [NtlmCredentials](interfaces/NtlmCredentials.md)
- [SsrsResponse](interfaces/SsrsResponse.md)
- [Logger](interfaces/Logger.md)
- [ApigsReportConfig](interfaces/ApigsReportConfig.md)

## Type Aliases

- [ReportFormat](type-aliases/ReportFormat.md)
- [LogLevel](type-aliases/LogLevel.md)

## Variables

- [Formats](variables/Formats.md)
- [configManager](variables/configManager.md)
- [envManager](variables/envManager.md)
- [logger](variables/logger.md)

## Modules

- [\<internal\>](-internal-/index.md)
