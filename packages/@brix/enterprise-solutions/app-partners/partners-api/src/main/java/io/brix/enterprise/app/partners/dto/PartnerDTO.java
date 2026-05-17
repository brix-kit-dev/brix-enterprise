/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴数据传输对象
 */
package io.brix.enterprise.app.partners.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.brix.enterprise.app.partners.enums.PartnerStatus;
import io.brix.enterprise.app.partners.enums.PartnerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 合作伙伴数据传输对象
 *
 * <p>用于在服务层和表示层之间传输合作伙伴数据。
 * 包含合作伙伴的完整信息，适用于详情展示和列表查询。</p>
 *
 * <h3>字段说明</h3>
 * <ul>
 *   <li>id - 合作伙伴唯一标识</li>
 *   <li>partnerCode - 合作伙伴编码，格式：{类型前缀}-{租户简码}-{序号}</li>
 *   <li>name - 合作伙伴官方名称</li>
 *   <li>shortName - 合作伙伴简称</li>
 *   <li>partnerType - 合作伙伴类型（医院/酒店/交通/翻译等）</li>
 *   <li>status - 合作伙伴状态（草稿/启用/暂停/终止）</li>
 *   <li>contactName - 联系人姓名</li>
 *   <li>contactPhone - 联系电话</li>
 *   <li>contactEmail - 联系邮箱</li>
 *   <li>address - 地址</li>
 *   <li>description - 简介</li>
 *   <li>serviceArea - 服务区域</li>
 *   <li>qualifications - 资质信息（JSONB）</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerDTO {

    /**
     * 合作伙伴ID
     */
    private Long id;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 合作伙伴编码
     * <p>系统唯一标识，格式：{类型前缀}-{租户简码}-{序号}</p>
     * <p>例如：HOSP-SH-00001（上海某医院）</p>
     */
    private String partnerCode;

    /**
     * 合作伙伴名称
     * <p>官方全称，用于合同和正式文件</p>
     */
    private String name;

    /**
     * 合作伙伴简称
     * <p>用于日常展示和沟通</p>
     */
    private String shortName;

    /**
     * 合作伙伴类型
     */
    private PartnerType partnerType;

    /**
     * 合作伙伴状态
     */
    private PartnerStatus status;

    /**
     * 联系人姓名
     */
    private String contactName;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 联系邮箱
     */
    private String contactEmail;

    /**
     * 地址
     */
    private String address;

    /**
     * 合作伙伴简介
     */
    private String description;

    /**
     * 服务区域
     * <p>例如：上海、北京、全国等</p>
     */
    private String serviceArea;

    /**
     * 资质信息
     * <p>以 Map 形式存储不同类型合作伙伴的差异化资质字段</p>
     */
    private Map<String, Object> qualifications;

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
     * 创建人
     */
    private String createdBy;

    /**
     * 更新人
     */
    private String updatedBy;
}
