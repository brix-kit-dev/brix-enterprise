package com.shinwa.app.contracts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 模板版本实体
 *
 * <p>记录合同模板的版本信息，支持版本迭代和回滚。
 * 每个版本包含独立的模板文件和变量定义。
 *
 * <p>实体职责：
 * <ul>
 *   <li>存储版本号和文件信息</li>
 *   <li>管理变量定义列表</li>
 *   <li>记录版本变更说明</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "template_version", indexes = {
    @Index(name = "idx_version_template", columnList = "template_id"),
    @Index(name = "idx_version_number", columnList = "version_number")
})
@Getter
@Setter
@NoArgsConstructor
public class TemplateVersion {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的模板
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ContractTemplate template;

    /**
     * 版本号
     */
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    /**
     * 模板文件URL
     * <p>存储在文件中心的模板文件
     */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    /**
     * 文件类型
     * <p>如：PDF, DOCX, HTML
     */
    @Column(name = "file_type", length = 20)
    private String fileType;

    /**
     * 变量定义（JSON格式）
     * <p>存储变量的键名、类型、是否必填等信息
     */
    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables;

    /**
     * 变更说明
     */
    @Column(name = "change_log", length = 500)
    private String changeLog;

    /**
     * 发布人ID
     */
    @Column(name = "published_by", length = 64)
    private String publishedBy;

    /**
     * 发布时间
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 创建模板版本
     *
     * @param fileUrl     文件URL
     * @param fileType    文件类型
     * @param variables   变量定义JSON
     * @param changeLog   变更说明
     * @param publishedBy 发布人
     * @return 新建的版本实体
     */
    public static TemplateVersion create(String fileUrl, String fileType, String variables,
                                         String changeLog, String publishedBy) {
        TemplateVersion version = new TemplateVersion();
        version.fileUrl = fileUrl;
        version.fileType = fileType;
        version.variables = variables;
        version.changeLog = changeLog;
        version.publishedBy = publishedBy;
        version.publishedAt = LocalDateTime.now();
        version.createdAt = LocalDateTime.now();
        return version;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
