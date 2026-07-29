/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.api;

import java.util.List;

/**
 * Response returned by the commercial booking template feature endpoint.
 *
 * @param pluginId stable plugin identity declared in the Runtime manifest
 * @param features business features exposed by this template instance
 * @author Brix Enterprise Team
 * @since 3.2.0
 */
public record BookingTemplateFeaturesResponse(String pluginId, List<String> features) {

    /**
     * Creates an immutable response with a defensive feature-list copy.
     */
    public BookingTemplateFeaturesResponse {
        features = List.copyOf(features != null ? features : List.of());
    }
}
