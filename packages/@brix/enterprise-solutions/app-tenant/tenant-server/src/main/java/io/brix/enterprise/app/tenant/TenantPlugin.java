/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.core.JacksonException;

import io.brix.enterprise.app.tenant.exception.TenantAlreadyExistsException;
import io.brix.enterprise.app.tenant.exception.TenantRecordNotFoundException;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;
import io.brix.enterprise.app.tenant.service.TenantManagementService;
import io.runtime.sdk.capability.AuthCapability;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.capability.NotificationCapability;
import io.runtime.sdk.plugin.BrixHealth;
import io.runtime.sdk.plugin.BrixPlugin;
import io.runtime.sdk.plugin.EndpointHandler;
import io.runtime.sdk.plugin.EndpointHandlingException;
import io.runtime.sdk.plugin.EndpointInvocation;
import io.runtime.sdk.plugin.EndpointResponse;
import io.runtime.sdk.plugin.PluginBootstrapContext;
import io.runtime.sdk.plugin.PluginContext;

/**
 * v3.0.10 Runtime Shell entry point for the tenant plugin.
 *
 * <p>The plugin manifest remains the single source of metadata at
 * {@code META-INF/brix/plugin-manifest.yaml}. This class only binds declared
 * route ids and resolves declared capabilities through {@link PluginContext};
 * it never reads platform implementations, Host code, Spring containers, or
 * runtime internals.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.10
 */
public final class TenantPlugin implements BrixPlugin {

    static final String ENDPOINT_TENANT_LIST = "tenant.list";
    static final String ENDPOINT_TENANT_CREATE = "tenant.create";
    static final String ENDPOINT_TENANT_DETAIL = "tenant.detail";
    static final String ENDPOINT_TENANT_BY_CODE = "tenant.by-code";
    static final String ENDPOINT_TENANT_ACTIVATE = "tenant.activate";
    static final String ENDPOINT_TENANT_SUSPEND = "tenant.suspend";
    static final String ENDPOINT_TENANT_MEMBERS = "tenant.members";
    private static final String ERROR_REQUEST_REQUIRED = "TENANT_REQUEST_REQUIRED";
    private static final String ERROR_REQUEST_INVALID = "TENANT_REQUEST_INVALID";
    private static final String ERROR_PATH_INVALID = "TENANT_PATH_INVALID";
    private static final String ERROR_PATH_REQUIRED = "TENANT_PATH_REQUIRED";
    private static final String ERROR_NOT_FOUND = "TENANT_NOT_FOUND";
    private static final String ERROR_ALREADY_EXISTS = "TENANT_ALREADY_EXISTS";

    private volatile boolean started;
    private volatile boolean notificationAvailable;
    private TenantManagementService tenantManagementService;
    private ObjectMapper objectMapper = JsonMapper.builder().configureForJackson2().build();

    /**
     * Injects plugin-owned services after ServiceLoader discovery.
     *
     * @param tenantManagementService tenant service
     * @param objectMapper JSON object mapper
     */
    @Autowired
    public void setTenantServices(TenantManagementService tenantManagementService, ObjectMapper objectMapper) {
        this.tenantManagementService = Objects.requireNonNull(
            tenantManagementService,
            "tenantManagementService must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    /**
     * Binds every route declared by the tenant plugin manifest.
     *
     * @param bootstrap Runtime Shell binding context
     */
    @Override
    public void configure(PluginBootstrapContext bootstrap) {
        Objects.requireNonNull(bootstrap, "bootstrap must not be null");
        requireTenantManagementService();
        bootstrap.bindEndpoint(ENDPOINT_TENANT_LIST, endpoint(this::listTenants));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_CREATE, endpoint(this::createTenant));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_DETAIL, endpoint(this::getTenant));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_BY_CODE, endpoint(this::getTenantByCode));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_ACTIVATE, endpoint(this::activateTenant));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_SUSPEND, endpoint(this::suspendTenant));
        bootstrap.bindEndpoint(ENDPOINT_TENANT_MEMBERS, endpoint(this::listMembers));
    }

    /**
     * Resolves manifest-declared capabilities through the plugin context.
     *
     * @param context Runtime Shell capability context
     */
    @Override
    public void onStart(PluginContext context) {
        Objects.requireNonNull(context, "context must not be null");
        context.require(AuthCapability.class);
        context.require(EventBusCapability.class);
        notificationAvailable = context.find(NotificationCapability.class).isPresent();
        started = true;
    }

    /**
     * Marks this plugin as stopped.
     */
    @Override
    public void onStop() {
        started = false;
        notificationAvailable = false;
    }

    /**
     * Returns the plugin health contribution.
     *
     * @return current tenant plugin health
     */
    @Override
    public BrixHealth health() {
        if (!started) {
            return BrixHealth.down("Tenant plugin has not started");
        }
        if (!notificationAvailable) {
            return BrixHealth.degraded("Optional NotificationCapability is not available");
        }
        return BrixHealth.up();
    }

    private Object listTenants(EndpointInvocation<Object> invocation) {
        return EndpointResponse.ok(requireTenantManagementService().listTenants());
    }

    private Object createTenant(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.created(
            requireTenantManagementService().createTenant(createRequest(invocation.body()))));
    }

    private Object getTenant(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.ok(
            requireTenantManagementService().getTenantById(pathLong(invocation, "tenantId"))));
    }

    private Object getTenantByCode(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.ok(
            requireTenantManagementService().getTenantByCode(pathText(invocation, "code"))));
    }

    private Object activateTenant(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.ok(
            requireTenantManagementService().activateTenant(pathLong(invocation, "tenantId"))));
    }

    private Object suspendTenant(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.ok(
            requireTenantManagementService().suspendTenant(pathLong(invocation, "tenantId"))));
    }

    private Object listMembers(EndpointInvocation<Object> invocation) {
        return mapExpectedFailures(() -> EndpointResponse.ok(
            requireTenantManagementService().listMembers(pathLong(invocation, "tenantId"))));
    }

    private CreateTenantRequest createRequest(Object body) {
        if (body == null) {
            throw new EndpointHandlingException(400, ERROR_REQUEST_REQUIRED, "Tenant create request body is required");
        }
        try {
            if (body instanceof CreateTenantRequest request) {
                return request;
            }
            return objectMapper.convertValue(body, CreateTenantRequest.class);
        } catch (IllegalArgumentException | JacksonException e) {
            // Jackson 3 reports conversion failures as (unchecked) JacksonException
            throw new EndpointHandlingException(400, ERROR_REQUEST_INVALID, "Tenant create request body is invalid");
        }
    }

    private Long pathLong(EndpointInvocation<Object> invocation, String name) {
        String value = pathText(invocation, name);
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException e) {
            throw new EndpointHandlingException(400, ERROR_PATH_INVALID, name + " must be a number");
        }
    }

    private String pathText(EndpointInvocation<Object> invocation, String name) {
        String value = invocation.pathVariables().get(name);
        if (value == null || value.isBlank()) {
            throw new EndpointHandlingException(400, ERROR_PATH_REQUIRED, name + " path variable is required");
        }
        return value;
    }

    private Object mapExpectedFailures(EndpointCall call) {
        try {
            return call.invoke();
        } catch (TenantRecordNotFoundException e) {
            throw new EndpointHandlingException(404, ERROR_NOT_FOUND, e.getMessage());
        } catch (TenantAlreadyExistsException e) {
            throw new EndpointHandlingException(409, ERROR_ALREADY_EXISTS, e.getMessage());
        } catch (java.lang.IllegalArgumentException e) {
            throw new EndpointHandlingException(400, ERROR_REQUEST_INVALID, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private EndpointHandler<EndpointInvocation<Object>, Object> endpoint(TenantEndpoint endpoint) {
        return endpoint::handle;
    }

    private TenantManagementService requireTenantManagementService() {
        if (tenantManagementService == null) {
            throw new IllegalStateException("TenantManagementService is not available for tenant endpoint binding");
        }
        return tenantManagementService;
    }

    @FunctionalInterface
    private interface TenantEndpoint {
        Object handle(EndpointInvocation<Object> invocation);
    }

    @FunctionalInterface
    private interface EndpointCall {
        Object invoke();
    }
}
