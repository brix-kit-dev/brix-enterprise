# Frontend Architecture 1.2.2 Freeze Evidence

> **Domain**: frontend
> **Version**: 1.2.2
> **Architecture state**: Architecture Frozen
> **Implementation status**: not-assessed
> **Rebase required**: false
> **Effective date**: 2026-11-14

## Authority

- Active root: `runtime-shell-3.4.0`
- Decision: `user-authorization:2026-11-14:frontend-1.2.2-freeze`
- Decision background: `docs/rfc/RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-009` (`2026-11-13T21:06:32+09:00`). The freeze of the raw bytes in commit `5cd72d6d04d426dca1f916e59c908b0601642a2c` was approved at `2026-11-14T11:34:07+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-14:frontend-1.2.2:architecture-committee` | `2026-11-14T11:34:07+09:00` |
| security | `user-authorization:2026-11-14:frontend-1.2.2:security` | `2026-11-14T11:34:07+09:00` |
| sre | `user-authorization:2026-11-14:frontend-1.2.2:sre` | `2026-11-14T11:34:07+09:00` |

## Immutable content

- Path: `docs/v1.2.2-前端架构-设计蓝图.md`
- Raw SHA-256: `1145bb59c65c3f0c7959cc948ae735180d3c692171e699caaa86a4b77874decf`
- Git blob: `cfd2dcd7f361d34a99b2919c49e48d57d0e7d730`
- Git commit: `5cd72d6d04d426dca1f916e59c908b0601642a2c`

The commit contains the locked bytes at the registered path.

## State transition

- `frontend-1.2.2`: CANDIDATE → ACTIVE, `effective=true`, `rebaseRequired=false`
- `frontend-1.2.1`: ACTIVE → SUPERSEDED, `effective=false`, moved to `docs/archived/v1.2.1-前端架构-设计蓝图.md`; its bytes are unchanged:
  - SHA-256: `c5ffd5390d765e017ac14c4020fe4234fe22fe8e97644ca4f55c1be99ed96fac`
  - Git blob: `71d0de056cb78e6999f856c3588133e6f654e7e3`
- Patch revision under runtime-shell §12.2: it inherits runtime-shell 3.4.0 and fixes two stale references (the identity-auth link points at 1.1.0; appendix A no longer lists four documents that no longer exist) (RFC-009 §3). Rules, red lines, the compatibility epoch (`1`) and `rebaseRequired=false` are unchanged; §9 records the change.

Validator result at registration, with `--require-active --check-instructions --base-ref e9ae09fbe27dde8cdbf9c75e1ac43444ad971b58`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.4.0, identity-auth=1.1.0, frontend=1.2.2, multi-tenant=5.1.4, super-admin=5.0.0] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
