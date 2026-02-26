package com.shinwa.app.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 头像信息响应DTO
 * 
 * <p>包含用户头像的多尺寸URL和元数据。
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarResponse {

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 原图URL
     */
    private String originalUrl;

    /**
     * 大尺寸头像URL (256x256)
     */
    private String largeUrl;

    /**
     * 中尺寸头像URL (128x128)
     */
    private String mediumUrl;

    /**
     * 小尺寸头像URL (48x48)
     */
    private String smallUrl;

    /**
     * 文件MIME类型
     */
    private String contentType;

    /**
     * 原图文件大小（字节）
     */
    private Long fileSize;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 默认头像标识
     * 如果用户未上传头像，使用默认头像
     */
    @Builder.Default
    private Boolean isDefault = false;
}
