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
package io.brix.enterprise.app.contracts.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.brix.enterprise.app.contracts.enums.PartyType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 合同参与方实体
 *
 * <p>记录合同的签署参与方信息，支持多方签署场景。
 * 作为 Contract 聚合内的实体，由聚合根管理生命周期。
 *
 * <p>实体职责：
 * <ul>
 *   <li>记录参与方类型（客户/合作方/平台/见证人）</li>
 *   <li>存储参与方基本信息</li>
 *   <li>维护签署顺序</li>
 * </ul>
 *
 * <p>设计原则：
 * <ul>
 *   <li>生命周期由 Contract 聚合根管理</li>
 *   <li>通过 displayOrder 控制签署顺序</li>
 *   <li>partyId 关联外部用户/机构系统</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "contract_party", indexes = {
    @Index(name = "idx_party_contract", columnList = "contract_id"),
    @Index(name = "idx_party_id", columnList = "party_id")
})
@Getter
@Setter
@NoArgsConstructor
public class ContractParty {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tenant identifier for multi-tenancy isolation.
     */
    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    /**
     * 关联的合同
     * 
     * <p>JSON 序列化说明（v3.2 修复）：
     * 使用 @JsonBackReference 标记为反向引用端，配合 Contract 上的
     * @JsonManagedReference 解决双向关联序列化时的循环引用问题。
     * 这样 ContractParty 序列化时不会包含 contract 字段，
     * 避免无限递归导致 StackOverflowError。
     */
    @JsonBackReference("contract-parties")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    /**
     * 参与方类型
     * <p>CUSTOMER/PARTNER/PLATFORM/WITNESS
     */
    @Column(name = "party_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PartyType partyType;

    /**
     * 参与方ID
     * <p>关联外部用户或机构系统的ID
     */
    @Column(name = "party_id", nullable = false, length = 64)
    private String partyId;

    /**
     * 参与方名称
     * <p>用于合同展示的名称
     */
    @Column(name = "party_name", nullable = false, length = 100)
    private String partyName;

    /**
     * 联系电话
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * 电子邮箱
     */
    @Column(name = "email", length = 100)
    private String email;

    /**
     * 显示顺序
     * <p>控制签署顺序和展示顺序
     */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    /**
     * 创建合同参与方
     *
     * @param partyType    参与方类型
     * @param partyId      参与方ID
     * @param partyName    参与方名称
     * @param displayOrder 显示顺序
     * @return 新建的参与方实体
     */
    public static ContractParty create(PartyType partyType, String partyId,
                                       String partyName, int displayOrder) {
        ContractParty party = new ContractParty();
        party.partyType = partyType;
        party.partyId = partyId;
        party.partyName = partyName;
        party.displayOrder = displayOrder;
        return party;
    }

    /**
     * 创建合同参与方（完整信息）
     *
     * @param partyType    参与方类型
     * @param partyId      参与方ID
     * @param partyName    参与方名称
     * @param phone        联系电话
     * @param email        电子邮箱
     * @param displayOrder 显示顺序
     * @return 新建的参与方实体
     */
    public static ContractParty create(PartyType partyType, String partyId, String partyName,
                                       String phone, String email, int displayOrder) {
        ContractParty party = create(partyType, partyId, partyName, displayOrder);
        party.phone = phone;
        party.email = email;
        return party;
    }
}
