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
package io.host.shell.embedded.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import io.brix.platform.starter.shell.AbstractShellProperties;

/**
 * 嵌入模式运行壳配置属性
 * 
 * <p>继承 {@link AbstractShellProperties} 公共字段（moduleId, tenantId, scheduling, lock），
 * 增加嵌入模式特有的 Webhook / 内存存储 / 轻量配置。</p>
 * 
 * <p>通过 application.yml 配置嵌入模式行为：</p>
 * <pre>{@code
 * brix:
 *   shell:
 *     embedded:
 *       module-id: my-plugin
 *       webhook:
 *         endpoints:
 *           - url: https://customer.com/webhook
 *             secret: my-secret
 *       state-store:
 *         max-entries: 10000
 *         default-ttl: PT1H
 * }</pre>
 * 
 * @author Host Assembly Team
 * @since 3.0.0
 * @see AbstractShellProperties
 */
@ConfigurationProperties(prefix = "brix.shell.embedded")
public class EmbeddedShellProperties extends AbstractShellProperties {

    /**
     * Webhook 配置
     */
    private WebhookConfig webhook = new WebhookConfig();

    /**
     * 状态存储配置
     */
    private StateStoreConfig stateStore = new StateStoreConfig();

    /**
     * Embedded 模式的锁配置（扩展基类，增加 fair 字段）
     */
    private EmbeddedLockConfig embeddedLock = new EmbeddedLockConfig();

    // ==================== 构造函数 ====================

    public EmbeddedShellProperties() {
        // 嵌入模式默认 moduleId 和较小的线程池
        setModuleId("embedded-shell");
        getScheduling().setPoolSize(2);
    }

    // ==================== Getters & Setters ====================

    public WebhookConfig getWebhook() {
        return webhook;
    }

    public void setWebhook(WebhookConfig webhook) {
        this.webhook = webhook;
    }

    public StateStoreConfig getStateStore() {
        return stateStore;
    }

    public void setStateStore(StateStoreConfig stateStore) {
        this.stateStore = stateStore;
    }

    public EmbeddedLockConfig getEmbeddedLock() {
        return embeddedLock;
    }

    public void setEmbeddedLock(EmbeddedLockConfig embeddedLock) {
        this.embeddedLock = embeddedLock;
    }

    // ==================== 嵌套配置类 ====================

    /**
     * Webhook 配置
     */
    public static class WebhookConfig {
        private boolean enabled = true;
        private List<WebhookEndpoint> endpoints = new ArrayList<>();
        private int maxRetries = 3;
        private Duration connectTimeout = Duration.ofSeconds(5);
        private Duration readTimeout = Duration.ofSeconds(30);

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public List<WebhookEndpoint> getEndpoints() {
            return endpoints;
        }

        public void setEndpoints(List<WebhookEndpoint> endpoints) {
            this.endpoints = endpoints;
        }

        public int getMaxRetries() {
            return maxRetries;
        }

        public void setMaxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
        }

        public Duration getConnectTimeout() {
            return connectTimeout;
        }

        public void setConnectTimeout(Duration connectTimeout) {
            this.connectTimeout = connectTimeout;
        }

        public Duration getReadTimeout() {
            return readTimeout;
        }

        public void setReadTimeout(Duration readTimeout) {
            this.readTimeout = readTimeout;
        }
    }

    /**
     * Webhook 端点配置
     */
    public static class WebhookEndpoint {
        private String url;
        private String secret;
        private List<String> eventTypes = new ArrayList<>();

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public List<String> getEventTypes() {
            return eventTypes;
        }

        public void setEventTypes(List<String> eventTypes) {
            this.eventTypes = eventTypes;
        }
    }

    /**
     * 状态存储配置
     */
    public static class StateStoreConfig {
        private int maxEntries = 10000;
        private Duration defaultTtl = Duration.ofHours(1);

        public int getMaxEntries() {
            return maxEntries;
        }

        public void setMaxEntries(int maxEntries) {
            this.maxEntries = maxEntries;
        }

        public Duration getDefaultTtl() {
            return defaultTtl;
        }

        public void setDefaultTtl(Duration defaultTtl) {
            this.defaultTtl = defaultTtl;
        }
    }

    /**
     * Embedded 模式锁配置（扩展基类 LockConfig，增加公平锁选项）
     */
    public static class EmbeddedLockConfig extends LockConfig {
        private boolean fair = false;

        public boolean isFair() {
            return fair;
        }

        public void setFair(boolean fair) {
            this.fair = fair;
        }
    }
}
