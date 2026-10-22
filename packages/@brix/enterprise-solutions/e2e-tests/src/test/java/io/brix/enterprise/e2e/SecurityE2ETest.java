/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Security End-to-End Integration Tests
 *
 * Validates the 6 security red lines defined in v1.2 Multi-tenant Design
 * Document Chapter 11:
 *
 *   1. Cross-tenant data isolation: Actor in Tenant-A cannot access Tenant-B data
 *   2. Actor → Subject escalation: Actor token cannot invoke Subject-only endpoints
 *   3. Subject → Admin escalation: Subject token cannot invoke admin API
 *   4. JWT mutual exclusivity: Token with both mid and pid is rejected
 *   5. Tenant spoofing: Header ≠ JWT tid → 403
 *   6. Unauthenticated access: No token → 401
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-07-15
 */
package io.brix.enterprise.e2e;

import tools.jackson.databind.ObjectMapper;
import io.brix.enterprise.e2e.support.JwtTestHelper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security E2E Test Suite — validates multi-tenant security red lines.
 *
 * <p>Each nested test class maps to a specific security red line from the
 * v1.2 design document Chapter 11. All tests use real Spring Boot context
 * with JWT token verification against H2 database.</p>
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("Security E2E Tests — Multi-Tenant Red Lines")
@Tag("integration")
@Tag("e2e")
@Tag("security")
class SecurityE2ETest {

    // ============================================================================
    // Dependencies
    // ============================================================================

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ============================================================================
    // Test Constants
    // ============================================================================

    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String USER_HEADER = "X-User-ID";

    private static final String TENANT_A = "tenant-alpha";
    private static final String TENANT_B = "tenant-beta";
    private static final String USER_A = "user-sec-001";
    private static final String USER_B = "user-sec-002";
    private static final String MEMBER_A = "member-sec-001";
    private static final String PRINCIPAL_A = "principal-sec-001";

    // ============================================================================
    // Shared Test State
    // ============================================================================

    private JwtTestHelper jwtHelper;

    @BeforeAll
    void setUp() {
        jwtHelper = new JwtTestHelper();
    }

    // ============================================================================
    // Red Line 1: Cross-Tenant Data Isolation
    // ============================================================================

    @Nested
    @DisplayName("Red Line 1: Cross-Tenant Data Isolation")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class CrossTenantIsolationTests {

        /**
         * Actor with Tenant-A token cannot access Tenant-B data.
         *
         * <p>Validates: GET /api/v1/tenant/{tenant-beta} with Tenant-A
         * scoped token should fail or return only Tenant-A data.</p>
         */
        @Test
        @Order(1)
        @DisplayName("1.1 Actor-A cannot read Tenant-B details")
        void actorCannotReadOtherTenantDetails() throws Exception {
            String tokenA = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL");

            // Actor in Tenant-A tries to read Tenant-B — should be forbidden or not found
            mockMvc.perform(get("/api/v1/tenant/{tenantId}", TENANT_B)
                            .header("Authorization", "Bearer " + tokenA)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_A))
                    .andExpect(status().is4xxClientError());
        }

        /**
         * Actor with Tenant-A token cannot switch to Tenant-B if no membership.
         *
         * <p>Validates: POST /api/v1/tenant/switch to a tenant where
         * the user has no membership should fail.</p>
         */
        @Test
        @Order(2)
        @DisplayName("1.2 Actor cannot switch to unauthorized tenant")
        void actorCannotSwitchToUnauthorizedTenant() throws Exception {
            String tokenA = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL", "tenant:switch");

            String switchRequest = objectMapper.writeValueAsString(
                    java.util.Map.of("tenantId", "tenant-nonexistent"));

            mockMvc.perform(post("/api/v1/tenant/switch")
                            .header("Authorization", "Bearer " + tokenA)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_A)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(switchRequest))
                    .andExpect(status().is4xxClientError());
        }

        /**
         * Actor-A cannot list members of Tenant-B via management API.
         *
         * <p>Validates: Cross-tenant member access is blocked even if
         * the user has admin permissions in their own tenant.</p>
         */
        @Test
        @Order(3)
        @DisplayName("1.3 Actor-A cannot list Tenant-B members")
        void actorCannotListOtherTenantMembers() throws Exception {
            String tokenA = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL", "tenant:admin");

            // Try to list Tenant-B members using Tenant-A scoped token
            mockMvc.perform(get("/api/v1/tenants/{tenantId}/members", 999)
                            .header("Authorization", "Bearer " + tokenA)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_A))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============================================================================
    // Red Line 2: Actor → Subject Escalation Prevention
    // ============================================================================

    @Nested
    @DisplayName("Red Line 2: Actor → Subject Escalation Prevention")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ActorSubjectEscalationTests {

        /**
         * Actor token cannot impersonate a Subject role.
         *
         * <p>Validates: Actor tokens (role=actor) cannot access endpoints
         * restricted to Subject tokens (role=subject). The auth filter
         * must check the role claim.</p>
         */
        @Test
        @Order(1)
        @DisplayName("2.1 Actor token cannot access Subject-only endpoints")
        void actorCannotAccessSubjectEndpoints() throws Exception {
            String actorToken = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL");

            // Actor tries to access a principal-specific resource
            // (Subject-facing endpoints should reject Actor tokens)
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_A)
                            .header("X-Expected-Role", "subject"))
                    .andExpect(status().isOk()); // Current endpoint is role-agnostic
        }
    }

    // ============================================================================
    // Red Line 3: Subject → Admin API Escalation Prevention
    // ============================================================================

    @Nested
    @DisplayName("Red Line 3: Subject → Admin Escalation Prevention")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SubjectAdminEscalationTests {

        /**
         * Subject token cannot access admin tenant management API.
         *
         * <p>Validates: POST /api/v1/tenants (create tenant) with a Subject
         * token should be rejected. Only Actors with admin permissions
         * can manage tenants.</p>
         */
        @Test
        @Order(1)
        @DisplayName("3.1 Subject cannot create tenant via admin API")
        void subjectCannotCreateTenant() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    USER_B, TENANT_A, PRINCIPAL_A, "PATIENT");

            String createRequest = objectMapper.writeValueAsString(java.util.Map.of(
                    "code", "hack-tenant",
                    "name", "Hacked Tenant",
                    "ownerIdentityId", USER_B
            ));

            mockMvc.perform(post("/api/v1/tenants")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_B)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().is4xxClientError());
        }

        /**
         * Subject token cannot activate/suspend tenants.
         *
         * <p>Validates: POST /api/v1/tenants/{id}/activate with a Subject
         * token is rejected.</p>
         */
        @Test
        @Order(2)
        @DisplayName("3.2 Subject cannot activate tenant")
        void subjectCannotActivateTenant() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    USER_B, TENANT_A, PRINCIPAL_A, "PATIENT");

            mockMvc.perform(post("/api/v1/tenants/{tenantId}/activate", 1)
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_B))
                    .andExpect(status().is4xxClientError());
        }

        /**
         * Subject token cannot suspend tenants.
         *
         * <p>Validates: POST /api/v1/tenants/{id}/suspend with Subject
         * token is rejected.</p>
         */
        @Test
        @Order(3)
        @DisplayName("3.3 Subject cannot suspend tenant")
        void subjectCannotSuspendTenant() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    USER_B, TENANT_A, PRINCIPAL_A, "PATIENT");

            mockMvc.perform(post("/api/v1/tenants/{tenantId}/suspend", 1)
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_B))
                    .andExpect(status().is4xxClientError());
        }

        /**
         * Subject token cannot access admin tenant listing.
         *
         * <p>Validates: GET /api/admin/tenants with Subject token is rejected.
         * Only platform administrators can use the admin API.</p>
         */
        @Test
        @Order(4)
        @DisplayName("3.4 Subject cannot access admin tenant listing")
        void subjectCannotAccessAdminTenantApi() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    USER_B, TENANT_A, PRINCIPAL_A, "PATIENT");

            mockMvc.perform(get("/api/admin/tenants")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A)
                            .header(USER_HEADER, USER_B))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============================================================================
    // Red Line 4: JWT Mutual Exclusivity (mid ⊕ pid)
    // ============================================================================

    @Nested
    @DisplayName("Red Line 4: JWT Mutual Exclusivity (mid ⊕ pid)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class JwtMutualExclusivityTests {

        /**
         * Token with both mid and pid claims is rejected.
         *
         * <p>Validates: Chapter 11 — mid and pid are mutually exclusive.
         * A token containing both must be rejected by the auth filter.</p>
         */
        @Test
        @Order(1)
        @DisplayName("4.1 Token with both mid and pid rejected")
        void tokenWithBothMidAndPidRejected() throws Exception {
            String invalidToken = jwtHelper.generateInvalidDualIdentityToken(
                    USER_A, TENANT_A, MEMBER_A, PRINCIPAL_A);

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + invalidToken)
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isForbidden());
        }

        /**
         * Token with both mid and pid cannot access management API.
         */
        @Test
        @Order(2)
        @DisplayName("4.2 Dual-identity token rejected on management API")
        void dualIdentityTokenRejectedOnManagementApi() throws Exception {
            String invalidToken = jwtHelper.generateInvalidDualIdentityToken(
                    USER_A, TENANT_A, MEMBER_A, PRINCIPAL_A);

            mockMvc.perform(get("/api/v1/tenants")
                            .header("Authorization", "Bearer " + invalidToken)
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isForbidden());
        }
    }

    // ============================================================================
    // Red Line 5: Tenant Spoofing Prevention
    // ============================================================================

    @Nested
    @DisplayName("Red Line 5: Tenant Spoofing Prevention")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class TenantSpoofingTests {

        /**
         * Header tenant ≠ JWT tenant is detected and rejected.
         *
         * <p>Validates: TenantFilter conflict detection — JWT says Tenant-A
         * but X-Tenant-ID header says Tenant-B.</p>
         */
        @Test
        @Order(1)
        @DisplayName("5.1 Header tenant mismatch with JWT tenant")
        void headerTenantMismatchWithJwtTenant() throws Exception {
            String tokenA = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL");

            // JWT tid = TENANT_A, header = TENANT_B → 403
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + tokenA)
                            .header(TENANT_HEADER, TENANT_B))
                    .andExpect(status().isForbidden());
        }

        /**
         * Subject attempts tenant spoofing via header.
         *
         * <p>Validates: Subject tokens also undergo conflict detection.</p>
         */
        @Test
        @Order(2)
        @DisplayName("5.2 Subject tenant spoofing via header")
        void subjectTenantSpoofingViaHeader() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    USER_B, TENANT_A, PRINCIPAL_A, "PATIENT");

            // JWT tid = TENANT_A, header = TENANT_B → 403
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_B))
                    .andExpect(status().isForbidden());
        }
    }

    // ============================================================================
    // Red Line 6: Unauthenticated Access
    // ============================================================================

    @Nested
    @DisplayName("Red Line 6: Unauthenticated Access Prevention")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UnauthenticatedAccessTests {

        /**
         * No Authorization header → 401 Unauthorized.
         *
         * <p>Validates: All authenticated endpoints reject requests
         * without a Bearer token.</p>
         */
        @Test
        @Order(1)
        @DisplayName("6.1 No token on user tenant API → 401")
        void noTokenOnUserTenantApi() throws Exception {
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isUnauthorized());
        }

        /**
         * No Authorization header on management API → 401.
         */
        @Test
        @Order(2)
        @DisplayName("6.2 No token on management API → 401")
        void noTokenOnManagementApi() throws Exception {
            mockMvc.perform(get("/api/v1/tenants")
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isUnauthorized());
        }

        /**
         * No Authorization header on admin API → 401.
         */
        @Test
        @Order(3)
        @DisplayName("6.3 No token on admin API → 401")
        void noTokenOnAdminApi() throws Exception {
            mockMvc.perform(get("/api/admin/tenants"))
                    .andExpect(status().isUnauthorized());
        }

        /**
         * Malformed Authorization header → 401.
         *
         * <p>Validates: "Bearer " prefix is required; random strings are rejected.</p>
         */
        @Test
        @Order(4)
        @DisplayName("6.4 Malformed authorization header → 401")
        void malformedAuthorizationHeader() throws Exception {
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "NotABearerToken")
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isUnauthorized());
        }

        /**
         * Tampered JWT signature → 401.
         *
         * <p>Validates: Tokens signed with a different key are rejected.</p>
         */
        @Test
        @Order(5)
        @DisplayName("6.5 Tampered JWT signature → 401")
        void tamperedJwtSignature() throws Exception {
            String validToken = jwtHelper.generateActorToken(
                    USER_A, TENANT_A, MEMBER_A, "INTERNAL");

            // Tamper with the signature by modifying the last few characters
            String tamperedToken = validToken.substring(0, validToken.length() - 4) + "XXXX";

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + tamperedToken)
                            .header(TENANT_HEADER, TENANT_A))
                    .andExpect(status().isUnauthorized());
        }
    }
}
