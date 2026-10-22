# Multi Tenant Architecture 5.0 Freeze Evidence

> **Domain**: multi-tenant
> **Version**: 5.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: pending
> **Rebase required**: true
> **Effective date**: 2026-10-22

## Authority

- Active root: `runtime-shell-3.2.0`
- Decision: `user-authorization:2026-10-22:multi-tenant-5.0-freeze`
- Decision background: `docs/rfc/RFC-002-身份认证-统一登录架构与认证专项（Draft）.md`
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-22:multi-tenant-5.0:architecture-committee` | `2026-10-22T13:08:12+09:00` |
| security | `user-authorization:2026-10-22:multi-tenant-5.0:security` | `2026-10-22T13:08:12+09:00` |
| sre | `user-authorization:2026-10-22:multi-tenant-5.0:sre` | `2026-10-22T13:08:12+09:00` |

## Immutable content

- Path: `docs/v5.0-多租户功能最小实现-设计蓝图.md`
- Raw SHA-256: `90a5cf442221cd5bca4bd92d26342c1df9fa0900b028e68997bd55de247b8d4f`
- Git blob: `a003f3736afbf40f98bca96ebcc2b8a4d89ba004`
- Git commit: `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`

The commit contains the locked bytes at the registered path.

## State transition

- `multi-tenant-4.0`: ACTIVE → SUPERSEDED, `effective=false`
- `multi-tenant-5.0`: registered as ACTIVE, `effective=true`, `rebaseRequired=true`
- Compatibility epoch changes from `2` to `3` because the public `/api/auth/login/actor` and `/api/auth/login/subject` entries are removed and token delivery changes.
- multi-tenant-4.0 remains byte-for-byte unchanged:
  - SHA-256: `70a68b4fde9825dc810df392dbca16aa87d019e99e3561ac12f3333214f84439`
  - Git blob: `7021d98d7c28fb7560385facc48d83f1dd7f67bf`

`rebaseRequired=true` remains because the persistence review required since runtime-shell 3.1.0 (§7) is not complete; authentication clauses are aligned with runtime-shell 3.2.0. It blocks Implementation Accepted and GA claims until the review is done.

Validator result at registration: `architecture-baseline: PASS: ACTIVE[identity-auth=1.0, frontend=1.2, super-admin=4.0, multi-tenant=5.0, runtime-shell=3.2.0]` with `--require-active --check-instructions --base-ref 289fe504f511bca2cb3d92038b1eff77c3dd4d1e`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
