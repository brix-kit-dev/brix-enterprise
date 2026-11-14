# Identity Auth Architecture 1.1.0 Freeze Evidence

> **Domain**: identity-auth
> **Version**: 1.1.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: pending
> **Rebase required**: false
> **Effective date**: 2026-11-14

## Authority

- Active root: `runtime-shell-3.4.0`
- Decision: `user-authorization:2026-11-14:identity-auth-1.1.0-freeze`
- Decision background: `docs/rfc/RFC-013-超管-Bootstrap会话交给BFF（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-013` (`2026-11-13T21:06:32+09:00`); `docs/rfc/RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-009` (`2026-11-13T21:06:32+09:00`). The freeze of the raw bytes in commit `5cd72d6d04d426dca1f916e59c908b0601642a2c` was approved at `2026-11-14T11:34:07+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-14:identity-auth-1.1.0:architecture-committee` | `2026-11-14T11:34:07+09:00` |
| security | `user-authorization:2026-11-14:identity-auth-1.1.0:security` | `2026-11-14T11:34:07+09:00` |
| sre | `user-authorization:2026-11-14:identity-auth-1.1.0:sre` | `2026-11-14T11:34:07+09:00` |

## Immutable content

- Path: `docs/v1.1.0-身份认证功能最小实现-设计蓝图.md`
- Raw SHA-256: `dd2d1cd16d9ec264d8c0e36b856032bec57942e4eb570df040272d50bb6e79c1`
- Git blob: `4c3a76e9c4382bc6687ddf9f48088e598c998d90`
- Git commit: `5cd72d6d04d426dca1f916e59c908b0601642a2c`

The commit contains the locked bytes at the registered path.

## State transition

- `identity-auth-1.1.0`: CANDIDATE → ACTIVE, `effective=true`, `rebaseRequired=false`
- `identity-auth-1.0.1`: ACTIVE → SUPERSEDED, `effective=false`, moved to `docs/archived/v1.0.1-身份认证功能最小实现-设计蓝图.md`; its bytes are unchanged:
  - SHA-256: `2ee48f3c7eb1ffd208b2c1faf638f97aac8c9675e941f299505c37d9cff21632`
  - Git blob: `4052b0acdfd893d7ea5829453e9ec66d173587a2`
- Minor revision under runtime-shell §12.2: it inherits runtime-shell 3.4.0 (RFC-009 §3), adds `BRX-IA-ONBOARD-004` and `BootstrapSessionCapability` in the §2 L2A contracts (RFC-013 §3) and names sibling blueprints in §0.2 without versions (RFC-009 §3 addendum). The other rules, the red lines, the compatibility epoch (`1`) and `rebaseRequired=false` are unchanged; appendix C records the change.

Validator result at registration, with `--require-active --check-instructions --base-ref e9ae09fbe27dde8cdbf9c75e1ac43444ad971b58`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.4.0, identity-auth=1.1.0, frontend=1.2.2, multi-tenant=5.1.4, super-admin=5.0.0] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
