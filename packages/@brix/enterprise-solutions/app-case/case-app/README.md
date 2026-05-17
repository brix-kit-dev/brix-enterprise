# Case Module — Standalone Application

Standalone Spring Boot entry point for the **Case Management** domain module.
This module aggregates `case-api`, `case-core`, and `case-server` into a single
executable JAR for independent development and testing.

## When to Use

| Scenario | Use This |
|---|---|
| **Isolated development** — Run Case module without the full Host Shell | `case-app` |
| **Integration testing** — Verify Case APIs with a real database | `case-app` |
| **Production deployment** — Embedded in the Host Shell | `host-shell-standalone` (not this module) |

> **Architecture Note**:  In production, Case module is loaded by `host-shell-standalone`
> as a classpath dependency. `case-app` is **not** deployed to production — it exists
> purely for development convenience.

## Module Structure

```
app-case/
├── case-api/      # OpenAPI contract, DTOs, shared types
├── case-core/     # Domain services, entities, repositories
├── case-server/   # REST controllers, Spring configuration
└── case-app/      # ← This module: Spring Boot Application entry point
```

## Quick Start

```bash
# From the enterprise-solutions root
mvn -pl app-case/case-app spring-boot:run -Dspring-boot.run.profiles=dev

# Or build and run the fat JAR
mvn -pl app-case/case-app package -DskipTests
java -jar app-case/case-app/target/case-app-3.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

## Configuration

| Property | Default | Description |
|---|---|---|
| `server.port` | `8083` | HTTP port |
| `spring.profiles.active` | — | `dev` for H2, `prod` for PostgreSQL |

## Key Dependencies

- **case-api** / **case-core** / **case-server** — domain modules
- **spring-boot-starter** — application framework
- **PostgreSQL** — production database (runtime scope)
