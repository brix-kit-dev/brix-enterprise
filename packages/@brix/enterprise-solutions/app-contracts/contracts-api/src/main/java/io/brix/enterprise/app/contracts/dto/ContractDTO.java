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
package io.brix.enterprise.app.contracts.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.brix.enterprise.app.contracts.enums.ContractStatus;
import io.brix.enterprise.app.contracts.enums.ContractType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 合同数据传输对象
 *
 * <p>用于在API层传输合同完整信息，包括基本信息、模板关联、
 * 参与方列表、签署记录等。
 *
 * <p>字段说明：
 * <ul>
 *   <li>基本信息：ID、合同编号、关联案例</li>
 *   <li>模板关联：模板ID、版本号、渲染后的PDF</li>
 *   <li>状态信息：合同状态、签署时间、到期日期</li>
 *   <li>参与方：签署方列表</li>
 *   <li>签署记录：签署历史</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDTO {

    /**
     * 合同ID
     */
    private Long id;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 合同编号
     * <p>格式：CT-YYYYMMDD-XXXX
     */
    private String contractNo;

    /**
     * 关联案例ID
     */
    private String caseId;

    /**
     * 关联的模板ID
     */
    private Long templateId;

    /**
     * 模板名称
     */
    private String templateName;

    /**
     * 合同类型
     */
    private ContractType contractType;

    /**
     * 使用的模板版本号
     */
    private Integer versionNumber;

    /**
     * 渲染后的PDF URL
     */
    private String renderedUrl;

    /**
     * 合同状态
     */
    private ContractStatus status;

    /**
     * 变量值
     */
    private Map<String, Object> variableValues;

    /**
     * 签署时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime signedAt;

    /**
     * 到期日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiresAt;

    /**
     * 参与方列表
     */
    private List<ContractPartyDTO> parties;

    /**
     * 签署记录列表
     */
    private List<SignRecordDTO> signRecords;

    /**
     * 待签署方数量
     */
    private Integer pendingSignCount;

    /**
     * 已签署方数量
     */
    private Integer signedCount;

    /**
     * 创建人ID
     */
    private String createdBy;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 判断是否已全部签署
     *
     * @return 是否已全部签署
     */
    public boolean isFullySigned() {
        return status == ContractStatus.SIGNED;
    }

    /**
     * 判断是否可以签署
     *
     * @return 是否可以签署
     */
    public boolean canSign() {
        return status != null && status.canSign();
    }

    /**
     * 判断是否可以取消
     *
     * @return 是否可以取消
     */
    public boolean canCancel() {
        return status != null && status.canCancel();
    }
}
