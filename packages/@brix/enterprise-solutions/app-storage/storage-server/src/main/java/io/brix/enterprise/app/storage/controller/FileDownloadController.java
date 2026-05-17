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

import io.brix.enterprise.app.storage.dto.FileMetadataDTO;
import io.brix.enterprise.app.storage.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 文件下载控制器
 * 
 * <p>提供文件下载和预览相关的REST API。
 * 
 * <h3>API端点</h3>
 * <ul>
 *   <li>GET /api/storage/download/{fileId} - 下载文件</li>
 *   <li>GET /api/storage/preview/{fileId} - 获取预览URL</li>
 *   <li>GET /api/storage/preview/{fileId}/redirect - 重定向到预览URL</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "File Downloads", description = "文件下载 API")
public class FileDownloadController {

    private final FileStorageService fileStorageService;

    /**
     * 下载文件
     *
     * <p>将文件内容以流式方式写入 HTTP 响应。
     *
     * <p>资源管理说明（v3.2 修复）：
     * 使用 try-with-resources 确保 InputStream 在任何情况下都能正确关闭，
     * 包括正常完成、发生异常或提前返回等情况。这避免了以下潜在问题：
     * <ul>
     *   <li>文件句柄泄漏：未关闭的流会占用操作系统文件描述符</li>
     *   <li>内存泄漏：流相关的缓冲区无法被 GC 回收</li>
     *   <li>存储服务连接泄漏：对于远程存储（如 S3），可能导致连接池耗尽</li>
     * </ul>
     *
     * @param fileId 文件ID
     * @param request HTTP请求
     * @param response HTTP响应
     */
    @Operation(summary = "下载文件", description = "以流式方式下载文件内容")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "文件下载成功"),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content),
            @ApiResponse(responseCode = "500", description = "下载失败", content = @Content)
    })
    @GetMapping("/download/{fileId}")
    public void download(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        log.info("[文件下载] 收到请求: fileId={}", fileId);

        try {
            // 获取文件元数据
            FileMetadataDTO metadata = fileStorageService.getById(fileId);
            if (metadata == null) {
                log.warn("[文件下载] 文件不存在: fileId={}", fileId);
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            // 设置响应头（在获取流之前设置，避免异常时响应头不完整）
            String encodedFileName = URLEncoder.encode(metadata.getOriginalName(), StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");
            
            response.setContentType(metadata.getContentType());
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName);
            response.setContentLengthLong(metadata.getFileSize());

            /*
             * 使用 try-with-resources 确保流正确关闭
             * 
             * 资源泄漏修复（v3.2）：
             * - 原实现：inputStream.close() 在 try 块内，异常时不会执行
             * - 新实现：使用 try-with-resources，保证在以下情况下流都会关闭：
             *   1. 正常完成下载
             *   2. 下载过程中发生 IOException
             *   3. 客户端断开连接
             *   4. 服务器端其他异常
             */
            try (InputStream inputStream = fileStorageService.download(
                    fileId, getClientIp(request), request.getHeader("User-Agent"))) {
                // 将文件流复制到响应输出流
                StreamUtils.copy(inputStream, response.getOutputStream());
            }
            
            log.info("[文件下载] 完成: fileId={}, fileName={}, size={}", 
                    fileId, metadata.getOriginalName(), metadata.getFileSize());

        } catch (Exception e) {
            log.error("[文件下载] 失败: fileId={}", fileId, e);
            // 仅在响应未提交时设置错误状态
            if (!response.isCommitted()) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    /**
     * 获取文件预览URL
     *
     * @param fileId 文件ID
     * @param request HTTP请求
     * @return 预览URL
     */
    @Operation(summary = "获取文件预览URL", description = "获取文件的临时预览URL，有效期5分钟")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功获取预览URL"),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content)
    })
    @GetMapping("/preview/{fileId}")
    public ResponseEntity<Map<String, String>> getPreviewUrl(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId,
            HttpServletRequest request) {
        
        log.info("[文件预览] 获取URL: fileId={}", fileId);

        String url = fileStorageService.getPreviewUrl(
                fileId, getClientIp(request), request.getHeader("User-Agent"));
        
        return ResponseEntity.ok(Map.of(
                "fileId", fileId,
                "previewUrl", url,
                "expiresIn", "300"  // 5分钟
        ));
    }

    /**
     * 重定向到预览URL
     *
     * @param fileId 文件ID
     * @param request HTTP请求
     * @param response HTTP响应
     */
    @Operation(summary = "重定向到预览URL", description = "直接重定向到文件预览URL")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "302", description = "重定向到预览URL"),
            @ApiResponse(responseCode = "404", description = "文件不存在", content = @Content),
            @ApiResponse(responseCode = "500", description = "重定向失败", content = @Content)
    })
    @GetMapping("/preview/{fileId}/redirect")
    public void redirectToPreview(
            @Parameter(description = "文件ID", required = true) @PathVariable String fileId,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        log.info("[文件预览] 重定向: fileId={}", fileId);

        try {
            String url = fileStorageService.getPreviewUrl(
                    fileId, getClientIp(request), request.getHeader("User-Agent"));
            response.sendRedirect(url);
        } catch (Exception e) {
            log.error("[文件预览] 重定向失败: fileId={}", fileId, e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
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
