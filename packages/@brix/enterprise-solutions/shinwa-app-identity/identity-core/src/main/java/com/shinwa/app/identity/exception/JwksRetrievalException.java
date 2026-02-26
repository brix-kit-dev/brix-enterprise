/*
 * Copyright 2024-2026 Shinwa Solutions Authors. All rights reserved.
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.exception;

/**
 * Exception thrown when JWKS (JSON Web Key Set) fetching or parsing fails.
 *
 * <p>This exception is used by {@code GoogleIdTokenVerifier} when:
 * <ul>
 *   <li>JWKS endpoint returns non-200 HTTP status</li>
 *   <li>JWKS response has invalid JSON structure</li>
 *   <li>Required 'keys' array is missing or malformed</li>
 *   <li>Network timeout or connection failure</li>
 * </ul>
 *
 * <h3>Design Rationale</h3>
 * <p>According to v3.0 Architecture Blueprint Red Line R10 (Fault Isolation),
 * external service call failures must use domain-specific exceptions rather
 * than generic RuntimeException. This enables:
 * <ul>
 *   <li>Retry strategy selection based on failure type</li>
 *   <li>Circuit breaker activation for persistent JWKS failures</li>
 *   <li>Fallback to cached keys when JWKS is temporarily unavailable</li>
 * </ul>
 *
 * <h3>Failure Categories</h3>
 * <ul>
 *   <li>{@code HTTP_ERROR} - JWKS endpoint returned non-200 status</li>
 *   <li>{@code INVALID_RESPONSE} - Response JSON is malformed</li>
 *   <li>{@code NETWORK_ERROR} - Connection timeout or network failure</li>
 * </ul>
 *
 * @author Shinwa Solutions Authors
 * @since 3.1.0
 * @see com.shinwa.app.identity.service.impl.GoogleIdTokenVerifier
 */
public class JwksRetrievalException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * The type of JWKS retrieval failure.
     */
    public enum FailureType {
        /** JWKS endpoint returned non-200 HTTP status */
        HTTP_ERROR,
        /** JWKS response JSON is invalid or malformed */
        INVALID_RESPONSE,
        /** Network connection timeout or failure */
        NETWORK_ERROR
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
     * The HTTP status code (for HTTP_ERROR failures).
     */
    private final Integer httpStatusCode;

    /**
     * The JWKS endpoint URL that was attempted.
     */
    private final String jwksUri;

    /**
     * Constructs a new JwksRetrievalException for HTTP errors.
     *
     * @param message        the detail message
     * @param httpStatusCode the HTTP status code returned
     * @param jwksUri        the JWKS endpoint URL
     */
    public JwksRetrievalException(String message, int httpStatusCode, String jwksUri) {
        super(message);
        this.failureType = FailureType.HTTP_ERROR;
        this.httpStatusCode = httpStatusCode;
        this.jwksUri = jwksUri;
        this.errorCode = "IDENTITY_JWKS_HTTP_" + httpStatusCode;
    }

    /**
     * Constructs a new JwksRetrievalException for invalid response.
     *
     * @param message the detail message describing the response issue
     * @param jwksUri the JWKS endpoint URL
     */
    public JwksRetrievalException(String message, String jwksUri) {
        super(message);
        this.failureType = FailureType.INVALID_RESPONSE;
        this.httpStatusCode = null;
        this.jwksUri = jwksUri;
        this.errorCode = "IDENTITY_JWKS_INVALID_RESPONSE";
    }

    /**
     * Constructs a new JwksRetrievalException for network errors.
     *
     * @param message the detail message
     * @param jwksUri the JWKS endpoint URL
     * @param cause   the underlying network exception
     */
    public JwksRetrievalException(String message, String jwksUri, Throwable cause) {
        super(message, cause);
        this.failureType = FailureType.NETWORK_ERROR;
        this.httpStatusCode = null;
        this.jwksUri = jwksUri;
        this.errorCode = "IDENTITY_JWKS_NETWORK_ERROR";
    }

    /**
     * Returns the error code for this exception.
     *
     * @return the error code, e.g., "IDENTITY_JWKS_HTTP_503"
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
     * Returns the HTTP status code for HTTP_ERROR failures.
     *
     * @return the HTTP status code, or null for non-HTTP failures
     */
    public Integer getHttpStatusCode() {
        return httpStatusCode;
    }

    /**
     * Returns the JWKS endpoint URL that was attempted.
     *
     * @return the JWKS URI
     */
    public String getJwksUri() {
        return jwksUri;
    }
}
