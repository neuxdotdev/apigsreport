[ApIgsReport Library](../globals.md) / ApigsError

# Abstract Class: ApigsError

Defined in: [handler/error.ts:42](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L42)

Abstract base class for all errors thrown by the APIGS Report Library.

`ApigsError` extends the built‑in `Error` class and adds:

- A timestamp (ISO string) when the error was created.
- Optional structured context for debugging.
- A `toJSON()` method that includes the stack trace only in development mode.
- A marker property `isApigsError` for reliable type detection.

## Abstract

## Example

```typescript
try {
	// some operation
} catch (err) {
	if (err instanceof ApigsError) {
		console.error(err.toJSON())
	}
}
```

## Extends

- `Error`

## Extended by

- [`ValidationError`](ValidationError.md)
- [`NetworkError`](NetworkError.md)
- [`ConfigError`](ConfigError.md)
- [`AuthError`](AuthError.md)
- [`CryptoError`](CryptoError.md)
- [`ExportError`](ExportError.md)

## Constructors

### Constructor

> **new ApigsError**(`message`, `options?`): `ApigsError`

Defined in: [handler/error.ts:70](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L70)

Creates a new `ApigsError`.

#### Parameters

##### message

`string`

Human‑readable error description.

##### options?

Optional settings.

###### context?

`Record`\<`string`, `unknown`\>

Structured metadata to attach to the error.

###### cause?

`unknown`

Underlying error that caused this one (e.g., a network exception).

#### Returns

`ApigsError`

#### Overrides

`Error.constructor`

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

## Properties

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [handler/error.ts:48](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L48)

ISO timestamp of when the error was instantiated.

#### Example

```ts
'2026-04-15T10:30:00.000Z'
```

---

### context?

> `readonly` `optional` **context?**: `Record`\<`string`, `unknown`\>

Defined in: [handler/error.ts:54](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L54)

Optional additional context for debugging (e.g., request parameters,
configuration keys, etc.). The contents are library‑specific.

---

### isApigsError

> `readonly` **isApigsError**: `true` = `true`

Defined in: [handler/error.ts:60](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L60)

Marker property that is always `true` for any `ApigsError` instance.
Used by the `isApigsError` type guard.
