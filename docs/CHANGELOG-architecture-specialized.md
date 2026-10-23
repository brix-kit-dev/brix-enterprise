# Specialized Architecture Changelog

## 2026-10-23

### Multi Tenant 5.1 Architecture Frozen

- Supersession target: `multi-tenant-5.0`.
- Compatibility epoch remains `3`: adds tenant authorization without changing member, principal, token structure, DDL or isolation semantics.
- Adds §9.8 tenant minimal RBAC (`BRX-TENANT-AUTHZ-001` to `012`): permission codes only from plugin manifests; built-in Actor (OWNER, ADMIN, MEMBER) and Subject (CUSTOMER, GUEST) roles; default grants declared next to each permission; an immutable grant table built at H3/B2; request-time expansion of `mtype`/`ptype` with no trusted permission list in tokens; `TENANT`/`SELF` data scopes delivered to handlers in the access decision (`BRX-TENANT-CONTRACT-007`); Subject roles limited to `SELF`; tenant endpoints accept either actor or subject tokens (`tenant-actor` / `tenant-subject`); tenant console permission catalog for `platform-tenant`.
- Adds red lines T-29 and T-30; T-11 and T-22 keep their meaning and gain startup gates; adds implementation item I11.
- Keeps `rebaseRequired=true` because the persistence review required since runtime-shell 3.1.0 is not complete.
- Decision background: RFC-003, ruled under `user-authorization:2026-10-23:rfc-003-ruling`.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-10-23:multi-tenant-5.1-freeze`.
- Locked at commit `3d726a0eeb7ac1bee8bcfa98680f3ff0356ad8ce`, SHA-256 `5bd94f07d37f5e51c1fec03daf1e08ceecca818edad9cdb8cee0c6c1f5bd8179`, Git blob `1c6f40dd722b6858298b0206348795e8fdf8fa2c`, effective 2026-10-23.
- Registered as the unique ACTIVE multi-tenant blueprint; multi-tenant 5.0 is SUPERSEDED and remains byte-for-byte unchanged.

## 2026-10-22

### Identity Auth 1.0 Architecture Frozen

- New specialized domain `identity-auth`; no supersession target. Decision background: RFC-002.
- Becomes the single specialized SSoT for how platform administrators, tenant staff and end users authenticate: three client classes, hosted login with identifier-first flow, credentials (password, passkey, TOTP, recovery codes, SMS/email codes, third-party login layer with Google first), assurance levels `brix:aal1` / `brix:aal2` / `brix:aal2-phr`, trusted devices, layered sessions, onboarding, recovery, abuse controls and authentication audit; red lines IA-1 to IA-7.
- All tenant staff must use two factors; platform administrators must use phishing-resistant authenticators on every authentication.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-10-22:identity-auth-1.0-freeze`.
- Locked at commit `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`, SHA-256 `0908c3731126891b9ede15a58f50e1fbf56de4e0fec61971256561b2384a866a`, Git blob `d1e6eb33c4398593c2485731eb81b160be47b25a`, effective 2026-10-22.
- Registered as the unique ACTIVE identity-auth blueprint; `requiredActiveDomains` now includes `identity-auth`.

### Super Admin 4.0 Architecture Frozen

- Supersession target: `super-admin-3.0`.
- Compatibility epoch changes from `2` to `3`: platform login moves to the identity protocol surface as the `platform-console` client; the `/api/platform/auth/login`, `/login/totp`, `/setup/*` and `/api/platform/admins/me/change-password` Runtime Entries are removed.
- Platform authentication requires `brix:aal2-phr` (passkey or hardware security key); TOTP is recovery only; setup registers a passkey and recovery codes; Platform Token claims use `acr`/`amr`/`auth_time`/`sid`; adds `BRX-SA-AUTH-007` step-up, `BRX-SA-SEC-013`, `BRX-SA-SEC-014` and red line SA-13.
- Keeps `rebaseRequired=true` because the persistence review required since runtime-shell 3.1.0 is not complete.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-10-22:super-admin-4.0-freeze`.
- Locked at commit `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`, SHA-256 `7e38ea714f414b71f8b2ebf792322e4f1215a62cb80b70bad43bd3f816f74777`, Git blob `6ed11b6e1002a1975a5bf80077537e2428920a2c`, effective 2026-10-22.
- Registered as the unique ACTIVE super-admin blueprint; super-admin 3.0 is SUPERSEDED and remains byte-for-byte unchanged.

### Multi Tenant 5.0 Architecture Frozen

- Supersession target: `multi-tenant-4.0`.
- Compatibility epoch changes from `2` to `3`: tenant staff and end users log in through the `tenant-console` and brand-app clients of the identity protocol surface; `/api/auth/login/actor` and `/api/auth/login/subject` are no longer public APIs.
- Login-time discovery, one-time selection tickets and stable `contextId` semantics are preserved and executed inside the authentication service; context switching and refresh go through the BFF; adds §9.7 staff MFA policy (`BRX-TENANT-AUTH-001`, `BRX-TENANT-AUTH-002`) and implementation item I10.
- Keeps `rebaseRequired=true` because the persistence review required since runtime-shell 3.1.0 is not complete.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-10-22:multi-tenant-5.0-freeze`.
- Locked at commit `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`, SHA-256 `90a5cf442221cd5bca4bd92d26342c1df9fa0900b028e68997bd55de247b8d4f`, Git blob `a003f3736afbf40f98bca96ebcc2b8a4d89ba004`, effective 2026-10-22.
- Registered as the unique ACTIVE multi-tenant blueprint; multi-tenant 4.0 is SUPERSEDED and remains byte-for-byte unchanged.

### Frontend 1.2 Architecture Frozen

- Supersession target: `frontend-1.1`.
- Compatibility epoch remains `1`.
- Adds §2.3a: session state only from the BFF, no Access/Refresh Token in the browser, unified step-up and session-expiry redirects, hosted login pages with strict CSP and no third-party scripts, no credential pages in consoles (`BRX-FE-AUTH-002` to `005`); adds red line FE-13; completes the confirmation review for runtime-shell 3.1.0.
- Approved by architecture-committee, security, and sre under `user-authorization:2026-10-22:frontend-1.2-freeze`.
- Locked at commit `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`, SHA-256 `bff96b4ba558320fd23e5d6b1aed74618a81c534493e8da559043f070916ec91`, Git blob `001843ca587b5b209811f8d54261946cae91903f`, effective 2026-10-22.
- Registered as the unique ACTIVE frontend blueprint; frontend 1.1 is SUPERSEDED and remains byte-for-byte unchanged.

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
