/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

/**
 * Integration event published when a new tenant is created.
 *
 * <p>Subscribers can use this event to perform post-provisioning tasks
 * such as sending welcome notifications or initializing default data.</p>
 *
 * <h3>Subscriber Handling Recommendations</h3>
 * <ul>
 *   <li>notification-service: Send welcome email to tenant owner</li>
 *   <li>audit-service: Log tenant creation event</li>
 *   <li>config-service: Initialize default tenant configuration</li>
 * </ul>
 *
 * <h3>Idempotency</h3>
 * <p>Consumers should use {@code tenantId} or {@code tenantCode} for
 * idempotent processing to prevent duplicate side effects.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class TenantCreatedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;

    private final String tenantCode;
    private final String tenantName;
    private final Long ownerIdentityId;

    public TenantCreatedEvent(Long tenantId, String tenantCode, String tenantName, Long ownerIdentityId) {
        super("brix-app-tenant", tenantId != null ? String.valueOf(tenantId) : null);
        this.tenantCode = tenantCode;
        this.tenantName = tenantName;
        this.ownerIdentityId = ownerIdentityId;
    }

    @Override
    public String getRoutingKey() {
        return "tenant." + getTenantId();
    }

    public String getTenantCode() { return tenantCode; }

    public String getTenantName() { return tenantName; }

    public Long getOwnerIdentityId() { return ownerIdentityId; }
}
