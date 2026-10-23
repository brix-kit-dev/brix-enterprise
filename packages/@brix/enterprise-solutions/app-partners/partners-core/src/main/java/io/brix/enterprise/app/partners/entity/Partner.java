/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴实体
 */
package io.brix.enterprise.app.partners.entity;

import io.brix.enterprise.app.partners.enums.PartnerStatus;
import io.brix.enterprise.app.partners.enums.PartnerType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 合作伙伴实体（聚合根）
 *
 * <p>合作伙伴是医疗中介系统的核心业务实体之一，代表与平台合作的服务提供方，
 * 包括医院、酒店、交通服务商、翻译服务商等。</p>
 *
 * <h3>聚合根职责</h3>
 * <ul>
 *   <li>维护合作伙伴基本信息（名称、类型、联系方式等）</li>
 *   <li>管理合作伙伴状态生命周期</li>
 *   <li>存储合作伙伴资质信息（以 JSONB 形式存储，便于扩展）</li>
 * </ul>
 *
 * <h3>状态流转</h3>
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
@Entity
@Table(name = "biz_partner", indexes = {
    @Index(name = "idx_partner_tenant", columnList = "tenant_id"),
    @Index(name = "idx_partner_type", columnList = "partner_type"),
    @Index(name = "idx_partner_status", columnList = "status"),
    @Index(name = "idx_partner_code", columnList = "partner_code", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Partner {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 租户ID
     */
    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    /**
     * 合作伙伴编码
     * <p>系统唯一标识，格式：{类型前缀}-{租户简码}-{序号}</p>
     * <p>例如：HOSP-SH-00001（上海某医院）</p>
     */
    @Column(name = "partner_code", nullable = false, length = 64, unique = true)
    private String partnerCode;

    /**
     * 合作伙伴名称
     * <p>官方全称，用于合同和正式文件</p>
     */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * 合作伙伴简称
     * <p>用于日常展示和沟通</p>
     */
    @Column(name = "short_name", length = 100)
    private String shortName;

    /**
     * 合作伙伴类型
     */
    @Column(name = "partner_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private PartnerType partnerType;

    /**
     * 合作伙伴状态
     */
    @Column(name = "status", nullable = false, length = 32)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PartnerStatus status = PartnerStatus.DRAFT;

    // =====================================================
    // 联系信息
    // =====================================================

    /**
     * 联系人姓名
     */
    @Column(name = "contact_name", length = 100)
    private String contactName;

    /**
     * 联系电话
     */
    @Column(name = "contact_phone", length = 32)
    private String contactPhone;

    /**
     * 联系邮箱
     */
    @Column(name = "contact_email", length = 128)
    private String contactEmail;

    /**
     * 地址
     */
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // =====================================================
    // 业务信息
    // =====================================================

    /**
     * 合作伙伴简介
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 服务区域
     * <p>例如：上海、北京、全国等</p>
     */
    @Column(name = "service_area", length = 200)
    private String serviceArea;

    /**
     * 资质信息（JSONB 格式）
     * <p>不同类型合作伙伴有不同的资质字段</p>
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "qualifications", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> qualifications = new HashMap<>();

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
    @Column(name = "created_by", length = 64)
    private String createdBy;

    /**
     * 更新人
     */
    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    /**
     * 删除标志
     */
    @Column(name = "deleted")
    @Builder.Default
    private Boolean deleted = false;

    // =====================================================
    // 生命周期回调
    // =====================================================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PartnerStatus.DRAFT;
        }
        if (this.deleted == null) {
            this.deleted = false;
        }
        if (this.qualifications == null) {
            this.qualifications = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // 领域方法
    // =====================================================

    /**
     * 激活合作伙伴
     *
     * @throws IllegalStateException 如果当前状态不允许激活
     */
    public void activate() {
        if (!this.status.canTransitionTo(PartnerStatus.ACTIVE)) {
            throw new IllegalStateException(
                String.format("无法将合作伙伴从 %s 状态变更为 ACTIVE", this.status));
        }
        this.status = PartnerStatus.ACTIVE;
    }

    /**
     * 暂停合作伙伴
     *
     * @throws IllegalStateException 如果当前状态不允许暂停
     */
    public void suspend() {
        if (!this.status.canTransitionTo(PartnerStatus.SUSPENDED)) {
            throw new IllegalStateException(
                String.format("无法将合作伙伴从 %s 状态变更为 SUSPENDED", this.status));
        }
        this.status = PartnerStatus.SUSPENDED;
    }

    /**
     * 恢复合作伙伴
     *
     * @throws IllegalStateException 如果当前状态不允许恢复
     */
    public void resume() {
        if (this.status != PartnerStatus.SUSPENDED) {
            throw new IllegalStateException(
                String.format("只有 SUSPENDED 状态的合作伙伴才能恢复，当前状态: %s", this.status));
        }
        this.status = PartnerStatus.ACTIVE;
    }

    /**
     * 终止合作伙伴
     *
     * @throws IllegalStateException 如果当前状态不允许终止
     */
    public void terminate() {
        if (!this.status.canTransitionTo(PartnerStatus.TERMINATED)) {
            throw new IllegalStateException(
                String.format("无法将合作伙伴从 %s 状态变更为 TERMINATED", this.status));
        }
        this.status = PartnerStatus.TERMINATED;
    }

    /**
     * 检查是否可以删除
     *
     * @return 如果可以删除返回 true
     */
    public boolean canDelete() {
        return this.status == PartnerStatus.DRAFT || this.status == PartnerStatus.TERMINATED;
    }
}
