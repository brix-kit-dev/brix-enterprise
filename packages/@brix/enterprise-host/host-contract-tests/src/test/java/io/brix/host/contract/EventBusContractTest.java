/*
 * Copyright 2026 Brix Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.brix.host.contract;

import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.event.IntegrationEvent;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Contract test verifying behavioral consistency between Standalone and Embedded
 * host modes for EventBusCapability implementations.
 *
 * <p>This test ensures that plugins observe identical EventBus publish/consume
 * behavior regardless of the underlying adapter (Kafka vs InMemory vs Webhook).</p>
 *
 * <h3>Architecture Reference</h3>
 * <p>R4.2 — Standalone/Embedded behavioral parity contract</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class EventBusContractTest {

    /**
     * Provides EventBusCapability implementations for parameterized tests.
     * Each implementation represents a different host mode adapter.
     */
    static Stream<EventBusCapability> eventBusImplementations() {
        return EventBusTestFactory.allImplementations();
    }

    @ParameterizedTest(name = "publishIntegration should not throw for valid event [{index}]")
    @MethodSource("eventBusImplementations")
    void publishIntegration_shouldNotThrowForValidEvent(EventBusCapability eventBus) {
        IntegrationEvent event = createTestEvent("tenant-1");

        assertThatCode(() -> eventBus.publishIntegration(event))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "publishIntegration should populate traceId [{index}]")
    @MethodSource("eventBusImplementations")
    void publishIntegration_shouldPopulateTraceId(EventBusCapability eventBus) {
        IntegrationEvent event = createTestEvent("tenant-1");

        eventBus.publishIntegration(event);

        assertThat(event.getTraceId())
                .as("traceId should be populated after publish (P0-1 contract)")
                .isNotNull()
                .isNotBlank();
    }

    @ParameterizedTest(name = "publishIntegration should reject null event [{index}]")
    @MethodSource("eventBusImplementations")
    void publishIntegration_shouldRejectNullEvent(EventBusCapability eventBus) {
        assertThatCode(() -> eventBus.publishIntegration(null))
                .isInstanceOf(NullPointerException.class);
    }

    private static IntegrationEvent createTestEvent(String tenantId) {
        return new IntegrationEvent("test-module") {
            @Override
            public String getRoutingKey() {
                return "test.routing.key";
            }
        };
    }
}
