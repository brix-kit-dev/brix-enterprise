# Identity Auth Architecture 1.0 Freeze Evidence

> **Domain**: identity-auth
> **Version**: 1.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: pending
> **Rebase required**: false
> **Effective date**: 2026-10-22

## Authority

- Active root: `runtime-shell-3.2.0`
- Decision: `user-authorization:2026-10-22:identity-auth-1.0-freeze`
- Decision background: `docs/rfc/RFC-002-身份认证-统一登录架构与认证专项（Draft）.md`
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-22:identity-auth-1.0:architecture-committee` | `2026-10-22T13:08:12+09:00` |
| security | `user-authorization:2026-10-22:identity-auth-1.0:security` | `2026-10-22T13:08:12+09:00` |
| sre | `user-authorization:2026-10-22:identity-auth-1.0:sre` | `2026-10-22T13:08:12+09:00` |

## Immutable content

- Path: `docs/v1.0-身份认证功能最小实现-设计蓝图.md`
- Raw SHA-256: `0908c3731126891b9ede15a58f50e1fbf56de4e0fec61971256561b2384a866a`
- Git blob: `d1e6eb33c4398593c2485731eb81b160be47b25a`
- Git commit: `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`

The commit contains the locked bytes at the registered path.

## State transition

- `identity-auth-1.0`: registered as ACTIVE, `effective=true`, `rebaseRequired=false`
- `requiredActiveDomains` now includes `identity-auth`.
- New specialized domain; compatibility epoch starts at `1`.

Validator result at registration: `architecture-baseline: PASS: ACTIVE[identity-auth=1.0, frontend=1.2, super-admin=4.0, multi-tenant=5.0, runtime-shell=3.2.0]` with `--require-active --check-instructions --base-ref 289fe504f511bca2cb3d92038b1eff77c3dd4d1e`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
