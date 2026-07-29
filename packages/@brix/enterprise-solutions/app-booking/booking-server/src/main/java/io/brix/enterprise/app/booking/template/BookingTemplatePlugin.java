/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.template;

import io.runtime.sdk.plugin.BrixHealth;
import io.runtime.sdk.plugin.BrixPlugin;
import io.runtime.sdk.plugin.EndpointInvocation;
import io.runtime.sdk.plugin.PluginBootstrapContext;
import io.runtime.sdk.plugin.PluginContext;

/**
 * Runtime Shell plugin provider for the commercial booking template.
 *
 * <p>The provider is the only {@link BrixPlugin} entry in the
 * {@code booking-server} artifact. It binds only manifest-declared endpoint
 * handlers and does not access Spring, Host code, repositories, infrastructure
 * adapters, or other plugin internals.</p>
 *
 * @author Brix Enterprise Team
 * @since 3.2.0
 */
public final class BookingTemplatePlugin implements BrixPlugin {

    static final String STATUS_ENDPOINT_ID = "app-booking.template.status.v1";
    static final String FEATURES_ENDPOINT_ID = "app-booking.template.features.v1";

    private final BookingTemplateService service = new BookingTemplateService();
    private final BookingTemplateEndpoints endpoints = new BookingTemplateEndpoints(service);

    @Override
    public void configure(PluginBootstrapContext bootstrap) {
        bootstrap.bindEndpoint(STATUS_ENDPOINT_ID, request -> endpoints.status(invocation(request)));
        bootstrap.bindEndpoint(FEATURES_ENDPOINT_ID, request -> endpoints.features(invocation(request)));
    }

    @Override
    public void onStart(PluginContext context) {
        service.markStarted();
    }

    @Override
    public void onStop() {
        service.markStopped();
    }

    @Override
    public BrixHealth health() {
        return BrixHealth.up();
    }

    @SuppressWarnings("unchecked")
    private static EndpointInvocation<Object> invocation(Object request) {
        return (EndpointInvocation<Object>) request;
    }
}
