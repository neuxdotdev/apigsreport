[ApIgsReport Library](../globals.md) / CryptoError

# Class: CryptoError

Defined in: [handler/error.ts:341](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L341)

Error thrown when cryptographic operations fail.

This includes issues with the master key (missing, corrupted, wrong length),
decryption failures (tampered data, incorrect key), or encryption errors.

## Example

```typescript
try {
	const decrypted = decrypt(encryptedHex)
} catch (err) {
	if (err instanceof CryptoError) {
		console.error('Crypto operation failed:', err.message)
	}
}
```

## Extends

- [`ApigsError`](ApigsError.md)

## Constructors

### Constructor

> **new CryptoError**(`message`, `options?`): `CryptoError`

Defined in: [handler/error.ts:348](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L348)

Creates a new cryptographic error.

#### Parameters

##### message

`string`

Description of the crypto failure.

##### options?

Additional context or cause.

###### context?

`Record`\<`string`, `unknown`\>

###### cause?

`unknown`

#### Returns

`CryptoError`

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
