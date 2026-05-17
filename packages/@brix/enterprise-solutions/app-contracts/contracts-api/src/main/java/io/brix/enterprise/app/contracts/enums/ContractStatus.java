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
 * 合同状态枚举
 *
 * <p>定义合同的生命周期状态，用于跟踪合同从创建到归档的完整流程。
 *
 * <p>状态说明：
 * <ul>
 *   <li>DRAFT - 草稿：合同已创建但尚未发起签署</li>
 *   <li>PENDING_SIGN - 待签署：合同已发起签署，等待各方签署</li>
 *   <li>SIGNED - 已签署：所有参与方已完成签署</li>
 *   <li>EXPIRED - 已过期：合同已超过有效期</li>
 *   <li>CANCELLED - 已取消：合同被主动取消</li>
 * </ul>
 *
 * <p>状态流转规则：
 * <ul>
 *   <li>DRAFT → PENDING_SIGN：发起签署</li>
 *   <li>PENDING_SIGN → SIGNED：所有方完成签署</li>
 *   <li>PENDING_SIGN → CANCELLED：签署过程中取消</li>
 *   <li>SIGNED → EXPIRED：合同到期</li>
 *   <li>DRAFT → CANCELLED：草稿状态取消</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum ContractStatus {

    /**
     * 草稿
     * <p>合同已创建但尚未发起签署，可以继续编辑
     */
    DRAFT("草稿", "合同已创建但尚未发起签署"),

    /**
     * 待签署
     * <p>合同已发起签署流程，等待各方签署
     */
    PENDING_SIGN("待签署", "合同已发起签署，等待各方签署"),

    /**
     * 已签署
     * <p>所有参与方已完成签署，合同生效
     */
    SIGNED("已签署", "所有参与方已完成签署"),

    /**
     * 已过期
     * <p>合同已超过有效期，不再具有法律效力
     */
    EXPIRED("已过期", "合同已超过有效期"),

    /**
     * 已取消
     * <p>合同被主动取消，流程终止
     */
    CANCELLED("已取消", "合同被主动取消");

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
    ContractStatus(String label, String description) {
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
     * 判断是否可以发起签署
     * <p>只有草稿状态可以发起签署
     *
     * @return 是否可以发起签署
     */
    public boolean canStartSign() {
        return this == DRAFT;
    }

    /**
     * 判断是否可以进行签署
     * <p>只有待签署状态可以进行签署
     *
     * @return 是否可以进行签署
     */
    public boolean canSign() {
        return this == PENDING_SIGN;
    }

    /**
     * 判断是否可以取消
     * <p>草稿和待签署状态可以取消
     *
     * @return 是否可以取消
     */
    public boolean canCancel() {
        return this == DRAFT || this == PENDING_SIGN;
    }

    /**
     * 判断是否为终态
     * <p>已签署、已过期、已取消为终态
     *
     * @return 是否为终态
     */
    public boolean isFinal() {
        return this == SIGNED || this == EXPIRED || this == CANCELLED;
    }
}
