package com.shinwa.app.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Pre-signed上传URL响应DTO
 * 
 * <p>用于客户端直传模式，包含签名上传URL和上传参数。
 * 
 * <h3>使用示例</h3>
 * <pre>
 * // 前端 TypeScript 示例
 * const response = await fetch('/api/v1/storage/avatar/presigned-url', {
 *   method: 'POST',
 *   body: JSON.stringify({ userId: 'xxx', contentType: 'image/webp', fileSize: 102400 })
 * });
 * const { uploadUrl, uploadFields, avatarUrl } = await response.json();
 * 
 * // 直接上传到对象存储
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'image/webp' },
 *   body: compressedImageBlob
 * });
 * 
 * // 确认上传
 * await fetch('/api/v1/storage/avatar/confirm', {
 *   method: 'POST',
 *   body: JSON.stringify({ userId: 'xxx', storagePath: avatarUrl.storagePath })
 * });
 * </pre>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadResponse {

    /**
     * Pre-signed上传URL
     * 客户端直接使用 PUT 方法上传文件到此URL
     */
    private String uploadUrl;

    /**
     * 上传时需要附带的表单字段（用于POST上传模式）
     * 如：key, policy, signature 等
     */
    private Map<String, String> uploadFields;

    /**
     * 存储路径
     * 上传确认时使用
     */
    private String storagePath;

    /**
     * URL过期时间
     */
    private LocalDateTime expiresAt;

    /**
     * 允许的最大文件大小（字节）
     */
    private Long maxFileSize;

    /**
     * 预设的头像访问URL（上传确认后生效）
     */
    private AvatarUrls avatarUrls;

    /**
     * 头像URL集合
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvatarUrls {
        /**
         * 原图URL
         */
        private String original;

        /**
         * 大尺寸缩略图 (256x256)
         */
        private String large;

        /**
         * 中尺寸缩略图 (128x128)
         */
        private String medium;

        /**
         * 小尺寸缩略图 (48x48)
         */
        private String small;
    }
}
