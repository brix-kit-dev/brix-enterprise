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
package io.brix.enterprise.app.products.entity;

import io.brix.enterprise.app.products.enums.ProductStatus;
import io.brix.enterprise.app.products.enums.ProductType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 产品实体（聚合根）
 *
 * <p>v3.0 分层架构中的领域实体，表示一个可销售的服务产品。
 *
 * <p>业务说明：
 * <ul>
 *   <li>产品关联合作方（Partner），通过 partnerId 字段关联</li>
 *   <li>产品有完整的生命周期：草稿 → 待审核 → 上架 → 下架 → 归档</li>
 *   <li>定价支持固定价格和价格范围两种模式</li>
 * </ul>
 *
 * <p>设计原则：
 * <ul>
 *   <li>聚合根是事务边界，保证聚合内的一致性</li>
 *   <li>领域逻辑封装在实体方法中</li>
 *   <li>通过工厂方法创建实体，确保初始状态有效</li>
 *   <li>状态变更通过领域方法进行，而非直接 setter</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "products_product", indexes = {
    @Index(name = "idx_product_tenant", columnList = "tenant_id"),
    @Index(name = "idx_product_status", columnList = "status"),
    @Index(name = "idx_product_type", columnList = "type"),
    @Index(name = "idx_product_partner", columnList = "partner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    // =====================================================
    // 主键与标识
    // =====================================================

    /**
     * 产品唯一标识
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 租户 ID（多租户隔离）
     */
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    /**
     * 产品编码（业务标识）
     */
    @Column(name = "code", length = 50)
    private String code;

    // =====================================================
    // 基本信息
    // =====================================================

    /**
     * 产品名称
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * 产品描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 产品类型
     */
    @Column(name = "type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private ProductType type;

    /**
     * 产品状态
     */
    @Column(name = "status", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProductStatus status = ProductStatus.DRAFT;

    // =====================================================
    // 定价信息
    // =====================================================

    /**
     * 销售价格
     */
    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    /**
     * 原价（用于显示折扣）
     */
    @Column(name = "original_price", precision = 12, scale = 2)
    private BigDecimal originalPrice;

    /**
     * 价格范围描述
     */
    @Column(name = "price_range", length = 100)
    private String priceRange;

    /**
     * 币种
     */
    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "JPY";

    // =====================================================
    // 关联信息
    // =====================================================

    /**
     * 关联的合作方 ID
     */
    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    /**
     * 分类 ID
     */
    @Column(name = "category_id")
    private Long categoryId;

    // =====================================================
    // 服务信息
    // =====================================================

    /**
     * 服务项目列表（JSON 格式存储）
     */
    @Column(name = "service_items", columnDefinition = "TEXT")
    private String serviceItemsJson;

    /**
     * 服务时长描述
     */
    @Column(name = "duration", length = 100)
    private String duration;

    /**
     * 备注信息
     */
    @Column(name = "remarks", length = 500)
    private String remarks;

    /**
     * 封面图片 URL
     */
    @Column(name = "cover_image", length = 500)
    private String coverImage;

    /**
     * 图片列表（JSON 格式存储）
     */
    @Column(name = "images", columnDefinition = "TEXT")
    private String imagesJson;

    /**
     * 标签列表（JSON 格式存储）
     */
    @Column(name = "tags", length = 500)
    private String tagsJson;

    // =====================================================
    // 排序与统计
    // =====================================================

    /**
     * 排序权重
     */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * 销量统计
     */
    @Column(name = "sales_count")
    @Builder.Default
    private Integer salesCount = 0;

    /**
     * 浏览量统计
     */
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    // =====================================================
    // 审计字段
    // =====================================================

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 创建人
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /**
     * 是否已删除（软删除）
     */
    @Column(name = "deleted")
    @Builder.Default
    private Boolean deleted = false;

    // =====================================================
    // 生命周期回调
    // =====================================================

    /**
     * 创建前回调
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = ProductStatus.DRAFT;
        }
        if (this.currency == null) {
            this.currency = "JPY";
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
        if (this.salesCount == null) {
            this.salesCount = 0;
        }
        if (this.viewCount == null) {
            this.viewCount = 0;
        }
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    /**
     * 更新前回调
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // 领域行为：状态变更
    // =====================================================

    /**
     * 提交审核
     *
     * <p>将产品从草稿状态提交审核。
     *
     * @throws IllegalStateException 如果当前状态不允许提交审核
     */
    public void submitReview() {
        if (!this.status.canSubmitReview()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许提交审核", this.status.getDescription()));
        }
        this.status = ProductStatus.PENDING_REVIEW;
    }

    /**
     * 审核通过
     *
     * <p>将产品从待审核状态变更为上架状态。
     *
     * @throws IllegalStateException 如果当前状态不允许审核通过
     */
    public void approve() {
        if (!this.status.canApprove()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许审核通过", this.status.getDescription()));
        }
        this.status = ProductStatus.ACTIVE;
    }

    /**
     * 审核驳回
     *
     * <p>将产品从待审核状态退回草稿状态。
     *
     * @throws IllegalStateException 如果当前状态不允许驳回
     */
    public void reject() {
        if (!this.status.canReject()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许驳回", this.status.getDescription()));
        }
        this.status = ProductStatus.DRAFT;
    }

    /**
     * 下架产品
     *
     * <p>将产品从上架状态变更为下架状态。
     *
     * @throws IllegalStateException 如果当前状态不允许下架
     */
    public void deactivate() {
        if (!this.status.canDeactivate()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许下架", this.status.getDescription()));
        }
        this.status = ProductStatus.INACTIVE;
    }

    /**
     * 重新上架产品
     *
     * <p>将产品从下架状态变更为上架状态。
     *
     * @throws IllegalStateException 如果当前状态不允许重新上架
     */
    public void reactivate() {
        if (!this.status.canReactivate()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许重新上架", this.status.getDescription()));
        }
        this.status = ProductStatus.ACTIVE;
    }

    /**
     * 归档产品
     *
     * <p>将产品从下架状态变更为归档状态。
     *
     * @throws IllegalStateException 如果当前状态不允许归档
     */
    public void archive() {
        if (!this.status.canArchive()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许归档", this.status.getDescription()));
        }
        this.status = ProductStatus.ARCHIVED;
    }

    // =====================================================
    // 领域行为：编辑验证
    // =====================================================

    /**
     * 更新产品信息
     *
     * <p>仅草稿状态的产品可以更新。
     *
     * @param name 产品名称
     * @param description 产品描述
     * @param priceRange 价格范围
     * @param duration 服务时长
     * @throws IllegalStateException 如果产品不可编辑
     */
    public void update(String name, String description, String priceRange, String duration) {
        if (!this.status.isEditable()) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许编辑", this.status.getDescription()));
        }
        this.name = name;
        this.description = description;
        this.priceRange = priceRange;
        this.duration = duration;
    }

    /**
     * 软删除产品
     *
     * <p>仅草稿或下架状态的产品可以删除。
     *
     * @throws IllegalStateException 如果产品状态不允许删除
     */
    public void markDeleted() {
        if (this.status != ProductStatus.DRAFT && this.status != ProductStatus.INACTIVE) {
            throw new IllegalStateException(
                String.format("当前状态 [%s] 不允许删除，仅草稿或下架状态可删除", this.status.getDescription()));
        }
        this.deleted = true;
    }

    // =====================================================
    // 工厂方法
    // =====================================================

    /**
     * 创建新产品
     *
     * @param name 产品名称
     * @param description 产品描述
     * @param type 产品类型
     * @param partnerId 合作方 ID
     * @param tenantId 租户 ID
     * @return 新创建的产品实体
     */
    public static Product create(String name, String description, ProductType type, 
                                  Long partnerId, String tenantId) {
        return Product.builder()
            .name(name)
            .description(description)
            .type(type)
            .partnerId(partnerId)
            .tenantId(tenantId)
            .status(ProductStatus.DRAFT)
            .currency("JPY")
            .sortOrder(0)
            .salesCount(0)
            .viewCount(0)
            .deleted(false)
            .build();
    }
}
