package com.shinwa.app.contracts.entity;

import com.shinwa.app.contracts.enums.ContractType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 合同模板实体（聚合根）
 *
 * <p>合同模板是创建合同的基础，定义了合同的基本结构和变量。
 * 支持版本控制，每次模板更新都会生成新版本。
 *
 * <p>聚合根职责：
 * <ul>
 *   <li>管理模板基本信息（编码、名称、类型）</li>
 *   <li>维护模板的启用/禁用状态</li>
 *   <li>关联模板版本，支持版本迭代</li>
 *   <li>提供模板发布和版本切换能力</li>
 * </ul>
 *
 * <p>设计原则：
 * <ul>
 *   <li>多租户隔离（tenant_id）</li>
 *   <li>状态变更通过领域方法进行，封装业务规则</li>
 *   <li>与 TemplateVersion 为一对多关系</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "contract_template", indexes = {
    @Index(name = "idx_template_tenant", columnList = "tenant_id"),
    @Index(name = "idx_template_code", columnList = "template_code"),
    @Index(name = "idx_template_type", columnList = "contract_type")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_template_tenant_code", columnNames = {"tenant_id", "template_code"})
})
@Getter
@Setter
@NoArgsConstructor
public class ContractTemplate {

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
     * 模板编码
     * <p>租户内唯一的模板标识符
     */
    @Column(name = "template_code", nullable = false, length = 32)
    private String templateCode;

    /**
     * 模板名称
     * <p>模板的显示名称
     */
    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    /**
     * 合同类型
     * <p>TREATMENT/AGENCY/CONSENT/SERVICE/NDA
     */
    @Column(name = "contract_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ContractType contractType;

    /**
     * 模板描述
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 当前版本号
     * <p>指向当前生效的模板版本
     */
    @Column(name = "current_version", nullable = false)
    private Integer currentVersion = 0;

    /**
     * 是否启用
     * <p>禁用的模板不能用于创建新合同
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * 模板版本列表
     * <p>维护模板的所有历史版本
     */
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("versionNumber DESC")
    private List<TemplateVersion> versions = new ArrayList<>();

    /**
     * 创建人ID
     */
    @Column(name = "created_by", length = 64)
    private String createdBy;

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
     * 是否删除
     */
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    /**
     * 创建合同模板
     *
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @param templateName 模板名称
     * @param contractType 合同类型
     * @param createdBy    创建人
     * @return 新建的模板实体
     */
    public static ContractTemplate create(String tenantId, String templateCode,
                                          String templateName, ContractType contractType,
                                          String createdBy) {
        ContractTemplate template = new ContractTemplate();
        template.tenantId = tenantId;
        template.templateCode = templateCode;
        template.templateName = templateName;
        template.contractType = contractType;
        template.currentVersion = 0;
        template.createdBy = createdBy;
        template.createdAt = LocalDateTime.now();
        template.updatedAt = LocalDateTime.now();
        return template;
    }

    /**
     * 添加版本
     *
     * @param version 模板版本
     */
    public void addVersion(TemplateVersion version) {
        version.setTemplate(this);
        version.setVersionNumber(this.currentVersion + 1);
        this.versions.add(version);
        this.currentVersion = version.getVersionNumber();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 切换到指定版本
     *
     * @param versionNumber 目标版本号
     */
    public void switchToVersion(int versionNumber) {
        boolean exists = versions.stream()
            .anyMatch(v -> v.getVersionNumber().equals(versionNumber));
        if (!exists) {
            throw new IllegalArgumentException("版本不存在: " + versionNumber);
        }
        this.currentVersion = versionNumber;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 启用模板
     */
    public void enable() {
        this.isActive = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 禁用模板
     */
    public void disable() {
        this.isActive = false;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 判断模板是否可用
     * <p>启用状态且有版本
     *
     * @return 是否可用
     */
    public boolean isAvailable() {
        return Boolean.TRUE.equals(isActive) && currentVersion > 0;
    }

    /**
     * 获取当前版本
     *
     * @return 当前版本实体（可能为null）
     */
    public TemplateVersion getCurrentVersionEntity() {
        return versions.stream()
            .filter(v -> v.getVersionNumber().equals(currentVersion))
            .findFirst()
            .orElse(null);
    }

    /**
     * 软删除
     */
    public void softDelete() {
        this.deleted = true;
        this.isActive = false;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
