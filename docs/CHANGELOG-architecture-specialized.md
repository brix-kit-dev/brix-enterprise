# Specialized Architecture Changelog

## 2026-07-27

### Frontend 1.1 Architecture Frozen

- Supersession target: `frontend-1.0`.
- Compatibility epoch remains `1` because the public layering direction is retained and tightened.
- Uses the complete frontend 1.0 document as its detailed base and retains the UIAdapter inventory, Design Tokens model, migration guide, component mapping, naming map, FAQ, and industry comparison.
- Replaces the outdated sections with the single Runtime Shell, Page → Hook/ViewModel → Repository → Http/Query Capability, BrixUI/useUI, explicit Route/Guard security domains, no-referrer security-link handling, frontend-owned FE redlines, and evidence-bound acceptance matrix.
- Removes direct Runtime registration and release-time workspace-link examples; Host composition and frontend BOM now own provider selection and version alignment.
- Reclassifies the former v1.0 green implementation matrix as evidence requiring revalidation rather than inherited architecture acceptance.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-07-27:frontend-1.1-freeze`.
- Locked at commit `55c6e13d42d60bd09a481c6cbee2c0a57f878de1`, SHA-256 `1ba8246c70bb4417cc6b826ca76bcea369b7f6f11a868b65ba0a2599c4d900c2`, effective 2026-07-27.
- Registered as the unique ACTIVE frontend blueprint; frontend 1.0 is SUPERSEDED and remains byte-for-byte unchanged.

### Super Admin 3.0 Architecture Frozen

- Supersession target: `super-admin-2.0`.
- Compatibility epoch changes from `1` to `2` because the L2C/Spring business path is removed.
- Rebuilt from the complete 926-line super-admin 2.0 blueprint rather than retaining the former concise candidate; detailed data model, permissions, endpoint inventory, flows, UI, security, implementation order, acceptance matrix and appendices were retained and rebased as an integrated 3.0 document.
- Reclassifies `platform-admin` as L2B `platform-operational`, requires descriptor/ServiceLoader discovery, and routes all Data Owner access through four frozen `OperationalContext` internal contracts.
- Removes startup Runner/listener business writes and the database Bootstrap user; Stage A now begins only after B3 and uses a SecretCapability/security-profile code to obtain a short-lived, one-time `BOOTSTRAP_SETUP` session.
- Removes the dev-only setup URL response, common bypass permission, fixed password/hash/TTL/lockout parameters, direct Notification/Repository/Service access, and private event publication.
- Adds platform tenant creation and FIRST_OWNER invitation lifecycle while preserving tenant Owner transactions, canonical Event/Outbox semantics, and the rule that a platform administrator never becomes a tenant member.
- Updates frontend coverage to Page → Hook → Repository → HttpCapability with BrixUI/useUI, isolated Platform/Actor/Subject/Bootstrap guards, no-referrer handling, and complete loading/error/empty/validation states.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-07-27:super-admin-3.0-freeze`.
- Locked at commit `5eb15aad06607ca6d5f44a7b0f920e4d399ff0e7`, SHA-256 `22d677432aa456cee3de372389ecff306b8718127ad9c3f0a175c208a75baaf6`, Git blob `a88d703389c11dc146ec95d1756175eb336537e1`, effective 2026-07-27.
- Registered as the unique ACTIVE super-admin blueprint; super-admin 2.0 is SUPERSEDED and its historical bytes remain unchanged.

### Multi Tenant 4.0 Architecture Frozen

- Supersession target: `multi-tenant-3.1.3`.
- Compatibility epoch changes from `1` to `2` because unregistered platform Capabilities and the private event envelope are removed.
- Rebuilt from the complete 1,392-line v3.1.3 base into a 1,463-line integrated blueprint; preserves detailed DDL, Actor/Subject token flows, context selection, isolation, FIRST_OWNER concurrency, roadmap and terminology rather than retaining the former summary-only Candidate.
- Freezes OSS `platform-tenant` as the sole Data Owner for the platform tenant directory, retains only Catalog-registered `TenantContextCapability`, replaces directory/quota/config/business-object platform Capabilities with typed Plugin contracts, and adopts the root canonical Event Envelope and Outbox/Inbox/Relay semantics.
- Freezes `platform-admin OperationalContext -> brix.internal.tenant.administration -> platform-tenant local transaction`, Runtime Entry/Manifest/ServiceLoader boundaries, monotonic Flyway governance, frontend 1.1 Page/Hook/Repository/HttpCapability rules, and explicit audit/Timeline ownership.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-07-27:multi-tenant-4.0-freeze`.
- Locked at commit `2eff43cde17797eb34f5e99e17f55ef5b7126dad`, SHA-256 `70a68b4fde9825dc810df392dbca16aa87d019e99e3561ac12f3333214f84439`, Git blob `7021d98d7c28fb7560385facc48d83f1dd7f67bf`, effective 2026-07-27.
- Registered as the unique ACTIVE multi-tenant blueprint; multi-tenant 3.1.3 is SUPERSEDED and remains byte-for-byte unchanged.

### Notification Plan 3.2.1 Draft

- Supersession target after review: the frozen v3.2.0 implementation plan.
- Moves notification orchestration behind `platform-admin → OperationalContext → internal contract → Data Owner local transaction`.
- Classifies `platform-notification` as the L2B Capability policy/provider and SMTP as the L2C Adapter.
- Adds the FIRST_OWNER template resources required by the Bootstrap flow and removes reliance on unregistered `TenantConfigCapability`.

The remaining candidates and drafts listed above are not ACTIVE architecture authorities or implementation acceptance records. Architecture Frozen records still require separate implementation evidence before `Implementation Accepted / GA`.
