[ApIgsReport Library](../globals.md) / NetworkError

# Class: NetworkError

Defined in: [handler/error.ts:220](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L220)

Error thrown when a network request fails.

This includes timeouts, connection refused, DNS errors, unexpected HTTP
status codes (4xx/5xx), and other transport‑level issues.

## Example

```typescript
try {
	await client.renderReport(options)
} catch (err) {
	if (err instanceof NetworkError) {
		console.error(`Network error ${err.statusCode} on ${err.url}`)
	}
}
```

## Extends

- [`ApigsError`](ApigsError.md)

## Constructors

### Constructor

> **new NetworkError**(`message`, `options?`): `NetworkError`

Defined in: [handler/error.ts:241](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L241)

Creates a new network error.

#### Parameters

##### message

`string`

Description of the network failure.

##### options?

Optional details.

###### statusCode?

`number`

HTTP status code (if applicable).

###### url?

`string`

Request URL.

###### context?

`Record`\<`string`, `unknown`\>

Additional metadata.

###### cause?

`unknown`

Underlying error (e.g., AxiosError).

#### Returns

`NetworkError`

#### Overrides

[`ApigsError`](ApigsError.md).[`constructor`](ApigsError.md#constructor)

## Methods

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Defined in: [handler/error.ts:260](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L260)

Extends the base `toJSON()` with `statusCode` and `url`.

#### Returns

`Record`\<`string`, `unknown`\>

Serializable error object including network details.

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

### statusCode?

> `readonly` `optional` **statusCode?**: `number`

Defined in: [handler/error.ts:224](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L224)

HTTP status code if the error originated from an HTTP response.

---

### url?

> `readonly` `optional` **url?**: `string`

Defined in: [handler/error.ts:229](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L229)

The URL that was requested when the error occurred.
