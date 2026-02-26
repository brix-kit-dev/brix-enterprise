package com.shinwa.app.products.controller;

import com.shinwa.app.products.api.ProductService;
import com.shinwa.app.products.dto.CreateProductRequest;
import com.shinwa.app.products.dto.ProductDTO;
import com.shinwa.app.products.dto.UpdateProductRequest;
import com.shinwa.app.products.enums.ProductStatus;
import com.shinwa.app.products.enums.ProductType;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 产品管理 REST Controller
 *
 * <p>v3.0 业务模块，提供产品管理的 RESTful API。
 *
 * <p>API 设计遵循 RESTful 规范：
 * <ul>
 *   <li>POST /products - 创建产品</li>
 *   <li>PUT /products/{id} - 更新产品</li>
 *   <li>GET /products/{id} - 查询单个产品</li>
 *   <li>GET /products - 查询产品列表</li>
 *   <li>DELETE /products/{id} - 删除产品</li>
 *   <li>POST /products/{id}/submit-review - 提交审核</li>
 *   <li>POST /products/{id}/approve - 审核通过</li>
 *   <li>POST /products/{id}/reject - 审核驳回</li>
 *   <li>POST /products/{id}/deactivate - 下架</li>
 *   <li>POST /products/{id}/reactivate - 重新上架</li>
 *   <li>POST /products/{id}/archive - 归档</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Tag(name = "Products", description = "产品管理 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final RuntimeContext runtimeContext;

    // =====================================================
    // 健康检查
    // =====================================================

    /**
     * 健康检查端点
     *
     * @return 健康状态
     */
    @Operation(summary = "健康检查", description = "检查产品服务的健康状态")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "服务正常", content = @Content)
    })
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        String currentUser = null;
        try {
            var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
            currentUser = principal != null ? principal.getName() : null;
        } catch (Exception e) {
            log.debug("获取当前用户失败: {}", e.getMessage());
        }
        
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "module", "products",
            "version", "3.0.0",
            "user", currentUser != null ? currentUser : "anonymous"
        ));
    }

    // =====================================================
    // CRUD 操作
    // =====================================================

    /**
     * 创建产品
     *
     * @param request 创建请求
     * @return 创建的产品
     */
    @Operation(summary = "创建产品", description = "创建新的产品套餐")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ProductDTO> create(@RequestBody @Valid CreateProductRequest request) {
        log.info("[API] 创建产品, name={}, type={}", request.getName(), request.getType());
        ProductDTO response = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 更新产品
     *
     * @param id 产品 ID
     * @param request 更新请求
     * @return 更新后的产品
     */
    @Operation(summary = "更新产品", description = "根据 ID 更新产品信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> update(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id,
            @RequestBody @Valid UpdateProductRequest request) {
        log.info("[API] 更新产品, id={}", id);
        ProductDTO response = productService.update(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 查询产品详情
     *
     * @param id 产品 ID
     * @return 产品详情
     */
    @Operation(summary = "查询产品详情", description = "根据 ID 查询产品详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getById(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.debug("[API] 查询产品, id={}", id);
        ProductDTO response = productService.getById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 查询产品列表
     *
     * <p>支持按状态、类型、合作方筛选。
     *
     * @param status 产品状态（可选）
     * @param type 产品类型（可选）
     * @param partnerId 合作方 ID（可选）
     * @param keyword 搜索关键字（可选）
     * @return 产品列表
     */
    @Operation(summary = "查询产品列表", description = "查询产品列表，支持按状态、类型、合作方筛选")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<ProductDTO>> list(
            @Parameter(description = "产品状态筛选") @RequestParam(required = false) ProductStatus status,
            @Parameter(description = "产品类型筛选") @RequestParam(required = false) ProductType type,
            @Parameter(description = "合作方 ID") @RequestParam(required = false) Long partnerId,
            @Parameter(description = "搜索关键字") @RequestParam(required = false) String keyword) {
        log.debug("[API] 查询产品列表, status={}, type={}, partnerId={}, keyword={}", 
            status, type, partnerId, keyword);
        
        List<ProductDTO> response;
        
        if (keyword != null && !keyword.isBlank()) {
            response = productService.search(keyword);
        } else if (partnerId != null) {
            response = productService.findByPartnerId(partnerId);
        } else if (status != null) {
            response = productService.findByStatus(status);
        } else if (type != null) {
            response = productService.findByType(type);
        } else {
            response = productService.findAll();
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * 查询上架的产品（对外展示）
     *
     * @return 上架产品列表
     */
    @Operation(summary = "查询上架产品", description = "查询所有已上架的产品列表（对外展示）")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class))))
    })
    @GetMapping("/active")
    public ResponseEntity<List<ProductDTO>> listActive() {
        log.debug("[API] 查询上架产品");
        List<ProductDTO> response = productService.findActiveProducts();
        return ResponseEntity.ok(response);
    }

    /**
     * 删除产品
     *
     * @param id 产品 ID
     * @return 无内容
     */
    @Operation(summary = "删除产品", description = "根据 ID 删除产品")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 删除产品, id={}", id);
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // 状态变更操作
    // =====================================================

    /**
     * 提交审核
     *
     * @param id 产品 ID
     * @return 更新后的产品
     */
    @Operation(summary = "提交审核", description = "将产品提交审核")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "提交成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许提交审核", content = @Content)
    })
    @PostMapping("/{id}/submit-review")
    public ResponseEntity<ProductDTO> submitReview(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 提交审核, id={}", id);
        ProductDTO response = productService.submitReview(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 审核通过
     *
     * @param id 产品 ID
     * @return 更新后的产品
     */
    @Operation(summary = "审核通过", description = "审核通过产品，状态变为已上架")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "审核通过成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许审核", content = @Content)
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<ProductDTO> approve(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 审核通过, id={}", id);
        ProductDTO response = productService.approve(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 审核驳回
     *
     * @param id 产品 ID
     * @param body 包含驳回原因的请求体
     * @return 更新后的产品
     */
    @Operation(summary = "审核驳回", description = "驳回产品审核，需提供驳回原因")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "驳回成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许驳回", content = @Content)
    })
    @PostMapping("/{id}/reject")
    public ResponseEntity<ProductDTO> reject(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        log.info("[API] 审核驳回, id={}, reason={}", id, reason);
        ProductDTO response = productService.reject(id, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * 下架产品
     *
     * @param id 产品 ID
     * @return 更新后的产品
     */
    @Operation(summary = "下架产品", description = "将产品下架，暂停销售")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "下架成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许下架", content = @Content)
    })
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ProductDTO> deactivate(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 下架产品, id={}", id);
        ProductDTO response = productService.deactivate(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 重新上架产品
     *
     * @param id 产品 ID
     * @return 更新后的产品
     */
    @Operation(summary = "重新上架", description = "将已下架的产品重新上架")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "重新上架成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许重新上架", content = @Content)
    })
    @PostMapping("/{id}/reactivate")
    public ResponseEntity<ProductDTO> reactivate(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 重新上架产品, id={}", id);
        ProductDTO response = productService.reactivate(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 归档产品
     *
     * @param id 产品 ID
     * @return 更新后的产品
     */
    @Operation(summary = "归档产品", description = "将产品归档，不再展示")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "归档成功",
            content = @Content(schema = @Schema(implementation = ProductDTO.class))),
        @ApiResponse(responseCode = "404", description = "产品不存在", content = @Content),
        @ApiResponse(responseCode = "400", description = "状态不允许归档", content = @Content)
    })
    @PostMapping("/{id}/archive")
    public ResponseEntity<ProductDTO> archive(
            @Parameter(description = "产品 ID", required = true, example = "1")
            @PathVariable Long id) {
        log.info("[API] 归档产品, id={}", id);
        ProductDTO response = productService.archive(id);
        return ResponseEntity.ok(response);
    }
}
