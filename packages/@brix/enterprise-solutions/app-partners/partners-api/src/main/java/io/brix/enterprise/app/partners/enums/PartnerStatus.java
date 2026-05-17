/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴状态枚举
 */
package io.brix.enterprise.app.partners.enums;

/**
 * 合作伙伴状态枚举
 *
 * <p>定义合作伙伴的生命周期状态，用于控制合作伙伴的可用性和业务流转。</p>
 *
 * <h3>状态流转规则</h3>
 * <ul>
 *   <li>DRAFT → ACTIVE: 审核通过后启用</li>
 *   <li>ACTIVE → SUSPENDED: 暂停合作</li>
 *   <li>SUSPENDED → ACTIVE: 恢复合作</li>
 *   <li>ACTIVE/SUSPENDED → TERMINATED: 终止合作</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum PartnerStatus {

    /**
     * 草稿状态
     * <p>新建合作伙伴，尚未审核通过</p>
     */
    DRAFT("草稿"),

    /**
     * 启用状态
     * <p>正常合作中，可分配业务</p>
     */
    ACTIVE("启用"),

    /**
     * 暂停状态
     * <p>暂时停止合作，不可分配新业务</p>
     */
    SUSPENDED("暂停"),

    /**
     * 终止状态
     * <p>已终止合作关系</p>
     */
    TERMINATED("终止");

    /**
     * 状态显示名称
     */
    private final String displayName;

    /**
     * 构造函数
     *
     * @param displayName 显示名称
     */
    PartnerStatus(String displayName) {
        this.displayName = displayName;
    }

    /**
     * 获取状态的显示名称
     *
     * @return 显示名称
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * 检查是否可以过渡到目标状态
     *
     * @param target 目标状态
     * @return 如果可以过渡返回 true
     */
    public boolean canTransitionTo(PartnerStatus target) {
        if (target == null) {
            return false;
        }
        return switch (this) {
            case DRAFT -> target == ACTIVE;
            case ACTIVE -> target == SUSPENDED || target == TERMINATED;
            case SUSPENDED -> target == ACTIVE || target == TERMINATED;
            case TERMINATED -> false; // 终止状态不可变更
        };
    }

    /**
     * 检查当前状态是否为可用状态（可分配业务）
     *
     * @return 如果可用返回 true
     */
    public boolean isAvailable() {
        return this == ACTIVE;
    }
}
