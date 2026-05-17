/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Embeddable component representing a single variable definition
 * within a {@link ScriptTemplateEntity}.
 *
 * <p>Stored in the {@code compliance_script_variable} collection table.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Embeddable
public class ScriptVariableEmbeddable {

    @Column(name = "var_key", length = 100, nullable = false)
    private String key;

    @Column(name = "label", length = 200, nullable = false)
    private String label;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    @Column(name = "var_order", insertable = false, updatable = false)
    private int order;

    /** Default constructor required by JPA. */
    protected ScriptVariableEmbeddable() {
    }

    /**
     * Constructs a new script variable embeddable.
     *
     * @param key          unique variable key
     * @param label        display label
     * @param description  help text (nullable)
     * @param defaultValue default value (nullable)
     * @param order        display order
     */
    public ScriptVariableEmbeddable(String key, String label, String description,
                                     String defaultValue, int order) {
        this.key = key;
        this.label = label;
        this.description = description;
        this.defaultValue = defaultValue;
        this.order = order;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDefaultValue() { return defaultValue; }
    public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
}
