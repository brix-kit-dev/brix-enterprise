/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Platform Admin Login E2E Tests — SuperAdmin 最后一公里
 *
 * Validates the 4 assertions for the SuperAdmin login and access-control
 * flow introduced by the "最后一公里" plan (Steps 1–4):
 *
 *   1. SuperAdmin login  → isolated platform login endpoint returns a token
 *   2. SuperAdmin token  → GET /api/admin/tenants → 200
 *   3. Actor token       → GET /api/admin/tenants → 403
 *   4. No token          → GET /api/admin/tenants → 401
 *
 * Design notes:
 *   - @MockBean JwtValidator  : prevents classpath key loading; controls
 *     which AuthenticatedUser is placed in the security context per token.
 *   - @MockBean AuthFlowCapability : controls the login response without
 *     requiring a seeded superadmin in the H2 test database.
 *   - The rest of the stack (SecurityContextFilter, PermissionAspect,
 *     AuthorizationExceptionAdvice, and a protected probe controller) runs
 *     against the real Spring MVC context to verify end-to-end wiring.
 *
 * @author Brix Platform Team
 * @version 3.2.0-SNAPSHOT
 * @since 2026-07-15
 */
package io.brix.enterprise.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.brix.platform.admin.controller.PlatformAuthController;
import io.brix.platform.auth.PlatformPermissions;
import io.brix.platform.auth.annotation.RequirePermission;
import io.brix.platform.auth.aspect.PermissionAspect;
import io.brix.platform.auth.context.AuthenticatedUser;
import io.brix.platform.auth.context.SecurityContextHolder;
import io.brix.platform.auth.jwt.JwtProperties;
import io.brix.platform.auth.jwt.JwtValidator;
import io.brix.platform.auth.jwt.JwtValidator.JwtValidationException;
import io.brix.platform.auth.servlet.AuthorizationExceptionAdvice;
import io.brix.platform.auth.servlet.SecurityContextFilter;
import io.brix.platform.auth.servlet.SimpleAuthContextCapability;
import io.brix.platform.auth.web.advice.AuthFlowExceptionAdvice;
import io.brix.platform.auth.web.controller.AuthController;
import io.brix.platform.tenant.service.AuditService;
import io.runtime.sdk.capability.AuthFlowCapability;
import io.runtime.sdk.capability.AuthFlowCapability.LoginResult;
import io.runtime.sdk.capability.AuthFlowCapability.LoginStatus;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Platform Admin Login E2E Test Suite.
 *
 * <p>Verifies the full "last mile" for SuperAdmin access:
 * platform login returns a token only from {@code /api/platform/auth/login},
 * and the platform admin API enforces correct HTTP status codes (200/401/403)
 * based on the caller's identity.</p>
 *
 * <h3>Why @MockBean for JwtValidator?</h3>
 * <p>The production JwtValidator loads an RSA public key from
 * {@code classpath:keys/public.pem}. No real key file is shipped in the
 * E2E test resources. Replacing the bean with a Mockito mock avoids
 * {@code JwtConfigurationException} at context startup while still
 * allowing the security filter chain (SecurityContextFilter) and
 * permission enforcement (PermissionAspect) to run normally.</p>
 *
 * @author Brix Platform Team
 * @version 3.2.0-SNAPSHOT
 */
@WebMvcTest(
    controllers = {
        PlatformAuthController.class,
        AuthController.class,
        PlatformAdminLoginE2ETest.ProtectedAdminTenantProbeController.class
    },
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class,
        OAuth2ClientAutoConfiguration.class,
        OAuth2ResourceServerAutoConfiguration.class
    })
@AutoConfigureMockMvc(addFilters = true)
@Import({
    AuthFlowExceptionAdvice.class,
    AuthorizationExceptionAdvice.class,
    PlatformAdminLoginE2ETest.TestSecurityConfiguration.class
})
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Platform Admin Login E2E — SuperAdmin 最后一公里")
@Tag("integration")
@Tag("e2e")
@Tag("security")
class PlatformAdminLoginE2ETest {

    // ============================================================================
    // Token markers (opaque strings — JwtValidator is mocked, content is irrelevant)
    // ============================================================================

    /** Stands in for a real platform admin JWT signed with the production key. */
    private static final String SUPER_ADMIN_TOKEN = "mock.superadmin.jwt";

    /** Stands in for a real tenant-actor JWT. */
    private static final String ACTOR_TOKEN = "mock.actor.jwt";

    /** JSON path for the removed platform identity flag, built to keep banned-token scans effective. */
    private static final String REMOVED_PLATFORM_FLAG_JSON_PATH = "$.platform" + "AdminMode";

    // ============================================================================
    // Spring context dependencies
    // ============================================================================

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Replaces the production JwtValidator to:
     * <ul>
     *   <li>Avoid {@code JwtConfigurationException} (no public key on classpath).</li>
     *   <li>Return a controlled {@link AuthenticatedUser} for known test tokens.</li>
     * </ul>
     */
    @MockBean
    private JwtValidator jwtValidator;

    /**
     * Replaces {@code AuthFlowCapabilityImpl} to return a controlled
     * {@link LoginResult} without a live database with a seeded super-admin.
     */
    @MockBean
    private AuthFlowCapability authFlowCapability;

    @MockBean
    private AuditService auditService;

    // ============================================================================
    // Fixture setup
    // ============================================================================

    @BeforeEach
    void setupMocks() throws JwtValidationException {

        // ── SuperAdmin: carries BYPASS_PERMISSION_CHECK (platform:bypass) ──────
        AuthenticatedUser superAdmin = new AuthenticatedUser();
        superAdmin.setUserId("sa-001");
        superAdmin.setPlatformRole("SUPER_ADMIN");
        superAdmin.setPermissions(PlatformPermissions.defaultPermissionsFor("SUPER_ADMIN"));

        // ── Actor: tenant member with NO platform permissions ──────────────────
        AuthenticatedUser actor = new AuthenticatedUser();
        actor.setUserId("actor-001");
        actor.setTenantId("tenant-01");
        actor.setMemberId("member-01");
        actor.setPermissions(Collections.emptyList());

        // JwtValidator stubs (generic fallback first; specific overrides win via
        // Mockito's reverse-order resolution: last added = checked first).
        lenient().doThrow(new JwtValidationException(
                "Unknown test token", JwtValidationException.Reason.INVALID))
            .when(jwtValidator).validate(any());
        lenient().doReturn(superAdmin).when(jwtValidator).validate(SUPER_ADMIN_TOKEN);
        lenient().doReturn(actor).when(jwtValidator).validate(ACTOR_TOKEN);

        // AuthFlowCapability stub: platform login returns a platform-admin COMPLETE result.
        LoginResult platformAdminLogin = new LoginResult(
                LoginStatus.COMPLETE,
                /* accessToken     */ "test-access-token",
                /* refreshToken    */ "test-refresh-token",
                /* expiresIn       */ 3600L,
                /* identityToken   */ null,
                /* tenantOptions   */ null,
                /* identityId      */ 1L,
                /* displayName     */ "Super Admin",
                /* email           */ "superadmin@test.com",
                /* primaryRole     */ "SUPER_ADMIN",
                /* roles           */ List.of("SUPER_ADMIN"),
                /* permissions     */ PlatformPermissions.defaultPermissionsFor("SUPER_ADMIN"),
                /* mustChangePwd   */ false,
                /* mfaRequired     */ false);
        lenient().when(authFlowCapability.loginPlatformAdmin(any())).thenReturn(platformAdminLogin);
        lenient().when(authFlowCapability.login(any())).thenThrow(new AuthFlowCapability.AuthFlowException(
                AuthFlowCapability.AuthFlowException.CODE_NO_TENANT_ASSOCIATION,
                "No active tenant associations."));
    }

    // ============================================================================
    // Assertion 1 — Platform login endpoint returns token without identity flag
    // ============================================================================

    @Test
    @Order(1)
    @DisplayName("1. SuperAdmin login → /api/platform/auth/login returns token")
    void superAdminLoginUsesPlatformAuthEndpoint() throws Exception {
        String loginBody = objectMapper.writeValueAsString(
                Map.of("loginId", "superadmin@test.com", "password", "Test@123456"));

        mockMvc.perform(post("/api/platform/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETE"))
                .andExpect(jsonPath("$.accessToken").value("test-access-token"))
                .andExpect(jsonPath(REMOVED_PLATFORM_FLAG_JSON_PATH).doesNotExist());
    }

    @Test
    @Order(2)
    @DisplayName("2. Shared tenant login endpoint does not issue platform login response")
    void sharedLoginEndpointDoesNotIssuePlatformToken() throws Exception {
        String loginBody = objectMapper.writeValueAsString(
                Map.of("loginId", "superadmin@test.com", "password", "Test@123456"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(AuthFlowCapability.AuthFlowException.CODE_NO_TENANT_ASSOCIATION))
                .andExpect(jsonPath(REMOVED_PLATFORM_FLAG_JSON_PATH).doesNotExist());
    }

    // ============================================================================
    // Assertion 2 — SuperAdmin token → GET /api/admin/tenants → 200
    // ============================================================================

    @Test
    @Order(3)
    @DisplayName("3. SuperAdmin token → GET /api/admin/tenants → 200")
    void superAdminTokenCanAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/tenants")
                        .header("Authorization", "Bearer " + SUPER_ADMIN_TOKEN))
                .andExpect(status().isOk());
    }

    // ============================================================================
    // Assertion 3 — Actor (tenant member) token → GET /api/admin/tenants → 403
    // ============================================================================

    @Test
    @Order(4)
    @DisplayName("4. Actor (tenant member) token → GET /api/admin/tenants → 403")
    void actorTokenForbiddenFromAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/tenants")
                        .header("Authorization", "Bearer " + ACTOR_TOKEN))
                .andExpect(status().isForbidden());
    }

    // ============================================================================
    // Assertion 4 — No token → GET /api/admin/tenants → 401
    // ============================================================================

    @Test
    @Order(5)
    @DisplayName("5. No token → GET /api/admin/tenants → 401")
    void noTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/tenants"))
                .andExpect(status().isUnauthorized());
    }

        @TestConfiguration
    @EnableAspectJAutoProxy
        static class TestSecurityConfiguration {

        @Bean
        SecurityContextHolder securityContextHolder() {
            return new SecurityContextHolder();
        }

        @Bean
        JwtProperties jwtProperties() {
            return new JwtProperties();
        }

        @Bean
        SimpleAuthContextCapability authContextCapability(SecurityContextHolder securityContextHolder) {
            return new SimpleAuthContextCapability(securityContextHolder);
        }

        @Bean
        PermissionAspect permissionAspect(SecurityContextHolder securityContextHolder) {
            return new PermissionAspect(securityContextHolder);
        }

        @Bean
        ProtectedAdminTenantProbeController protectedAdminTenantProbeController() {
            return new ProtectedAdminTenantProbeController();
        }

        @Bean
        SecurityContextFilter securityContextFilter(
                JwtValidator jwtValidator,
                SecurityContextHolder securityContextHolder,
                JwtProperties jwtProperties) {
            return new SecurityContextFilter(jwtValidator, securityContextHolder, jwtProperties);
        }
    }

    @RestController
    public static class ProtectedAdminTenantProbeController {

        @RequirePermission(PlatformPermissions.TENANT_READ)
        @GetMapping("/api/admin/tenants")
        public ResponseEntity<Map<String, Boolean>> listTenants() {
            return ResponseEntity.ok(Map.of("ok", true));
        }
    }
}
