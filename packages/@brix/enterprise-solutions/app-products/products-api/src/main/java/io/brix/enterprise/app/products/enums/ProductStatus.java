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
 * 产品状态枚举
 *
 * <p>定义服务产品的生命周期状态。
 *
 * <p>状态说明：
 * <ul>
 *   <li>DRAFT - 草稿：产品创建后的初始状态，可编辑但不可对外展示</li>
 *   <li>PENDING_REVIEW - 待审核：产品已提交审核，等待管理员审批</li>
 *   <li>ACTIVE - 上架：产品已发布，可对外展示和销售</li>
 *   <li>INACTIVE - 下架：产品已停用，不可对外展示</li>
 *   <li>ARCHIVED - 归档：产品已归档，历史数据保留</li>
 * </ul>
 *
 * <p>状态流转规则：
 * <pre>
 *   DRAFT → PENDING_REVIEW   （提交审核）
 *   PENDING_REVIEW → ACTIVE  （审核通过）
 *   PENDING_REVIEW → DRAFT   （审核驳回）
 *   ACTIVE → INACTIVE        （下架停用）
 *   INACTIVE → ACTIVE        （重新上架）
 *   INACTIVE → ARCHIVED      （归档处理）
 * </pre>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum ProductStatus {

    /**
     * 草稿状态
     * 产品创建后的初始状态，可编辑但不可对外展示
     */
    DRAFT("草稿", "draft"),

    /**
     * 待审核状态
     * 产品已提交审核，等待管理员审批
     */
    PENDING_REVIEW("待审核", "pending_review"),

    /**
     * 上架状态
     * 产品已发布，可对外展示和销售
     */
    ACTIVE("上架", "active"),

    /**
     * 下架状态
     * 产品已停用，不可对外展示
     */
    INACTIVE("下架", "inactive"),

    /**
     * 归档状态
     * 产品已归档，历史数据保留
     */
    ARCHIVED("归档", "archived");

    /**
     * 状态描述（中文）
     */
    private final String description;

    /**
     * 状态编码（英文，用于 API）
     */
    private final String code;

    /**
     * 构造函数
     *
     * @param description 状态描述
     * @param code 状态编码
     */
    ProductStatus(String description, String code) {
        this.description = description;
        this.code = code;
    }

    /**
     * 获取状态描述
     *
     * @return 状态的中文描述
     */
    public String getDescription() {
        return description;
    }

    /**
     * 获取状态编码
     *
     * @return 状态的英文编码
     */
    public String getCode() {
        return code;
    }

    /**
     * 判断是否可以提交审核
     *
     * @return 如果当前状态允许提交审核返回 true
     */
    public boolean canSubmitReview() {
        return this == DRAFT;
    }

    /**
     * 判断是否可以审核通过
     *
     * @return 如果当前状态允许审核通过返回 true
     */
    public boolean canApprove() {
        return this == PENDING_REVIEW;
    }

    /**
     * 判断是否可以驳回
     *
     * @return 如果当前状态允许驳回返回 true
     */
    public boolean canReject() {
        return this == PENDING_REVIEW;
    }

    /**
     * 判断是否可以下架
     *
     * @return 如果当前状态允许下架返回 true
     */
    public boolean canDeactivate() {
        return this == ACTIVE;
    }

    /**
     * 判断是否可以重新上架
     *
     * @return 如果当前状态允许重新上架返回 true
     */
    public boolean canReactivate() {
        return this == INACTIVE;
    }

    /**
     * 判断是否可以归档
     *
     * @return 如果当前状态允许归档返回 true
     */
    public boolean canArchive() {
        return this == INACTIVE;
    }

    /**
     * 判断是否可编辑
     *
     * @return 如果当前状态允许编辑返回 true
     */
    public boolean isEditable() {
        return this == DRAFT;
    }

    /**
     * 判断是否对外可见
     *
     * @return 如果当前状态对外可见返回 true
     */
    public boolean isVisible() {
        return this == ACTIVE;
    }

    /**
     * 判断是否可以转换到目标状态
     *
     * @param targetStatus 目标状态
     * @return 如果可以转换返回 true
     */
    public boolean canTransitionTo(ProductStatus targetStatus) {
        if (targetStatus == null) {
            return false;
        }
        return switch (this) {
            case DRAFT -> targetStatus == PENDING_REVIEW;
            case PENDING_REVIEW -> targetStatus == ACTIVE || targetStatus == DRAFT;
            case ACTIVE -> targetStatus == INACTIVE;
            case INACTIVE -> targetStatus == ACTIVE || targetStatus == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
