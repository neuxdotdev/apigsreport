[ApIgsReport Library](../globals.md) / ExportError

# Class: ExportError

Defined in: [handler/error.ts:406](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L406)

Error thrown when exporting a report to a file fails.

This includes file system errors (permission denied, disk full), invalid
output paths (path traversal attempts), or file already exists (when using
safe write mode).

## Example

```typescript
try {
	await client.exportReport({ outputPath: '/etc/passwd' })
} catch (err) {
	if (err instanceof ExportError) {
		console.error('Export failed:', err.message)
	}
}
```

## Extends

- [`ApigsError`](ApigsError.md)

## Constructors

### Constructor

> **new ExportError**(`message`, `options?`): `ExportError`

Defined in: [handler/error.ts:413](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L413)

Creates a new export error.

#### Parameters

##### message

`string`

Description of the export failure.

##### options?

Additional context or cause.

###### context?

`Record`\<`string`, `unknown`\>

###### cause?

`unknown`

#### Returns

`ExportError`

#### Overrides

[`ApigsError`](ApigsError.md).[`constructor`](ApigsError.md#constructor)

## Methods

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [handler/error.ts:99](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L99)

Converts the error to a plain object suitable for JSON serialization.

The stack trace is included **only** when `NODE_ENV === 'development'`
to avoid leaking internal paths in production logs.

#### Returns

`Record`\<`string`, `unknown`\>

A serializable representation of the error.

#### Example

```typescript
console.log(JSON.stringify(error.toJSON()))
```

#### Inherited from

[`ApigsError`](ApigsError.md).[`toJSON`](ApigsError.md#tojson)

## Properties

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [handler/error.ts:48](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L48)

ISO timestamp of when the error was instantiated.

#### Example

```ts
'2026-04-15T10:30:00.000Z'
```

#### Inherited from

[`ApigsError`](ApigsError.md).[`timestamp`](ApigsError.md#timestamp)

---

### context?

> `readonly` `optional` **context?**: `Record`\<`string`, `unknown`\>

Defined in: [handler/error.ts:54](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L54)

Optional additional context for debugging (e.g., request parameters,
configuration keys, etc.). The contents are library‑specific.

#### Inherited from

[`ApigsError`](ApigsError.md).[`context`](ApigsError.md#context)

---

### isApigsError

> `readonly` **isApigsError**: `true` = `true`

Defined in: [handler/error.ts:60](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L60)

Marker property that is always `true` for any `ApigsError` instance.
Used by the `isApigsError` type guard.

#### Inherited from

[`ApigsError`](ApigsError.md).[`isApigsError`](ApigsError.md#isapigserror)
