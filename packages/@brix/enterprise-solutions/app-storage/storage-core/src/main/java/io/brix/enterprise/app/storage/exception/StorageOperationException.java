/*
 * Copyright 2024-2026 Brix Platform Authors. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.storage.exception;

/**
 * Exception thrown when file storage operations fail.
 *
 * <p>This exception wraps failures in file upload, download, preview URL generation,
 * and deletion operations. It provides structured error information for monitoring
 * and client error responses.</p>
 *
 * <h3>Design Rationale</h3>
 * <p>According to v3.0 Architecture Blueprint Red Line R10 (Fault Isolation),
 * all storage operation failures must use domain-specific exceptions rather
 * than generic RuntimeException. This enables:
 * <ul>
 *   <li>Clear distinction between transient and permanent failures</li>
 *   <li>Retry strategy selection based on operation type</li>
 *   <li>Structured error responses to API consumers</li>
 * </ul>
 *
 * <h3>Operation Categories</h3>
 * <ul>
 *   <li>{@code UPLOAD} - File upload to storage backend</li>
 *   <li>{@code DOWNLOAD} - File retrieval from storage backend</li>
 *   <li>{@code PREVIEW_URL} - Pre-signed URL generation</li>
 *   <li>{@code DELETE} - File deletion from storage backend</li>
 *   <li>{@code METADATA} - File metadata retrieval</li>
 * </ul>
 *
 * @author Brix Platform Authors
 * @since 3.1.0
 * @see io.brix.enterprise.app.storage.impl.FileStorageServiceImpl
 */
public class StorageOperationException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * The type of storage operation that failed.
     */
    public enum Operation {
        /** File upload operation */
        UPLOAD,
        /** File download operation */
        DOWNLOAD,
        /** Pre-signed preview URL generation */
        PREVIEW_URL,
        /** File deletion operation */
        DELETE,
        /** File metadata retrieval */
        METADATA
    }

    /**
     * Error code for categorization in monitoring systems.
     */
    private final String errorCode;

    /**
     * The storage operation that failed.
     */
    private final Operation operation;

    /**
     * The file identifier involved (bucket/key or file ID).
     */
    private final String fileIdentifier;

    /**
     * Constructs a new StorageOperationException with message and cause.
     *
     * @param message   the detail message
     * @param operation the storage operation that failed
     * @param cause     the underlying cause
     */
    public StorageOperationException(String message, Operation operation, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.fileIdentifier = null;
        this.errorCode = "STORAGE_" + operation.name() + "_ERROR";
    }

    /**
     * Constructs a new StorageOperationException with full details.
     *
     * @param message        the detail message
     * @param operation      the storage operation that failed
     * @param fileIdentifier the file identifier (bucket/key or file ID)
     * @param cause          the underlying cause
     */
    public StorageOperationException(String message, Operation operation, 
                                     String fileIdentifier, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.fileIdentifier = fileIdentifier;
        this.errorCode = "STORAGE_" + operation.name() + "_ERROR";
    }

    /**
     * Constructs a new StorageOperationException without a cause.
     *
     * @param message   the detail message
     * @param operation the storage operation that failed
     */
    public StorageOperationException(String message, Operation operation) {
        super(message);
        this.operation = operation;
        this.fileIdentifier = null;
        this.errorCode = "STORAGE_" + operation.name() + "_ERROR";
    }

    /**
     * Returns the error code for this exception.
     *
     * @return the error code, e.g., "STORAGE_UPLOAD_ERROR"
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * Returns the storage operation that failed.
     *
     * @return the operation type
     */
    public Operation getOperation() {
        return operation;
    }

    /**
     * Returns the file identifier involved in the failure.
     *
     * @return the file identifier, or null if not applicable
     */
    public String getFileIdentifier() {
        return fileIdentifier;
    }
}
