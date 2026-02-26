/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.controller;

import com.shinwa.app.booking.dto.BookableResourceDTO;
import com.shinwa.app.booking.entity.BookableResource;
import com.shinwa.app.booking.enums.ResourceType;
import com.shinwa.app.booking.repository.BookableResourceRepository;
import io.runtime.sdk.capability.TenantAwarePrincipal;
import io.runtime.sdk.context.RuntimeContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 可预约资源管理 REST 控制器
 * 
 * <p>提供可预约资源的管理接口，用于配置和查询可预约的场地、设备、人员等</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Tag(name = "BookableResources", description = "可预约资源管理 API - 提供可预约资源的配置和查询")
@RestController
@RequestMapping("/api/v1/bookable-resources")
public class BookableResourceController {
    
    /**
     * 运行时上下文
     */
    private final RuntimeContext runtimeContext;
    
    /**
     * 资源仓库
     */
    private final BookableResourceRepository resourceRepository;
    
    /**
     * 构造函数注入依赖
     *
     * @param runtimeContext     运行时上下文
     * @param resourceRepository 资源仓库
     */
    public BookableResourceController(RuntimeContext runtimeContext,
                                        BookableResourceRepository resourceRepository) {
        this.runtimeContext = runtimeContext;
        this.resourceRepository = resourceRepository;
    }
    
    // ==================== 查询接口 ====================
    
    /**
     * 获取资源列表
     *
     * @param resourceType 可选，按资源类型筛选
     * @param enabled      可选，按启用状态筛选
     * @return 资源列表
     */
    @Operation(summary = "查询资源列表", description = "获取可预约资源列表，可按类型和状态筛选")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = BookableResourceDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<BookableResourceDTO>> list(
            @Parameter(description = "资源类型", example = "ROOM")
            @RequestParam(required = false) String resourceType,
            @Parameter(description = "是否启用", example = "true")
            @RequestParam(required = false) Boolean enabled) {
        Long tenantId = getCurrentTenantId();
        
        List<BookableResource> resources;
        if (resourceType != null && enabled != null) {
            ResourceType type = ResourceType.valueOf(resourceType);
            resources = resourceRepository.findByResourceTypeAndTenantIdAndEnabled(type, tenantId, enabled);
        } else if (enabled != null) {
            resources = resourceRepository.findByTenantIdAndEnabled(tenantId, enabled);
        } else {
            resources = resourceRepository.findByTenantIdAndEnabled(tenantId, true);
        }
        
        List<BookableResourceDTO> dtos = resources.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * 根据ID获取资源详情
     *
     * @param id 资源ID
     * @return 资源详情
     */
    @Operation(summary = "查询资源详情", description = "根据ID获取可预约资源详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = BookableResourceDTO.class))),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<BookableResourceDTO> getById(
            @Parameter(description = "资源ID", required = true, example = "100")
            @PathVariable Long id) {
        Long tenantId = getCurrentTenantId();
        
        return resourceRepository.findByIdAndTenantId(id, tenantId)
                .map(resource -> ResponseEntity.ok(toDTO(resource)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 根据资源类型和外部资源ID获取
     *
     * @param resourceType       资源类型
     * @param externalResourceId 外部资源ID
     * @return 资源详情
     */
    @Operation(summary = "根据外部ID查询资源", description = "根据资源类型和外部系统资源ID获取可预约资源")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = BookableResourceDTO.class))),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @GetMapping("/by-external")
    public ResponseEntity<BookableResourceDTO> getByExternal(
            @Parameter(description = "资源类型", required = true, example = "ROOM")
            @RequestParam String resourceType,
            @Parameter(description = "外部系统资源ID", required = true, example = "1001")
            @RequestParam Long externalResourceId) {
        Long tenantId = getCurrentTenantId();
        ResourceType type = ResourceType.valueOf(resourceType);
        
        return resourceRepository.findByResourceTypeAndExternalResourceIdAndTenantId(type, externalResourceId, tenantId)
                .map(resource -> ResponseEntity.ok(toDTO(resource)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // ==================== 写操作接口 ====================
    
    /**
     * 创建可预约资源
     *
     * @param request 创建请求
     * @return 创建的资源
     */
    @Operation(summary = "创建资源", description = "创建新的可预约资源")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(schema = @Schema(implementation = BookableResourceDTO.class))),
        @ApiResponse(responseCode = "409", description = "资源已存在", content = @Content)
    })
    @PostMapping
    public ResponseEntity<BookableResourceDTO> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建资源请求", required = true,
                content = @Content(schema = @Schema(implementation = BookableResourceDTO.class)))
            @RequestBody BookableResourceDTO request) {
        Long tenantId = getCurrentTenantId();
        Long currentUserId = getCurrentUserId();
        
        // 检查是否已存在相同的外部资源映射
        if (resourceRepository.findByResourceTypeAndExternalResourceIdAndTenantId(
                request.getResourceType(), request.getExternalResourceId(), tenantId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        
        BookableResource resource = new BookableResource();
        resource.setResourceType(request.getResourceType());
        resource.setExternalResourceId(request.getExternalResourceId());
        resource.setResourceName(request.getResourceName());
        resource.setDescription(request.getDescription());
        resource.setMaxConcurrent(request.getMaxConcurrent() != null ? request.getMaxConcurrent() : 1);
        resource.setAdvanceDays(request.getAdvanceDays() != null ? request.getAdvanceDays() : 30);
        resource.setCancelDeadlineHours(request.getCancelDeadlineHours() != null ? request.getCancelDeadlineHours() : 2);
        resource.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        resource.setTenantId(tenantId);
        resource.setCreatedBy(currentUserId);
        
        resource = resourceRepository.save(resource);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(resource));
    }
    
    /**
     * 更新可预约资源
     *
     * @param id      资源ID
     * @param request 更新请求
     * @return 更新后的资源
     */
    @Operation(summary = "更新资源", description = "更新可预约资源信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = BookableResourceDTO.class))),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<BookableResourceDTO> update(
            @Parameter(description = "资源ID", required = true, example = "100")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "更新资源请求", required = true,
                content = @Content(schema = @Schema(implementation = BookableResourceDTO.class)))
            @RequestBody BookableResourceDTO request) {
        Long tenantId = getCurrentTenantId();
        
        return resourceRepository.findByIdAndTenantId(id, tenantId)
                .map(resource -> {
                    resource.setResourceName(request.getResourceName());
                    resource.setDescription(request.getDescription());
                    resource.setMaxConcurrent(request.getMaxConcurrent());
                    resource.setAdvanceDays(request.getAdvanceDays());
                    resource.setCancelDeadlineHours(request.getCancelDeadlineHours());
                    resource.setEnabled(request.getEnabled());
                    
                    resource = resourceRepository.save(resource);
                    return ResponseEntity.ok(toDTO(resource));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 启用资源
     *
     * @param id 资源ID
     * @return 无内容
     */
    @Operation(summary = "启用资源", description = "启用指定的可预约资源")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "启用成功"),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @PostMapping("/{id}/enable")
    public ResponseEntity<Void> enable(
            @Parameter(description = "资源ID", required = true, example = "100")
            @PathVariable Long id) {
        Long tenantId = getCurrentTenantId();
        
        resourceRepository.findByIdAndTenantId(id, tenantId)
                .ifPresent(resource -> {
                    resource.setEnabled(true);
                    resourceRepository.save(resource);
                });
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 禁用资源
     *
     * @param id 资源ID
     * @return 无内容
     */
    @Operation(summary = "禁用资源", description = "禁用指定的可预约资源")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "禁用成功"),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @PostMapping("/{id}/disable")
    public ResponseEntity<Void> disable(
            @Parameter(description = "资源ID", required = true, example = "100")
            @PathVariable Long id) {
        Long tenantId = getCurrentTenantId();
        
        resourceRepository.findByIdAndTenantId(id, tenantId)
                .ifPresent(resource -> {
                    resource.setEnabled(false);
                    resourceRepository.save(resource);
                });
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 删除资源（物理删除）
     *
     * @param id 资源ID
     * @return 无内容
     */
    @Operation(summary = "删除资源", description = "物理删除指定的可预约资源")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "资源不存在", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "资源ID", required = true, example = "100")
            @PathVariable Long id) {
        Long tenantId = getCurrentTenantId();
        
        resourceRepository.findByIdAndTenantId(id, tenantId)
                .ifPresent(resourceRepository::delete);
        
        return ResponseEntity.noContent().build();
    }
    
    // ==================== 私有方法 ====================
    
    /**
     * 获取当前租户ID
     * <p>通过 RuntimeContext 的 AuthContext 能力获取</p>
     *
     * @return 租户ID
     */
    private Long getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return tenantId != null ? Long.parseLong(tenantId) : null;
    }
    
    /**
     * 获取当前用户ID
     * <p>通过 RuntimeContext 的 AuthContext 能力获取</p>
     *
     * @return 当前用户ID
     */
    private Long getCurrentUserId() {
        var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        if (principal instanceof TenantAwarePrincipal tenantPrincipal) {
            String userId = tenantPrincipal.getUserId();
            return userId != null ? Long.parseLong(userId) : null;
        }
        return principal != null && principal.getName() != null 
                ? Long.parseLong(principal.getName()) 
                : null;
    }
    
    /**
     * 实体转 DTO
     *
     * @param resource 资源实体
     * @return 资源DTO
     */
    private BookableResourceDTO toDTO(BookableResource resource) {
        BookableResourceDTO dto = new BookableResourceDTO();
        dto.setId(resource.getId());
        dto.setResourceType(resource.getResourceType());
        dto.setExternalResourceId(resource.getExternalResourceId());
        dto.setResourceName(resource.getResourceName());
        dto.setDescription(resource.getDescription());
        dto.setMaxConcurrent(resource.getMaxConcurrent());
        dto.setAdvanceDays(resource.getAdvanceDays());
        dto.setCancelDeadlineHours(resource.getCancelDeadlineHours());
        dto.setEnabled(resource.getEnabled());
        dto.setTenantId(resource.getTenantId());
        return dto;
    }
}
