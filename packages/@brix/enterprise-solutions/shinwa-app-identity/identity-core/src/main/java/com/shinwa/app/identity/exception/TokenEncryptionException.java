/*
 * Copyright 2024-2026 Shinwa Solutions Authors. All rights reserved.
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.exception;

/**
 * Exception thrown when token encryption or decryption operations fail.
 *
 * <p>This exception is used by {@code TokenEncryptionConverter} when AES-GCM
 * encryption/decryption fails during OAuth2 token persistence.</p>
 *
 * <h3>Design Rationale</h3>
 * <p>According to v3.0 Architecture Blueprint Red Line R10 (Fault Isolation),
 * cryptographic operation failures must use domain-specific exceptions rather
 * than generic RuntimeException. This enables:
 * <ul>
 *   <li>Clear security incident identification in monitoring</li>
 *   <li>Appropriate error responses without exposing cryptographic details</li>
 *   <li>Audit trail for potential security investigations</li>
 * </ul>
 *
 * <h3>Security Considerations</h3>
 * <p>This exception intentionally does not expose:
 * <ul>
 *   <li>The actual token value (plaintext or ciphertext)</li>
 *   <li>Encryption key material</li>
 *   <li>Detailed algorithm parameters</li>
 * </ul>
 *
 * @author Shinwa Solutions Authors
 * @since 3.1.0
 * @see com.shinwa.app.identity.entity.converter.TokenEncryptionConverter
 */
public class TokenEncryptionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * The operation that failed (encrypt or decrypt).
     */
    public enum Operation {
        /** Token encryption operation */
        ENCRYPT,
        /** Token decryption operation */
        DECRYPT,
        /** Encryption key derivation */
        KEY_DERIVATION
    }

    /**
     * Error code for categorization in monitoring systems.
     */
    private final String errorCode;

    /**
     * The operation that failed.
     */
    private final Operation operation;

    /**
     * Constructs a new TokenEncryptionException with message and cause.
     *
     * @param message   the detail message (should not contain sensitive data)
     * @param operation the cryptographic operation that failed
     * @param cause     the underlying cause
     */
    public TokenEncryptionException(String message, Operation operation, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.errorCode = "IDENTITY_TOKEN_" + operation.name() + "_ERROR";
    }

    /**
     * Constructs a new TokenEncryptionException with message only.
     *
     * @param message   the detail message
     * @param operation the cryptographic operation that failed
     */
    public TokenEncryptionException(String message, Operation operation) {
        super(message);
        this.operation = operation;
        this.errorCode = "IDENTITY_TOKEN_" + operation.name() + "_ERROR";
    }

    /**
     * Returns the error code for this exception.
     *
     * @return the error code, e.g., "IDENTITY_TOKEN_ENCRYPT_ERROR"
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * Returns the operation that failed.
     *
     * @return the operation (ENCRYPT, DECRYPT, or KEY_DERIVATION)
     */
    public Operation getOperation() {
        return operation;
    }
}
