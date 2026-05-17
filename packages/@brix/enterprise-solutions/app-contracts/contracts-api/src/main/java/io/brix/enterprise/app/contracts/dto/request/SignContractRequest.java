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

import io.brix.enterprise.app.contracts.enums.SignMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 签署合同请求对象
 *
 * <p>用于签署合同时传递参数。
 *
 * <p>必填字段：
 * <ul>
 *   <li>partyId - 签署方ID</li>
 *   <li>signMethod - 签署方式</li>
 * </ul>
 *
 * <p>可选字段：
 * <ul>
 *   <li>signatureUrl - 签名图片URL（手动签署时必填）</li>
 *   <li>verificationCode - 验证码（短信验证时必填）</li>
 *   <li>extra - 扩展信息</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignContractRequest {

    /**
     * 签署方ID
     */
    @NotNull(message = "签署方ID不能为空")
    private String partyId;

    /**
     * 签署方式
     */
    @NotNull(message = "签署方式不能为空")
    private SignMethod signMethod;

    /**
     * 签名图片URL
     * <p>手动签署或电子签章时的签名图片
     */
    private String signatureUrl;

    /**
     * 签名图片Base64
     * <p>如果没有URL，可以直接传Base64数据
     */
    private String signatureBase64;

    /**
     * 验证码
     * <p>短信验证签署时使用
     */
    private String verificationCode;

    /**
     * 扩展信息
     * <p>存储电子签章证书信息等
     */
    private Map<String, Object> extra;

    /**
     * 签署备注
     */
    private String remark;
}
