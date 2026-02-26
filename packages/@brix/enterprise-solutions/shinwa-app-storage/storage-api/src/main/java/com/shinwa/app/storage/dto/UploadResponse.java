package com.shinwa.app.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传响应DTO
 * 
 * <p>文件上传成功后的响应，包含文件ID和预览URL。
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {

    /**
     * 文件唯一标识
     * 后续操作（下载、删除、预览）使用此ID
     */
    private String fileId;

    /**
     * 原始文件名
     */
    private String originalName;

    /**
     * 文件大小（字节）
     */
    private Long fileSize;

    /**
     * 文件大小（人类可读格式）
     */
    private String fileSizeReadable;

    /**
     * MIME类型
     */
    private String contentType;

    /**
     * 文件MD5哈希值
     */
    private String md5Hash;

    /**
     * 预览URL
     * 带签名的临时访问URL（5分钟有效期）
     */
    private String previewUrl;

    /**
     * 是否可预览
     */
    private Boolean previewable;
}
