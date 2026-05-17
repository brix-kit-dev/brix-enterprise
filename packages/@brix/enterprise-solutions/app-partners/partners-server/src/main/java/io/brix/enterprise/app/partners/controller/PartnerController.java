/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴管理控制器
 */
package io.brix.enterprise.app.partners.controller;

import io.brix.enterprise.app.partners.dto.CreatePartnerRequest;
import io.brix.enterprise.app.partners.dto.PartnerDTO;
import io.brix.enterprise.app.partners.dto.UpdatePartnerRequest;
import io.brix.enterprise.app.partners.enums.PartnerStatus;
import io.brix.enterprise.app.partners.enums.PartnerType;
import io.brix.enterprise.app.partners.service.PartnerService;
import io.runtime.sdk.capability.AuthContextCapability;
import io.runtime.sdk.context.RuntimeContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 合作伙伴管理控制器
 *
 * <p>提供合作伙伴管理的 RESTful API 接口。</p>
 *
 * <h3>API 概览</h3>
 * <ul>
 *   <li>POST /api/v1/partners - 创建合作伙伴</li>
 *   <li>PUT /api/v1/partners/{id} - 更新合作伙伴</li>
 *   <li>GET /api/v1/partners/{id} - 获取合作伙伴详情</li>
 *   <li>GET /api/v1/partners - 查询合作伙伴列表</li>
 *   <li>DELETE /api/v1/partners/{id} - 删除合作伙伴</li>
 *   <li>POST /api/v1/partners/{id}/activate - 激活合作伙伴</li>
 *   <li>POST /api/v1/partners/{id}/suspend - 暂停合作伙伴</li>
 *   <li>POST /api/v1/partners/{id}/resume - 恢复合作伙伴</li>
 *   <li>POST /api/v1/partners/{id}/terminate - 终止合作伙伴</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "Partners", description = "合作伙伴管理 API")
@RestController
@RequestMapping("/api/v1/partners")
public class PartnerController {

    private final PartnerService partnerService;
    private final RuntimeContext runtimeContext;

    /**
     * 构造函数
     *
     * @param partnerService 合作伙伴服务
     * @param runtimeContext 运行时上下文
     */
    public PartnerController(PartnerService partnerService, RuntimeContext runtimeContext) {
        this.partnerService = partnerService;
        this.runtimeContext = runtimeContext;
    }

    /**
     * 获取当前租户ID
     *
     * <p>通过 RuntimeContext 的 AuthCapability 能力契约获取。
     * 生产环境从 JWT 令牌解析，开发环境由 FallbackAuth 提供默认值。</p>
     *
     * @return 当前租户ID
     * @throws IllegalStateException 如果未找到租户上下文
     */
    private String getCurrentTenantId() {
        AuthContextCapability authContext = runtimeContext.getAuthContext();
        String tenantId = authContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("未找到租户上下文");
        }
        return tenantId;
    }

    // ==================== CRUD 接口 ====================

    /**
     * 创建合作伙伴
     *
     * @param request 创建请求
     * @return 创建后的合作伙伴信息
     */
    @Operation(summary = "创建合作伙伴", description = "创建一个新的合作伙伴")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content)
    })
    @PostMapping
    public ResponseEntity<PartnerDTO> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建合作伙伴请求", required = true,
                content = @Content(schema = @Schema(implementation = CreatePartnerRequest.class)))
            @Valid @RequestBody CreatePartnerRequest request) {
        String tenantId = getCurrentTenantId();
        PartnerDTO result = partnerService.create(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * 更新合作伙伴
     *
     * @param id      合作伙伴ID
     * @param request 更新请求
     * @return 更新后的合作伙伴信息
     */
    @Operation(summary = "更新合作伙伴", description = "更新指定合作伙伴的信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<PartnerDTO> update(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "更新合作伙伴请求", required = true,
                content = @Content(schema = @Schema(implementation = UpdatePartnerRequest.class)))
            @Valid @RequestBody UpdatePartnerRequest request) {
        String tenantId = getCurrentTenantId();
        PartnerDTO result = partnerService.update(tenantId, id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取合作伙伴详情
     *
     * @param id 合作伙伴ID
     * @return 合作伙伴信息
     */
    @Operation(summary = "获取合作伙伴详情", description = "根据ID获取合作伙伴详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<PartnerDTO> getById(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id) {
        String tenantId = getCurrentTenantId();
        return partnerService.getById(tenantId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 根据编码获取合作伙伴
     *
     * @param code 合作伙伴编码
     * @return 合作伙伴信息
     */
    @Operation(summary = "根据编码获取合作伙伴", description = "根据合作伙伴编码获取详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content)
    })
    @GetMapping("/code/{code}")
    public ResponseEntity<PartnerDTO> getByCode(
            @Parameter(description = "合作伙伴编码", required = true, example = "PARTNER001")
            @PathVariable String code) {
        String tenantId = getCurrentTenantId();
        return partnerService.getByCode(tenantId, code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 查询合作伙伴列表
     *
     * @param type   合作伙伴类型（可选）
     * @param status 合作伙伴状态（可选）
     * @return 合作伙伴列表
     */
    @Operation(summary = "查询合作伙伴列表", description = "获取合作伙伴列表，可按类型和状态筛选")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PartnerDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<PartnerDTO>> list(
            @Parameter(description = "合作伙伴类型筛选", example = "DISTRIBUTOR")
            @RequestParam(required = false) PartnerType type,
            @Parameter(description = "合作伙伴状态筛选", example = "ACTIVE")
            @RequestParam(required = false) PartnerStatus status) {
        String tenantId = getCurrentTenantId();

        List<PartnerDTO> result;
        if (type != null) {
            result = partnerService.listByType(tenantId, type);
        } else if (status != null) {
            result = partnerService.listByStatus(tenantId, status);
        } else {
            result = partnerService.listByTenant(tenantId);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * 查询可用的合作伙伴
     *
     * @param type 合作伙伴类型（可选）
     * @return 可用的合作伙伴列表
     */
    @Operation(summary = "查询可用的合作伙伴", description = "获取状态为激活的合作伙伴列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PartnerDTO.class))))
    })
    @GetMapping("/available")
    public ResponseEntity<List<PartnerDTO>> listAvailable(
            @Parameter(description = "合作伙伴类型筛选", example = "DISTRIBUTOR")
            @RequestParam(required = false) PartnerType type) {
        String tenantId = getCurrentTenantId();
        List<PartnerDTO> result = partnerService.listAvailable(tenantId, type);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除合作伙伴
     *
     * @param id 合作伙伴ID
     * @return 无内容
     */
    @Operation(summary = "删除合作伙伴", description = "删除指定的合作伙伴")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id) {
        String tenantId = getCurrentTenantId();
        partnerService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    // ==================== 状态变更接口 ====================

    /**
     * 激活合作伙伴
     *
     * @param id 合作伙伴ID
     * @return 更新后的合作伙伴信息
     */
    @Operation(summary = "激活合作伙伴", description = "将合作伙伴状态变更为激活")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "激活成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "状态不允许激活", content = @Content)
    })
    @PostMapping("/{id}/activate")
    public ResponseEntity<PartnerDTO> activate(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id) {
        String tenantId = getCurrentTenantId();
        PartnerDTO result = partnerService.activate(tenantId, id);
        return ResponseEntity.ok(result);
    }

    /**
     * 暂停合作伙伴
     *
     * @param id   合作伙伴ID
     * @param body 请求体（包含原因）
     * @return 更新后的合作伙伴信息
     */
    @Operation(summary = "暂停合作伙伴", description = "暂停合作伙伴，可提供暂停原因")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "暂停成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "状态不允许暂停", content = @Content)
    })
    @PostMapping("/{id}/suspend")
    public ResponseEntity<PartnerDTO> suspend(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String tenantId = getCurrentTenantId();
        String reason = body != null ? body.get("reason") : null;
        PartnerDTO result = partnerService.suspend(tenantId, id, reason);
        return ResponseEntity.ok(result);
    }

    /**
     * 恢复合作伙伴
     *
     * @param id 合作伙伴ID
     * @return 更新后的合作伙伴信息
     */
    @Operation(summary = "恢复合作伙伴", description = "恢复已暂停的合作伙伴")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "恢复成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "状态不允许恢复", content = @Content)
    })
    @PostMapping("/{id}/resume")
    public ResponseEntity<PartnerDTO> resume(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id) {
        String tenantId = getCurrentTenantId();
        PartnerDTO result = partnerService.resume(tenantId, id);
        return ResponseEntity.ok(result);
    }

    /**
     * 终止合作伙伴
     *
     * @param id   合作伙伴ID
     * @param body 请求体（包含原因）
     * @return 更新后的合作伙伴信息
     */
    @Operation(summary = "终止合作伙伴", description = "终止合作伙伴关系，可提供终止原因")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "终止成功",
            content = @Content(schema = @Schema(implementation = PartnerDTO.class))),
        @ApiResponse(responseCode = "404", description = "合作伙伴不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "状态不允许终止", content = @Content)
    })
    @PostMapping("/{id}/terminate")
    public ResponseEntity<PartnerDTO> terminate(
            @Parameter(description = "合作伙伴ID", required = true, example = "1001")
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String tenantId = getCurrentTenantId();
        String reason = body != null ? body.get("reason") : null;
        PartnerDTO result = partnerService.terminate(tenantId, id, reason);
        return ResponseEntity.ok(result);
    }
}
