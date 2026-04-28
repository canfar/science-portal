# Contributing

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

`<type>(<optional scope>): <description>`

- **Types** (common): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scope**: optional, short, lowercase noun in parentheses (for example `home`, `api`, `auth`)
- **Description**: imperative mood, lowercase, no trailing period; keep the first line around 72 characters when practical
- **Breaking changes**: add `!` after the type or scope (`feat(api)!:`) or a `BREAKING CHANGE:` footer in the commit body

Examples:

- `fix(home): align session and storage widget heights`
- `feat(api): add session renew endpoint`
- `chore(deps): bump next to 15.5.10`

Avoid vague messages such as "Update code" or "Fix bug".
