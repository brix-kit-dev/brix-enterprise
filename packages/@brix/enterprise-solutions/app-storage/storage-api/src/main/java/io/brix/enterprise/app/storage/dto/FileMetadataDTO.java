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
package io.brix.enterprise.app.storage.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.brix.enterprise.app.storage.enums.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文件元数据DTO
 * 
 * <p>文件信息的传输对象，用于API响应。
 * 包含文件的完整元数据信息，不包含实际文件内容。
 * 
 * <h3>使用场景</h3>
 * <ul>
 *   <li>文件上传成功后的响应</li>
 *   <li>文件列表查询响应</li>
 *   <li>文件详情查询响应</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadataDTO {

    /**
     * 文件唯一标识
     */
    private String id;

    /**
     * 原始文件名
     * 用户上传时的文件名
     */
    private String originalName;

    /**
     * 文件大小（字节）
     */
    private Long fileSize;

    /**
     * 文件大小（人类可读格式）
     * 如：1.5 MB, 256 KB
     */
    private String fileSizeReadable;

    /**
     * MIME类型
     * 如：image/jpeg, application/pdf, text/plain
     */
    private String contentType;

    /**
     * 文件扩展名
     * 如：jpg, pdf, docx
     */
    private String fileExtension;

    /**
     * 文件MD5哈希值
     * 用于文件完整性校验和去重
     */
    private String md5Hash;

    /**
     * 业务类型
     */
    private BusinessType businessType;

    /**
     * 关联实体ID
     * 如：案件ID、订单ID、用户ID等
     */
    private String entityId;

    /**
     * 文件备注说明
     */
    private String remark;

    /**
     * 预览URL
     * 带签名的临时访问URL（5分钟有效期）
     */
    private String previewUrl;

    /**
     * 是否可预览
     * 根据文件类型判断（如图片、PDF可预览）
     */
    private Boolean previewable;

    /**
     * 上传人ID
     */
    private String uploadedBy;

    /**
     * 上传人姓名
     */
    private String uploadedByName;

    /**
     * 上传时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 将字节数转换为人类可读格式
     *
     * @param bytes 字节数
     * @return 人类可读的大小字符串
     */
    public static String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }

    /**
     * 判断文件是否可预览
     *
     * @param contentType MIME类型
     * @return 是否可预览
     */
    public static boolean isPreviewable(String contentType) {
        if (contentType == null) {
            return false;
        }
        return contentType.startsWith("image/") ||
               contentType.equals("application/pdf") ||
               contentType.startsWith("text/") ||
               contentType.startsWith("video/");
    }
}
