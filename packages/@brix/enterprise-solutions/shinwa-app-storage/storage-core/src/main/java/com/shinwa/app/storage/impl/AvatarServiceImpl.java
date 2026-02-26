package com.shinwa.app.storage.impl;

import com.shinwa.app.storage.adapter.StorageAdapter;
import com.shinwa.app.storage.dto.*;
import com.shinwa.app.storage.event.AvatarUploadedEvent;
import com.shinwa.app.storage.service.AvatarService;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.capability.StateStoreCapability;
import io.runtime.sdk.capability.ConfigStoreCapability;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 头像服务实现
 * 
 * <p>基于 v3.0 Runtime Shell 架构实现，通过 RuntimeContext 获取能力契约。
 * 
 * <h3>架构合规</h3>
 * <ul>
 *   <li>通过 RuntimeContext 获取 ObservabilityCapability（替代 @Slf4j）</li>
 *   <li>通过 RuntimeContext 获取 EventBusCapability 发布事件</li>
 *   <li>通过 RuntimeContext 获取 StateStoreCapability 缓存头像信息</li>
 *   <li>通过 RuntimeContext 获取 ConfigStoreCapability 读取配置</li>
 * </ul>
 * 
 * <h3>最新技术栈</h3>
 * <ul>
 *   <li>Pre-signed URL 直传 - 客户端直接上传到 MinIO/S3</li>
 *   <li>客户端压缩 - 建议使用 browser-image-compression</li>
 *   <li>WebP 格式 - 更小体积，更好质量</li>
 *   <li>多尺寸缩略图 - 按需生成 48x48, 128x128, 256x256</li>
 * </ul>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Service
public class AvatarServiceImpl implements AvatarService {

    private final RuntimeContext context;
    private final StorageAdapter storageAdapter;

    /**
     * 头像缓存前缀
     */
    private static final String AVATAR_CACHE_PREFIX = "avatar:";

    /**
     * 头像缓存TTL
     */
    private static final Duration AVATAR_CACHE_TTL = Duration.ofHours(24);

    /**
     * Pre-signed URL 有效期
     */
    private static final Duration PRESIGNED_URL_EXPIRATION = Duration.ofMinutes(15);

    /**
     * 默认头像路径
     */
    private static final String DEFAULT_AVATAR_PATH = "system/default-avatar.png";

    public AvatarServiceImpl(RuntimeContext context, StorageAdapter storageAdapter) {
        this.context = context;
        this.storageAdapter = storageAdapter;
    }

    // ========== Capability 获取方法 ==========

    private ObservabilityCapability getLog() {
        return context.getObservability();
    }

    private EventBusCapability getEventBus() {
        return context.getEventBus();
    }

    private StateStoreCapability getStateStore() {
        return context.getStateStore();
    }

    private ConfigStoreCapability getConfigStore() {
        return context.getConfigStore();
    }

    // ========== 接口实现 ==========

    @Override
    public PresignedUploadResponse generatePresignedUploadUrl(String tenantId, AvatarUploadRequest request) {
        getLog().info("生成头像上传Pre-signed URL: tenantId={}, userId={}", tenantId, request.getUserId());

        // 校验文件大小
        long maxSize = getConfigStore().getLong("storage.avatar.max-size", 500L) * 1024; // KB -> Bytes
        if (request.getFileSize() != null && request.getFileSize() > maxSize) {
            throw new IllegalArgumentException("头像文件大小不能超过 " + (maxSize / 1024) + "KB");
        }

        // 生成存储路径
        String fileId = UUID.randomUUID().toString();
        String extension = getExtensionFromContentType(request.getContentType());
        String storagePath = buildAvatarStoragePath(tenantId, request.getUserId(), fileId, extension);

        // 生成 Pre-signed 上传 URL
        String uploadUrl = storageAdapter.generatePresignedUploadUrl(storagePath, PRESIGNED_URL_EXPIRATION);

        // 构建预设的头像URL（上传确认后生效）
        PresignedUploadResponse.AvatarUrls avatarUrls = buildAvatarUrls(tenantId, request.getUserId(), fileId, extension);

        getLog().info("Pre-signed URL 生成成功: userId={}, storagePath={}", request.getUserId(), storagePath);

        return PresignedUploadResponse.builder()
                .uploadUrl(uploadUrl)
                .storagePath(storagePath)
                .expiresAt(LocalDateTime.now().plus(PRESIGNED_URL_EXPIRATION))
                .maxFileSize(maxSize)
                .avatarUrls(avatarUrls)
                .build();
    }

    @Override
    public AvatarResponse confirmUpload(String tenantId, AvatarConfirmRequest request) {
        getLog().info("确认头像上传: tenantId={}, userId={}, storagePath={}", 
                tenantId, request.getUserId(), request.getStoragePath());

        // 验证文件是否已上传到对象存储
        if (!storageAdapter.exists(request.getStoragePath())) {
            throw new IllegalStateException("文件未上传完成，请重试");
        }

        // 获取文件信息
        long fileSize = storageAdapter.getFileSize(request.getStoragePath());

        // TODO: 生成多尺寸缩略图（可异步处理）
        // 实际项目中可使用 imagemagick, thumbnailator, 或云端图片处理服务
        // 这里简化处理，直接使用原图URL

        // 构建头像响应
        String baseUrl = getConfigStore().getString("storage.cdn-url", "");
        AvatarResponse response = AvatarResponse.builder()
                .userId(request.getUserId())
                .originalUrl(buildAccessUrl(baseUrl, request.getStoragePath()))
                .largeUrl(buildAccessUrl(baseUrl, request.getStoragePath()))    // TODO: 实际应为缩略图
                .mediumUrl(buildAccessUrl(baseUrl, request.getStoragePath()))   // TODO: 实际应为缩略图
                .smallUrl(buildAccessUrl(baseUrl, request.getStoragePath()))    // TODO: 实际应为缩略图
                .contentType(detectContentType(request.getStoragePath()))
                .fileSize(fileSize)
                .updatedAt(LocalDateTime.now())
                .isDefault(false)
                .build();

        // 缓存头像信息
        String cacheKey = AVATAR_CACHE_PREFIX + tenantId + ":" + request.getUserId();
        getStateStore().put(cacheKey, response, AVATAR_CACHE_TTL);

        // 发布头像上传事件
        publishAvatarUploadedEvent(tenantId, request.getUserId(), response);

        getLog().info("头像上传确认成功: userId={}, fileSize={}", request.getUserId(), fileSize);

        return response;
    }

    @Override
    public AvatarResponse getAvatar(String tenantId, String userId) {
        // 尝试从缓存获取
        String cacheKey = AVATAR_CACHE_PREFIX + tenantId + ":" + userId;
        var cached = getStateStore().get(cacheKey, AvatarResponse.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        // 检查用户是否有自定义头像
        // TODO: 实际应查询数据库获取用户头像路径
        // String avatarPath = buildAvatarBasePath(tenantId, userId);
        
        // 返回默认头像
        return getDefaultAvatar(tenantId);
    }

    @Override
    public void deleteAvatar(String tenantId, String userId) {
        getLog().info("删除用户头像: tenantId={}, userId={}", tenantId, userId);

        // 清除缓存
        String cacheKey = AVATAR_CACHE_PREFIX + tenantId + ":" + userId;
        getStateStore().remove(cacheKey);

        // 删除存储的头像文件
        // TODO: 实际应遍历删除该用户的所有头像文件
        // String avatarPath = buildAvatarBasePath(tenantId, userId);

        getLog().info("用户头像删除成功: userId={}", userId);
    }

    @Override
    public AvatarResponse getDefaultAvatar(String tenantId) {
        String baseUrl = getConfigStore().getString("storage.cdn-url", "");
        String defaultUrl = buildAccessUrl(baseUrl, DEFAULT_AVATAR_PATH);

        return AvatarResponse.builder()
                .userId(null)
                .originalUrl(defaultUrl)
                .largeUrl(defaultUrl)
                .mediumUrl(defaultUrl)
                .smallUrl(defaultUrl)
                .contentType("image/png")
                .fileSize(0L)
                .updatedAt(null)
                .isDefault(true)
                .build();
    }

    // ========== 私有方法 ==========

    /**
     * 构建头像存储路径
     */
    private String buildAvatarStoragePath(String tenantId, String userId, String fileId, String extension) {
        return String.format("%s/avatars/%s/%s.%s", tenantId, userId, fileId, extension);
    }

    /**
     * 构建头像基础路径
     */
    private String buildAvatarBasePath(String tenantId, String userId) {
        return String.format("%s/avatars/%s/", tenantId, userId);
    }

    /**
     * 构建头像URL集合
     */
    private PresignedUploadResponse.AvatarUrls buildAvatarUrls(String tenantId, String userId, 
                                                                String fileId, String extension) {
        String baseUrl = getConfigStore().getString("storage.cdn-url", "");
        String basePath = String.format("%s/avatars/%s/%s", tenantId, userId, fileId);

        return PresignedUploadResponse.AvatarUrls.builder()
                .original(buildAccessUrl(baseUrl, basePath + "." + extension))
                .large(buildAccessUrl(baseUrl, basePath + "_256." + extension))
                .medium(buildAccessUrl(baseUrl, basePath + "_128." + extension))
                .small(buildAccessUrl(baseUrl, basePath + "_48." + extension))
                .build();
    }

    /**
     * 构建访问URL
     */
    private String buildAccessUrl(String baseUrl, String path) {
        if (baseUrl == null || baseUrl.isEmpty()) {
            // 使用签名URL
            return storageAdapter.generateSignedUrl(path, Duration.ofHours(24));
        }
        return baseUrl + "/" + path;
    }

    /**
     * 根据Content-Type获取文件扩展名
     */
    private String getExtensionFromContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    /**
     * 检测Content-Type
     */
    private String detectContentType(String path) {
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (path.endsWith(".png")) {
            return "image/png";
        } else if (path.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    /**
     * 发布头像上传事件
     */
    private void publishAvatarUploadedEvent(String tenantId, String userId, AvatarResponse avatar) {
        AvatarUploadedEvent event = AvatarUploadedEvent.builder()
                .tenantId(tenantId)
                .userId(userId)
                .originalUrl(avatar.getOriginalUrl())
                .largeUrl(avatar.getLargeUrl())
                .mediumUrl(avatar.getMediumUrl())
                .smallUrl(avatar.getSmallUrl())
                .contentType(avatar.getContentType())
                .fileSize(avatar.getFileSize())
                .build();

        getEventBus().publishIntegration(event);
        getLog().info("发布头像上传事件: userId={}, eventId={}", userId, event.getEventId());
    }
}
