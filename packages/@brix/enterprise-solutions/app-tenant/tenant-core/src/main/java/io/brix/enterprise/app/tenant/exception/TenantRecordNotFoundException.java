/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.exception;

/**
 * Raised when an app-tenant directory record cannot be found.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
public class TenantRecordNotFoundException extends RuntimeException {

    /**
     * Creates an exception.
     *
     * @param selector lookup selector
     */
    public TenantRecordNotFoundException(String selector) {
        super("Tenant not found: " + selector);
    }
}
