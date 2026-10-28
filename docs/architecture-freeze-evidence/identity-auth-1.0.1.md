# Identity Auth Architecture 1.0.1 Freeze Evidence

> **Domain**: identity-auth
> **Version**: 1.0.1
> **Architecture state**: Architecture Frozen
> **Implementation status**: pending
> **Rebase required**: false
> **Effective date**: 2026-10-28

## Authority

- Active root: `runtime-shell-3.3.0`
- Decision: `user-authorization:2026-10-28:identity-auth-1.0.1-freeze`
- Decision background: `docs/rfc/RFC-008-运行壳-受托写入登记与策略审计写入器（Draft）.md`, approved under `user-authorization:2026-10-28:rfc-008` (`2026-10-28T13:18:15+09:00`). The freeze of the raw bytes in commit `00b2f8fa9c019cd6a487bc8480998876b305e91a` was approved at `2026-10-28T13:37:33+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-28:identity-auth-1.0.1:architecture-committee` | `2026-10-28T13:37:33+09:00` |
| security | `user-authorization:2026-10-28:identity-auth-1.0.1:security` | `2026-10-28T13:37:33+09:00` |
| sre | `user-authorization:2026-10-28:identity-auth-1.0.1:sre` | `2026-10-28T13:37:33+09:00` |

## Immutable content

- Path: `docs/v1.0.1-身份认证功能最小实现-设计蓝图.md`
- Raw SHA-256: `2ee48f3c7eb1ffd208b2c1faf638f97aac8c9675e941f299505c37d9cff21632`
- Git blob: `4052b0acdfd893d7ea5829453e9ec66d173587a2`
- Git commit: `00b2f8fa9c019cd6a487bc8480998876b305e91a`

The commit contains the locked bytes at the registered path.

## State transition

- `identity-auth-1.0.1`: ACTIVE, `effective=true`, `rebaseRequired=false`
- `identity-auth-1.0`: ACTIVE → SUPERSEDED, `effective=false`; its bytes are unchanged:
  - SHA-256: `0908c3731126891b9ede15a58f50e1fbf56de4e0fec61971256561b2384a866a`
  - Git blob: `d1e6eb33c4398593c2485731eb81b160be47b25a`
- Patch revision under runtime-shell §12.2: only the inherited root moves from 3.2.0 to 3.3.0, together with the status lines and the change record. Rules, red lines, the compatibility epoch (`1`) and `rebaseRequired=false` are unchanged. The validator requires every ACTIVE specialized blueprint to inherit the ACTIVE root.

Validator result at registration, with `--require-active --check-instructions --base-ref 00b2f8fa9c019cd6a487bc8480998876b305e91a`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.3.0, identity-auth=1.0.1, frontend=1.2.1, super-admin=4.0.1, multi-tenant=5.1.3] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
