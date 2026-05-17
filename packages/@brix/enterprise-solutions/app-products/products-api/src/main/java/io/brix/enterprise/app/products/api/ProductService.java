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
package io.brix.enterprise.app.products.api;

import io.brix.enterprise.app.products.dto.CreateProductRequest;
import io.brix.enterprise.app.products.dto.ProductDTO;
import io.brix.enterprise.app.products.dto.UpdateProductRequest;
import io.brix.enterprise.app.products.enums.ProductStatus;
import io.brix.enterprise.app.products.enums.ProductType;

import java.util.List;
import java.util.Optional;

/**
 * 产品服务接口
 *
 * <p>定义产品模块的核心业务操作接口。
 *
 * <p>功能说明：
 * <ul>
 *   <li>CRUD 操作：创建、查询、更新、删除产品</li>
 *   <li>状态管理：提交审核、审核通过/驳回、上架/下架、归档</li>
 *   <li>查询操作：按类型、状态、合作方等条件查询</li>
 * </ul>
 *
 * <p>v3.0 设计原则：
 * <ul>
 *   <li>接口与实现分离</li>
 *   <li>方法签名清晰，职责单一</li>
 *   <li>返回 Optional 处理可能不存在的数据</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface ProductService {

    // =====================================================
    // 创建与更新操作
    // =====================================================

    /**
     * 创建产品
     *
     * <p>创建新产品，初始状态为 DRAFT（草稿）。
     *
     * @param request 创建请求
     * @return 创建的产品 DTO
     * @throws IllegalArgumentException 如果产品名称已存在
     */
    ProductDTO create(CreateProductRequest request);

    /**
     * 更新产品
     *
     * <p>仅草稿状态的产品可以更新。
     *
     * @param id 产品 ID
     * @param request 更新请求
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在或名称重复
     * @throws IllegalStateException 如果产品不可编辑
     */
    ProductDTO update(Long id, UpdateProductRequest request);

    /**
     * 删除产品
     *
     * <p>软删除产品。仅草稿或下架状态的产品可以删除。
     *
     * @param id 产品 ID
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果产品状态不允许删除
     */
    void delete(Long id);

    // =====================================================
    // 查询操作
    // =====================================================

    /**
     * 根据 ID 查询产品
     *
     * @param id 产品 ID
     * @return 产品 DTO（如果存在）
     */
    Optional<ProductDTO> findById(Long id);

    /**
     * 根据 ID 查询产品（必须存在）
     *
     * @param id 产品 ID
     * @return 产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     */
    ProductDTO getById(Long id);

    /**
     * 查询所有产品
     *
     * @return 产品 DTO 列表
     */
    List<ProductDTO> findAll();

    /**
     * 根据状态查询产品
     *
     * @param status 产品状态
     * @return 产品 DTO 列表
     */
    List<ProductDTO> findByStatus(ProductStatus status);

    /**
     * 根据类型查询产品
     *
     * @param type 产品类型
     * @return 产品 DTO 列表
     */
    List<ProductDTO> findByType(ProductType type);

    /**
     * 根据合作方 ID 查询产品
     *
     * @param partnerId 合作方 ID
     * @return 产品 DTO 列表
     */
    List<ProductDTO> findByPartnerId(Long partnerId);

    /**
     * 查询上架的产品（对外展示）
     *
     * @return 上架产品 DTO 列表
     */
    List<ProductDTO> findActiveProducts();

    /**
     * 根据关键字搜索产品
     *
     * @param keyword 搜索关键字
     * @return 产品 DTO 列表
     */
    List<ProductDTO> search(String keyword);

    // =====================================================
    // 状态管理操作
    // =====================================================

    /**
     * 提交审核
     *
     * <p>将草稿状态的产品提交审核。
     *
     * @param id 产品 ID
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许提交审核
     */
    ProductDTO submitReview(Long id);

    /**
     * 审核通过（上架）
     *
     * <p>将待审核状态的产品审核通过，变为上架状态。
     *
     * @param id 产品 ID
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许审核通过
     */
    ProductDTO approve(Long id);

    /**
     * 审核驳回
     *
     * <p>将待审核状态的产品驳回，变为草稿状态。
     *
     * @param id 产品 ID
     * @param reason 驳回原因
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许驳回
     */
    ProductDTO reject(Long id, String reason);

    /**
     * 下架产品
     *
     * <p>将上架状态的产品下架。
     *
     * @param id 产品 ID
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许下架
     */
    ProductDTO deactivate(Long id);

    /**
     * 重新上架产品
     *
     * <p>将下架状态的产品重新上架。
     *
     * @param id 产品 ID
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许重新上架
     */
    ProductDTO reactivate(Long id);

    /**
     * 归档产品
     *
     * <p>将下架状态的产品归档。
     *
     * @param id 产品 ID
     * @return 更新后的产品 DTO
     * @throws IllegalArgumentException 如果产品不存在
     * @throws IllegalStateException 如果当前状态不允许归档
     */
    ProductDTO archive(Long id);
}
