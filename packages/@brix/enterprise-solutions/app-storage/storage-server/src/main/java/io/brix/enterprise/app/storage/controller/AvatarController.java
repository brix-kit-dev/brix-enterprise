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
package io.brix.enterprise.app.storage.controller;

import io.brix.enterprise.app.storage.dto.*;
import io.brix.enterprise.app.storage.service.AvatarService;
import io.runtime.sdk.capability.AuthContextCapability;
import io.runtime.sdk.context.RuntimeContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 头像上传控制器
 * 
 * <p>提供用户头像的上传、获取、删除等REST API。
 * 支持 Pre-signed URL 直传模式（推荐）和服务端中转模式。
 * 
 * <h3>Pre-signed直传流程（推荐）</h3>
 * <pre>
 * 1. POST /api/v1/storage/avatar/presigned-url  → 获取上传凭证
 * 2. PUT {uploadUrl}                             → 客户端直传到对象存储
 * 3. POST /api/v1/storage/avatar/confirm        → 确认上传完成
 * </pre>
 * 
 * <h3>前端示例代码</h3>
 * <pre>
 * // 1. 客户端压缩图片（使用 browser-image-compression）
 * const compressedFile = await imageCompression(file, {
 *   maxSizeMB: 0.2,
 *   maxWidthOrHeight: 512,
 *   fileType: 'image/webp'
 * });
 * 
 * // 2. 获取上传凭证
 * const { uploadUrl, storagePath } = await fetch('/api/v1/storage/avatar/presigned-url', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     userId: currentUser.id,
 *     contentType: 'image/webp',
 *     fileSize: compressedFile.size
 *   })
 * }).then(r => r.json());
 * 
 * // 3. 直传到对象存储
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'image/webp' },
 *   body: compressedFile
 * });
 * 
 * // 4. 确认上传
 * const avatar = await fetch('/api/v1/storage/avatar/confirm', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ userId: currentUser.id, storagePath })
 * }).then(r => r.json());
 * </pre>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@RestController
@RequestMapping("/api/v1/storage/avatar")
@Tag(name = "Avatars", description = "头像管理 API")
public class AvatarController {

    private final RuntimeContext context;
    private final AvatarService avatarService;

    public AvatarController(RuntimeContext context, AvatarService avatarService) {
        this.context = context;
        this.avatarService = avatarService;
    }

    /**
     * 生成头像上传Pre-signed URL
     * 
     * <p>客户端获取签名URL后，直接上传到对象存储，减轻服务器压力。
     * 
     * @param request 上传请求
     * @return Pre-signed上传响应
     */
    @Operation(summary = "生成头像上传Pre-signed URL", description = "客户端获取签名URL后，直接上传到对象存储，减轻服务器压力")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功生成上传URL",
                    content = @Content(schema = @Schema(implementation = PresignedUploadResponse.class))),
            @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content),
            @ApiResponse(responseCode = "401", description = "未授权", content = @Content)
    })
    @PostMapping("/presigned-url")
    public ResponseEntity<PresignedUploadResponse> generatePresignedUrl(
            @Valid @RequestBody AvatarUploadRequest request) {
        String tenantId = getCurrentTenantId();
        PresignedUploadResponse response = avatarService.generatePresignedUploadUrl(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 确认头像上传
     * 
     * <p>客户端完成直传后调用此接口，服务端将：
     * <ol>
     *   <li>验证文件已上传到对象存储</li>
     *   <li>生成多尺寸缩略图</li>
     *   <li>更新用户头像URL</li>
     *   <li>发布AvatarUploadedEvent事件</li>
     * </ol>
     * 
     * @param request 确认请求
     * @return 头像响应
     */
    @Operation(summary = "确认头像上传", description = "客户端完成直传后调用此接口，确认上传完成")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "确认成功",
                    content = @Content(schema = @Schema(implementation = AvatarResponse.class))),
            @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content)
    })
    @PostMapping("/confirm")
    public ResponseEntity<AvatarResponse> confirmUpload(
            @Valid @RequestBody AvatarConfirmRequest request) {
        String tenantId = getCurrentTenantId();
        AvatarResponse response = avatarService.confirmUpload(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户头像
     * 
     * @param userId 用户ID
     * @return 头像响应
     */
    @Operation(summary = "获取用户头像", description = "根据用户ID获取头像信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功获取头像",
                    content = @Content(schema = @Schema(implementation = AvatarResponse.class))),
            @ApiResponse(responseCode = "404", description = "用户或头像不存在", content = @Content)
    })
    @GetMapping("/{userId}")
    public ResponseEntity<AvatarResponse> getAvatar(
            @Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        String tenantId = getCurrentTenantId();
        AvatarResponse response = avatarService.getAvatar(tenantId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取当前用户头像
     * 
     * @return 头像响应
     */
    @Operation(summary = "获取当前用户头像", description = "获取当前登录用户的头像信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功获取头像",
                    content = @Content(schema = @Schema(implementation = AvatarResponse.class))),
            @ApiResponse(responseCode = "401", description = "未授权", content = @Content)
    })
    @GetMapping("/me")
    public ResponseEntity<AvatarResponse> getMyAvatar() {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        AvatarResponse response = avatarService.getAvatar(tenantId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 删除用户头像
     * 
     * @param userId 用户ID
     * @return 空响应
     */
    @Operation(summary = "删除用户头像", description = "删除指定用户的头像")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "删除成功"),
            @ApiResponse(responseCode = "404", description = "用户或头像不存在", content = @Content)
    })
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteAvatar(
            @Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        String tenantId = getCurrentTenantId();
        avatarService.deleteAvatar(tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 获取默认头像
     * 
     * @return 默认头像响应
     */
    @Operation(summary = "获取默认头像", description = "获取系统默认头像信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功获取默认头像",
                    content = @Content(schema = @Schema(implementation = AvatarResponse.class)))
    })
    @GetMapping("/default")
    public ResponseEntity<AvatarResponse> getDefaultAvatar() {
        String tenantId = getCurrentTenantId();
        AvatarResponse response = avatarService.getDefaultAvatar(tenantId);
        return ResponseEntity.ok(response);
    }

    // ========== 辅助方法 ==========

    private String getCurrentTenantId() {
        AuthContextCapability authContext = context.getAuthContext();
        String tenantId = authContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("未找到租户上下文");
        }
        return tenantId;
    }

    private String getCurrentUserId() {
        var principal = context.getAuthContext().getCurrentPrincipal();
        if (principal == null) {
            throw new IllegalStateException("用户未登录");
        }
        return principal.getName();
    }
}
