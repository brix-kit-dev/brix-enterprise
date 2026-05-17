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
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 文件上传控制器
 * 
 * <p>提供文件上传相关的REST API。
 * 
 * <h3>API端点</h3>
 * <ul>
 *   <li>POST /api/storage/upload - 上传单个文件</li>
 *   <li>POST /api/storage/upload/batch - 批量上传文件</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "File Uploads", description = "文件上传 API")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @Value("${storage.max-file-size:10485760}")
    private long maxFileSize;

    @Value("${storage.allowed-extensions:pdf,jpg,jpeg,png,doc,docx,xls,xlsx}")
    private String allowedExtensions;

    /**
     * 上传单个文件
     *
     * @param file 上传的文件
     * @param businessType 业务类型
     * @param entityId 关联实体ID（可选）
     * @param remark 备注（可选）
     * @param request HTTP请求
     * @return 上传结果
     */
    @Operation(summary = "上传单个文件", description = "上传单个文件到存储服务")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "上传成功",
                    content = @Content(schema = @Schema(implementation = UploadResponse.class))),
            @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content),
            @ApiResponse(responseCode = "500", description = "上传失败", content = @Content)
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(
            @Parameter(description = "上传的文件", required = true) @RequestParam("file") MultipartFile file,
            @Parameter(description = "业务类型", required = true) @RequestParam("businessType") BusinessType businessType,
            @Parameter(description = "关联实体ID") @RequestParam(value = "entityId", required = false) String entityId,
            @Parameter(description = "备注信息") @RequestParam(value = "remark", required = false) String remark,
            HttpServletRequest request) {
        
        log.info("[文件上传] 收到请求: fileName={}, size={}, businessType={}",
                file.getOriginalFilename(), file.getSize(), businessType);

        try {
            validateFile(file);

            UploadRequest uploadRequest = UploadRequest.builder()
                    .businessType(businessType)
                    .entityId(entityId)
                    .remark(remark)
                    .build();

            UploadResponse response = fileStorageService.upload(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    uploadRequest,
                    getClientIp(request),
                    request.getHeader("User-Agent"));

            return ResponseEntity.ok(response);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("[文件上传] 处理失败: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "文件上传失败", e);
        }
    }

    /**
     * 批量上传文件
     *
     * @param files 上传的文件列表
     * @param businessType 业务类型
     * @param entityId 关联实体ID（可选）
     * @param request HTTP请求
     * @return 上传结果列表
     */
    @Operation(summary = "批量上传文件", description = "批量上传多个文件到存储服务")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "上传成功",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UploadResponse.class)))),
            @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content),
            @ApiResponse(responseCode = "500", description = "上传失败", content = @Content)
    })
    @PostMapping(value = "/upload/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<UploadResponse>> batchUpload(
            @Parameter(description = "上传的文件列表", required = true) @RequestParam("files") List<MultipartFile> files,
            @Parameter(description = "业务类型", required = true) @RequestParam("businessType") BusinessType businessType,
            @Parameter(description = "关联实体ID") @RequestParam(value = "entityId", required = false) String entityId,
            HttpServletRequest request) {
        
        log.info("[批量上传] 收到请求: fileCount={}, businessType={}", files.size(), businessType);

        List<UploadResponse> results = files.stream()
                .map(file -> {
                    try {
                        validateFile(file);

                        UploadRequest uploadRequest = UploadRequest.builder()
                                .businessType(businessType)
                                .entityId(entityId)
                                .build();

                        return fileStorageService.upload(
                                file.getInputStream(),
                                file.getOriginalFilename(),
                                file.getContentType(),
                                file.getSize(),
                                uploadRequest,
                                getClientIp(request),
                                request.getHeader("User-Agent"));
                    } catch (Exception e) {
                        log.error("[批量上传] 单文件失败: fileName={}", file.getOriginalFilename(), e);
                        return UploadResponse.builder()
                                .originalName(file.getOriginalFilename())
                                .build();
                    }
                })
                .toList();

        return ResponseEntity.ok(results);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "文件不能为空");
        }
        if (file.getSize() > maxFileSize) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "文件大小超过限制");
        }
        String extension = getExtension(file.getOriginalFilename());
        boolean allowed = Arrays.stream(allowedExtensions.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .anyMatch(extension::equals);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不支持的文件类型: " + extension);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int index = fileName.lastIndexOf('.');
        return index >= 0 && index < fileName.length() - 1
                ? fileName.substring(index + 1).toLowerCase(Locale.ROOT)
                : "";
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
        // 多级代理时取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
