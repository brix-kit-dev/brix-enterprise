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
package io.brix.enterprise.app.products.dto;

import io.brix.enterprise.app.products.enums.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 创建产品请求 DTO
 *
 * <p>用于创建新产品的请求参数。包含产品的基本信息、定价信息和服务信息。
 *
 * <p>验证规则：
 * <ul>
 *   <li>name: 必填，长度 2-100 字符</li>
 *   <li>type: 必填，产品类型</li>
 *   <li>partnerId: 必填，关联合作方</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    // =====================================================
    // 基本信息
    // =====================================================

    /**
     * 产品名称
     * 必填，长度 2-100 字符
     */
    @NotBlank(message = "产品名称不能为空")
    @Size(min = 2, max = 100, message = "产品名称长度必须在 2-100 字符之间")
    private String name;

    /**
     * 产品描述
     * 可选，最大 2000 字符
     */
    @Size(max = 2000, message = "产品描述最多 2000 字符")
    private String description;

    /**
     * 产品类型
     * 必填
     */
    @NotNull(message = "产品类型不能为空")
    private ProductType type;

    /**
     * 产品编码
     * 可选，用于业务标识
     */
    @Size(max = 50, message = "产品编码最多 50 字符")
    private String code;

    // =====================================================
    // 定价信息
    // =====================================================

    /**
     * 销售价格
     * 可选，必须为正数
     */
    @Positive(message = "价格必须大于 0")
    private BigDecimal price;

    /**
     * 原价
     * 可选，用于显示折扣
     */
    @Positive(message = "原价必须大于 0")
    private BigDecimal originalPrice;

    /**
     * 价格范围描述
     * 可选，如 "10000-20000"
     */
    @Size(max = 100, message = "价格范围最多 100 字符")
    private String priceRange;

    /**
     * 币种
     * 可选，默认 JPY
     */
    @Size(max = 10, message = "币种最多 10 字符")
    private String currency;

    // =====================================================
    // 关联信息
    // =====================================================

    /**
     * 关联的合作方 ID
     * 必填
     */
    @NotNull(message = "合作方 ID 不能为空")
    private Long partnerId;

    /**
     * 分类 ID
     * 可选
     */
    private Long categoryId;

    // =====================================================
    // 服务信息
    // =====================================================

    /**
     * 服务项目列表
     * 可选
     */
    private List<String> serviceItems;

    /**
     * 服务时长描述
     * 可选，如 "3天2夜"
     */
    @Size(max = 100, message = "服务时长最多 100 字符")
    private String duration;

    /**
     * 备注信息
     * 可选
     */
    @Size(max = 500, message = "备注最多 500 字符")
    private String remarks;

    /**
     * 封面图片 URL
     * 可选
     */
    @Size(max = 500, message = "图片 URL 最多 500 字符")
    private String coverImage;

    /**
     * 图片列表
     * 可选
     */
    private List<String> images;

    /**
     * 标签列表
     * 可选
     */
    private List<String> tags;

    /**
     * 排序权重
     * 可选，默认 0
     */
    private Integer sortOrder;
}
