# Brix Enterprise

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Build Status](https://gitlab.example.com/brix/brix-enterprise/badges/main/pipeline.svg)](https://gitlab.example.com/brix/brix-enterprise/-/pipelines)

**Brix Enterprise** is the commercial extension to the Brix Runtime Shell framework.

> **CONFIDENTIAL**: This repository contains proprietary code.
> Unauthorized distribution is strictly prohibited.

## Architecture

Brix Enterprise extends the open-source [Brix](https://github.com/brix-framework/brix) framework with:

- **Enterprise Host Assemblies**: Production-ready capability orchestration
- **Business Solutions**: Industry-specific plugin implementations
- **Enterprise Shell**: Commercial UI components and branding

## Dependency Model

Enterprise packages depend on **published versions** of Core packages:

```json
{
  "dependencies": {
    "@brix/runtime-core": "^3.1.0",
    "@brix/service-core": "^3.1.0"
  }
}
```

> **IMPORTANT**: Enterprise NEVER uses `workspace:*` references to Core.
> Core is consumed as published npm/Maven artifacts.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@brix/enterprise-host` | Host assembly implementations | Stable |
| `@brix/enterprise-solutions` | Business application plugins | Stable |
| `@brix/enterprise-shell` | Commercial UI shell components | Stable |

## Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Java 17+ (for backend modules)
- Maven 3.8+
- Access to GitLab Private Registry

### Registry Configuration

Configure your .npmrc to access the private registry:

```bash
# .npmrc
@brix:registry=https://gitlab.example.com/api/v4/packages/npm/
//gitlab.example.com/api/v4/packages/npm/:_authToken=${GITLAB_TOKEN}
```

### Installation

```bash
# Clone the repository (requires GitLab access)
git clone git@gitlab.example.com:brix/brix-enterprise.git
cd brix-enterprise

# Install dependencies (including Core packages from registry)
pnpm install

# Build all packages
pnpm build

# For Java modules
mvn clean install -DskipTests
```

## License

Proprietary - see [LICENSE](LICENSE) for details.

Commercial use requires a valid Brix Enterprise license.
Contact: enterprise@brix.dev

---

Copyright 2026 Brix Platform Authors. All Rights Reserved.
