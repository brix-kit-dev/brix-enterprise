# Runtime Shell Architecture 3.3.0 Freeze Evidence

> **Domain**: runtime-shell
> **Version**: 3.3.0
> **Architecture state**: Architecture Frozen
> **Implementation status**: non-conformant
> **Rebase required**: false
> **Effective date**: 2026-10-28

## Authority

- Active root: `runtime-shell-3.3.0`
- Decision: `user-authorization:2026-10-28:runtime-shell-3.3.0-freeze`
- Decision background: `docs/rfc/RFC-008-运行壳-受托写入登记与策略审计写入器（Draft）.md`, approved under `user-authorization:2026-10-28:rfc-008` (`2026-10-28T13:18:15+09:00`). The freeze of the raw bytes in commit `00b2f8fa9c019cd6a487bc8480998876b305e91a` was approved at `2026-10-28T13:37:33+09:00`.
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-28:runtime-shell-3.3.0:architecture-committee` | `2026-10-28T13:37:33+09:00` |
| security | `user-authorization:2026-10-28:runtime-shell-3.3.0:security` | `2026-10-28T13:37:33+09:00` |
| sre | `user-authorization:2026-10-28:runtime-shell-3.3.0:sre` | `2026-10-28T13:37:33+09:00` |

## Immutable content

- Path: `docs/v3.3.0-运行壳架构设计蓝图.md`
- Raw SHA-256: `2ab132bfde67330e161b3b53bf3d03de8b7066864f1850cb71efc23ed47d769b`
- Git blob: `996ff8270cf9fb56a9196b70498b7ab353addd9d`
- Git commit: `00b2f8fa9c019cd6a487bc8480998876b305e91a`

The commit contains the locked bytes at the registered path.

## State transition

- `runtime-shell-3.3.0`: ACTIVE, `effective=true`, `rebaseRequired=false`
- `runtime-shell-3.2.0`: ACTIVE → SUPERSEDED, `effective=false`; its bytes are unchanged:
  - SHA-256: `38c2db6645cec798c33b2c0371fa92f098ea89e764cad16caabc757258278139`
  - Git blob: `330dc066034816e38dc3343c0316c119d3c26f39`
- Minor revision under runtime-shell 3.2.0 §12.2 (new backward-compatible Manifest registration). The compatibility epoch stays `1`. v3.3.0 adds §7.8 (BRX-RS-DATA-045 to DATA-047, BRX-RS-MANIFEST-031), the `manifest.custodialWrites` definition in appendix A, the appendix B note and ruling record BRX-RS-GOVERNANCE-026. The rest of the text is v3.2.0.

Validator result at registration, with `--require-active --check-instructions --base-ref 00b2f8fa9c019cd6a487bc8480998876b305e91a`: `architecture-baseline: PASS: ACTIVE[runtime-shell=3.3.0, identity-auth=1.0.1, frontend=1.2.1, super-admin=4.0.1, multi-tenant=5.1.3] CANDIDATE(non-guiding)[none]`.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
