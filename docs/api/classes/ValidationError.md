[ApIgsReport Library](../globals.md) / ValidationError

# Class: ValidationError

Defined in: [handler/error.ts:288](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L288)

Error thrown when input validation fails.

This occurs when a method receives invalid arguments – for example,
missing required fields, incorrect URL format, or unsupported report formats.

## Example

```typescript
try {
	new ApigsReportClient({})
} catch (err) {
	if (err instanceof ValidationError) {
		console.error(`Field '${err.field}' is invalid: ${err.message}`)
	}
}
```

## Extends

- [`ApigsError`](ApigsError.md)

## Constructors

### Constructor

> **new ValidationError**(`field`, `value`, `message`, `options?`): `ValidationError`

Defined in: [handler/error.ts:307](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L307)

Creates a new validation error.

#### Parameters

##### field

`string`

Name of the invalid field.

##### value

`unknown`

The problematic value.

##### message

`string`

Specific validation message.

##### options?

Additional context.

###### context?

`Record`\<`string`, `unknown`\>

#### Returns

`ValidationError`

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

---

### field

> `readonly` **field**: `string`

Defined in: [handler/error.ts:292](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L292)

Name of the field that failed validation.

---

### value

> `readonly` **value**: `unknown`

Defined in: [handler/error.ts:297](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L297)

The value that was provided (or `undefined` if missing).
