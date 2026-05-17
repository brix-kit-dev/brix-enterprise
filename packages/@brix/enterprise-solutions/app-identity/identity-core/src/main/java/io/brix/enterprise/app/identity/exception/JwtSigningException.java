/*
 * Copyright 2024-2026 Brix Platform Authors. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.exception;

/**
 * Exception thrown when JWT token signing or configuration fails.
 *
 * <p>This exception is used by {@code JwtTokenService} when:
 * <ul>
 *   <li>Private key loading fails during service initialization</li>
 *   <li>Token signing operation fails</li>
 *   <li>Key format is invalid or unsupported</li>
 * </ul>
 *
 * <h3>Design Rationale</h3>
 * <p>According to v3.0 Architecture Blueprint Red Line R10 (Fault Isolation),
 * cryptographic operation failures must use domain-specific exceptions rather
 * than generic RuntimeException. This enables:
 * <ul>
 *   <li>Clear identification of authentication subsystem failures</li>
 *   <li>Proper alerting for security-critical configuration issues</li>
 *   <li>Graceful degradation strategies in upper layers</li>
 * </ul>
 *
 * <h3>Failure Categories</h3>
 * <ul>
 *   <li>{@code KEY_LOADING} - Private key file not found or unreadable</li>
 *   <li>{@code KEY_PARSING} - Invalid key format (PEM/PKCS8)</li>
 *   <li>{@code SIGNING} - Token signing operation failed</li>
 * </ul>
 *
 * @author Brix Platform Authors
 * @since 3.1.0
 * @see io.brix.enterprise.app.identity.service.impl.JwtTokenService
 */
public class JwtSigningException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * The type of JWT signing operation that failed.
     */
    public enum FailureType {
        /** Private key loading failed (file not found, IO error) */
        KEY_LOADING,
        /** Private key parsing failed (invalid format) */
        KEY_PARSING,
        /** Token signing operation failed */
        SIGNING
    }

    /**
     * Error code for categorization in monitoring systems.
     */
    private final String errorCode;

    /**
     * The type of failure that occurred.
     */
    private final FailureType failureType;

    /**
     * The resource path involved (for key loading failures).
     */
    private final String resourcePath;

    /**
     * Constructs a new JwtSigningException with message and cause.
     *
     * @param message     the detail message
     * @param failureType the type of failure
     * @param cause       the underlying cause
     */
    public JwtSigningException(String message, FailureType failureType, Throwable cause) {
        super(message, cause);
        this.failureType = failureType;
        this.resourcePath = null;
        this.errorCode = "IDENTITY_JWT_" + failureType.name() + "_ERROR";
    }

    /**
     * Constructs a new JwtSigningException with message, resource path, and cause.
     *
     * @param message      the detail message
     * @param failureType  the type of failure
     * @param resourcePath the path to the resource that failed
     * @param cause        the underlying cause
     */
    public JwtSigningException(String message, FailureType failureType, String resourcePath, Throwable cause) {
        super(message, cause);
        this.failureType = failureType;
        this.resourcePath = resourcePath;
        this.errorCode = "IDENTITY_JWT_" + failureType.name() + "_ERROR";
    }

    /**
     * Returns the error code for this exception.
     *
     * @return the error code, e.g., "IDENTITY_JWT_SIGNING_ERROR"
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * Returns the type of failure that occurred.
     *
     * @return the failure type
     */
    public FailureType getFailureType() {
        return failureType;
    }

    /**
     * Returns the resource path involved in the failure.
     *
     * @return the resource path, or null if not applicable
     */
    public String getResourcePath() {
        return resourcePath;
    }
}
