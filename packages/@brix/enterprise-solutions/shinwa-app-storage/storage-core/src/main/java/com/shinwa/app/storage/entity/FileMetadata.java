package com.shinwa.app.storage.entity;

import com.shinwa.app.storage.enums.BusinessType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 文件元数据实体
 * 
 * <p>存储文件的元数据信息，实际文件内容存储在对象存储中。
 * 通过 storagePath 关联实际文件位置。
 * 
 * <h3>存储路径规则</h3>
 * <pre>{bucket}/{tenant_id}/{business_type}/{entity_id}/{file_id}</pre>
 * 
 * <h3>设计原则</h3>
 * <ul>
 *   <li>文件元数据与文件存储分离（元数据在数据库，文件在对象存储）</li>
 *   <li>支持按 tenant_id + business_type + entity_id 进行文件隔离</li>
 *   <li>软删除支持，便于恢复误删文件</li>
 *   <li>完整审计字段，追踪文件生命周期</li>
 * </ul>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "storage_file_metadata", indexes = {
    @Index(name = "idx_file_tenant", columnList = "tenant_id"),
    @Index(name = "idx_file_business", columnList = "tenant_id, business_type, entity_id"),
    @Index(name = "idx_file_uploader", columnList = "tenant_id, uploaded_by"),
    @Index(name = "idx_file_md5", columnList = "tenant_id, md5_hash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {

    /**
     * 文件唯一标识
     * UUID格式，32位无连字符
     */
    @Id
    @Column(name = "id", length = 36)
    private String id;

    /**
     * 租户ID
     * 实现多租户数据隔离
     */
    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    // =====================================================
    // 文件基本信息
    // =====================================================

    /**
     * 原始文件名
     * 用户上传时的文件名
     */
    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    /**
     * 存储路径
     * 文件在对象存储中的完整路径
     */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    /**
     * 文件大小（字节）
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME类型
     * 如：image/jpeg, application/pdf, text/plain
     */
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /**
     * 文件扩展名
     * 如：jpg, pdf, docx
     */
    @Column(name = "file_extension", length = 20)
    private String fileExtension;

    /**
     * 文件MD5哈希值
     * 用于文件完整性校验和去重
     */
    @Column(name = "md5_hash", length = 32)
    private String md5Hash;

    // =====================================================
    // 业务关联信息
    // =====================================================

    /**
     * 业务类型
     */
    @Column(name = "business_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private BusinessType businessType;

    /**
     * 关联实体ID
     * 如：案件ID、订单ID、用户ID等
     */
    @Column(name = "entity_id", length = 64)
    private String entityId;

    /**
     * 备注说明
     */
    @Column(name = "remark", length = 500)
    private String remark;

    // =====================================================
    // 审计字段
    // =====================================================

    /**
     * 上传人ID
     */
    @Column(name = "uploaded_by", nullable = false, length = 64)
    private String uploadedBy;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 是否已删除（软删除）
     */
    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    /**
     * 删除时间
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 删除操作人
     */
    @Column(name = "deleted_by", length = 64)
    private String deletedBy;

    // =====================================================
    // 生命周期回调
    // =====================================================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // 业务方法
    // =====================================================

    /**
     * 标记删除
     *
     * @param operatorId 操作人ID
     */
    public void markDeleted(String operatorId) {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = operatorId;
    }

    /**
     * 恢复删除
     */
    public void restore() {
        this.deleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
    }

    /**
     * 获取文件扩展名
     *
     * @param fileName 文件名
     * @return 扩展名（不含点号），如果没有扩展名返回空字符串
     */
    public static String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
}
