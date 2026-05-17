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

import io.brix.enterprise.app.storage.dto.FileAccessLogDTO;
import io.brix.enterprise.app.storage.dto.FileMetadataDTO;
import io.brix.enterprise.app.storage.enums.BusinessType;
import io.brix.enterprise.app.storage.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 文件元数据控制器
 * 
 * <p>提供文件查询和管理相关的REST API。
 * 
 * <h3>API端点</h3>
 * <ul>
 *   <li>GET /api/storage/files - 分页查询文件列表</li>
 *   <li>GET /api/storage/files/{fileId} - 获取文件详情</li>
 *   <li>GET /api/storage/files/entity - 按实体查询文件</li>
 *   <li>DELETE /api/storage/files/{fileId} - 删除文件</li>
 *   <li>DELETE /api/storage/files/batch - 批量删除文件</li>
 *   <li>GET /api/storage/files/{fileId}/logs - 获取访问日志</li>
 *   <li>GET /api/storage/stats - 获取统计信息</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "File Metadata", description = "文件元数据 API")
public class FileMetadataController {

    private final FileStorageService fileStorageService;

    /**
     * 分页查询文件列表
     *
     * @param businessType 业务类型（可选）
     * @param keyword 搜索关键词（可选）
     * @param page 页码
     * @param size 每页大小
     * @return 文件列表
     */
    @Operation(summary = "分页查询文件列表", description = "根据条件分页查询文件元数据列表")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileMetadataDTO.class))))
    })
    @GetMapping("/files")
    public ResponseEntity<List<FileMetadataDTO>> listFiles(
            @Parameter(description = "业务类型") @RequestParam(value = "businessType", required = false) BusinessType businessType,
            @Parameter(description = "搜索关键词") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "页码，从0开始") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(value = "size", defaultValue = "20") int size) {
        
        log.info("[文件列表] 查询: businessType={}, keyword={}, page={}, size={}",
                businessType, keyword, page, size);

        List<FileMetadataDTO> files = fileStorageService.list(businessType, keyword, page, size);
        return ResponseEntity.ok(files);
    }

    /**
     * 获取文件详情
     *
     * @param fileId 文件ID
     * @return 文件元数据
     */
    @Operation(summary = "获取文件详情", description = "根据文件ID获取文件元数据详情")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功",
                    content = @Content(schema = @Schema(implementation = FileMetadataDTO.class))),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content)
    })
    @GetMapping("/files/{fileId}")
    public ResponseEntity<FileMetadataDTO> getFile(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId) {
        log.info("[文件详情] 查询: fileId={}", fileId);

        FileMetadataDTO file = fileStorageService.getById(fileId);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(file);
    }

    /**
     * 按实体查询文件列表
     *
     * @param businessType 业务类型
     * @param entityId 关联实体ID
     * @return 文件列表
     */
    @Operation(summary = "按实体查询文件列表", description = "根据业务类型和实体ID查询关联的文件列表")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileMetadataDTO.class))))
    })
    @GetMapping("/files/entity")
    public ResponseEntity<List<FileMetadataDTO>> listByEntity(
            @Parameter(description = "业务类型", required = true) @RequestParam("businessType") BusinessType businessType,
            @Parameter(description = "关联实体ID", required = true) @RequestParam("entityId") String entityId) {
        
        log.info("[按实体查询] businessType={}, entityId={}", businessType, entityId);

        List<FileMetadataDTO> files = fileStorageService.listByEntity(businessType, entityId);
        return ResponseEntity.ok(files);
    }

    /**
     * 删除文件
     *
     * @param fileId 文件ID
     * @param request HTTP请求
     * @return 操作结果
     */
    @Operation(summary = "删除文件", description = "根据文件ID删除文件")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content)
    })
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Map<String, String>> deleteFile(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId,
            HttpServletRequest request) {
        
        log.info("[文件删除] fileId={}", fileId);

        fileStorageService.delete(fileId, getClientIp(request), request.getHeader("User-Agent"));
        
        return ResponseEntity.ok(Map.of(
                "fileId", fileId,
                "message", "删除成功"
        ));
    }

    /**
     * 批量删除文件
     *
     * @param fileIds 文件ID列表
     * @param request HTTP请求
     * @return 操作结果
     */
    @Operation(summary = "批量删除文件", description = "根据文件ID列表批量删除文件")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "批量删除成功")
    })
    @DeleteMapping("/files/batch")
    public ResponseEntity<Map<String, Object>> batchDelete(
            @Parameter(description = "文件ID列表", required = true) @RequestBody List<String> fileIds,
            HttpServletRequest request) {
        
        log.info("[批量删除] fileIds={}", fileIds);

        fileStorageService.batchDelete(fileIds, getClientIp(request), request.getHeader("User-Agent"));
        
        return ResponseEntity.ok(Map.of(
                "deletedCount", fileIds.size(),
                "message", "批量删除成功"
        ));
    }

    /**
     * 获取文件访问日志
     *
     * @param fileId 文件ID
     * @param page 页码
     * @param size 每页大小
     * @return 访问日志列表
     */
    @Operation(summary = "获取文件访问日志", description = "分页查询指定文件的访问日志")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileAccessLogDTO.class)))),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content)
    })
    @GetMapping("/files/{fileId}/logs")
    public ResponseEntity<List<FileAccessLogDTO>> getAccessLogs(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId,
            @Parameter(description = "页码，从0开始") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(value = "size", defaultValue = "20") int size) {
        
        log.info("[访问日志] fileId={}, page={}, size={}", fileId, page, size);

        List<FileAccessLogDTO> logs = fileStorageService.getAccessLogs(fileId, page, size);
        return ResponseEntity.ok(logs);
    }

    /**
     * 获取统计信息
     *
     * @param businessType 业务类型（可选）
     * @return 统计信息
     */
    @Operation(summary = "获取统计信息", description = "获取文件存储统计信息，可按业务类型筛选")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功")
    })
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @Parameter(description = "业务类型") @RequestParam(value = "businessType", required = false) BusinessType businessType) {
        
        long totalCount = fileStorageService.count(businessType);
        
        return ResponseEntity.ok(Map.of(
                "totalCount", totalCount,
                "businessType", businessType != null ? businessType.name() : "ALL"
        ));
    }

    /**
     * 获取客户端IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
