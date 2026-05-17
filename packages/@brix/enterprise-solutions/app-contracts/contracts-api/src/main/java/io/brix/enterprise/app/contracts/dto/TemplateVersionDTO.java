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
package io.brix.enterprise.app.contracts.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 模板版本数据传输对象
 *
 * <p>用于在API层传输模板版本信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>versionNumber - 版本号</li>
 *   <li>fileUrl - 模板文件URL</li>
 *   <li>variables - 变量定义列表</li>
 *   <li>changeLog - 变更说明</li>
 *   <li>publishedAt - 发布时间</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateVersionDTO {

    /**
     * 版本ID
     */
    private Long id;

    /**
     * 关联的模板ID
     */
    private Long templateId;

    /**
     * 版本号
     */
    private Integer versionNumber;

    /**
     * 模板文件URL
     * <p>存储在文件中心的模板文件
     */
    private String fileUrl;

    /**
     * 文件类型
     * <p>如：PDF, DOCX, HTML
     */
    private String fileType;

    /**
     * 变量定义列表
     * <p>模板中可替换的变量
     */
    private List<TemplateVariableDTO> variables;

    /**
     * 变更说明
     */
    private String changeLog;

    /**
     * 是否为当前版本
     */
    private Boolean isCurrent;

    /**
     * 发布人ID
     */
    private String publishedBy;

    /**
     * 发布时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime publishedAt;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
