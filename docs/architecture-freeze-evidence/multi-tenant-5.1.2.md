# Multi Tenant Architecture 5.1.2 Freeze Evidence

> **Domain**: multi-tenant
> **Version**: 5.1.2
> **Architecture state**: Architecture Frozen
> **Implementation status**: pending
> **Rebase required**: true
> **Effective date**: 2026-10-27

## Authority

- Active root: `runtime-shell-3.2.0`
- Decision: `user-authorization:2026-10-27:multi-tenant-5.1.2-freeze`
- Decision background: `docs/rfc/RFC-005-多租户-全局表清单与跨租户访问登记（Draft）.md`, ruled under `user-authorization:2026-10-27:rfc-005-ruling` (option A for the post-setup invitation resend)
- Reviewer identity: `jsq`

Approvals:

| Role | Record | Approved at |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-27:multi-tenant-5.1.2:architecture-committee` | `2026-10-27T17:59:17+09:00` |
| security | `user-authorization:2026-10-27:multi-tenant-5.1.2:security` | `2026-10-27T17:59:17+09:00` |
| sre | `user-authorization:2026-10-27:multi-tenant-5.1.2:sre` | `2026-10-27T17:59:17+09:00` |

## Immutable content

- Path: `docs/v5.1.2-多租户功能最小实现-设计蓝图.md`
- Raw SHA-256: `fb0b9f26704f76afc8bad41433bcd51831b28872bedeb692aad3a164a356cceb`
- Git blob: `e35b88fe3894f4d973a31b07abb0a099365281c6`
- Git commit: `3aaf4c4ed374e8f6cc2b586051cadbcc359d0c07`

The commit contains the locked bytes at the registered path.

## State transition

- `multi-tenant-5.1.2`: CANDIDATE (candidate bytes from `2ef85cfb8cd1eebe4d16dd2febc2c3133eb77b45`, registered in `e63fe29`) → ACTIVE, `effective=true`, `rebaseRequired=true`
- `multi-tenant-5.1.1`: ACTIVE → SUPERSEDED, `effective=false`
- Patch revision under runtime-shell 3.2.0 §12.2: a correction that does not change observable contracts or red lines. The compatibility epoch stays `3`. v5.1.2 makes three changes:
  - adds `sys_setup_token` and `sys_bootstrap_state`, the two global tables super-admin 4.0 defines, to the §6.1 whitelist, and makes §6.1 the persistence adapter's global-table register;
  - registers every allowed cross-tenant access in the new §6.4 and forbids the rest;
  - states that `TenantInterceptor` means the adapter's ORM-level tenant filter.

  DDL, red lines T-1 to T-30, token structure and the permission catalog are unchanged.
- multi-tenant-5.1.1 remains byte-for-byte unchanged:
  - SHA-256: `a36e48707a0797c6c7210208b779f7c02896c8a8e5b000d8fbfde4e0f42d094a`
  - Git blob: `e6bbdfaffcabb41a05425c1508f6973431f3a825`

`rebaseRequired=true` remains because the persistence review required since runtime-shell 3.1.0 (§7) is not complete. It blocks Implementation Accepted and GA claims until the review is done.

Validator result at registration:

- With `--require-active --check-instructions --base-ref 3aaf4c4ed374e8f6cc2b586051cadbcc359d0c07`: `architecture-baseline: PASS: ACTIVE[identity-auth=1.0, frontend=1.2, super-admin=4.0, runtime-shell=3.2.0, multi-tenant=5.1.2] CANDIDATE(non-guiding)[none]`.
- With `--base-ref e63fe29` (the CANDIDATE → ACTIVE transition): the same result.

Architecture Frozen records an approved architecture authority. It does not assert implementation conformance, Implementation Accepted, or GA.
