[ApIgsReport Library](../globals.md) / AuthError

# Class: AuthError

Defined in: [handler/error.ts:163](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L163)

Error thrown when authentication with the SSRS server fails.

This can happen due to invalid NTLM credentials, expired sessions,
missing domain information, or server‑side authentication rejections.

## Example

```typescript
try {
	await authManager.initialize()
} catch (err) {
	if (err instanceof AuthError) {
		console.error(`Auth failed with code ${err.errorCode}: ${err.message}`)
	}
}
```

## Extends

- [`ApigsError`](ApigsError.md)

## Constructors

### Constructor

> **new AuthError**(`message`, `errorCode`, `options?`): `AuthError`

Defined in: [handler/error.ts:179](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L179)

Creates a new authentication error.

#### Parameters

##### message

`string`

Human‑readable description.

##### errorCode

`string`

Programmatic error identifier.

##### options?

Additional context or cause.

###### context?

`Record`\<`string`, `unknown`\>

###### cause?

`unknown`

#### Returns

`AuthError`

#### Overrides

[`ApigsError`](ApigsError.md).[`constructor`](ApigsError.md#constructor)

## Methods

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [handler/error.ts:193](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L193)

Extends the base `toJSON()` with the `errorCode` field.

#### Returns

`Record`\<`string`, `unknown`\>

Serializable error object including the error code.

#### Overrides

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

---

### errorCode

> `readonly` **errorCode**: `string`

Defined in: [handler/error.ts:170](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L170)

Machine‑readable error code for programmatic handling.

Common codes: `'AUTH_401'`, `'AUTH_FAILED'`, `'NOT_AUTHENTICATED'`,
`'CLIENT_NOT_READY'`, `'NOT_INITIALIZED'`.
