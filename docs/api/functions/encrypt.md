[ApIgsReport Library](../globals.md) / encrypt

# Function: encrypt()

> **encrypt**(`plaintext`): `string`

Defined in: [utils/crypto.ts:161](https://github.com/neuxdotdev/apigsreport/blob/master/lib/utils/crypto.ts#L161)

Encrypts a plaintext string using AES‑256‑GCM.

The encryption process:

1. Retrieves the master key (generates if missing).
2. Generates a random 12‑byte nonce.
3. Encrypts the plaintext using AES‑256‑GCM.
4. Extracts the 16‑byte authentication tag.
5. Concatenates `nonce + authTag + ciphertext`.
6. Returns the result as a hex string.

## Parameters

### plaintext

`string`

The string to encrypt (UTF‑8 encoded).

## Returns

`string`

Hex‑encoded ciphertext that includes nonce, auth tag, and encrypted data.

## Throws

If encryption fails (e.g., invalid key, algorithm error).

## Example

```typescript
import { encrypt, decrypt } from 'apigsreport/utils/crypto'

const secret = 'mySuperSecretPassword'
const encrypted = encrypt(secret)
console.log(`Encrypted: ${encrypted}`)

const decrypted = decrypt(encrypted)
console.log(decrypted === secret) // true
```
