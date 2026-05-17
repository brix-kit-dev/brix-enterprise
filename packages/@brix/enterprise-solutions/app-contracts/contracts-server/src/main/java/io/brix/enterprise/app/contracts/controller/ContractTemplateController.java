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
package io.brix.enterprise.app.contracts.controller;

import io.brix.enterprise.app.contracts.dto.ContractTemplateDTO;
import io.brix.enterprise.app.contracts.dto.TemplateVersionDTO;
import io.brix.enterprise.app.contracts.dto.request.CreateTemplateRequest;
import io.brix.enterprise.app.contracts.dto.request.PublishVersionRequest;
import io.brix.enterprise.app.contracts.enums.ContractType;
import io.brix.enterprise.app.contracts.service.ContractTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 合同模板控制器
 *
 * <p>提供合同模板管理的RESTful API。
 *
 * <p>API端点：
 * <ul>
 *   <li>POST /api/contracts/templates - 创建模板</li>
 *   <li>PUT /api/contracts/templates/{id} - 更新模板</li>
 *   <li>POST /api/contracts/templates/{id}/versions - 发布新版本</li>
 *   <li>PUT /api/contracts/templates/{id}/switch-version - 切换版本</li>
 *   <li>PUT /api/contracts/templates/{id}/enable - 启用模板</li>
 *   <li>PUT /api/contracts/templates/{id}/disable - 禁用模板</li>
 *   <li>GET /api/contracts/templates/{id} - 查询单个模板</li>
 *   <li>GET /api/contracts/templates/code/{code} - 按编码查询</li>
 *   <li>GET /api/contracts/templates - 查询所有模板</li>
 *   <li>GET /api/contracts/templates/type/{type} - 按类型查询</li>
 *   <li>GET /api/contracts/templates/{id}/versions - 查询版本列表</li>
 *   <li>DELETE /api/contracts/templates/{id} - 删除模板</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "Contract Templates", description = "合同模板管理 API - 提供合同模板的创建、更新、版本管理等操作")
@RestController
@RequestMapping("/api/contracts/templates")
public class ContractTemplateController {

    private static final Logger log = LoggerFactory.getLogger(ContractTemplateController.class);

    private final ContractTemplateService templateService;

    /**
     * 构造函数注入
     *
     * @param templateService 模板服务
     */
    public ContractTemplateController(ContractTemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * 创建模板
     *
     * @param request 创建请求
     * @return 模板信息
     */
    @Operation(summary = "创建合同模板", description = "创建一个新的合同模板")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "创建成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content),
        @ApiResponse(responseCode = "409", description = "模板编码已存在", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ContractTemplateDTO> createTemplate(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建模板请求", required = true,
                content = @Content(schema = @Schema(implementation = CreateTemplateRequest.class)))
            @Valid @RequestBody CreateTemplateRequest request) {
        log.info("创建合同模板: code={}", request.getTemplateCode());
        ContractTemplateDTO result = templateService.createTemplate(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新模板
     *
     * @param id     模板ID
     * @param params 更新参数
     * @return 模板信息
     */
    @Operation(summary = "更新合同模板", description = "更新模板的名称和描述")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<ContractTemplateDTO> updateTemplate(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "更新参数", required = true,
                content = @Content(schema = @Schema(example = "{\"templateName\": \"新名称\", \"description\": \"新描述\"}" )))
            @RequestBody Map<String, String> params) {
        String name = params.get("templateName");
        String description = params.get("description");
        log.info("更新合同模板: id={}", id);
        ContractTemplateDTO result = templateService.updateTemplate(id, name, description);
        return ResponseEntity.ok(result);
    }

    /**
     * 发布新版本
     *
     * @param id      模板ID
     * @param request 版本发布请求
     * @return 版本信息
     */
    @Operation(summary = "发布模板新版本", description = "为指定模板发布新版本")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "发布成功",
            content = @Content(schema = @Schema(implementation = TemplateVersionDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content)
    })
    @PostMapping("/{id}/versions")
    public ResponseEntity<TemplateVersionDTO> publishVersion(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "版本发布请求", required = true,
                content = @Content(schema = @Schema(implementation = PublishVersionRequest.class)))
            @Valid @RequestBody PublishVersionRequest request) {
        log.info("发布模板新版本: templateId={}", id);
        TemplateVersionDTO result = templateService.publishVersion(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 切换版本
     *
     * @param id     模板ID
     * @param params 版本参数
     * @return 模板信息
     */
    @Operation(summary = "切换模板版本", description = "切换模板的当前活动版本")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "切换成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板或版本不存在", content = @Content)
    })
    @PutMapping("/{id}/switch-version")
    public ResponseEntity<ContractTemplateDTO> switchVersion(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "版本号", required = true,
                content = @Content(schema = @Schema(example = "{\"versionNumber\": 2}" )))
            @RequestBody Map<String, Integer> params) {
        Integer versionNumber = params.get("versionNumber");
        log.info("切换模板版本: templateId={}, version={}", id, versionNumber);
        ContractTemplateDTO result = templateService.switchVersion(id, versionNumber);
        return ResponseEntity.ok(result);
    }

    /**
     * 启用模板
     *
     * @param id 模板ID
     * @return 模板信息
     */
    @Operation(summary = "启用模板", description = "启用指定的合同模板")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "启用成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content)
    })
    @PutMapping("/{id}/enable")
    public ResponseEntity<ContractTemplateDTO> enable(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id) {
        log.info("启用模板: templateId={}", id);
        ContractTemplateDTO result = templateService.enable(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 禁用模板
     *
     * @param id 模板ID
     * @return 模板信息
     */
    @Operation(summary = "禁用模板", description = "禁用指定的合同模板")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "禁用成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content)
    })
    @PutMapping("/{id}/disable")
    public ResponseEntity<ContractTemplateDTO> disable(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id) {
        log.info("禁用模板: templateId={}", id);
        ContractTemplateDTO result = templateService.disable(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 查询单个模板
     *
     * @param id 模板ID
     * @return 模板信息
     */
    @Operation(summary = "查询模板详情", description = "根据模板ID查询模板详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ContractTemplateDTO> findById(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id) {
        return templateService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 按模板编码查询
     *
     * @param code 模板编码
     * @return 模板信息
     */
    @Operation(summary = "根据编码查询模板", description = "根据模板编码查询模板详情")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = ContractTemplateDTO.class))),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content)
    })
    @GetMapping("/code/{code}")
    public ResponseEntity<ContractTemplateDTO> findByCode(
            @Parameter(description = "模板编码", required = true, example = "TPL001")
            @PathVariable String code) {
        return templateService.findByCode(code)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 查询所有模板
     *
     * @param activeOnly 是否只查询启用的模板
     * @return 模板列表
     */
    @Operation(summary = "查询模板列表", description = "查询所有合同模板，可筛选仅启用的")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractTemplateDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<ContractTemplateDTO>> findAll(
            @Parameter(description = "是否只查询启用的模板", example = "true")
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<ContractTemplateDTO> results = templateService.findAll(activeOnly);
        return ResponseEntity.ok(results);
    }

    /**
     * 按类型查询模板
     *
     * @param type 合同类型
     * @return 模板列表
     */
    @Operation(summary = "按类型查询模板", description = "查询指定类型的合同模板列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractTemplateDTO.class))))
    })
    @GetMapping("/type/{type}")
    public ResponseEntity<List<ContractTemplateDTO>> findByType(
            @Parameter(description = "合同类型", required = true, example = "SERVICE")
            @PathVariable ContractType type) {
        List<ContractTemplateDTO> results = templateService.findByType(type);
        return ResponseEntity.ok(results);
    }

    /**
     * 查询模板的所有版本
     *
     * @param id 模板ID
     * @return 版本列表
     */
    @Operation(summary = "查询模板版本列表", description = "查询指定模板的所有历史版本")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateVersionDTO.class))))
    })
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<TemplateVersionDTO>> findVersions(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id) {
        List<TemplateVersionDTO> results = templateService.findVersions(id);
        return ResponseEntity.ok(results);
    }

    /**
     * 删除模板
     *
     * @param id 模板ID
     * @return 无内容
     */
    @Operation(summary = "删除模板", description = "删除指定的合同模板")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "模板不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "模板正在使用中，无法删除", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "模板ID", required = true, example = "1001")
            @PathVariable Long id) {
        log.info("删除模板: templateId={}", id);
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 统计模板数量
     *
     * @param activeOnly 是否只统计启用的
     * @return 数量
     */
    @Operation(summary = "统计模板数量", description = "统计合同模板数量，可筛选仅启用的")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(example = "{\"count\": 50}")))
    })
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count(
            @Parameter(description = "是否只统计启用的模板", example = "true")
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        long count = templateService.count(activeOnly);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
