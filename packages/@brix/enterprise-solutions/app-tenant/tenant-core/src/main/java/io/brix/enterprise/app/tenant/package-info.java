/**
 * Tenant module core layer - domain models and business logic.
 *
 * <p>This package serves as the root for all tenant-related domain classes.
 * ArchUnit scans this package to enforce architecture constraints including:
 * <ul>
 *   <li>No cross-plugin entity access (R8.1)</li>
 *   <li>No bypassing Runtime Shell capabilities (R2.1)</li>
 *   <li>No circular dependencies (R11)</li>
 * </ul>
 *
 * @since 3.0.0
 */
package io.brix.enterprise.app.tenant;
