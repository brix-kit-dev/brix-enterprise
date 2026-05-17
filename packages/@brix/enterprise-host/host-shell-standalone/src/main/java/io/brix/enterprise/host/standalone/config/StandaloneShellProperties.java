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
package io.brix.enterprise.host.standalone.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import io.brix.platform.starter.shell.AbstractShellProperties;

/**
 * Standalone mode Runtime Shell configuration properties.
 *
 * <p>Extends {@link AbstractShellProperties} common fields (moduleId, tenantId, scheduling, lock)
 * and adds standalone-mode-specific Kafka/Redis/capability declarative configuration.</p>
 *
 * <h2>Package Rename (v3.0.9)</h2>
 * <p>Renamed from {@code io.host.shell.standalone.config} to
 * {@code io.brix.enterprise.host.standalone.config}.</p>
 *
 * <p>Configure the Runtime Shell behavior via application.yml:</p>
 * <pre>{@code
 * brix:
 *   shell:
 *     standalone:
 *       module-id: brix-platform
 *       tenant-id: default
 *       capabilities:
 *         required:
 *           - io.runtime.sdk.capability.EventBusCapability
 *           - io.runtime.sdk.capability.StateStoreCapability
 *         optional:
 *           - io.runtime.sdk.capability.SchedulingCapability
 *         disabled:
 *           - io.runtime.sdk.capability.ResilienceCapability
 *       event-bus:
 *         type: kafka
 *       state-store:
 *         type: redis
 * }</pre>
 *
 * @author Host Assembly Team
 * @since 3.0.0
 * @see AbstractShellProperties
 */
@ConfigurationProperties(prefix = "brix.shell.standalone")
public class StandaloneShellProperties extends AbstractShellProperties {

    /**
     * Capability configuration (declarative capability assembly).
     */
    private CapabilitiesConfig capabilities = new CapabilitiesConfig();

    /**
     * Event bus configuration.
     */
    private EventBusConfig eventBus = new EventBusConfig();

    /**
     * State store configuration.
     */
    private StateStoreConfig stateStore = new StateStoreConfig();

    /**
     * Observability configuration.
     */
    private ObservabilityConfig observability = new ObservabilityConfig();

    /**
     * Standalone mode distributed lock configuration (extends base class, adds type field).
     */
    private StandaloneLockConfig standaloneLock = new StandaloneLockConfig();

    // ==================== Constructors ====================

    public StandaloneShellProperties() {
        // Default moduleId for standalone mode
        setModuleId("standalone-shell");
    }

    // ==================== Getters & Setters ====================

    public CapabilitiesConfig getCapabilities() {
        return capabilities;
    }

    public void setCapabilities(CapabilitiesConfig capabilities) {
        this.capabilities = capabilities;
    }

    public EventBusConfig getEventBus() {
        return eventBus;
    }

    public void setEventBus(EventBusConfig eventBus) {
        this.eventBus = eventBus;
    }

    public StateStoreConfig getStateStore() {
        return stateStore;
    }

    public void setStateStore(StateStoreConfig stateStore) {
        this.stateStore = stateStore;
    }

    public StandaloneLockConfig getStandaloneLock() {
        return standaloneLock;
    }

    public void setStandaloneLock(StandaloneLockConfig standaloneLock) {
        this.standaloneLock = standaloneLock;
    }

    public ObservabilityConfig getObservability() {
        return observability;
    }

    public void setObservability(ObservabilityConfig observability) {
        this.observability = observability;
    }

    // ==================== Nested Configuration Classes ====================

    /**
     * Capability configuration (declarative capability assembly).
     */
    public static class CapabilitiesConfig {

        private List<String> required = new ArrayList<>();
        private List<String> optional = new ArrayList<>();
        private List<String> disabled = new ArrayList<>();
        private boolean autoDiscovery = true;
        private boolean validateOnStartup = true;

        public List<String> getRequired() {
            return required;
        }

        public void setRequired(List<String> required) {
            this.required = required;
        }

        public List<String> getOptional() {
            return optional;
        }

        public void setOptional(List<String> optional) {
            this.optional = optional;
        }

        public List<String> getDisabled() {
            return disabled;
        }

        public void setDisabled(List<String> disabled) {
            this.disabled = disabled;
        }

        public boolean isAutoDiscovery() {
            return autoDiscovery;
        }

        public void setAutoDiscovery(boolean autoDiscovery) {
            this.autoDiscovery = autoDiscovery;
        }

        public boolean isValidateOnStartup() {
            return validateOnStartup;
        }

        public void setValidateOnStartup(boolean validateOnStartup) {
            this.validateOnStartup = validateOnStartup;
        }
    }

    /**
     * Event bus configuration.
     */
    public static class EventBusConfig {
        private String type = "kafka";
        private boolean outboxEnabled = true;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public boolean isOutboxEnabled() {
            return outboxEnabled;
        }

        public void setOutboxEnabled(boolean outboxEnabled) {
            this.outboxEnabled = outboxEnabled;
        }
    }

    /**
     * State store configuration.
     */
    public static class StateStoreConfig {
        private String type = "redis";
        private String keyPrefix = "brix:";

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getKeyPrefix() {
            return keyPrefix;
        }

        public void setKeyPrefix(String keyPrefix) {
            this.keyPrefix = keyPrefix;
        }
    }

    /**
     * Standalone mode distributed lock configuration (extends base LockConfig, adds lock type).
     */
    public static class StandaloneLockConfig extends LockConfig {
        private String type = "redis";

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    /**
     * Observability configuration.
     */
    public static class ObservabilityConfig {
        private String type = "otel";
        private String serviceName;
        private double samplingRatio = 1.0;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getServiceName() {
            return serviceName;
        }

        public void setServiceName(String serviceName) {
            this.serviceName = serviceName;
        }

        public double getSamplingRatio() {
            return samplingRatio;
        }

        public void setSamplingRatio(double samplingRatio) {
            this.samplingRatio = samplingRatio;
        }
    }
}
