# Runtime Shell Architecture 3.2.0 Freeze Evidence

> **Domain**: runtime-shell
> **Version**: 3.2.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: non-conformant
> **Rebase required**: false
> **Effective date**: 2026-10-22

## Authority

- Kind: ROOT (unique active root)
- Decision: `user-authorization:2026-10-22:runtime-shell-3.2.0-freeze`
- Decision background: `docs/rfc/RFC-002-身份认证-统一登录架构与认证专项（Draft）.md`
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-22:runtime-shell-3.2.0:architecture-committee` | `2026-10-22T13:08:12+09:00` |
| security | `user-authorization:2026-10-22:runtime-shell-3.2.0:security` | `2026-10-22T13:08:12+09:00` |
| sre | `user-authorization:2026-10-22:runtime-shell-3.2.0:sre` | `2026-10-22T13:08:12+09:00` |

## Immutable content

- Path: `docs/v3.2.0-运行壳架构设计蓝图.md`
- Raw SHA-256: `38c2db6645cec798c33b2c0371fa92f098ea89e764cad16caabc757258278139`
- Git blob: `330dc066034816e38dc3343c0316c119d3c26f39`
- Git commit: `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`

The commit contains the locked bytes at the registered path.

## State transition

- `runtime-shell-3.1.0`: ACTIVE → SUPERSEDED, `effective=false`
- `runtime-shell-3.2.0`: registered as ACTIVE, `effective=true`, `rebaseRequired=false`
- Compatibility epoch remains `1`.
- runtime-shell-3.1.0 remains byte-for-byte unchanged:
  - SHA-256: `33016713f2c6dd5638d32fce4772725718fd73d23cdea715688d9b72b3412d33`
  - Git blob: `adf116f1c81a99049ff97ed351a656cd9010a4d0`

Validator result at registration: `architecture-baseline: PASS: ACTIVE[identity-auth=1.0, frontend=1.2, super-admin=4.0, multi-tenant=5.0, runtime-shell=3.2.0]` with `--require-active --check-instructions --base-ref 289fe504f511bca2cb3d92038b1eff77c3dd4d1e`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
