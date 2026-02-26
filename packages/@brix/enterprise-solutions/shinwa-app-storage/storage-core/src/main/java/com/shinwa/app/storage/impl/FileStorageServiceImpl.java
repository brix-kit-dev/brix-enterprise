package com.shinwa.app.storage.impl;

import com.shinwa.app.storage.adapter.StorageAdapter;
import com.shinwa.app.storage.dto.*;
import com.shinwa.app.storage.entity.FileAccessLog;
import com.shinwa.app.storage.entity.FileMetadata;
import com.shinwa.app.storage.enums.AccessType;
import com.shinwa.app.storage.enums.BusinessType;
import com.shinwa.app.storage.exception.StorageOperationException;
import com.shinwa.app.storage.repository.FileAccessLogRepository;
import com.shinwa.app.storage.repository.FileMetadataRepository;
import com.shinwa.app.storage.service.FileStorageService;
import io.runtime.sdk.context.RuntimeContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 文件存储服务实现
 * 
 * <p>基于 RuntimeContext 能力契约模型实现文件存储服务。
 * 通过 RuntimeContext 获取认证信息和可观测性能力。
 * 
 * <h3>核心流程</h3>
 * <ul>
 *   <li>上传：校验 → 计算MD5 → 生成路径 → 存储 → 保存元数据 → 记录日志</li>
 *   <li>下载：验证权限 → 获取流 → 记录日志</li>
 *   <li>预览：验证权限 → 生成签名URL → 记录日志</li>
 *   <li>删除：验证权限 → 软删除 → 记录日志</li>
 * </ul>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final RuntimeContext runtimeContext;
    private final StorageAdapter storageAdapter;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileAccessLogRepository fileAccessLogRepository;

    /**
     * 签名URL默认有效期（5分钟）
     */
    private static final Duration DEFAULT_URL_EXPIRATION = Duration.ofMinutes(5);

    // =====================================================
    // 工具方法
    // =====================================================

    /**
     * 获取当前租户ID
     */
    private String getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("租户ID不能为空");
        }
        return tenantId;
    }

    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        return principal != null ? principal.getName() : "system";
    }

    /**
     * 记录指标
     */
    private void recordMetric(String name, double value, Map<String, String> tags) {
        try {
            runtimeContext.getObservability().recordMetric(name, value, tags);
        } catch (Exception e) {
            log.debug("记录指标失败: {}", e.getMessage());
        }
    }

    /**
     * 生成存储路径
     */
    private String buildStoragePath(String tenantId, BusinessType businessType,
                                     String entityId, String fileId, String fileName) {
        String extension = FileMetadata.extractExtension(fileName);
        String basePath = tenantId + "/" + businessType.getCode();
        
        if (entityId != null && !entityId.isBlank()) {
            basePath += "/" + entityId;
        }
        
        return basePath + "/" + fileId + (extension.isEmpty() ? "" : "." + extension);
    }

    /**
     * 计算文件MD5
     */
    private String calculateMd5(InputStream inputStream, long fileSize) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] buffer = new byte[8192];
            int bytesRead;
            
            // 注意：这里会消费inputStream，需要在调用前考虑
            // 实际实现中可能需要使用临时文件或缓存
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                md.update(buffer, 0, bytesRead);
            }
            
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
            
        } catch (Exception e) {
            log.warn("计算MD5失败，跳过: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 记录访问日志
     */
    private void logAccess(String fileId, String fileName, AccessType accessType,
                           String clientIp, String userAgent, boolean success, String failureReason) {
        try {
            String tenantId = getCurrentTenantId();
            String userId = getCurrentUserId();
            
            FileAccessLog accessLog;
            if (success) {
                accessLog = FileAccessLog.success(tenantId, fileId, fileName, accessType,
                        userId, clientIp, userAgent);
            } else {
                accessLog = FileAccessLog.failed(tenantId, fileId, fileName, accessType,
                        userId, clientIp, userAgent, failureReason);
            }
            
            fileAccessLogRepository.save(accessLog);
            
        } catch (Exception e) {
            log.error("记录访问日志失败: fileId={}, accessType={}", fileId, accessType, e);
        }
    }

    /**
     * 转换为DTO
     */
    private FileMetadataDTO toDTO(FileMetadata entity) {
        return FileMetadataDTO.builder()
                .id(entity.getId())
                .originalName(entity.getOriginalName())
                .fileSize(entity.getFileSize())
                .fileSizeReadable(FileMetadataDTO.formatFileSize(entity.getFileSize()))
                .contentType(entity.getContentType())
                .fileExtension(entity.getFileExtension())
                .md5Hash(entity.getMd5Hash())
                .businessType(entity.getBusinessType())
                .entityId(entity.getEntityId())
                .remark(entity.getRemark())
                .previewable(FileMetadataDTO.isPreviewable(entity.getContentType()))
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getCreatedAt())
                .tenantId(entity.getTenantId())
                .build();
    }

    // =====================================================
    // 文件上传
    // =====================================================

    @Override
    @Transactional
    public UploadResponse upload(InputStream inputStream, String originalName, String contentType,
                                  long fileSize, UploadRequest request, String clientIp, String userAgent) {
        log.info("[文件上传] 开始: fileName={}, size={}, businessType={}",
                originalName, fileSize, request.getBusinessType());

        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        String fileId = UUID.randomUUID().toString().replace("-", "");

        try {
            // 1. 生成存储路径
            String storagePath = buildStoragePath(tenantId, request.getBusinessType(),
                    request.getEntityId(), fileId, originalName);

            // 2. 上传到存储后端
            storageAdapter.upload(storagePath, inputStream, contentType, fileSize);

            // 3. 保存文件元数据
            FileMetadata metadata = FileMetadata.builder()
                    .id(fileId)
                    .tenantId(tenantId)
                    .originalName(originalName)
                    .storagePath(storagePath)
                    .fileSize(fileSize)
                    .contentType(contentType)
                    .fileExtension(FileMetadata.extractExtension(originalName))
                    .businessType(request.getBusinessType())
                    .entityId(request.getEntityId())
                    .remark(request.getRemark())
                    .uploadedBy(userId)
                    .build();

            FileMetadata saved = fileMetadataRepository.save(metadata);

            // 4. 记录访问日志
            logAccess(fileId, originalName, AccessType.UPLOAD, clientIp, userAgent, true, null);

            // 5. 记录指标
            recordMetric("storage.upload.count", 1,
                    Map.of("business_type", request.getBusinessType().getCode()));
            recordMetric("storage.upload.size", fileSize,
                    Map.of("business_type", request.getBusinessType().getCode()));

            log.info("[文件上传] 成功: fileId={}, path={}", fileId, storagePath);

            // 6. 生成预览URL
            String previewUrl = null;
            if (FileMetadataDTO.isPreviewable(contentType)) {
                previewUrl = storageAdapter.generateSignedUrl(storagePath, DEFAULT_URL_EXPIRATION);
            }

            return UploadResponse.builder()
                    .fileId(saved.getId())
                    .originalName(saved.getOriginalName())
                    .fileSize(saved.getFileSize())
                    .fileSizeReadable(FileMetadataDTO.formatFileSize(fileSize))
                    .contentType(saved.getContentType())
                    .previewUrl(previewUrl)
                    .previewable(FileMetadataDTO.isPreviewable(contentType))
                    .build();

        } catch (Exception e) {
            log.error("[文件上传] 失败: fileName={}", originalName, e);
            logAccess(fileId, originalName, AccessType.UPLOAD, clientIp, userAgent, false, e.getMessage());
            // [R10 Fix] Use domain-specific StorageOperationException instead of RuntimeException
            throw new StorageOperationException(
                "File upload failed: " + e.getMessage(),
                StorageOperationException.Operation.UPLOAD, fileId, e);
        }
    }

    // =====================================================
    // 文件下载
    // =====================================================

    @Override
    public InputStream download(String fileId, String clientIp, String userAgent) {
        log.info("[文件下载] 开始: fileId={}", fileId);

        String tenantId = getCurrentTenantId();
        FileMetadata metadata = fileMetadataRepository.findByIdAndTenantId(fileId, tenantId)
                .orElseThrow(() -> new RuntimeException("文件不存在: " + fileId));

        try {
            InputStream stream = storageAdapter.download(metadata.getStoragePath());
            
            logAccess(fileId, metadata.getOriginalName(), AccessType.DOWNLOAD,
                    clientIp, userAgent, true, null);
            
            recordMetric("storage.download.count", 1,
                    Map.of("business_type", metadata.getBusinessType().getCode()));
            
            return stream;

        } catch (Exception e) {
            log.error("[文件下载] 失败: fileId={}", fileId, e);
            logAccess(fileId, metadata.getOriginalName(), AccessType.DOWNLOAD,
                    clientIp, userAgent, false, e.getMessage());
            // [R10 Fix] Use domain-specific StorageOperationException instead of RuntimeException
            throw new StorageOperationException(
                "File download failed: " + e.getMessage(),
                StorageOperationException.Operation.DOWNLOAD, fileId, e);
        }
    }

    @Override
    public String getPreviewUrl(String fileId, String clientIp, String userAgent) {
        log.info("[文件预览] 生成URL: fileId={}", fileId);

        String tenantId = getCurrentTenantId();
        FileMetadata metadata = fileMetadataRepository.findByIdAndTenantId(fileId, tenantId)
                .orElseThrow(() -> new RuntimeException("文件不存在: " + fileId));

        try {
            String url = storageAdapter.generateSignedUrl(metadata.getStoragePath(), DEFAULT_URL_EXPIRATION);
            
            logAccess(fileId, metadata.getOriginalName(), AccessType.PREVIEW,
                    clientIp, userAgent, true, null);
            
            return url;

        } catch (Exception e) {
            log.error("[文件预览] 生成URL失败: fileId={}", fileId, e);
            logAccess(fileId, metadata.getOriginalName(), AccessType.PREVIEW,
                    clientIp, userAgent, false, e.getMessage());
            // [R10 Fix] Use domain-specific StorageOperationException instead of RuntimeException
            throw new StorageOperationException(
                "Preview URL generation failed: " + e.getMessage(),
                StorageOperationException.Operation.PREVIEW_URL, fileId, e);
        }
    }

    // =====================================================
    // 文件查询
    // =====================================================

    @Override
    public FileMetadataDTO getById(String fileId) {
        String tenantId = getCurrentTenantId();
        return fileMetadataRepository.findByIdAndTenantId(fileId, tenantId)
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    public List<FileMetadataDTO> listByEntity(BusinessType businessType, String entityId) {
        String tenantId = getCurrentTenantId();
        return fileMetadataRepository.findByTenantAndBusinessTypeAndEntityId(tenantId, businessType, entityId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<FileMetadataDTO> list(BusinessType businessType, String keyword, int page, int size) {
        String tenantId = getCurrentTenantId();
        PageRequest pageable = PageRequest.of(page, size);
        Page<FileMetadata> result;

        if (keyword != null && !keyword.isBlank()) {
            if (businessType != null) {
                result = fileMetadataRepository.searchByBusinessTypeAndName(tenantId, businessType, keyword, pageable);
            } else {
                result = fileMetadataRepository.searchByName(tenantId, keyword, pageable);
            }
        } else {
            if (businessType != null) {
                result = fileMetadataRepository.findByTenantIdAndBusinessType(tenantId, businessType, pageable);
            } else {
                result = fileMetadataRepository.findByTenantId(tenantId, pageable);
            }
        }

        return result.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public long count(BusinessType businessType) {
        String tenantId = getCurrentTenantId();
        if (businessType != null) {
            return fileMetadataRepository.countByTenantIdAndBusinessType(tenantId, businessType);
        }
        return fileMetadataRepository.countByTenantId(tenantId);
    }

    // =====================================================
    // 文件删除
    // =====================================================

    @Override
    @Transactional
    public void delete(String fileId, String clientIp, String userAgent) {
        log.info("[文件删除] 开始: fileId={}", fileId);

        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        FileMetadata metadata = fileMetadataRepository.findByIdAndTenantId(fileId, tenantId)
                .orElseThrow(() -> new RuntimeException("文件不存在: " + fileId));

        try {
            // 软删除
            metadata.markDeleted(userId);
            fileMetadataRepository.save(metadata);
            
            logAccess(fileId, metadata.getOriginalName(), AccessType.DELETE,
                    clientIp, userAgent, true, null);
            
            recordMetric("storage.delete.count", 1,
                    Map.of("business_type", metadata.getBusinessType().getCode()));
            
            log.info("[文件删除] 成功: fileId={}", fileId);

        } catch (Exception e) {
            log.error("[文件删除] 失败: fileId={}", fileId, e);
            logAccess(fileId, metadata.getOriginalName(), AccessType.DELETE,
                    clientIp, userAgent, false, e.getMessage());
            // [R10 Fix] Use domain-specific StorageOperationException instead of RuntimeException
            throw new StorageOperationException(
                "File deletion failed: " + e.getMessage(),
                StorageOperationException.Operation.DELETE, fileId, e);
        }
    }

    @Override
    @Transactional
    public void batchDelete(List<String> fileIds, String clientIp, String userAgent) {
        for (String fileId : fileIds) {
            try {
                delete(fileId, clientIp, userAgent);
            } catch (Exception e) {
                log.error("批量删除失败，跳过: fileId={}", fileId, e);
            }
        }
    }

    // =====================================================
    // 访问日志
    // =====================================================

    @Override
    public List<FileAccessLogDTO> getAccessLogs(String fileId, int page, int size) {
        String tenantId = getCurrentTenantId();
        PageRequest pageable = PageRequest.of(page, size);
        
        return fileAccessLogRepository.findByFileId(fileId, tenantId, pageable)
                .getContent()
                .stream()
                .map(log -> FileAccessLogDTO.builder()
                        .id(log.getId())
                        .fileId(log.getFileId())
                        .fileName(log.getFileName())
                        .accessType(log.getAccessType())
                        .operatorId(log.getOperatorId())
                        .clientIp(log.getClientIp())
                        .userAgent(log.getUserAgent())
                        .accessTime(log.getAccessTime())
                        .result(log.getResult())
                        .failureReason(log.getFailureReason())
                        .tenantId(log.getTenantId())
                        .build())
                .collect(Collectors.toList());
    }
}
