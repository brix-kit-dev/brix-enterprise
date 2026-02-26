package com.shinwa.app.products.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shinwa.app.products.enums.ProductStatus;
import com.shinwa.app.products.enums.ProductType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 产品数据传输对象
 *
 * <p>用于 API 响应的产品信息 DTO，包含产品的完整信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>基本信息：id、name、description、type、status</li>
 *   <li>定价信息：price、originalPrice、currency</li>
 *   <li>关联信息：partnerId、partnerName、categoryId</li>
 *   <li>服务信息：serviceItems、duration、remarks</li>
 *   <li>审计信息：createdAt、updatedAt、createdBy</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    // =====================================================
    // 基本信息
    // =====================================================

    /**
     * 产品唯一标识
     */
    private Long id;

    /**
     * 产品名称
     */
    private String name;

    /**
     * 产品描述
     */
    private String description;

    /**
     * 产品类型
     */
    private ProductType type;

    /**
     * 产品状态
     */
    private ProductStatus status;

    /**
     * 产品编码（用于展示）
     */
    private String code;

    // =====================================================
    // 定价信息
    // =====================================================

    /**
     * 销售价格
     */
    private BigDecimal price;

    /**
     * 原价（用于显示折扣）
     */
    private BigDecimal originalPrice;

    /**
     * 价格范围描述（如 "10000-20000"）
     */
    private String priceRange;

    /**
     * 币种（默认 JPY）
     */
    private String currency;

    // =====================================================
    // 关联信息
    // =====================================================

    /**
     * 关联的合作方 ID
     */
    private Long partnerId;

    /**
     * 合作方名称（冗余字段，方便展示）
     */
    private String partnerName;

    /**
     * 分类 ID
     */
    private Long categoryId;

    /**
     * 分类名称（冗余字段）
     */
    private String categoryName;

    // =====================================================
    // 服务信息
    // =====================================================

    /**
     * 服务项目列表
     */
    private List<String> serviceItems;

    /**
     * 服务时长描述
     */
    private String duration;

    /**
     * 备注信息
     */
    private String remarks;

    /**
     * 封面图片 URL
     */
    private String coverImage;

    /**
     * 图片列表
     */
    private List<String> images;

    /**
     * 标签列表
     */
    private List<String> tags;

    // =====================================================
    // 排序与统计
    // =====================================================

    /**
     * 排序权重
     */
    private Integer sortOrder;

    /**
     * 销量统计
     */
    private Integer salesCount;

    /**
     * 浏览量统计
     */
    private Integer viewCount;

    // =====================================================
    // 审计信息
    // =====================================================

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
     * 租户 ID
     */
    private String tenantId;
}
