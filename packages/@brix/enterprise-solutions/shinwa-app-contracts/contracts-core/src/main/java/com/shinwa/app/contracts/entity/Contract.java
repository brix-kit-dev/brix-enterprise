package com.shinwa.app.contracts.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.shinwa.app.contracts.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 合同实体（聚合根）
 *
 * <p>合同是合同管理的核心聚合根，管理合同的完整生命周期。
 * 包括合同创建、签署、过期和取消等状态流转。
 *
 * <p>聚合根职责：
 * <ul>
 *   <li>管理合同基本信息（编号、模板、状态）</li>
 *   <li>维护合同参与方列表</li>
 *   <li>管理签署记录</li>
 *   <li>控制合同状态流转</li>
 * </ul>
 *
 * <p>设计原则：
 * <ul>
 *   <li>多租户隔离（tenant_id）</li>
 *   <li>状态变更通过领域方法进行，封装业务规则</li>
 *   <li>作为聚合根管理 ContractParty 和 ContractSignRecord</li>
 *   <li>软删除支持</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "contract", indexes = {
    @Index(name = "idx_contract_tenant", columnList = "tenant_id"),
    @Index(name = "idx_contract_case", columnList = "case_id"),
    @Index(name = "idx_contract_status", columnList = "status"),
    @Index(name = "idx_contract_template", columnList = "template_id"),
    @Index(name = "idx_contract_created_by", columnList = "created_by"),
    @Index(name = "idx_contract_expires", columnList = "expires_at")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_contract_no", columnNames = {"contract_no"})
})
@Getter
@Setter
@NoArgsConstructor
public class Contract {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 租户ID
     * <p>用于多租户数据隔离
     */
    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    /**
     * 合同编号
     * <p>全局唯一的合同标识符，格式：CT-YYYYMMDD-XXXX
     */
    @Column(name = "contract_no", nullable = false, length = 32)
    private String contractNo;

    /**
     * 关联案例ID
     * <p>可选，用于关联到具体业务案例
     */
    @Column(name = "case_id", length = 64)
    private String caseId;

    /**
     * 关联的模板ID
     */
    @Column(name = "template_id", nullable = false)
    private Long templateId;

    /**
     * 使用的模板版本ID
     */
    @Column(name = "version_id", nullable = false)
    private Long versionId;

    /**
     * 渲染后的PDF URL
     * <p>存储在文件中心的已填充变量的合同PDF
     */
    @Column(name = "rendered_url", length = 500)
    private String renderedUrl;

    /**
     * 合同状态
     * <p>DRAFT/PENDING_SIGN/SIGNED/EXPIRED/CANCELLED
     */
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    /**
     * 变量值（JSON格式）
     * <p>存储合同渲染时使用的变量值
     */
    @Column(name = "variable_values", columnDefinition = "TEXT")
    private String variableValues;

    /**
     * 签署时间
     * <p>所有方完成签署的时间
     */
    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    /**
     * 到期日期
     * <p>合同的有效截止日期
     */
    @Column(name = "expires_at")
    private LocalDate expiresAt;

    /**
     * 取消原因
     */
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    /**
     * 合同参与方列表
     * 
     * <p>JSON 序列化说明（v3.2 修复）：
     * 使用 @JsonManagedReference 标记为主引用端，配合 ContractParty 上的
     * @JsonBackReference 解决双向关联序列化时的循环引用问题。
     * 这样 Contract 序列化时会包含 parties 列表，
     * 但 parties 序列化时不会包含反向引用的 contract。
     */
    @JsonManagedReference("contract-parties")
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<ContractParty> parties = new ArrayList<>();

    /**
     * 签署记录列表
     * 
     * <p>JSON 序列化说明（v3.2 修复）：
     * 使用 @JsonManagedReference 标记为主引用端，配合 ContractSignRecord 上的
     * @JsonBackReference 解决双向关联序列化时的循环引用问题。
     */
    @JsonManagedReference("contract-signRecords")
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("signedAt ASC")
    private List<ContractSignRecord> signRecords = new ArrayList<>();

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
     * 创建合同
     *
     * @param tenantId   租户ID
     * @param contractNo 合同编号
     * @param templateId 模板ID
     * @param versionId  版本ID
     * @param createdBy  创建人ID
     * @return 新建的合同实体
     */
    public static Contract create(String tenantId, String contractNo, Long templateId, 
                                  Long versionId, String createdBy) {
        Contract contract = new Contract();
        contract.tenantId = tenantId;
        contract.contractNo = contractNo;
        contract.templateId = templateId;
        contract.versionId = versionId;
        contract.status = ContractStatus.DRAFT;
        contract.createdBy = createdBy;
        contract.createdAt = LocalDateTime.now();
        contract.updatedAt = LocalDateTime.now();
        return contract;
    }

    /**
     * 添加参与方
     *
     * @param party 参与方实体
     */
    public void addParty(ContractParty party) {
        party.setContract(this);
        this.parties.add(party);
    }

    /**
     * 发起签署
     * <p>将合同从草稿状态转为待签署状态
     */
    public void startSign() {
        if (!status.canStartSign()) {
            throw new IllegalStateException("当前状态不能发起签署: " + status);
        }
        this.status = ContractStatus.PENDING_SIGN;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 添加签署记录
     *
     * @param signRecord 签署记录
     */
    public void addSignRecord(ContractSignRecord signRecord) {
        if (!status.canSign()) {
            throw new IllegalStateException("当前状态不能进行签署: " + status);
        }
        signRecord.setContract(this);
        this.signRecords.add(signRecord);
        this.updatedAt = LocalDateTime.now();
        
        // 检查是否所有必须签署方都已签署
        checkAllSigned();
    }

    /**
     * 检查是否所有必须签署方都已签署
     */
    private void checkAllSigned() {
        long requiredPartyCount = parties.stream()
            .filter(p -> p.getPartyType().isRequiredSigner())
            .count();
        long signedCount = signRecords.stream()
            .map(ContractSignRecord::getPartyId)
            .distinct()
            .filter(partyId -> parties.stream()
                .anyMatch(p -> p.getPartyId().equals(partyId) && p.getPartyType().isRequiredSigner()))
            .count();
        
        if (signedCount >= requiredPartyCount) {
            this.status = ContractStatus.SIGNED;
            this.signedAt = LocalDateTime.now();
        }
    }

    /**
     * 取消合同
     *
     * @param reason 取消原因
     */
    public void cancel(String reason) {
        if (!status.canCancel()) {
            throw new IllegalStateException("当前状态不能取消: " + status);
        }
        this.status = ContractStatus.CANCELLED;
        this.cancelReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为过期
     */
    public void markExpired() {
        if (this.status == ContractStatus.SIGNED) {
            this.status = ContractStatus.EXPIRED;
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * 软删除
     */
    public void softDelete() {
        if (this.status != ContractStatus.DRAFT) {
            throw new IllegalStateException("只能删除草稿状态的合同");
        }
        this.deleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 判断某个参与方是否已签署
     *
     * @param partyId 参与方ID
     * @return 是否已签署
     */
    public boolean hasPartySigned(String partyId) {
        return signRecords.stream()
            .anyMatch(r -> r.getPartyId().equals(partyId));
    }

    /**
     * 获取待签署方数量
     *
     * @return 待签署方数量
     */
    public int getPendingSignCount() {
        long signedPartyCount = signRecords.stream()
            .map(ContractSignRecord::getPartyId)
            .distinct()
            .count();
        return (int) (parties.size() - signedPartyCount);
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
