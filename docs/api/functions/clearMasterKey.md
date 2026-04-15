[ApIgsReport Library](../globals.md) / clearMasterKey

# Function: clearMasterKey()

> **clearMasterKey**(): `void`

Defined in: [utils/crypto.ts:291](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L291)

Securely zeroes the in‑memory master key and clears the reference.

After calling this function, the next call to `getMasterKey()`, `encrypt()`,
or `decrypt()` will reload (or regenerate) the key from disk.

This is useful for long‑running applications that want to reduce the
lifetime of sensitive key material in memory.

## Returns

`void`

## Example

```typescript
import { clearMasterKey, encrypt } from 'apigsreport/utils/crypto'

// Use encryption...
const encrypted = encrypt('data')

// Clear key from memory when no longer needed
clearMasterKey()

// Next encrypt() will reload key from disk
const encrypted2 = encrypt('more data')
```
