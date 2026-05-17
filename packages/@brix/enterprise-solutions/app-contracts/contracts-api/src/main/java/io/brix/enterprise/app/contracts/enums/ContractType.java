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
package io.brix.enterprise.app.contracts.enums;

/**
 * 合同类型枚举
 *
 * <p>定义系统支持的合同类型，用于区分不同业务场景的合同。
 *
 * <p>类型说明：
 * <ul>
 *   <li>TREATMENT - 治疗合同：医疗服务相关的合同，如诊疗协议、手术同意书等</li>
 *   <li>AGENCY - 中介合同：代理服务相关的合同，如服务委托协议、代理授权书等</li>
 *   <li>CONSENT - 知情同意书：患者知情同意类文件，如风险告知书、隐私授权书等</li>
 *   <li>SERVICE - 服务合同：通用服务合同</li>
 *   <li>NDA - 保密协议：商业保密协议</li>
 * </ul>
 *
 * <p>使用场景：
 * <ul>
 *   <li>合同模板分类管理</li>
 *   <li>合同审批流程配置</li>
 *   <li>合同统计报表分组</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum ContractType {

    /**
     * 治疗合同
     * <p>用于医疗服务相关的合同，如诊疗协议、手术同意书等
     */
    TREATMENT("治疗合同", "医疗服务相关的合同"),

    /**
     * 中介合同
     * <p>用于代理服务相关的合同，如服务委托协议、代理授权书等
     */
    AGENCY("中介合同", "代理服务相关的合同"),

    /**
     * 知情同意书
     * <p>用于患者知情同意类文件，如风险告知书、隐私授权书等
     */
    CONSENT("知情同意书", "患者知情同意类文件"),

    /**
     * 服务合同
     * <p>通用的服务类合同
     */
    SERVICE("服务合同", "通用服务合同"),

    /**
     * 保密协议
     * <p>商业保密协议（NDA）
     */
    NDA("保密协议", "商业保密协议");

    /**
     * 中文名称
     */
    private final String label;

    /**
     * 描述说明
     */
    private final String description;

    /**
     * 构造函数
     *
     * @param label       中文名称
     * @param description 描述说明
     */
    ContractType(String label, String description) {
        this.label = label;
        this.description = description;
    }

    /**
     * 获取中文名称
     *
     * @return 中文名称
     */
    public String getLabel() {
        return label;
    }

    /**
     * 获取描述说明
     *
     * @return 描述说明
     */
    public String getDescription() {
        return description;
    }

    /**
     * 判断是否需要多方签署
     * <p>通常中介合同和服务合同需要多方签署
     *
     * @return 是否需要多方签署
     */
    public boolean requiresMultipleParties() {
        return this == AGENCY || this == SERVICE || this == NDA;
    }

    /**
     * 判断是否为医疗相关类型
     *
     * @return 是否为医疗相关类型
     */
    public boolean isMedicalRelated() {
        return this == TREATMENT || this == CONSENT;
    }
}
