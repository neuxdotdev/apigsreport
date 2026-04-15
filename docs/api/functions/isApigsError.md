[ApIgsReport Library](../globals.md) / isApigsError

# Function: isApigsError()

> **isApigsError**(`error`): `error is ApigsError`

Defined in: [handler/error.ts:379](https://github.com/neuxdotdev/apigsreport/blob/master/lib/handler/error.ts#L379)

Type guard to check whether an unknown error is an `ApigsError`.

This function checks both the prototype chain (`instanceof`) and the presence
of the `isApigsError` marker property, making it reliable even when errors
cross module boundaries (e.g., different copies of the library).

## Parameters

### error

`unknown`

The value to test.

## Returns

`error is ApigsError`

`true` if the value is an `ApigsError` or a compatible object.

## Example

```typescript
try {
	// ...
} catch (err) {
	if (isApigsError(err)) {
		console.error('Library error:', err.toJSON())
	} else {
		console.error('Unknown error:', err)
	}
}
```
