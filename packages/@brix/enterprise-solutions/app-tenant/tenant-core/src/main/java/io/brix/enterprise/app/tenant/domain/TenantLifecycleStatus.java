/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.domain;

/**
 * Lifecycle status values for tenant directory records owned by app-tenant.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
public enum TenantLifecycleStatus {

    /**
     * Tenant has been created but is not serving traffic yet.
     */
    PENDING_ACTIVATION,

    /**
     * Tenant can be selected and used.
     */
    ACTIVE,

    /**
     * Tenant is temporarily blocked from normal use.
     */
    SUSPENDED
}
