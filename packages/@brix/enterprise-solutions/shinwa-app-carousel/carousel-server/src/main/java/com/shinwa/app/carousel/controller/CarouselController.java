/**
 * CarouselController控制器
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.controller;

import com.shinwa.app.carousel.dto.BannerDTO;
import com.shinwa.app.carousel.dto.CarouselDTO;
import com.shinwa.app.carousel.enums.Platform;
import com.shinwa.app.carousel.service.CarouselService;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.AuthContextCapability;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 轮播Banner控制器
 * 
 * <p>提供轮播位和Banner的CRUD操作REST API</p>
 */
@Tag(name = "Carousels", description = "轮播Banner管理 API")
@Slf4j
@RestController
@RequestMapping("/api/carousels")
@RequiredArgsConstructor
public class CarouselController {
    
    private final CarouselService carouselService;
    private final RuntimeContext runtimeContext;
    
    /**
     * 获取当前租户ID
     */
    private String getCurrentTenantId() {
        AuthContextCapability authContext = runtimeContext.getAuthContext();
        String tenantId = authContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("未找到租户上下文");
        }
        return tenantId;
    }
    
    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        AuthContextCapability authContext = runtimeContext.getAuthContext();
        return authContext.getCurrentPrincipal() != null ? authContext.getCurrentPrincipal().getName() : null;
    }
    
    // ==================== 展示端接口 ====================
    
    /**
     * 根据编码获取轮播位
     * 
     * @param code 轮播位编码
     * @return 轮播位信息
     */
    @Operation(summary = "根据编码查询轮播位", description = "根据轮播位编码获取轮播位信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = CarouselDTO.class))),
        @ApiResponse(responseCode = "404", description = "轮播位不存在", content = @Content)
    })
    @GetMapping("/code/{code}")
    public ResponseEntity<CarouselDTO> getByCode(
            @Parameter(description = "轮播位编码", required = true, example = "HOME_BANNER")
            @PathVariable String code) {
        String tenantId = getCurrentTenantId();
        return carouselService.getByCode(tenantId, code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 根据编码和平台获取轮播位
     * 
     * @param code 轮播位编码
     * @param platform 目标平台
     * @return 轮播位信息
     */
    @Operation(summary = "根据编码和平台查询轮播位", description = "根据轮播位编码和目标平台获取轮播位")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = CarouselDTO.class))),
        @ApiResponse(responseCode = "404", description = "轮播位不存在", content = @Content)
    })
    @GetMapping("/code/{code}/platform/{platform}")
    public ResponseEntity<CarouselDTO> getByCodeAndPlatform(
            @Parameter(description = "轮播位编码", required = true, example = "HOME_BANNER")
            @PathVariable String code,
            @Parameter(description = "目标平台", required = true, example = "WEB")
            @PathVariable Platform platform) {
        String tenantId = getCurrentTenantId();
        return carouselService.getByCodeAndPlatform(tenantId, code, platform)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 获取有效的Banner列表
     * 
     * @param code 轮播位编码
     * @param platform 平台
     * @return Banner列表
     */
    @Operation(summary = "获取有效Banner列表", description = "根据轮播位编码和平台获取当前有效的Banner列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = BannerDTO.class))))
    })
    @GetMapping("/code/{code}/banners")
    public ResponseEntity<List<BannerDTO>> getActiveBanners(
            @Parameter(description = "轮播位编码", required = true, example = "HOME_BANNER")
            @PathVariable String code,
            @Parameter(description = "目标平台", example = "ALL")
            @RequestParam(defaultValue = "ALL") Platform platform) {
        String tenantId = getCurrentTenantId();
        List<BannerDTO> banners = carouselService.getActiveBanners(tenantId, code, platform);
        return ResponseEntity.ok(banners);
    }
    
    /**
     * 记录Banner点击
     * 
     * @param bannerId BannerID
     * @param platform 平台
     * @return 操作结果
     */
    @Operation(summary = "记录Banner点击", description = "记录用户点击Banner的行为")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "记录成功")
    })
    @PostMapping("/banners/{bannerId}/click")
    public ResponseEntity<Void> recordClick(
            @Parameter(description = "BannerID", required = true, example = "1")
            @PathVariable Long bannerId,
            @Parameter(description = "平台", example = "WEB")
            @RequestParam(defaultValue = "WEB") Platform platform) {
        String userId = getCurrentUserId();
        carouselService.recordClick(bannerId, userId, platform);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 批量记录Banner展示
     * 
     * @param bannerIds BannerID列表
     * @return 操作结果
     */
    @Operation(summary = "批量记录Banner展示", description = "批量记录多个Banner的展示次数")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "记录成功")
    })
    @PostMapping("/banners/views")
    public ResponseEntity<Void> recordViews(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "BannerID列表", required = true)
            @RequestBody List<Long> bannerIds) {
        carouselService.recordView(bannerIds);
        return ResponseEntity.ok().build();
    }
    
    // ==================== 管理端接口 ====================
    
    /**
     * 创建轮播位
     * 
     * @param dto 轮播位信息
     * @return 创建结果
     */
    @Operation(summary = "创建轮播位", description = "创建新的轮播位")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "创建成功",
            content = @Content(schema = @Schema(implementation = CarouselDTO.class)))
    })
    @PostMapping
    public ResponseEntity<CarouselDTO> createCarousel(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "轮播位信息", required = true,
                content = @Content(schema = @Schema(implementation = CarouselDTO.class)))
            @Valid @RequestBody CarouselDTO dto) {
        String tenantId = getCurrentTenantId();
        CarouselDTO created = carouselService.createCarousel(tenantId, dto);
        return ResponseEntity.ok(created);
    }
    
    /**
     * 更新轮播位
     * 
     * @param id 轮播位ID
     * @param dto 轮播位信息
     * @return 更新结果
     */
    @Operation(summary = "更新轮播位", description = "更新轮播位信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = CarouselDTO.class))),
        @ApiResponse(responseCode = "404", description = "轮播位不存在", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<CarouselDTO> updateCarousel(
            @Parameter(description = "轮播位ID", required = true, example = "1")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "轮播位信息", required = true,
                content = @Content(schema = @Schema(implementation = CarouselDTO.class)))
            @Valid @RequestBody CarouselDTO dto) {
        CarouselDTO updated = carouselService.updateCarousel(id, dto);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 删除轮播位
     * 
     * @param id 轮播位ID
     * @return 删除结果
     */
    @Operation(summary = "删除轮播位", description = "删除轮播位及其下所有Banner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "轮播位不存在", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCarousel(
            @Parameter(description = "轮播位ID", required = true, example = "1")
            @PathVariable Long id) {
        carouselService.deleteCarousel(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 创建Banner
     * 
     * @param carouselId 轮播位ID
     * @param dto Banner信息
     * @return 创建结果
     */
    @Operation(summary = "创建Banner", description = "在指定轮播位下创建新Banner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "创建成功",
            content = @Content(schema = @Schema(implementation = BannerDTO.class))),
        @ApiResponse(responseCode = "404", description = "轮播位不存在", content = @Content)
    })
    @PostMapping("/{carouselId}/banners")
    public ResponseEntity<BannerDTO> createBanner(
            @Parameter(description = "轮播位ID", required = true, example = "1")
            @PathVariable Long carouselId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Banner信息", required = true,
                content = @Content(schema = @Schema(implementation = BannerDTO.class)))
            @Valid @RequestBody BannerDTO dto) {
        String tenantId = getCurrentTenantId();
        BannerDTO created = carouselService.createBanner(tenantId, carouselId, dto);
        return ResponseEntity.ok(created);
    }
    
    /**
     * 更新Banner
     * 
     * @param bannerId BannerID
     * @param dto Banner信息
     * @return 更新结果
     */
    @Operation(summary = "更新Banner", description = "更新Banner信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = BannerDTO.class))),
        @ApiResponse(responseCode = "404", description = "Banner不存在", content = @Content)
    })
    @PutMapping("/banners/{bannerId}")
    public ResponseEntity<BannerDTO> updateBanner(
            @Parameter(description = "BannerID", required = true, example = "1")
            @PathVariable Long bannerId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Banner信息", required = true,
                content = @Content(schema = @Schema(implementation = BannerDTO.class)))
            @Valid @RequestBody BannerDTO dto) {
        BannerDTO updated = carouselService.updateBanner(bannerId, dto);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 删除Banner
     * 
     * @param bannerId BannerID
     * @return 删除结果
     */
    @Operation(summary = "删除Banner", description = "删除指定的Banner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "Banner不存在", content = @Content)
    })
    @DeleteMapping("/banners/{bannerId}")
    public ResponseEntity<Void> deleteBanner(
            @Parameter(description = "BannerID", required = true, example = "1")
            @PathVariable Long bannerId) {
        carouselService.deleteBanner(bannerId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 启用Banner
     * 
     * @param bannerId BannerID
     * @return 操作结果
     */
    @Operation(summary = "启用Banner", description = "启用指定的Banner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "启用成功"),
        @ApiResponse(responseCode = "404", description = "Banner不存在", content = @Content)
    })
    @PostMapping("/banners/{bannerId}/enable")
    public ResponseEntity<Void> enableBanner(
            @Parameter(description = "BannerID", required = true, example = "1")
            @PathVariable Long bannerId) {
        carouselService.toggleBannerStatus(bannerId, true);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 禁用Banner
     * 
     * @param bannerId BannerID
     * @return 操作结果
     */
    @Operation(summary = "禁用Banner", description = "禁用指定的Banner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "禁用成功"),
        @ApiResponse(responseCode = "404", description = "Banner不存在", content = @Content)
    })
    @PostMapping("/banners/{bannerId}/disable")
    public ResponseEntity<Void> disableBanner(
            @Parameter(description = "BannerID", required = true, example = "1")
            @PathVariable Long bannerId) {
        carouselService.toggleBannerStatus(bannerId, false);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 刷新缓存
     * 
     * @param carouselCode 轮播位编码（可选）
     * @return 操作结果
     */
    @Operation(summary = "刷新缓存", description = "刷新轮播位缓存，不传编码则刷新全部")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "刷新成功")
    })
    @PostMapping("/cache/refresh")
    public ResponseEntity<Void> refreshCache(
            @Parameter(description = "轮播位编码（可选）", example = "HOME_BANNER")
            @RequestParam(required = false) String carouselCode) {
        carouselService.refreshCache(carouselCode);
        return ResponseEntity.ok().build();
    }
}
