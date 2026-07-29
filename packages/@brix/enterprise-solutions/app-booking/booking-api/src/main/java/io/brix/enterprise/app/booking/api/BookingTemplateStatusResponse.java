/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.api;

import java.util.List;

/**
 * Response returned by the commercial booking template status endpoint.
 *
 * @param pluginId stable plugin identity declared in the Runtime manifest
 * @param version plugin artifact version declared in the Runtime manifest
 * @param runtimeStatus current template runtime status
 * @param endpointPublished whether the Runtime Dispatcher published the template endpoint
 * @param features business features exposed by this template instance
 * @author Brix Enterprise Team
 * @since 3.2.0
 */
public record BookingTemplateStatusResponse(
        String pluginId,
        String version,
        String runtimeStatus,
        boolean endpointPublished,
        List<String> features) {

    /**
     * Creates an immutable response with a defensive feature-list copy.
     */
    public BookingTemplateStatusResponse {
        features = List.copyOf(features != null ? features : List.of());
    }
}
