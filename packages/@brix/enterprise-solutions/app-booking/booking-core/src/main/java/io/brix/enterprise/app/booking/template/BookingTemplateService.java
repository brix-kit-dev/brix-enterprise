/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.template;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import io.brix.enterprise.app.booking.api.BookingTemplateFeaturesResponse;
import io.brix.enterprise.app.booking.api.BookingTemplateStatusResponse;

/**
 * Application service for the commercial booking plugin template.
 *
 * <p>The Phase 5 template intentionally exposes no booking business behavior.
 * It reports only Runtime assembly status so the Host can prove the plugin is
 * discoverable and dispatchable without creating business tables, events, or
 * tenant directory authority.</p>
 *
 * @author Brix Enterprise Team
 * @since 3.2.0
 */
public final class BookingTemplateService {

    private static final String PLUGIN_ID = "app-booking";
    private static final String VERSION = "3.2.0-SNAPSHOT";
    private static final List<String> FEATURES = List.of();

    private final AtomicReference<String> runtimeStatus = new AtomicReference<>("CONFIGURED");

    /**
     * Marks the template as started by the Runtime Shell.
     */
    public void markStarted() {
        runtimeStatus.set("STARTED");
    }

    /**
     * Marks the template as stopped by the Runtime Shell.
     */
    public void markStopped() {
        runtimeStatus.set("STOPPED");
    }

    /**
     * Returns the current template status.
     *
     * @return immutable template status response
     */
    public BookingTemplateStatusResponse status() {
        return new BookingTemplateStatusResponse(
            PLUGIN_ID,
            VERSION,
            runtimeStatus.get(),
            "STARTED".equals(runtimeStatus.get()),
            FEATURES);
    }

    /**
     * Returns the current template feature list.
     *
     * @return immutable template features response
     */
    public BookingTemplateFeaturesResponse features() {
        return new BookingTemplateFeaturesResponse(PLUGIN_ID, FEATURES);
    }
}
