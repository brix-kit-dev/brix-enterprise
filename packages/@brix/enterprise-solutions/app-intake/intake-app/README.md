# Intake Module — Standalone Application

Standalone Spring Boot entry point for the **Intake** domain module.
This module bootstraps `intake-server` into a single executable JAR
for independent development and testing.

## When to Use

| Scenario | Use This |
|---|---|
| **Isolated development** — Run Intake module without the full Host Shell | `intake-app` |
| **Integration testing** — Verify Intake APIs with a real database | `intake-app` |
| **Production deployment** — Embedded in the Host Shell | `host-shell-standalone` (not this module) |

> **Architecture Note**:  In production, Intake module is loaded by `host-shell-standalone`
> as a classpath dependency. `intake-app` is **not** deployed to production — it exists
> purely for development convenience.

## Module Structure

```
app-intake/
├── intake-server/   # REST controllers, domain services, entities
└── intake-app/      # ← This module: Spring Boot Application entry point
```

## Quick Start

```bash
# From the enterprise-solutions root
mvn -pl app-intake/intake-app spring-boot:run -Dspring-boot.run.profiles=dev

# Or build and run the fat JAR
mvn -pl app-intake/intake-app package -DskipTests
java -jar app-intake/intake-app/target/intake-app-3.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

## Configuration

| Property | Default | Description |
|---|---|---|
| `server.port` | `8084` | HTTP port |
| `spring.profiles.active` | — | `dev` for H2, `prod` for PostgreSQL |
| `spring.datasource.url` | H2 in-memory | Database connection URL |

## Key Dependencies

- **intake-server** — domain module (controllers, services, repositories)
- **spring-boot-starter** + **actuator** — application framework + health checks
- **H2** — embedded database for development
- **PostgreSQL** — production database (runtime scope)
