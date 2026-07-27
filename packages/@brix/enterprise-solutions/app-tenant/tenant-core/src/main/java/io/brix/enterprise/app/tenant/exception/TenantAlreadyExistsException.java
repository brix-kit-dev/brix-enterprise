/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.exception;

/**
 * Raised when creating a tenant with a code already owned by app-tenant.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
public class TenantAlreadyExistsException extends RuntimeException {

    /**
     * Creates an exception.
     *
     * @param code duplicate tenant code
     */
    public TenantAlreadyExistsException(String code) {
        super("Tenant code already exists: " + code);
    }
}
