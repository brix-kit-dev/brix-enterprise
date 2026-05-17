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
package io.brix.enterprise.app.contracts.dto.request;

import io.brix.enterprise.app.contracts.enums.PartyType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 创建合同请求对象
 *
 * <p>用于创建合同时传递参数。
 *
 * <p>必填字段：
 * <ul>
 *   <li>templateId - 模板ID</li>
 *   <li>parties - 参与方列表（至少2方）</li>
 * </ul>
 *
 * <p>可选字段：
 * <ul>
 *   <li>caseId - 关联案例ID</li>
 *   <li>version - 模板版本号（不填则使用当前版本）</li>
 *   <li>variableValues - 变量值</li>
 *   <li>expiresAt - 到期日期</li>
 *   <li>autoStartSign - 是否自动发起签署</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContractRequest {

    /**
     * 模板ID
     */
    @NotNull(message = "模板ID不能为空")
    @Positive(message = "模板ID必须为正数")
    private Long templateId;

    /**
     * 模板版本号
     * <p>不填则使用模板的当前版本
     */
    private Integer version;

    /**
     * 关联案例ID
     */
    private String caseId;

    /**
     * 变量值
     * <p>用于填充模板中的变量
     */
    private Map<String, Object> variableValues;

    /**
     * 参与方列表
     */
    @Valid
    private List<PartyRequest> parties;

    /**
     * 到期日期
     */
    private LocalDate expiresAt;

    /**
     * 是否自动发起签署
     * <p>true则创建后立即进入待签署状态
     */
    private Boolean autoStartSign;

    /**
     * 参与方请求对象
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartyRequest {

        /**
         * 参与方类型
         */
        @NotNull(message = "参与方类型不能为空")
        private PartyType partyType;

        /**
         * 参与方ID
         */
        @NotNull(message = "参与方ID不能为空")
        private String partyId;

        /**
         * 参与方名称
         */
        @NotNull(message = "参与方名称不能为空")
        private String partyName;

        /**
         * 联系电话
         */
        private String phone;

        /**
         * 电子邮箱
         */
        private String email;

        /**
         * 显示顺序
         */
        private Integer displayOrder;
    }
}
