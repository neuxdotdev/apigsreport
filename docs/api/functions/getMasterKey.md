[ApIgsReport Library](../globals.md) / getMasterKey

# Function: getMasterKey()

> **getMasterKey**(): `Buffer`

Defined in: [utils/crypto.ts:71](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L71)

Retrieves the master encryption key, loading from disk or generating a new one.

The master key is stored at `~/.config/apigsreport/.master_key` as a hex string.
If the file does not exist, a cryptographically secure random key is generated,
saved with `0600` permissions, and cached in memory. Subsequent calls return
the cached key.

**Important:** The key is never logged or exposed outside this module.

## Returns

`Buffer`

The master key as a `Buffer` (32 bytes).

## Throws

If the existing key file has an invalid length or cannot be read.

## Example

```typescript
import { getMasterKey } from 'apigsreport/utils/crypto'

const key = getMasterKey()
console.log(`Key length: ${key.length} bytes`)
```
