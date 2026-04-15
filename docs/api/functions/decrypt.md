[ApIgsReport Library](../globals.md) / decrypt

# Function: decrypt()

> **decrypt**(`ciphertextHex`): `string`

Defined in: [utils/crypto.ts:208](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L208)

Decrypts a previously AES‑256‑GCM encrypted hex string.

The decryption process:

1. Retrieves the master key.
2. Decodes the hex string to a Buffer.
3. Extracts nonce (first 12 bytes), auth tag (next 16 bytes), and ciphertext.
4. Verifies the authentication tag (integrity check).
5. Decrypts and returns the plaintext.

## Parameters

### ciphertextHex

`string`

Hex‑encoded ciphertext produced by `encrypt()`.

## Returns

`string`

The original plaintext string.

## Throws

If the ciphertext is too short, corrupted, tampered,
or decryption fails for any reason.

## Example

```typescript
import { decrypt } from 'apigsreport/utils/crypto'

const decrypted = decrypt('a1b2c3...')
```
