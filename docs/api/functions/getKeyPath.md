[ApIgsReport Library](../globals.md) / getKeyPath

# Function: getKeyPath()

> **getKeyPath**(): `string`

Defined in: [utils/crypto.ts:127](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L127)

Returns the absolute filesystem path to the master key file.

The path is: `~/.config/apigsreport/.master_key`

## Returns

`string`

The full path to the master key file.

## Example

```typescript
import { getKeyPath } from 'apigsreport/utils/crypto'

console.log(`Master key stored at: ${getKeyPath()}`)
```
