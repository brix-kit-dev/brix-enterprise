# Frontend Architecture 1.1 Changelog

> **Effective date**: 2026-07-27
> **Previous version**: frontend 1.0
> **Current version**: frontend 1.1
> **Compatibility epoch**: 1
> **Architecture state**: Architecture Frozen
> **Implementation status**: not-assessed

## Decision

Frontend 1.1 uses the complete frontend 1.0 document as its detailed base and incorporates the root-aligned 1.1 constraints. The user authorized the architecture freeze on 2026-07-27. The repository reviewer identity is `jsq`.

## Changes

1. Added the mandatory Page → Hook/ViewModel → Repository → Http/Query Capability dependency direction.
2. Added single Shared Runtime and strict Module Federation admission rules.
3. Added Route/Guard rules for Platform, Actor, Subject, and Bootstrap Setup security domains.
4. Added no-referrer and in-memory-only security-token requirements.
5. Added loading, refresh, error, empty, cancellation, duplicate-submission, and form-validation states.
6. Replaced reused root A/S identifiers with frontend-owned FE-1 through FE-12 red lines.
7. Removed direct Runtime registration and release-time workspace-link examples.
8. Replaced grep-based implementation acceptance claims with evidence-bound verification gates.
9. Retained the detailed UIAdapter inventory, Design Tokens model, MUI migration guide, component mapping, naming map, FAQ, and industry comparison from frontend 1.0.

## Locked content

- Raw SHA-256: `1ba8246c70bb4417cc6b826ca76bcea369b7f6f11a868b65ba0a2599c4d900c2`
- Git blob: `6208231fbbee7abd927727083512d84b3cbfad5b`

Frontend 1.0 remains byte-for-byte unchanged as the historical superseded record. Architecture Frozen does not imply Implementation Accepted or GA.
