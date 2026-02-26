package com.shinwa.app.storage.controller;

import com.shinwa.app.storage.dto.*;
import com.shinwa.app.storage.enums.BusinessType;
import com.shinwa.app.storage.service.FileStorageService;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
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
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "File Uploads", description = "文件上传 API")
public class FileUploadController {

    private final FileStorageService fileStorageService;

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

        } catch (Exception e) {
            log.error("[文件上传] 处理失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
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
