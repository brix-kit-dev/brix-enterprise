# Frontend Architecture 1.2.1 Freeze Evidence

> **Domain**: frontend
> **Version**: 1.2.1
> **Architecture state**: Architecture Frozen
> **Implementation status**: not-assessed
> **Rebase required**: false
> **Effective date**: 2026-10-28

## Authority

- Active root: `runtime-shell-3.3.0`
- Decision: `user-authorization:2026-10-28:frontend-1.2.1-freeze`
- Decision background: `docs/rfc/RFC-008-运行壳-受托写入登记与策略审计写入器（Draft）.md`, approved under `user-authorization:2026-10-28:rfc-008` (`2026-10-28T13:18:15+09:00`). The freeze of the raw bytes in commit `00b2f8fa9c019cd6a487bc8480998876b305e91a` was approved at `2026-10-28T13:37:33+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-28:frontend-1.2.1:architecture-committee` | `2026-10-28T13:37:33+09:00` |
| security | `user-authorization:2026-10-28:frontend-1.2.1:security` | `2026-10-28T13:37:33+09:00` |
| sre | `user-authorization:2026-10-28:frontend-1.2.1:sre` | `2026-10-28T13:37:33+09:00` |

The approval prompt showed this file's SHA-256 with a wrong suffix (`c56a8bce`). The approval named commit `00b2f8f`; the bytes registered here are the bytes in that commit.

## Immutable content

- Path: `docs/v1.2.1-前端架构-设计蓝图.md`
- Raw SHA-256: `c5ffd5390d765e017ac14c4020fe4234fe22fe8e97644ca4f55c1be99ed96fac`
- Git blob: `71d0de056cb78e6999f856c3588133e6f654e7e3`
- Git commit: `00b2f8fa9c019cd6a487bc8480998876b305e91a`

The commit contains the locked bytes at the registered path.

## State transition

- `frontend-1.2.1`: ACTIVE, `effective=true`, `rebaseRequired=false`
- `frontend-1.2`: ACTIVE → SUPERSEDED, `effective=false`; its bytes are unchanged:
  - SHA-256: `bff96b4ba558320fd23e5d6b1aed74618a81c534493e8da559043f070916ec91`
  - Git blob: `001843ca587b5b209811f8d54261946cae91903f`
- Patch revision under runtime-shell §12.2: only the inherited root moves from 3.2.0 to 3.3.0, together with the status lines and the change record. Rules, red lines, the compatibility epoch (`1`) and `rebaseRequired=false` are unchanged. The validator requires every ACTIVE specialized blueprint to inherit the ACTIVE root.

Validator result at registration, with `--require-active --check-instructions --base-ref 00b2f8fa9c019cd6a487bc8480998876b305e91a`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.3.0, identity-auth=1.0.1, frontend=1.2.1, super-admin=4.0.1, multi-tenant=5.1.3] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
