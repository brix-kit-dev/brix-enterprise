# Runtime Shell Architecture 3.4.0 Freeze Evidence

> **Domain**: runtime-shell
> **Version**: 3.4.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: non-conformant
> **Rebase required**: false
> **Effective date**: 2026-11-14

## Authority

- Active root: `runtime-shell-3.4.0`
- Decision: `user-authorization:2026-11-14:runtime-shell-3.4.0-freeze`
- Decision background: `docs/rfc/RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-009` (`2026-11-13T21:06:32+09:00`); `docs/rfc/RFC-010-运行壳-先做访问检查再校验请求（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-010` (`2026-11-13T21:06:32+09:00`); `docs/rfc/RFC-012-运行壳-通知的送达语义（Draft）.md`, approved under `user-authorization:2026-11-13:rfc-012` (`2026-11-13T21:06:32+09:00`). The freeze of the raw bytes in commit `5cd72d6d04d426dca1f916e59c908b0601642a2c` was approved at `2026-11-14T11:34:07+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-14:runtime-shell-3.4.0:architecture-committee` | `2026-11-14T11:34:07+09:00` |
| security | `user-authorization:2026-11-14:runtime-shell-3.4.0:security` | `2026-11-14T11:34:07+09:00` |
| sre | `user-authorization:2026-11-14:runtime-shell-3.4.0:sre` | `2026-11-14T11:34:07+09:00` |

## Immutable content

- Path: `docs/v3.4.0-运行壳架构设计蓝图.md`
- Raw SHA-256: `0f7d7b7bad58354dc5228d91c7ac42772e0199e072d3935111a5cc9df17a96d8`
- Git blob: `cfba349a55f73fab04b70b8f4531b18c83ac3d90`
- Git commit: `5cd72d6d04d426dca1f916e59c908b0601642a2c`

The commit contains the locked bytes at the registered path.

## State transition

- `runtime-shell-3.4.0`: CANDIDATE → ACTIVE, `effective=true`, `rebaseRequired=false`
- `runtime-shell-3.3.0`: ACTIVE → SUPERSEDED, `effective=false`, moved to `docs/archived/v3.3.0-运行壳架构设计蓝图.md`; its bytes are unchanged:
  - SHA-256: `2ab132bfde67330e161b3b53bf3d03de8b7066864f1850cb71efc23ed47d769b`
  - Git blob: `996ff8270cf9fb56a9196b70498b7ab353addd9d`
- Minor revision under runtime-shell 3.3.0 §12.2 (RFC-009, RFC-010, RFC-012). The compatibility epoch stays `1`. v3.4.0 rewrites MESSAGE-014 (request fingerprint, result and status of command idempotency), adds MESSAGE-030 and MESSAGE-031 (§6.3), puts the access checks before request normalization and schema validation in MANIFEST-022 (§5.4), adds ERROR-017 (delivery semantics of `NotificationCapability`) and the Notification row of §4.7, syncs appendix A, updates the specialized versions and stale references of §0.6, appendix A and appendix B (RFC-009 §3) and records the ruling in BRX-RS-GOVERNANCE-027. The rest of the text is v3.3.0.

Validator result at registration, with `--require-active --check-instructions --base-ref e9ae09fbe27dde8cdbf9c75e1ac43444ad971b58`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.4.0, identity-auth=1.1.0, frontend=1.2.2, multi-tenant=5.1.4, super-admin=5.0.0] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
