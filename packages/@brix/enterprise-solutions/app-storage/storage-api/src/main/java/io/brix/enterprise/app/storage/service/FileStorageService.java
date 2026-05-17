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
package io.brix.enterprise.app.storage.service;

import io.brix.enterprise.app.storage.dto.*;
import io.brix.enterprise.app.storage.enums.BusinessType;

import java.io.InputStream;
import java.util.List;

/**
 * 文件存储服务接口
 * 
 * <p>定义文件存储模块的核心业务能力，包括文件上传、下载、预览、删除等操作。
 * 实现类通过 RuntimeContext 获取认证信息和可观测性能力。
 * 
 * <h3>核心能力</h3>
 * <ul>
 *   <li><b>文件上传</b> - 支持单文件和批量上传，自动计算MD5，支持去重</li>
 *   <li><b>文件下载</b> - 提供文件流下载，支持断点续传</li>
 *   <li><b>文件预览</b> - 生成带签名的临时URL，支持图片、PDF、视频预览</li>
 *   <li><b>文件删除</b> - 软删除，支持恢复</li>
 *   <li><b>访问审计</b> - 记录所有文件访问操作</li>
 * </ul>
 * 
 * <h3>安全特性</h3>
 * <ul>
 *   <li>多租户隔离 - 按租户ID隔离文件存储</li>
 *   <li>签名URL - 临时访问URL，5分钟有效期</li>
 *   <li>访问日志 - 完整的操作审计日志</li>
 *   <li>类型校验 - 限制允许上传的文件类型</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface FileStorageService {

    // =====================================================
    // 文件上传
    // =====================================================

    /**
     * 上传文件
     * 
     * <p>处理流程：
     * <ol>
     *   <li>校验文件类型和大小</li>
     *   <li>计算MD5哈希值</li>
     *   <li>生成存储路径：{tenant_id}/{business_type}/{entity_id}/{file_id}</li>
     *   <li>上传到存储后端</li>
     *   <li>保存文件元数据</li>
     *   <li>记录上传日志</li>
     * </ol>
     *
     * @param inputStream 文件输入流
     * @param originalName 原始文件名
     * @param contentType MIME类型
     * @param fileSize 文件大小
     * @param request 上传请求参数
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     * @return 上传结果
     */
    UploadResponse upload(InputStream inputStream, String originalName, String contentType,
                          long fileSize, UploadRequest request, String clientIp, String userAgent);

    // =====================================================
    // 文件下载
    // =====================================================

    /**
     * 下载文件
     * 
     * <p>返回文件输入流，调用方负责关闭流。
     * 下载操作会记录访问日志。
     *
     * @param fileId 文件ID
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     * @return 文件输入流
     */
    InputStream download(String fileId, String clientIp, String userAgent);

    /**
     * 获取文件预览URL
     * 
     * <p>生成带签名的临时访问URL，默认5分钟有效期。
     * 适用于图片、PDF、视频等可预览文件。
     *
     * @param fileId 文件ID
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     * @return 签名URL
     */
    String getPreviewUrl(String fileId, String clientIp, String userAgent);

    // =====================================================
    // 文件查询
    // =====================================================

    /**
     * 根据ID获取文件元数据
     *
     * @param fileId 文件ID
     * @return 文件元数据，不存在返回回null
     */
    FileMetadataDTO getById(String fileId);

    /**
     * 根据业务类型和实体ID查询文件列表
     *
     * @param businessType 业务类型
     * @param entityId 关联实体ID
     * @return 文件列表
     */
    List<FileMetadataDTO> listByEntity(BusinessType businessType, String entityId);

    /**
     * 分页查询文件列表
     *
     * @param businessType 业务类型（可选）
     * @param keyword 关键词（搜索文件名）
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @return 文件列表
     */
    List<FileMetadataDTO> list(BusinessType businessType, String keyword, int page, int size);

    /**
     * 统计文件数量
     *
     * @param businessType 业务类型（可选）
     * @return 文件数量
     */
    long count(BusinessType businessType);

    // =====================================================
    // 文件删除
    // =====================================================

    /**
     * 删除文件（软删除）
     * 
     * <p>标记文件为已删除，不会立即从存储后端删除。
     * 管理员可以恢复已删除的文件。
     *
     * @param fileId 文件ID
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     */
    void delete(String fileId, String clientIp, String userAgent);

    /**
     * 批量删除文件
     *
     * @param fileIds 文件ID列表
     * @param clientIp 客户端IP
     * @param userAgent 用户代理
     */
    void batchDelete(List<String> fileIds, String clientIp, String userAgent);

    // =====================================================
    // 访问日志
    // =====================================================

    /**
     * 查询文件访问日志
     *
     * @param fileId 文件ID
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @return 访问日志列表
     */
    List<FileAccessLogDTO> getAccessLogs(String fileId, int page, int size);
}
