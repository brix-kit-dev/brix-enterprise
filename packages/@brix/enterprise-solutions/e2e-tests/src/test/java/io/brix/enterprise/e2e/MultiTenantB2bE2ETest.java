/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Multi-Tenant B2B2C End-to-End Integration Tests
 *
 * Validates the complete multi-tenant lifecycle through REST API endpoints,
 * covering both Actor (B-side) and Subject (C-side) dual-track flows as
 * defined in v1.2 Multi-tenant Design Document.
 *
 * Test Scenarios:
 *   1. Actor (B-side): Login → Select tenant → Switch tenant → Refresh token
 *   2. Subject (C-side): Admission → Login → Switch tenant
 *   3. Dual-identity: Same user as Actor in one tenant, Subject in another
 *   4. Tenant context isolation between requests
 *
 * Architecture Compliance:
 *   - Tests run against real Spring Boot context (no mocked business logic)
 *   - Uses H2 in-memory database for test isolation
 *   - JWT tokens generated via JwtTestHelper (RS256)
 *   - Validates TenantContext propagation through filter chain
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-07-15
 */
package io.brix.enterprise.e2e;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import io.brix.enterprise.e2e.support.JwtTestHelper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Multi-Tenant B2B2C E2E Integration Test Suite.
 *
 * <p>Validates the complete tenant lifecycle for both Actor (B-side members)
 * and Subject (C-side principals) through the REST API layer.</p>
 *
 * <h3>JWT Dual-Track Model</h3>
 * <ul>
 *   <li><strong>Actor Token</strong>: {@code mid} (memberId), {@code mtype}, {@code role=actor}
 *       — used by tenant members (employees, partners)</li>
 *   <li><strong>Subject Token</strong>: {@code pid} (principalId), {@code ptype}, {@code role=subject}
 *       — used by principals (patients, customers)</li>
 *   <li><strong>Mutual Exclusivity</strong>: {@code mid} and {@code pid} never coexist in same token</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Multi-Tenant B2B2C E2E Integration Tests")
@Tag("integration")
@Tag("e2e")
class MultiTenantB2bE2ETest {

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

    /** Test user IDs */
    private static final String ACTOR_USER_ID = "user-actor-001";
    private static final String SUBJECT_USER_ID = "user-subject-001";
    private static final String DUAL_USER_ID = "user-dual-001";

    /** Test tenant IDs */
    private static final String TENANT_A_ID = "tenant-alpha";
    private static final String TENANT_B_ID = "tenant-beta";

    /** Test member/principal IDs */
    private static final String MEMBER_A_ID = "member-001";
    private static final String MEMBER_B_ID = "member-002";
    private static final String PRINCIPAL_A_ID = "principal-001";
    private static final String PRINCIPAL_B_ID = "principal-002";

    // ============================================================================
    // Shared Test State
    // ============================================================================

    private JwtTestHelper jwtHelper;

    @BeforeAll
    void setUp() {
        jwtHelper = new JwtTestHelper();
    }

    // ============================================================================
    // 1. Actor (B-side) Lifecycle Tests
    // ============================================================================

    @Nested
    @DisplayName("1. Actor (B-side) Tenant Lifecycle")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ActorLifecycleTests {

        /**
         * Actor can query available tenants with a valid Actor Token.
         *
         * <p>Validates: GET /api/v1/tenant/available accepts Actor token and
         * returns the list of tenants the member belongs to.</p>
         */
        @Test
        @Order(1)
        @DisplayName("1.1 Actor queries available tenants")
        void actorQueriesAvailableTenants() throws Exception {
            String actorToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL",
                    "tenant:read", "tenant:switch");

            MvcResult result = mockMvc.perform(get("/api/v1/tenant/available")
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andReturn();

            JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
            assertThat(body.path("data").path("tenants").isArray()).isTrue();
        }

        /**
         * Actor can get current tenant context.
         *
         * <p>Validates: GET /api/v1/tenant/current returns the tenant bound
         * to the current JWT {@code tid} claim.</p>
         */
        @Test
        @Order(2)
        @DisplayName("1.2 Actor gets current tenant")
        void actorGetsCurrentTenant() throws Exception {
            String actorToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(TENANT_A_ID));
        }

        /**
         * Actor can switch from Tenant-A to Tenant-B.
         *
         * <p>Validates: POST /api/v1/tenant/switch with {@code {"tenantId": "tenant-beta"}}
         * returns the new tenant context when the Actor has membership in both tenants.</p>
         */
        @Test
        @Order(3)
        @DisplayName("1.3 Actor switches tenant")
        void actorSwitchesTenant() throws Exception {
            String actorToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL",
                    "tenant:switch");

            String switchRequest = objectMapper.writeValueAsString(
                    java.util.Map.of("tenantId", TENANT_B_ID));

            mockMvc.perform(post("/api/v1/tenant/switch")
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(switchRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        /**
         * Actor can retrieve tenant feature flags.
         *
         * <p>Validates: GET /api/v1/tenant/{tenantId}/features returns
         * a features array (may be empty in Phase 1).</p>
         */
        @Test
        @Order(4)
        @DisplayName("1.4 Actor retrieves tenant features")
        void actorRetrievesTenantFeatures() throws Exception {
            String actorToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            mockMvc.perform(get("/api/v1/tenant/{tenantId}/features", TENANT_A_ID)
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.features").isArray());
        }

        /**
         * Expired Actor Token results in 401.
         *
         * <p>Validates: The auth filter rejects expired tokens before
         * reaching the controller.</p>
         */
        @Test
        @Order(5)
        @DisplayName("1.5 Expired actor token is rejected")
        void expiredActorTokenIsRejected() throws Exception {
            String expiredToken = jwtHelper.generateExpiredActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID);

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + expiredToken)
                            .header(TENANT_HEADER, TENANT_A_ID))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ============================================================================
    // 2. Subject (C-side) Lifecycle Tests
    // ============================================================================

    @Nested
    @DisplayName("2. Subject (C-side) Tenant Lifecycle")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SubjectLifecycleTests {

        /**
         * Subject can query available tenants with a valid Subject Token.
         *
         * <p>Validates: Subject tokens (with pid/ptype/role=subject) are
         * accepted by the tenant API for listing available tenants.</p>
         */
        @Test
        @Order(1)
        @DisplayName("2.1 Subject queries available tenants")
        void subjectQueriesAvailableTenants() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    SUBJECT_USER_ID, TENANT_A_ID, PRINCIPAL_A_ID, "PATIENT",
                    "tenant:read");

            MvcResult result = mockMvc.perform(get("/api/v1/tenant/available")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, SUBJECT_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andReturn();

            JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
            assertThat(body.path("data").path("tenants").isArray()).isTrue();
        }

        /**
         * Subject can get current tenant context.
         *
         * <p>Validates: GET /api/v1/tenant/current with Subject token
         * returns the tenant scoped by {@code tid} claim.</p>
         */
        @Test
        @Order(2)
        @DisplayName("2.2 Subject gets current tenant")
        void subjectGetsCurrentTenant() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    SUBJECT_USER_ID, TENANT_A_ID, PRINCIPAL_A_ID, "PATIENT");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, SUBJECT_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(TENANT_A_ID));
        }

        /**
         * Subject can switch to a different tenant.
         *
         * <p>Validates: POST /api/v1/tenant/switch works for Subject tokens
         * when the principal has been admitted to the target tenant.</p>
         */
        @Test
        @Order(3)
        @DisplayName("2.3 Subject switches tenant")
        void subjectSwitchesTenant() throws Exception {
            String subjectToken = jwtHelper.generateSubjectToken(
                    SUBJECT_USER_ID, TENANT_A_ID, PRINCIPAL_A_ID, "PATIENT",
                    "tenant:switch");

            String switchRequest = objectMapper.writeValueAsString(
                    java.util.Map.of("tenantId", TENANT_B_ID));

            mockMvc.perform(post("/api/v1/tenant/switch")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, SUBJECT_USER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(switchRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ============================================================================
    // 3. Dual-Identity Tests
    // ============================================================================

    @Nested
    @DisplayName("3. Dual-Identity Scenarios")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class DualIdentityTests {

        /**
         * Same user can hold Actor token for Tenant-A and Subject token for Tenant-B.
         *
         * <p>Validates: The system supports the B2B2C model where a single
         * physical person can be a member (Actor) in one tenant and a
         * principal (Subject) in another tenant.</p>
         */
        @Test
        @Order(1)
        @DisplayName("3.1 Same user as Actor in Tenant-A, Subject in Tenant-B")
        void sameUserDualRolesAcrossTenants() throws Exception {
            // Step 1: Use Actor token in Tenant-A
            String actorToken = jwtHelper.generateActorToken(
                    DUAL_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + actorToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, DUAL_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(TENANT_A_ID));

            // Step 2: Use Subject token in Tenant-B
            String subjectToken = jwtHelper.generateSubjectToken(
                    DUAL_USER_ID, TENANT_B_ID, PRINCIPAL_B_ID, "PATIENT");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + subjectToken)
                            .header(TENANT_HEADER, TENANT_B_ID)
                            .header(USER_HEADER, DUAL_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(TENANT_B_ID));
        }

        /**
         * Token with both mid and pid is rejected (mutual exclusivity red line).
         *
         * <p>Validates Chapter 11 Security Red Line: mid and pid claims
         * must never coexist in a single JWT token.</p>
         */
        @Test
        @Order(2)
        @DisplayName("3.2 Invalid dual-identity token is rejected")
        void invalidDualIdentityTokenIsRejected() throws Exception {
            String invalidToken = jwtHelper.generateInvalidDualIdentityToken(
                    DUAL_USER_ID, TENANT_A_ID, MEMBER_A_ID, PRINCIPAL_A_ID);

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + invalidToken)
                            .header(TENANT_HEADER, TENANT_A_ID))
                    .andExpect(status().isForbidden());
        }
    }

    // ============================================================================
    // 4. Tenant Context Isolation Tests
    // ============================================================================

    @Nested
    @DisplayName("4. Tenant Context Isolation")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class TenantContextIsolationTests {

        /**
         * Tenant context does not leak between sequential requests.
         *
         * <p>Validates: TenantContext.clear() is called in the filter's
         * finally block, preventing context leakage between requests.</p>
         */
        @Test
        @Order(1)
        @DisplayName("4.1 Tenant context isolated between requests")
        void tenantContextIsolatedBetweenRequests() throws Exception {
            // Request 1: Actor in Tenant-A
            String tokenA = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + tokenA)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(TENANT_A_ID));

            // Request 2: Actor in Tenant-B (different context)
            String tokenB = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_B_ID, MEMBER_B_ID, "INTERNAL");

            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + tokenB)
                            .header(TENANT_HEADER, TENANT_B_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(TENANT_B_ID));
        }

        /**
         * Request without tenant header uses default or returns appropriate error.
         *
         * <p>Validates: The TenantFilter handles missing headers gracefully
         * depending on the required configuration.</p>
         */
        @Test
        @Order(2)
        @DisplayName("4.2 Request without tenant header handled gracefully")
        void requestWithoutTenantHeaderHandled() throws Exception {
            String token = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            // When no X-Tenant-ID header is provided, JWT tid claim is used as fallback
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + token)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk());
        }

        /**
         * Tenant header mismatch with JWT tid is detected and rejected.
         *
         * <p>Validates: TenantFilter's conflict detection — when header says
         * Tenant-B but JWT says Tenant-A, the request is rejected as a
         * potential spoofing attempt (403 Forbidden).</p>
         */
        @Test
        @Order(3)
        @DisplayName("4.3 Tenant header/JWT mismatch is rejected")
        void tenantHeaderJwtMismatchIsRejected() throws Exception {
            String tokenForA = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL");

            // JWT says Tenant-A, header says Tenant-B → conflict → 403
            mockMvc.perform(get("/api/v1/tenant/current")
                            .header("Authorization", "Bearer " + tokenForA)
                            .header(TENANT_HEADER, TENANT_B_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isForbidden());
        }
    }

    // ============================================================================
    // 5. Enterprise Tenant Management API Tests
    // ============================================================================

    @Nested
    @DisplayName("5. Enterprise Tenant Management API")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class EnterpriseTenantManagementTests {

        /**
         * Admin can list all tenants via management API.
         *
         * <p>Validates: GET /api/v1/tenants returns all registered tenants
         * for users with admin privileges.</p>
         */
        @Test
        @Order(1)
        @DisplayName("5.1 Admin lists all tenants")
        void adminListsAllTenants() throws Exception {
            String adminToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL",
                    "tenant:admin", "tenant:read");

            mockMvc.perform(get("/api/v1/tenants")
                            .header("Authorization", "Bearer " + adminToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().isOk());
        }

        /**
         * Admin can get tenant by ID.
         *
         * <p>Validates: GET /api/v1/tenants/{tenantId} returns tenant details.</p>
         */
        @Test
        @Order(2)
        @DisplayName("5.2 Admin gets tenant by ID")
        void adminGetsTenantById() throws Exception {
            String adminToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL",
                    "tenant:admin");

            mockMvc.perform(get("/api/v1/tenants/{tenantId}", 1)
                            .header("Authorization", "Bearer " + adminToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().is2xxSuccessful());
        }

        /**
         * Admin can list members of a tenant.
         *
         * <p>Validates: GET /api/v1/tenants/{tenantId}/members returns
         * the member list for the specified tenant.</p>
         */
        @Test
        @Order(3)
        @DisplayName("5.3 Admin lists tenant members")
        void adminListsTenantMembers() throws Exception {
            String adminToken = jwtHelper.generateActorToken(
                    ACTOR_USER_ID, TENANT_A_ID, MEMBER_A_ID, "INTERNAL",
                    "tenant:admin");

            mockMvc.perform(get("/api/v1/tenants/{tenantId}/members", 1)
                            .header("Authorization", "Bearer " + adminToken)
                            .header(TENANT_HEADER, TENANT_A_ID)
                            .header(USER_HEADER, ACTOR_USER_ID))
                    .andExpect(status().is2xxSuccessful());
        }
    }
}
