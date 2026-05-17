/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */

/**
 * Compliance Management Module — API Layer.
 *
 * <p>This package defines the public contract of the compliance plugin:
 * enums, DTOs, integration events, and service interfaces. Other modules
 * (including the compliance-core and compliance-server) depend on this
 * layer, but this layer has <strong>no</strong> dependency on Spring,
 * JPA, or any infrastructure technology.</p>
 *
 * <h3>Package Structure</h3>
 * <ul>
 *   <li>{@code enums} — domain enumeration types (status, category, severity)</li>
 *   <li>{@code dto}   — data transfer objects and request/response types</li>
 *   <li>{@code event} — integration events published to the Runtime Shell EventBus</li>
 *   <li>{@code service} — service interfaces consumed by the server layer</li>
 * </ul>
 *
 * <h3>Architecture Constraints</h3>
 * <ul>
 *   <li>Only depends on {@code runtime-sdk-api} for {@code IntegrationEvent}</li>
 *   <li>Uses Jakarta Validation annotations for DTO validation</li>
 *   <li>Uses Jackson annotations for JSON serialization hints</li>
 *   <li>Uses Swagger annotations for OpenAPI documentation</li>
 * </ul>
 *
 * @author Brix Architecture Team
 * @version 3.0.0-SNAPSHOT
 * @since 3.2.0
 */
package io.brix.enterprise.app.compliance;
