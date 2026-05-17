/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

/**
 * Integration event published when a script template transitions to
 * {@code PUBLISHED} status after compliance review approval.
 *
 * <p>Other plugins (e.g. messenger, booking) can subscribe to this event
 * to update their local caches of approved script templates.</p>
 *
 * <h3>Routing</h3>
 * <ul>
 *   <li>Routing key: {@code compliance.script-template.<templateId>}</li>
 *   <li>Source module: {@code brix-app-compliance}</li>
 * </ul>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 * @see IntegrationEvent
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class ScriptTemplatePublishedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;
    private static final String SOURCE_MODULE = "brix-app-compliance";

    private final String templateId;
    private final String templateCode;
    private final String templateName;
    private final String templateVersion;
    private final String publishedBy;
    private final String tenantId;

    /**
     * Constructs a new script-template-published event.
     *
     * @param templateId      the unique ID of the published template
     * @param templateCode    the business code of the template
     * @param templateName    the display name of the template
     * @param templateVersion the semantic version of the template
     * @param publishedBy     the user ID who approved the publication
      * @param tenantId        the tenant that owns the published template
     */
    public ScriptTemplatePublishedEvent(String templateId, String templateCode,
                                         String templateName, String templateVersion,
                                                      String publishedBy, String tenantId) {
          super(SOURCE_MODULE, tenantId);
        this.templateId = templateId;
        this.templateCode = templateCode;
        this.templateName = templateName;
        this.templateVersion = templateVersion;
        this.publishedBy = publishedBy;
          this.tenantId = tenantId;
    }

    @Override
    public String getRoutingKey() {
        return "compliance.script-template." + templateId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public String getTemplateName() {
        return templateName;
    }

    public String getTemplateVersion() {
        return templateVersion;
    }

    public String getPublishedBy() {
        return publishedBy;
    }

    public String getTenantId() {
        return tenantId;
    }

    @Override
    public String toString() {
        return "ScriptTemplatePublishedEvent{"
                + "eventId=" + getEventId()
                + ", templateId='" + templateId + '\''
                + ", templateCode='" + templateCode + '\''
                + ", templateName='" + templateName + '\''
                + ", templateVersion='" + templateVersion + '\''
                + ", publishedBy='" + publishedBy + '\''
                + ", tenantId='" + tenantId + '\''
                + '}';
    }
}
