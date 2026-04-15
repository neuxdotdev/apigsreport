[ApIgsReport Library](../globals.md) / Formats

# Variable: Formats

> `const` **Formats**: `object`

Defined in: [functions/api/api.ts:119](https://github.com/neuxdotdev/apigsreport/blob/master/lib/functions/api/api.ts#L119)

Constants for supported SSRS report formats.

This object provides named constants to avoid typos and improve code readability.
Use these values as the `format` field in `RenderOptions`.

## Type Declaration

### PDF

> `readonly` **PDF**: `"PDF"`

Portable Document Format (`.pdf`)

### EXCEL

> `readonly` **EXCEL**: `"EXCELOPENXML"`

Microsoft Excel Open XML (`.xlsx`)

### CSV

> `readonly` **CSV**: `"CSV"`

Comma‑Separated Values (`.csv`)

### XML

> `readonly` **XML**: `"XML"`

Extensible Markup Language (`.xml`)

### HTML

> `readonly` **HTML**: `"HTML4.0"`

HTML 4.0 document (`.html`)
