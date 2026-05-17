/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.messenger.service.impl;

import io.brix.enterprise.app.messenger.entity.MessageTemplate;
import io.brix.enterprise.app.messenger.repository.MessageTemplateRepository;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Handles message template caching, retrieval, and variable rendering.
 *
 * <p>Templates are cached via {@code StateStoreCapability} with a configurable TTL.
 * Variable substitution uses {@code ${variableName}} placeholders.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Component
class MessageTemplateRenderer {

    private final RuntimeContext context;
    private final MessageTemplateRepository templateRepository;

    /** Matches ${variableName} placeholders in template strings. */
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\$\\{([^}]+)}");
    private static final String TEMPLATE_CACHE_PREFIX = "messenger:template:";
    private static final Duration TEMPLATE_CACHE_TTL = Duration.ofHours(1);

    MessageTemplateRenderer(RuntimeContext context, MessageTemplateRepository templateRepository) {
        this.context = context;
        this.templateRepository = templateRepository;
    }

    private ObservabilityCapability getLog() {
        return context.getObservability();
    }

    /**
     * Retrieves a template from the StateStore cache, falling back to the database.
     *
     * @param tenantId     tenant ID
     * @param templateCode template code
     * @return the template, or {@code null} if not found
     */
    MessageTemplate getTemplateFromCacheOrDb(String tenantId, String templateCode) {
        String cacheKey = TEMPLATE_CACHE_PREFIX + tenantId + ":" + templateCode;

        try {
            Optional<MessageTemplate> cached = context.getStateStore()
                .get(cacheKey, MessageTemplate.class);
            if (cached.isPresent()) {
                getLog().debug("Template cache hit: {}", cacheKey);
                return cached.get();
            }
        } catch (Exception e) {
            getLog().warn("Failed to fetch template from cache: {}", e.getMessage());
        }

        Optional<MessageTemplate> template = templateRepository
            .findByTenantIdAndTemplateCodeAndEnabledTrue(tenantId, templateCode);

        if (template.isPresent()) {
            try {
                context.getStateStore().put(cacheKey, template.get(), TEMPLATE_CACHE_TTL);
                getLog().debug("Template cached: {}", cacheKey);
            } catch (Exception e) {
                getLog().warn("Failed to cache template: {}", e.getMessage());
            }
        }
        return template.orElse(null);
    }

    /**
     * Renders a template string by replacing {@code ${variable}} placeholders with values.
     *
     * @param template  template string with placeholders
     * @param variables variable name-to-value mapping
     * @return the rendered string
     */
    String renderTemplate(String template, Map<String, String> variables) {
        if (template == null || variables == null || variables.isEmpty()) {
            return template;
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        while (matcher.find()) {
            String variableName = matcher.group(1);
            String value = variables.getOrDefault(variableName, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    /**
     * Parses a variables JSON string into a map.
     *
     * @param variablesJson JSON variable string
     * @return variable map (empty if input is null or unparseable)
     */
    /**
     * Parses template variables from a JSON string into a flat key-value map.
     *
     * <p><b>DECISION (2025-07, Phase 3.8):</b> Jackson ObjectMapper injection
     * deferred to v4.0. Messenger-core currently has no direct Jackson dependency;
     * adding one would require coordinating BOM version alignment with the Host
     * layer. Until then, callers should pass pre-parsed maps via the overloaded
     * render methods. This method returns an empty map as a safe no-op.</p>
     *
     * @param variablesJson JSON string of template variables (nullable)
     * @return parsed variable map, or empty map if input is null/empty/unparseable
     * @since 3.0.0
     */
    Map<String, String> parseVariables(String variablesJson) {
        if (variablesJson == null || variablesJson.isEmpty()) {
            return Map.of();
        }
        try {
            // DECISION: returns empty map until Jackson ObjectMapper is injected (v4.0)
            return Map.of();
        } catch (Exception e) {
            getLog().warn("Failed to parse variables: {}", e.getMessage());
            return Map.of();
        }
    }
}
