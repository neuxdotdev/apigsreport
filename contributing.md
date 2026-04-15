# Contributing to `apigsreport`

Thank you for your interest in contributing to **`apigsreport`** — a minimal TypeScript auth handler for web sessions, CSRF tokens, and cookie persistence.

Contributions of all kinds are welcome: bug reports, feature proposals, documentation improvements, code enhancements, and even typo fixes!

> [!TIP]
> **Quick Requirements**
>
> - **Node.js**: LTS recommended (≥18.0.0)
> - **Bun**: ≥1.0.0 _(primary package manager)_
> - **Git**: for version control
> - **Editor**: Any, but VS Code / Zed with TypeScript support recommended

Verify your environment:

```sh
node -v      # ≥18.0.0
bun -v       # ≥1.0.0
git --version
```

---

## Getting Started

### 1. Fork & Clone

```sh
# Fork the repo via GitHub UI, then:
git clone https://github.com/your-username/apigsreport.git
cd apigsreport
```

### 2. Install Dependencies

```sh
bun install
```

### 3. Create a Feature Branch

```sh
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

> [!NOTE]
> Branch naming convention:
>
> - `feat/` → new features
> - `fix/` → bug fixes
> - `refactor/` → code improvements
> - `docs/` → documentation changes
> - `test/` → test additions/updates

---

## Development Workflow

### Run in Development Mode

```sh
bun run dev
```

Watches source files and rebuilds on change.

### Type Checking

```sh
bun run typecheck
```

Runs `tsc --noEmit` with strict config. **All type errors must be resolved** before PR.

### Build for Production

```sh
bun run rebuild
```

Full pipeline: clean → typecheck → bundle (prod) → format check → generate docs.

Output goes to `./build/`:

```
build/
├── index.cjs          # CommonJS bundle
├── index.mjs          # ES Module bundle
├── index.d.ts         # Type declarations
├── index.d.ts.map     # Declaration sourcemap
└── *.map              # JS sourcemaps (if enabled)
```

### Format & Lint

```sh
# Auto-fix formatting
bun run format

# Check formatting (CI-friendly)
bun run format:check

# Lint with ESLint
bun run lint
bun run lint:fix  # Auto-fix fixable issues
```

> [!WARNING]
> All PRs must pass:
>
> - `bun run typecheck`
> - `bun run lint`
> - `bun run format:check`

---

## Testing

### Run Tests

```sh
bun test          # Run all tests
bun test:watch    # Watch mode
bun test:coverage # With coverage report
```

### Testing Guidelines

- **New features** → add unit tests first (TDD recommended)
- **Core logic** → must have unit test coverage
- **Edge cases** → test boundary conditions, invalid inputs, error paths
- **No regression** → existing test coverage must not decrease

Example test structure:

```ts
// lib/__tests__/csrf.test.ts
import { describe, test, expect } from 'bun:test'
import { generateToken, validateToken } from '../csrf'

describe('CSRF token utilities', () => {
	test('generateToken returns hex string of expected length', () => {
		const token = generateToken(32)
		expect(token).toMatch(/^[0-9a-f]{64}$/)
	})

	test('validateToken rejects malformed tokens', () => {
		expect(validateToken('invalid!')).toBe(false)
	})
})
```

---

## Code Standards

### TypeScript Rules

- **Strict mode enabled** — no `any` unless absolutely necessary (with `// justified: ...` comment)
- **Functional preference** — pure functions, immutable data where possible
- **Small, composable modules** — one responsibility per file
- **Explicit types** — avoid implicit `any`, use interfaces/types for public APIs
- **No unnecessary dependencies** — prefer built-in or already-depended packages

### Project Structure

```
apigsreport/
├── lib/                 # Source code (.ts)
│   ├── index.ts         # Public API exports
│   ├── csrf/            # CSRF token logic
│   ├── session/         # Session handling
│   └── utils/           # Internal helpers
├── lib/__tests__/       # Test files
├── build/               # Compiled output (gitignored)
├── scripts/             # Build/helper scripts
└── docs/                # Generated documentation
```

### Naming Conventions

| Type             | Convention              | Example                     |
| ---------------- | ----------------------- | --------------------------- |
| Files            | `kebab-case.ts`         | `csrf-token.ts`             |
| Functions        | `camelCase`             | `generateSessionId()`       |
| Types/Interfaces | `PascalCase`            | `AuthConfig`, `SessionData` |
| Constants        | `UPPER_SNAKE`           | `DEFAULT_TIMEOUT_MS`        |
| Private members  | `#private` or `_prefix` | `#internalCache`            |

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>?): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | New user-facing feature                         |
| `fix`      | Bug fix                                         |
| `refactor` | Code change that neither fixes nor adds feature |
| `docs`     | Documentation only                              |
| `test`     | Adding/updating tests                           |
| `chore`    | Maintenance, tooling, deps                      |
| `perf`     | Performance improvement                         |
| `ci`       | CI/CD configuration changes                     |

### Examples

```sh
# Simple
git commit -m "feat: add token expiration config option"

# With scope
git commit -m "fix(csrf): handle missing header gracefully"

# Multi-line for complex changes
git commit -m "refactor(session): simplify cookie serialization

- Replace manual JSON handling with structuredClone
- Add validation for cookie size limits
- Improve error messages for malformed data

No breaking changes; internal only."
```

> [!TIP]
> Keep commits **atomic**: one logical change per commit. Use `git add -p` to stage hunks selectively.

---

## Pull Request Guidelines

### Before Opening a PR

- [ ] Code builds: `bun run rebuild`
- [ ] Tests pass: `bun test`
- [ ] Lint/format clean: `bun run lint && bun run format:check`
- [ ] Types are strict: `bun run typecheck`
- [ ] Docs updated (if API changed): `bun run docs:generate`
- [ ] Changelog updated (if user-facing)

### PR Template

When creating a PR, please include:

```markdown
## What changed?

<!-- Brief description of the change -->

## Why is this needed?

<!-- Problem statement or use case -->

## How was it tested?

<!-- Test commands, manual steps, or test file references -->

## Breaking changes?

<!-- Yes/No + migration notes if applicable -->

## Related issues

<!-- Closes #123, Fixes #456, etc. -->
```

### Review Process

1. CI checks run automatically (build, test, lint)
2. Maintainer reviews code, style, and docs
3. Address feedback with follow-up commits (don't force-push unless requested)
4. Once approved, PR is squashed & merged

> [!NOTE]
> Small, focused PRs get reviewed faster. If your change is large, consider:
>
> - Opening a draft PR early for feedback
> - Splitting into multiple smaller PRs
> - Discussing in an issue first

---

## Versioning & Releases

This project follows [Semantic Versioning](https://semver.org/):

| Version | Meaning                            | Example           |
| ------- | ---------------------------------- | ----------------- |
| `MAJOR` | Breaking changes                   | `1.0.0` → `2.0.0` |
| `MINOR` | New features (backward-compatible) | `1.2.0` → `1.3.0` |
| `PATCH` | Bug fixes                          | `1.2.3` → `1.2.4` |

```

```
