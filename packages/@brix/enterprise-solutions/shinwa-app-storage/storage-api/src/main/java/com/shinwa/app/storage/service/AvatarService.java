package com.shinwa.app.storage.service;

import com.shinwa.app.storage.dto.AvatarConfirmRequest;
import com.shinwa.app.storage.dto.AvatarResponse;
import com.shinwa.app.storage.dto.AvatarUploadRequest;
import com.shinwa.app.storage.dto.PresignedUploadResponse;

/**
 * 头像服务接口
 * 
 * <p>提供用户头像的上传、获取、删除等操作。
 * 支持两种上传模式：
 * <ul>
 *   <li>Pre-signed直传（推荐）：客户端直接上传到对象存储</li>
 *   <li>服务端中转：客户端上传到服务端，服务端转存</li>
 * </ul>
 * 
 * <h3>v3.0 架构合规</h3>
 * <p>本接口定义在 storage-api 模块，实现在 storage-core/server 模块。
 * 通过 RuntimeContext 获取能力契约，发布 AvatarUploadedEvent 事件。
 * 
 * <h3>最新技术栈</h3>
 * <ul>
 *   <li>Pre-signed URL 直传 - 减轻服务器压力</li>
 *   <li>客户端压缩 - WebP 格式，200KB 以内</li>
 *   <li>多尺寸缩略图 - 48x48, 128x128, 256x256</li>
 *   <li>CDN 加速 - 全球分发</li>
 * </ul>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
public interface AvatarService {

    /**
     * 生成头像上传Pre-signed URL
     * 
     * <p>客户端获取签名URL后，直接上传到对象存储，减轻服务器压力。
     * 
     * @param tenantId 租户ID
     * @param request 上传请求（包含userId, contentType, fileSize）
     * @return Pre-signed上传响应（包含uploadUrl, storagePath, avatarUrls）
     */
    PresignedUploadResponse generatePresignedUploadUrl(String tenantId, AvatarUploadRequest request);

    /**
     * 确认头像上传
     * 
     * <p>客户端完成直传后调用此接口：
     * <ol>
     *   <li>验证文件已上传到对象存储</li>
     *   <li>生成多尺寸缩略图</li>
     *   <li>更新用户头像URL</li>
     *   <li>发布AvatarUploadedEvent事件</li>
     * </ol>
     * 
     * @param tenantId 租户ID
     * @param request 确认请求（包含userId, storagePath）
     * @return 头像响应（包含多尺寸URL）
     */
    AvatarResponse confirmUpload(String tenantId, AvatarConfirmRequest request);

    /**
     * 获取用户头像信息
     * 
     * @param tenantId 租户ID
     * @param userId 用户ID
     * @return 头像响应（如果未上传则返回默认头像）
     */
    AvatarResponse getAvatar(String tenantId, String userId);

    /**
     * 删除用户头像
     * 
     * <p>删除用户上传的头像，恢复为默认头像。
     * 
     * @param tenantId 租户ID
     * @param userId 用户ID
     */
    void deleteAvatar(String tenantId, String userId);

    /**
     * 获取默认头像URL
     * 
     * @param tenantId 租户ID
     * @return 默认头像响应
     */
    AvatarResponse getDefaultAvatar(String tenantId);
}
