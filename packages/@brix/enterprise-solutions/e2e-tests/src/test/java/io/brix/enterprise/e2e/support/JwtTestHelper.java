/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * JWT Token Helper for E2E Tests
 *
 * Generates Actor Tokens and Subject Tokens with the correct claim structure
 * as defined in v1.2 Multi-tenant Design Document Section 8 (JWT Dual-Track).
 *
 * Actor Token claims: mid (memberId), mtype (INTERNAL|EXTERNAL), role=actor
 * Subject Token claims: pid (principalId), ptype (PATIENT|CUSTOMER|...), role=subject
 * mid and pid are mutually exclusive (never appear in the same token).
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-07-15
 */
package io.brix.enterprise.e2e.support;

import io.jsonwebtoken.Jwts;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Test JWT token generator for E2E integration tests.
 *
 * <p>Generates RS256-signed JWT tokens following the B2B2C dual-track model.
 * The key pair is generated once per test run and shared across all test classes.</p>
 *
 * <h3>Token Types</h3>
 * <ul>
 *   <li><strong>Actor Token</strong>: B-side (tenant member) — carries {@code mid}, {@code mtype}, {@code role=actor}</li>
 *   <li><strong>Subject Token</strong>: C-side (principal) — carries {@code pid}, {@code ptype}, {@code role=subject}</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 */
public final class JwtTestHelper {

    private static final String ISSUER = "brix-e2e-tests";
    private static final long ACCESS_TOKEN_TTL_SECONDS = 3600;

    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    /**
     * Creates a new JwtTestHelper with a freshly generated RSA key pair.
     *
     * @throws RuntimeException if RSA key generation fails
     */
    public JwtTestHelper() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            this.privateKey = keyPair.getPrivate();
            this.publicKey = keyPair.getPublic();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate RSA key pair for tests", e);
        }
    }

    /**
     * Returns the public key for token verification in test configurations.
     *
     * @return the RSA public key
     */
    public PublicKey getPublicKey() {
        return publicKey;
    }

    /**
     * Generate an Actor Token (B-side: tenant member).
     *
     * <p>Claims structure:</p>
     * <pre>
     * {
     *   "sub": "{userId}",
     *   "tid": "{tenantId}",
     *   "mid": "{memberId}",
     *   "mtype": "INTERNAL" | "EXTERNAL",
     *   "role": "actor",
     *   "permissions": ["perm1", "perm2"],
     *   "iss": "brix-e2e-tests",
     *   "iat": ...,
     *   "exp": ...
     * }
     * </pre>
     *
     * @param userId     the user's unique identifier
     * @param tenantId   the tenant ID this token is scoped to
     * @param memberId   the tenant member ID (sys_tenant_member.id)
     * @param memberType the member type (INTERNAL or EXTERNAL)
     * @param permissions variable-length list of permission strings
     * @return signed JWT token string
     */
    public String generateActorToken(String userId, String tenantId, String memberId,
                                      String memberType, String... permissions) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(userId)
                .issuer(ISSUER)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ACCESS_TOKEN_TTL_SECONDS)))
                .claims(Map.of(
                        "tid", tenantId,
                        "mid", memberId,
                        "mtype", memberType,
                        "role", "actor",
                        "permissions", permissions
                ))
                .signWith(privateKey)
                .compact();
    }

    /**
     * Generate a Subject Token (C-side: principal).
     *
     * <p>Claims structure:</p>
     * <pre>
     * {
     *   "sub": "{userId}",
     *   "tid": "{tenantId}",
     *   "pid": "{principalId}",
     *   "ptype": "PATIENT" | "CUSTOMER" | ...,
     *   "role": "subject",
     *   "permissions": ["perm1", "perm2"],
     *   "iss": "brix-e2e-tests",
     *   "iat": ...,
     *   "exp": ...
     * }
     * </pre>
     *
     * @param userId      the user's unique identifier
     * @param tenantId    the tenant ID this token is scoped to
     * @param principalId the principal ID (sys_tenant_principal.id)
     * @param principalType the principal type (PATIENT, CUSTOMER, etc.)
     * @param permissions variable-length list of permission strings
     * @return signed JWT token string
     */
    public String generateSubjectToken(String userId, String tenantId, String principalId,
                                        String principalType, String... permissions) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(userId)
                .issuer(ISSUER)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ACCESS_TOKEN_TTL_SECONDS)))
                .claims(Map.of(
                        "tid", tenantId,
                        "pid", principalId,
                        "ptype", principalType,
                        "role", "subject",
                        "permissions", permissions
                ))
                .signWith(privateKey)
                .compact();
    }

    /**
     * Generate an expired Actor Token for refresh-flow testing.
     *
     * @param userId   the user's unique identifier
     * @param tenantId the tenant ID
     * @param memberId the member ID
     * @return signed but expired JWT token string
     */
    public String generateExpiredActorToken(String userId, String tenantId, String memberId) {
        Instant past = Instant.now().minusSeconds(7200);

        return Jwts.builder()
                .subject(userId)
                .issuer(ISSUER)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(past))
                .expiration(Date.from(past.plusSeconds(ACCESS_TOKEN_TTL_SECONDS)))
                .claims(Map.of(
                        "tid", tenantId,
                        "mid", memberId,
                        "mtype", "INTERNAL",
                        "role", "actor",
                        "permissions", new String[]{}
                ))
                .signWith(privateKey)
                .compact();
    }

    /**
     * Generate a token that contains BOTH mid and pid (invalid — security red line).
     *
     * <p>This token violates the mutual exclusivity constraint and must be
     * rejected by the AuthFilter.</p>
     *
     * @param userId    the user's unique identifier
     * @param tenantId  the tenant ID
     * @param memberId  the member ID
     * @param principalId the principal ID
     * @return signed JWT token with both mid and pid claims
     */
    public String generateInvalidDualIdentityToken(String userId, String tenantId,
                                                    String memberId, String principalId) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(userId)
                .issuer(ISSUER)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ACCESS_TOKEN_TTL_SECONDS)))
                .claims(Map.of(
                        "tid", tenantId,
                        "mid", memberId,
                        "mtype", "INTERNAL",
                        "pid", principalId,
                        "ptype", "PATIENT",
                        "role", "actor",
                        "permissions", new String[]{}
                ))
                .signWith(privateKey)
                .compact();
    }
}
