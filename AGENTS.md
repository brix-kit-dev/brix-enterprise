# Brix Architecture Context

These instructions apply to every analysis, design, documentation, and code task in this repository.

## Mandatory preflight

Before analyzing or changing files:

1. Read `docs/architecture-baselines.lock.yaml` as JSON. It is the machine-readable architecture status registry.
2. Run `python3 scripts/validate_architecture_baseline.py --require-active --check-instructions` from the repository root.
3. Select the single `ROOT` blueprint whose status is `ACTIVE` and read that document.
4. Select and read every task-relevant `SPECIALIZED` blueprint whose status is `ACTIVE`.
5. State the selected root and specialized versions before presenting conclusions or editing files. Use the declaration: `已读取并校验当前仓库架构基线`.

Do not rely on chat history, summaries, cached context, or internal memory as architecture authority. Never claim that `AI 内部记忆已更新`; only report that the current repository baseline was read and validated.

## Authority and stop rules

- Only `ACTIVE` records may guide new code.
- `CANDIDATE`, `SUPERSEDED`, and `ARCHIVED` records are review or historical evidence and must not guide implementation.
- A document under `docs/archived/` must never guide implementation, including a registered candidate.
- Authority order is the active root blueprint, then an applicable active specialized blueprint, then implementation plans and code evidence.
- A specialized blueprint may narrow its domain but must not override its declared root inheritance.
- `rebaseRequired=true` does not revoke an explicitly `ACTIVE` architecture record, but it blocks claims of `Implementation Accepted` or `GA` and must be disclosed.
- On any missing file, validation failure, hash mismatch, ambiguous task domain, version conflict, inheritance conflict, or SSoT conflict: `停止施工`, stop before editing, and report the conflict. Do not choose a convenient version.

## Domain selection

- Frontend shells, web/mobile UI, BrixUI, routing, and design tokens require the active `frontend` blueprint.
- Platform administrator identity, bootstrap, login, permissions, or `/api/platform/**` work requires the active `super-admin` blueprint.
- Tenant identity, isolation, tenant data, context selection, tenant token, or `app-tenant` work requires the active `multi-tenant` blueprint.
- Authentication, login, credentials, MFA, sessions, hosted login pages, BFF, or identity-provider work requires the active `identity-auth` blueprint; platform administrator or tenant login work also reads `super-admin` or `multi-tenant`.
- Cross-domain work must read every affected active specialized blueprint and apply the strictest compatible rule.

## Frozen blueprint governance

Never silently modify an active frozen blueprint. An architecture change requires a new versioned document, a new hash-locked registry record, an explicit state transition for the old record, and the required review evidence. Plans, prompts, source comments, tests, and AI responses cannot override the registry.