/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.template;

import io.brix.enterprise.app.booking.api.BookingTemplateFeaturesResponse;
import io.brix.enterprise.app.booking.api.BookingTemplateStatusResponse;
import io.runtime.sdk.plugin.EndpointInvocation;

/**
 * Runtime Dispatcher handlers for the commercial booking template endpoints.
 *
 * @author Brix Enterprise Team
 * @since 3.2.0
 */
final class BookingTemplateEndpoints {

    private final BookingTemplateService service;

    BookingTemplateEndpoints(BookingTemplateService service) {
        this.service = service;
    }

    BookingTemplateStatusResponse status(EndpointInvocation<Object> ignored) {
        return service.status();
    }

    BookingTemplateFeaturesResponse features(EndpointInvocation<Object> ignored) {
        return service.features();
    }
}
