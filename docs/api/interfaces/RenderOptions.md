[ApIgsReport Library](../globals.md) / RenderOptions

# Interface: RenderOptions

Defined in: [functions/api/types.ts:88](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L88)

Options for rendering an SSRS report.

This interface is used by `SsrsApiClient.renderReport()` and the
standalone `renderReport()` function.

## Properties

### reportPath

> **reportPath**: `string`

Defined in: [functions/api/types.ts:98](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L98)

Path to the report on the SSRS server.

#### Example

```typescript
reportPath: '/Sales/YearlySummary'
reportPath: '/Finance/BalanceSheet'
```

---

### format

> **format**: [`ReportFormat`](../type-aliases/ReportFormat.md)

Defined in: [functions/api/types.ts:101](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L101)

Desired output format (see [ReportFormat](../type-aliases/ReportFormat.md))

---

### parameters?

> `optional` **parameters?**: `Record`\<`string`, `string` \| `number` \| `boolean`\>

Defined in: [functions/api/types.ts:118](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L118)

Optional report parameters.

Keys and values are URL‑encoded automatically. Values can be strings,
numbers, or booleans (converted to string).

#### Example

```typescript
parameters: {
  FiscalYear: 2025,
  IncludeDetails: true,
  Region: 'EMEA'
}
```

---

### workstation?

> `optional` **workstation?**: `string`

Defined in: [functions/api/types.ts:126](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L126)

Optional workstation name (rarely needed).

#### Remarks

Most SSRS deployments ignore this field.

---

### timeout?

> `optional` **timeout?**: `number`

Defined in: [functions/api/types.ts:133](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/types.ts#L133)

Request timeout in milliseconds.

#### Default Value

Client's default timeout (usually `30000`)
