[ApIgsReport Library](../globals.md) / createClient

# Function: createClient()

> **createClient**(`config`): [`ApigsReportClient`](../classes/ApigsReportClient.md)

Defined in: [lib.ts:355](https://github.com/neuxdotdev/apigsreport/blob/master/lib/lib.ts#L355)

Factory function to create an `ApigsReportClient` instance.

This is an alternative to using the `new` operator; it behaves identically.

## Parameters

### config

`unknown`

Configuration object (see [ApigsReportConfig](../interfaces/ApigsReportConfig.md)).

## Returns

[`ApigsReportClient`](../classes/ApigsReportClient.md)

A new `ApigsReportClient` instance.

## Example

```typescript
import { createClient } from 'apigsreport'

const client = createClient({
	baseUrl: 'https://ssrs.company.com',
	username: 'user',
	password: 'pass',
})
```
