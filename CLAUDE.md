# Claude Repository Instructions

Follow `AGENTS.md` for all work in this repository.

Before analysis, design, or edits, Claude must read `docs/architecture-baselines.lock.yaml`, run `python3 scripts/validate_architecture_baseline.py --require-active --check-instructions`, read the `ACTIVE` root blueprint and all task-relevant `ACTIVE` specialized blueprints, and declare: `已读取并校验当前仓库架构基线` with the selected versions.

Only `ACTIVE` records may guide new code. `CANDIDATE`, `SUPERSEDED`, `ARCHIVED`, and every document under `docs/archived/` are non-guiding. Never use chat history or internal memory as architecture authority, and never claim `AI 内部记忆已更新`.

If validation fails or a version, hash, inheritance, task-domain, or SSoT conflict is found, `停止施工`, stop before editing, and report it. Never silently modify a frozen blueprint; create and approve a new version through the control plane.