package com.shinwa.app.storage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 头像上传请求DTO
 * 
 * <p>支持两种上传模式：
 * <ul>
 *   <li>服务端上传：客户端上传到服务端，服务端转存到对象存储</li>
 *   <li>Pre-signed直传：客户端先获取签名URL，直接上传到对象存储</li>
 * </ul>
 * 
 * <h3>推荐使用Pre-signed直传模式</h3>
 * <ol>
 *   <li>客户端调用 POST /api/v1/storage/avatar/presigned-url 获取上传凭证</li>
 *   <li>客户端在本地压缩/裁剪图片（WebP格式，200KB以内）</li>
 *   <li>客户端使用 uploadUrl 直接上传到对象存储</li>
 *   <li>客户端调用 POST /api/v1/storage/avatar/confirm 确认上传</li>
 *   <li>服务端生成多尺寸缩略图并更新用户头像</li>
 * </ol>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUploadRequest {

    /**
     * 用户ID
     * 用于确定存储路径和权限校验
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;

    /**
     * 文件MIME类型
     * 支持：image/jpeg, image/png, image/webp
     */
    @NotBlank(message = "文件类型不能为空")
    @Pattern(regexp = "^image/(jpeg|png|webp)$", message = "仅支持JPEG、PNG、WebP格式")
    private String contentType;

    /**
     * 文件大小（字节）
     * 用于Pre-signed URL生成时的校验
     */
    private Long fileSize;

    /**
     * 客户端图片MD5
     * 用于上传完成后的完整性校验
     */
    private String md5;
}
