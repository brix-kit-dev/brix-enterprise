# Super Admin Architecture 4.0 Freeze Evidence

> **Domain**: super-admin
> **Version**: 4.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: not-assessed
> **Rebase required**: true
> **Effective date**: 2026-10-22

## Authority

- Active root: `runtime-shell-3.2.0`
- Decision: `user-authorization:2026-10-22:super-admin-4.0-freeze`
- Decision background: `docs/rfc/RFC-002-身份认证-统一登录架构与认证专项（Draft）.md`
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-22:super-admin-4.0:architecture-committee` | `2026-10-22T13:08:12+09:00` |
| security | `user-authorization:2026-10-22:super-admin-4.0:security` | `2026-10-22T13:08:12+09:00` |
| sre | `user-authorization:2026-10-22:super-admin-4.0:sre` | `2026-10-22T13:08:12+09:00` |

## Immutable content

- Path: `docs/v4.0-平台超管功能最小实现-设计蓝图.md`
- Raw SHA-256: `7e38ea714f414b71f8b2ebf792322e4f1215a62cb80b70bad43bd3f816f74777`
- Git blob: `6ed11b6e1002a1975a5bf80077537e2428920a2c`
- Git commit: `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`

The commit contains the locked bytes at the registered path.

## State transition

- `super-admin-3.0`: ACTIVE → SUPERSEDED, `effective=false`
- `super-admin-4.0`: registered as ACTIVE, `effective=true`, `rebaseRequired=true`
- Compatibility epoch changes from `2` to `3` because the platform password/TOTP login and setup Runtime Entries are removed and Platform Token delivery changes.
- super-admin-3.0 remains byte-for-byte unchanged:
  - SHA-256: `22d677432aa456cee3de372389ecff306b8718127ad9c3f0a175c208a75baaf6`
  - Git blob: `a88d703389c11dc146ec95d1756175eb336537e1`

`rebaseRequired=true` remains because the persistence review required since runtime-shell 3.1.0 (§7) is not complete; authentication clauses are aligned with runtime-shell 3.2.0. It blocks Implementation Accepted and GA claims until the review is done.

Validator result at registration: `architecture-baseline: PASS: ACTIVE[identity-auth=1.0, frontend=1.2, super-admin=4.0, multi-tenant=5.0, runtime-shell=3.2.0]` with `--require-active --check-instructions --base-ref 289fe504f511bca2cb3d92038b1eff77c3dd4d1e`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
