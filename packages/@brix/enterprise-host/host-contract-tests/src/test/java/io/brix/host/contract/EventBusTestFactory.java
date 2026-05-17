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

import io.infra.adapter.simple.InMemoryEventBusCapability;
import io.runtime.sdk.capability.EventBusCapability;

import java.util.stream.Stream;

/**
 * Factory providing EventBusCapability implementations for contract testing.
 *
 * <p>Includes all adapter implementations that should be behaviorally equivalent:
 * <ul>
 *   <li>InMemoryEventBusCapability (Embedded mode)</li>
 *   <li>HttpWebhookEventBus (Embedded mode) — requires network setup, skipped by default</li>
 *   <li>KafkaEventBusCapability (Standalone mode) — requires Kafka, skipped by default</li>
 * </ul>
 *
 * <p>For CI integration tests with real infrastructure, use Spring profiles
 * to activate the full adapter suite.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
final class EventBusTestFactory {

    private EventBusTestFactory() {
    }

    /**
     * Returns all EventBusCapability implementations that can be tested
     * without external infrastructure (unit-level contract tests).
     */
    static Stream<EventBusCapability> allImplementations() {
        return Stream.of(
                createInMemoryEventBus()
        );
    }

    private static InMemoryEventBusCapability createInMemoryEventBus() {
        return new InMemoryEventBusCapability(false, 100);
    }
}
