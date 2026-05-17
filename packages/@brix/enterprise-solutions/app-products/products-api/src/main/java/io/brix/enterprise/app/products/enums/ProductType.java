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
package io.brix.enterprise.app.products.enums;

/**
 * 产品类型枚举
 *
 * <p>定义服务产品的类型分类，用于区分不同业务场景的套餐。
 *
 * <p>类型说明：
 * <ul>
 *   <li>CHECKUP - 体检套餐：包含健康检查、体检项目组合</li>
 *   <li>TREATMENT - 治疗套餐：包含诊疗、手术等医疗服务</li>
 *   <li>TRANSLATION - 翻译套餐：包含医疗翻译、陪同翻译服务</li>
 *   <li>TRANSPORT - 交通套餐：包含接送机、市内交通等服务</li>
 *   <li>ACCOMMODATION - 住宿套餐：包含酒店、公寓等住宿服务</li>
 *   <li>COMPOSITE - 综合套餐：组合多种服务的套餐</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum ProductType {

    /**
     * 体检套餐
     * 包含健康检查、体检项目组合
     */
    CHECKUP("体检套餐", "health_checkup"),

    /**
     * 治疗套餐
     * 包含诊疗、手术等医疗服务
     */
    TREATMENT("治疗套餐", "medical_treatment"),

    /**
     * 翻译套餐
     * 包含医疗翻译、陪同翻译服务
     */
    TRANSLATION("翻译套餐", "translation_service"),

    /**
     * 交通套餐
     * 包含接送机、市内交通等服务
     */
    TRANSPORT("交通套餐", "transportation"),

    /**
     * 住宿套餐
     * 包含酒店、公寓等住宿服务
     */
    ACCOMMODATION("住宿套餐", "accommodation"),

    /**
     * 综合套餐
     * 组合多种服务的套餐
     */
    COMPOSITE("综合套餐", "composite_package");

    /**
     * 类型描述（中文）
     */
    private final String description;

    /**
     * 类型编码（英文，用于 API）
     */
    private final String code;

    /**
     * 构造函数
     *
     * @param description 类型描述
     * @param code 类型编码
     */
    ProductType(String description, String code) {
        this.description = description;
        this.code = code;
    }

    /**
     * 获取类型描述
     *
     * @return 类型的中文描述
     */
    public String getDescription() {
        return description;
    }

    /**
     * 获取类型编码
     *
     * @return 类型的英文编码
     */
    public String getCode() {
        return code;
    }

    /**
     * 判断是否为医疗相关类型
     *
     * @return 如果是医疗相关类型返回 true
     */
    public boolean isMedicalRelated() {
        return this == CHECKUP || this == TREATMENT;
    }

    /**
     * 判断是否为服务辅助类型
     *
     * @return 如果是服务辅助类型返回 true
     */
    public boolean isAuxiliary() {
        return this == TRANSLATION || this == TRANSPORT || this == ACCOMMODATION;
    }
}
