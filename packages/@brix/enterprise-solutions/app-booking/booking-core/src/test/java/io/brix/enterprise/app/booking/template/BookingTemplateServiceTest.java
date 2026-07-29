/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.template;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BookingTemplateServiceTest {

    @Test
    void reportsStartedTemplateWithoutBusinessFeatures() {
        BookingTemplateService service = new BookingTemplateService();

        service.markStarted();

        assertThat(service.status().pluginId()).isEqualTo("app-booking");
        assertThat(service.status().runtimeStatus()).isEqualTo("STARTED");
        assertThat(service.status().endpointPublished()).isTrue();
        assertThat(service.features().features()).isEmpty();
    }
}
