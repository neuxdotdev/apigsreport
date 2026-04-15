[ApIgsReport Library](../globals.md) / hash

# Function: hash()

> **hash**(`value`): `string`

Defined in: [utils/crypto.ts:262](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L262)

Computes a SHA‑256 hash of the input string.

This function is used for integrity verification (e.g., password hashes
stored in the config file). It is **not** suitable for password storage
because it lacks salting and is fast; use dedicated password hashing
libraries for user authentication.

## Parameters

### value

`string`

The string to hash.

## Returns

`string`

Hexadecimal representation of the SHA‑256 digest.

## Example

```typescript
import { hash } from 'apigsreport/utils/crypto'

const digest = hash('myValue')
console.log(digest) // 64 hex characters
```
