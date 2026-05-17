/*
 * Copyright 2026 Brix Platform
 *
 * 更新合作伙伴请求
 */
package io.brix.enterprise.app.partners.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 更新合作伙伴请求DTO
 *
 * <p>用于接收更新合作伙伴的请求参数。包含可更新的合作伙伴信息字段。</p>
 *
 * <h3>可更新字段</h3>
 * <ul>
 *   <li>name - 合作伙伴名称</li>
 *   <li>shortName - 简称</li>
 *   <li>description - 简介</li>
 *   <li>contactName/Phone/Email - 联系信息</li>
 *   <li>address - 地址</li>
 *   <li>serviceArea - 服务区域</li>
 *   <li>qualifications - 资质信息</li>
 * </ul>
 *
 * <p>注意：合作伙伴类型（partnerType）创建后不可修改</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePartnerRequest {

    /**
     * 合作伙伴名称
     * <p>必填，2-200 字符</p>
     */
    @NotBlank(message = "合作伙伴名称不能为空")
    @Size(min = 2, max = 200, message = "合作伙伴名称长度必须在 2-200 字符之间")
    private String name;

    /**
     * 合作伙伴简称
     * <p>可选，最多 100 字符</p>
     */
    @Size(max = 100, message = "简称长度不能超过 100 字符")
    private String shortName;

    /**
     * 联系人姓名
     */
    @Size(max = 100, message = "联系人姓名长度不能超过 100 字符")
    private String contactName;

    /**
     * 联系电话
     */
    @Size(max = 32, message = "联系电话长度不能超过 32 字符")
    private String contactPhone;

    /**
     * 联系邮箱
     */
    @Size(max = 128, message = "联系邮箱长度不能超过 128 字符")
    private String contactEmail;

    /**
     * 地址
     */
    @Size(max = 500, message = "地址长度不能超过 500 字符")
    private String address;

    /**
     * 合作伙伴简介
     */
    @Size(max = 2000, message = "简介长度不能超过 2000 字符")
    private String description;

    /**
     * 服务区域
     */
    @Size(max = 200, message = "服务区域长度不能超过 200 字符")
    private String serviceArea;

    /**
     * 资质信息
     * <p>以 Map 形式传递不同类型合作伙伴的差异化资质字段</p>
     */
    private Map<String, Object> qualifications;
}
