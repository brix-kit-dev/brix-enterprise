# Case Management Module (app-case)

Domain module for case lifecycle management — creation, assignment, status tracking, and resolution.

## Module Layout

| Sub-module | Purpose |
|---|---|
| `case-api` | OpenAPI contract, DTOs, shared types |
| `case-core` | Domain services, entities, repositories |
| `case-server` | REST controllers, Spring configuration |
| `case-app` | Standalone Spring Boot entry point (dev/test only) |

See [case-app/README.md](case-app/README.md) for standalone usage instructions.
