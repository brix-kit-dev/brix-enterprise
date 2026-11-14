# Super Admin Architecture 5.0.0 Freeze Evidence

> **Domain**: super-admin
> **Version**: 5.0.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: not-assessed
> **Rebase required**: true
> **Effective date**: 2026-11-14

## Authority

- Active root: `runtime-shell-3.4.0`
- Decision: `user-authorization:2026-11-14:super-admin-5.0.0-freeze`
- Decision background: `docs/rfc/RFC-013-超管-Bootstrap会话交给BFF（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-013` (`2026-11-13T21:06:32+09:00`); `docs/rfc/RFC-012-运行壳-通知的送达语义（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-012` (`2026-11-13T21:06:32+09:00`); `docs/rfc/RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-009` (`2026-11-13T21:06:32+09:00`). The freeze of the raw bytes in commit `5cd72d6d04d426dca1f916e59c908b0601642a2c` was approved at `2026-11-14T11:34:07+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-14:super-admin-5.0.0:architecture-committee` | `2026-11-14T11:34:07+09:00` |
| security | `user-authorization:2026-11-14:super-admin-5.0.0:security` | `2026-11-14T11:34:07+09:00` |
| sre | `user-authorization:2026-11-14:super-admin-5.0.0:sre` | `2026-11-14T11:34:07+09:00` |

## Immutable content

- Path: `docs/v5.0.0-平台超管功能最小实现-设计蓝图.md`
- Raw SHA-256: `a91c9a23ae008ad5b19f6ec6999edd8a9af99019ba17e3dca7e678a85a7b651c`
- Git blob: `a86526e1d376e5aa305fe7905b49b04d9546b137`
- Git commit: `5cd72d6d04d426dca1f916e59c908b0601642a2c`

The commit contains the locked bytes at the registered path.

## State transition

- `super-admin-5.0.0`: CANDIDATE → ACTIVE, `effective=true`, `rebaseRequired=true`
- `super-admin-4.0.1`: ACTIVE → SUPERSEDED, `effective=false`, moved to `docs/archived/v4.0.1-平台超管功能最小实现-设计蓝图.md`; its bytes are unchanged:
  - SHA-256: `a2cd70e7580ec822ecb1c0bb912b0b52dfed044eba37527a999688be99f39689`
  - Git blob: `0ac2a98b5dfcc0deb3a5e43ad121ed6d94be5439`
- Major revision under runtime-shell §12.2 and GOVERNANCE-008 (RFC-013): the Bootstrap session moves to the BFF and the §6 table drops `POST /api/platform/bootstrap/session`. The compatibility epoch moves from `3` to `4`; the migration plan is RFC-013 §4 and §6, and the notice period ran from the RFC-013 draft on main (2026-11-09) to this release (RFC-013 §5, D128). The same version inherits runtime-shell 3.4.0, refers to root ERROR-017 for notification delivery (RFC-012 §3), states D95 in BOOT-004 and fixes ten dead links (RFC-009 §3). `rebaseRequired=true` is unchanged; §18.0b records the change.

Validator result at registration, with `--require-active --check-instructions --base-ref e9ae09fbe27dde8cdbf9c75e1ac43444ad971b58`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.4.0, identity-auth=1.1.0, frontend=1.2.2, multi-tenant=5.1.4, super-admin=5.0.0] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
