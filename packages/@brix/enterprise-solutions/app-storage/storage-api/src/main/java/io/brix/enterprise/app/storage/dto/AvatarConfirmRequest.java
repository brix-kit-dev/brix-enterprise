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

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 头像上传确认请求DTO
 * 
 * <p>客户端完成Pre-signed直传后，调用确认接口通知服务端。
 * 服务端将：
 * <ol>
 *   <li>验证文件是否已上传到对象存储</li>
 *   <li>生成多尺寸缩略图（48x48, 128x128, 256x256）</li>
 *   <li>更新用户头像URL</li>
 *   <li>发布AvatarUploadedEvent事件</li>
 * </ol>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarConfirmRequest {

    /**
     * 用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;

    /**
     * 存储路径
     * 由 presigned-url 接口返回
     */
    @NotBlank(message = "存储路径不能为空")
    private String storagePath;

    /**
     * 客户端计算的文件MD5
     * 用于完整性校验
     */
    private String md5;
}
