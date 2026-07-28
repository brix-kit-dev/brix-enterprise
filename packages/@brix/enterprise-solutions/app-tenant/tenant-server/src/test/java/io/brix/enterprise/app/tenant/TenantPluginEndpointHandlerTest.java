/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.dto.TenantMemberDTO;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;
import io.brix.enterprise.app.tenant.service.TenantManagementService;
import io.runtime.sdk.plugin.CommandHandler;
import io.runtime.sdk.plugin.EndpointHandler;
import io.runtime.sdk.plugin.EndpointInvocation;
import io.runtime.sdk.plugin.EndpointResponse;
import io.runtime.sdk.plugin.EventHandler;
import io.runtime.sdk.plugin.ManagedTask;
import io.runtime.sdk.plugin.PluginBootstrapContext;
import io.runtime.sdk.plugin.QueryHandler;

/**
 * Verifies tenant Runtime Shell endpoint handlers call plugin-owned services.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
class TenantPluginEndpointHandlerTest {

    @Test
    void createTenantHandlerReturnsCreatedResponse() {
        RecordingTenantManagementService service = new RecordingTenantManagementService();
        RecordingBootstrapContext bootstrap = configuredBootstrap(service);
        Map<String, Object> body = Map.of(
            "code", "acme-corp",
            "name", "Acme Corporation",
            "ownerIdentityId", 1001L,
            "contactEmail", "owner@example.com");

        EndpointResponse response = (EndpointResponse) invoke(
            bootstrap.endpoint(TenantPlugin.ENDPOINT_TENANT_CREATE),
            invocation(body, Map.of()));

        assertThat(response.status()).isEqualTo(201);
        assertThat(((TenantDTO) response.body()).getCode()).isEqualTo("acme-corp");
        assertThat(service.createdRequests).hasSize(1);
    }

    @Test
    void detailHandlerUsesRuntimePathVariables() {
        RecordingBootstrapContext bootstrap = configuredBootstrap(new RecordingTenantManagementService());

        EndpointResponse response = (EndpointResponse) invoke(
            bootstrap.endpoint(TenantPlugin.ENDPOINT_TENANT_DETAIL),
            invocation(null, Map.of("tenantId", "42")));

        assertThat(response.status()).isEqualTo(200);
        assertThat(((TenantDTO) response.body()).getId()).isEqualTo(42L);
    }

    @SuppressWarnings("unchecked")
    private static Object invoke(EndpointHandler<?, ?> handler, EndpointInvocation<Object> invocation) {
        return ((EndpointHandler<EndpointInvocation<Object>, Object>) handler).handle(invocation);
    }

    private static RecordingBootstrapContext configuredBootstrap(RecordingTenantManagementService service) {
        TenantPlugin plugin = new TenantPlugin();
        plugin.setTenantServices(service, new ObjectMapper());
        RecordingBootstrapContext bootstrap = new RecordingBootstrapContext();
        plugin.configure(bootstrap);
        return bootstrap;
    }

    private static EndpointInvocation<Object> invocation(Object body, Map<String, String> pathVariables) {
        return new EndpointInvocation<>(
            body,
            pathVariables,
            Map.of(),
            Map.of(),
            java.util.Optional.empty(),
            java.util.Optional.of("operator-1"),
            java.util.Optional.of("trace-1"),
            Instant.now().plusSeconds(30));
    }

    private static final class RecordingBootstrapContext implements PluginBootstrapContext {
        private final Map<String, EndpointHandler<?, ?>> endpoints = new LinkedHashMap<>();

        @Override
        public void bindEndpoint(String manifestEndpointId, EndpointHandler<?, ?> handler) {
            endpoints.put(manifestEndpointId, handler);
        }

        @Override
        public void bindQueryHandler(String manifestQueryId, QueryHandler<?, ?> handler) {
        }

        @Override
        public void bindCommandHandler(String manifestCommandId, CommandHandler<?> handler) {
        }

        @Override
        public void bindEventHandler(String manifestSubscriptionId, EventHandler<?> handler) {
        }

        @Override
        public void bindTask(String manifestTaskId, ManagedTask task) {
        }

        private EndpointHandler<?, ?> endpoint(String endpointId) {
            return endpoints.get(endpointId);
        }
    }

    private static final class RecordingTenantManagementService implements TenantManagementService {
        private final List<CreateTenantRequest> createdRequests = new ArrayList<>();

        @Override
        public TenantDTO createTenant(CreateTenantRequest request) {
            createdRequests.add(request);
            return tenant(7L, request.getCode(), request.getName());
        }

        @Override
        public TenantDTO getTenantById(Long tenantId) {
            return tenant(tenantId, "acme-corp", "Acme Corporation");
        }

        @Override
        public TenantDTO getTenantByCode(String code) {
            return tenant(7L, code, "Acme Corporation");
        }

        @Override
        public List<TenantDTO> listTenants() {
            return List.of(tenant(7L, "acme-corp", "Acme Corporation"));
        }

        @Override
        public TenantDTO activateTenant(Long tenantId) {
            return tenant(tenantId, "acme-corp", "Acme Corporation");
        }

        @Override
        public TenantDTO suspendTenant(Long tenantId) {
            return tenant(tenantId, "acme-corp", "Acme Corporation");
        }

        @Override
        public List<TenantMemberDTO> listMembers(Long tenantId) {
            TenantMemberDTO member = new TenantMemberDTO();
            member.setTenantId(tenantId);
            member.setIdentityId(1001L);
            member.setMemberType("OWNER");
            member.setStatus("ACTIVE");
            return List.of(member);
        }

        private static TenantDTO tenant(Long id, String code, String name) {
            return new TenantDTO(
                id,
                code,
                name,
                "ACTIVE",
                "owner@example.com",
                OffsetDateTime.now(),
                OffsetDateTime.now());
        }
    }
}
