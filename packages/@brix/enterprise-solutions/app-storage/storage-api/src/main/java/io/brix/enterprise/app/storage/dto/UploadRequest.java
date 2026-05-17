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
package io.brix.enterprise.app.storage.dto;

import io.brix.enterprise.app.storage.enums.BusinessType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传请求DTO
 * 
 * <p>文件上传时的元数据参数，与MultipartFile一起提交。
 * 实际文件内容通过multipart/form-data方式传输。
 * 
 * <h3>上传流程</h3>
 * <ol>
 *   <li>客户端选择文件</li>
 *   <li>填写业务类型和关联实体ID</li>
 *   <li>通过multipart/form-data上传</li>
 *   <li>服务端校验文件类型和大小</li>
 *   <li>存储文件并保存元数据</li>
 *   <li>返回FileMetadataDTO</li>
 * </ol>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadRequest {

    /**
     * 业务类型
     * 决定文件的存储路径和访问权限
     */
    @NotNull(message = "业务类型不能为空")
    private BusinessType businessType;

    /**
     * 关联实体ID
     * 如：案件ID、订单ID、用户ID等
     * 用于文件的业务关联和按实体查询
     */
    @Size(max = 64, message = "关联实体ID长度不能超过64字符")
    private String entityId;

    /**
     * 文件备注说明
     */
    @Size(max = 500, message = "备注说明长度不能超过500字符")
    private String remark;

    /**
     * 是否覆盖同名文件
     * 默认false，不覆盖
     */
    @Builder.Default
    private Boolean overwrite = false;
}
