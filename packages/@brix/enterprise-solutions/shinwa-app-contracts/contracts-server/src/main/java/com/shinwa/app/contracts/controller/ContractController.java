package com.shinwa.app.contracts.controller;

import com.shinwa.app.contracts.dto.ContractDTO;
import com.shinwa.app.contracts.dto.request.ContractQueryRequest;
import com.shinwa.app.contracts.dto.request.CreateContractRequest;
import com.shinwa.app.contracts.dto.request.SignContractRequest;
import com.shinwa.app.contracts.enums.ContractStatus;
import com.shinwa.app.contracts.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 合同控制器
 *
 * <p>提供合同管理的RESTful API。
 *
 * <p>API端点：
 * <ul>
 *   <li>POST /api/contracts - 创建合同</li>
 *   <li>POST /api/contracts/{id}/start-sign - 发起签署</li>
 *   <li>POST /api/contracts/{id}/sign - 签署合同</li>
 *   <li>POST /api/contracts/{id}/cancel - 取消合同</li>
 *   <li>GET /api/contracts/{id} - 查询单个合同</li>
 *   <li>GET /api/contracts/no/{contractNo} - 按编号查询</li>
 *   <li>GET /api/contracts - 查询合同列表</li>
 *   <li>GET /api/contracts/status/{status} - 按状态查询</li>
 *   <li>GET /api/contracts/case/{caseId} - 按案例查询</li>
 *   <li>GET /api/contracts/party/{partyId} - 按参与方查询</li>
 *   <li>DELETE /api/contracts/{id} - 删除合同</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Tag(name = "Contracts", description = "合同管理 API - 提供合同的创建、签署、取消、查询等操作")
@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private static final Logger log = LoggerFactory.getLogger(ContractController.class);

    private final ContractService contractService;

    /**
     * 构造函数注入
     *
     * @param contractService 合同服务
     */
    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    /**
     * 创建合同
     *
     * @param request 创建请求
     * @return 合同信息
     */
    @Operation(summary = "创建合同", description = "根据模板创建一份新合同")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "创建成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ContractDTO> createContract(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建合同请求", required = true,
                content = @Content(schema = @Schema(implementation = CreateContractRequest.class)))
            @Valid @RequestBody CreateContractRequest request) {
        log.info("创建合同: templateId={}", request.getTemplateId());
        ContractDTO result = contractService.createContract(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 发起签署
     *
     * @param id 合同ID
     * @return 合同信息
     */
    @Operation(summary = "发起签署", description = "将合同状态变更为签署中")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "发起成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "合同状态不允许发起签署", content = @Content)
    })
    @PostMapping("/{id}/start-sign")
    public ResponseEntity<ContractDTO> startSign(
            @Parameter(description = "合同ID", required = true, example = "1001")
            @PathVariable Long id) {
        log.info("发起签署: contractId={}", id);
        ContractDTO result = contractService.startSign(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 签署合同
     *
     * @param id      合同ID
     * @param request 签署请求
     * @param httpRequest HTTP请求（用于获取IP和UserAgent）
     * @return 合同信息
     */
    @Operation(summary = "签署合同", description = "参与方签署合同")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "签署成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "合同状态不允许签署", content = @Content)
    })
    @PostMapping("/{id}/sign")
    public ResponseEntity<ContractDTO> sign(
            @Parameter(description = "合同ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "签署请求", required = true,
                content = @Content(schema = @Schema(implementation = SignContractRequest.class)))
            @Valid @RequestBody SignContractRequest request,
            HttpServletRequest httpRequest) {
        log.info("签署合同: contractId={}, partyId={}", id, request.getPartyId());
        // 可以在这里设置IP和UserAgent到request中
        ContractDTO result = contractService.sign(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 取消合同
     *
     * @param id     合同ID
     * @param params 取消参数（包含reason）
     * @return 合同信息
     */
    @Operation(summary = "取消合同", description = "取消一份合同，需提供取消原因")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "取消成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "合同状态不允许取消", content = @Content)
    })
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ContractDTO> cancel(
            @Parameter(description = "合同ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "取消参数", required = false,
                content = @Content(schema = @Schema(example = "{\"reason\": \"用户主动取消\"}" )))
            @RequestBody(required = false) Map<String, String> params) {
        String reason = params != null ? params.get("reason") : null;
        log.info("取消合同: contractId={}, reason={}", id, reason);
        ContractDTO result = contractService.cancel(id, reason);
        return ResponseEntity.ok(result);
    }

    /**
     * 查询单个合同
     *
     * @param id 合同ID
     * @return 合同信息
     */
    @Operation(summary = "查询合同详情", description = "根据合同ID查询合同详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ContractDTO> findById(
            @Parameter(description = "合同ID", required = true, example = "1001")
            @PathVariable Long id) {
        return contractService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 按合同编号查询
     *
     * @param contractNo 合同编号
     * @return 合同信息
     */
    @Operation(summary = "根据编号查询合同", description = "根据合同编号查询合同详情")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = ContractDTO.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content)
    })
    @GetMapping("/no/{contractNo}")
    public ResponseEntity<ContractDTO> findByContractNo(
            @Parameter(description = "合同编号", required = true, example = "CT20260214001")
            @PathVariable String contractNo) {
        return contractService.findByContractNo(contractNo)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 查询合同列表
     *
     * @param request 查询条件
     * @return 合同列表
     */
    @Operation(summary = "查询合同列表", description = "根据条件查询合同列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<ContractDTO>> findAll(ContractQueryRequest request) {
        List<ContractDTO> results = contractService.findAll(request);
        return ResponseEntity.ok(results);
    }

    /**
     * 按状态查询合同
     *
     * @param status 合同状态
     * @return 合同列表
     */
    @Operation(summary = "按状态查询合同", description = "查询指定状态的合同列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractDTO.class))))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ContractDTO>> findByStatus(
            @Parameter(description = "合同状态", required = true, example = "DRAFT")
            @PathVariable ContractStatus status) {
        List<ContractDTO> results = contractService.findByStatus(status);
        return ResponseEntity.ok(results);
    }

    /**
     * 按案例ID查询合同
     *
     * @param caseId 案例ID
     * @return 合同列表
     */
    @Operation(summary = "按案例查询合同", description = "查询指定案例下的合同列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractDTO.class))))
    })
    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<ContractDTO>> findByCaseId(
            @Parameter(description = "案例ID", required = true, example = "CASE001")
            @PathVariable String caseId) {
        List<ContractDTO> results = contractService.findByCaseId(caseId);
        return ResponseEntity.ok(results);
    }

    /**
     * 按参与方ID查询合同
     *
     * @param partyId 参与方ID
     * @return 合同列表
     */
    @Operation(summary = "按参与方查询合同", description = "查询指定参与方的合同列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContractDTO.class))))
    })
    @GetMapping("/party/{partyId}")
    public ResponseEntity<List<ContractDTO>> findByPartyId(
            @Parameter(description = "参与方ID", required = true, example = "PARTY001")
            @PathVariable String partyId) {
        List<ContractDTO> results = contractService.findByPartyId(partyId);
        return ResponseEntity.ok(results);
    }

    /**
     * 删除合同
     *
     * @param id 合同ID
     * @return 无内容
     */
    @Operation(summary = "删除合同", description = "删除指定的合同")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "合同不存在", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "合同ID", required = true, example = "1001")
            @PathVariable Long id) {
        log.info("删除合同: contractId={}", id);
        contractService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 统计合同数量
     *
     * @param status 状态（可选）
     * @return 数量
     */
    @Operation(summary = "统计合同数量", description = "统计合同数量，可按状态筛选")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(example = "{\"count\": 100}")))
    })
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count(
            @Parameter(description = "合同状态（可选）", example = "SIGNED")
            @RequestParam(required = false) ContractStatus status) {
        long count = contractService.count(status);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
