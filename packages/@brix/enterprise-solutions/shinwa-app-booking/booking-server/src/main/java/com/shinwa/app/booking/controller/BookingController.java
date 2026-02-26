/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.controller;

import com.shinwa.app.booking.dto.BookingDTO;
import com.shinwa.app.booking.dto.TimeSlotDTO;
import com.shinwa.app.booking.request.CreateBookingRequest;
import com.shinwa.app.booking.service.BookingService;
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
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * 预约管理 REST 控制器
 * 
 * <p>提供预约模块的 RESTful API 接口，包括：</p>
 * <ul>
 *   <li>预约的创建、查询、取消、确认、完成等操作</li>
 *   <li>可用时间槽查询</li>
 *   <li>按用户、来源查询预约列表</li>
 * </ul>
 * 
 * <h3>API 版本</h3>
 * <p>当前为 v1 版本，路径前缀为 {@code /api/v1/bookings}</p>
 * 
 * <h3>响应格式</h3>
 * <p>所有响应均为 JSON 格式，错误响应统一由全局异常处理器处理</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Tag(name = "Bookings", description = "预约管理 API - 提供预约的创建、查询、取消、确认、完成等操作")
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    
    /**
     * 运行时上下文
     * <p>用于获取当前用户等认证信息</p>
     */
    private final RuntimeContext runtimeContext;
    
    /**
     * 预约服务
     */
    private final BookingService bookingService;
    
    /**
     * 构造函数注入依赖
     *
     * @param runtimeContext 运行时上下文
     * @param bookingService 预约服务
     */
    public BookingController(RuntimeContext runtimeContext, BookingService bookingService) {
        this.runtimeContext = runtimeContext;
        this.bookingService = bookingService;
    }
    
    // ==================== 查询接口 ====================
    
    /**
     * 根据ID查询预约详情
     *
     * @param id 预约ID
     * @return 预约详情，不存在时返回 404
     */
    @Operation(summary = "查询预约详情", description = "根据预约ID查询预约详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = BookingDTO.class))),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<BookingDTO> getById(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id) {
        BookingDTO booking = bookingService.getById(id);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(booking);
    }
    
    /**
     * 根据预约编号查询
     *
     * @param bookingNo 预约编号
     * @return 预约详情，不存在时返回 404
     */
    @Operation(summary = "根据编号查询预约", description = "根据系统生成的预约编号查询预约详情")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = BookingDTO.class))),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content)
    })
    @GetMapping("/by-no/{bookingNo}")
    public ResponseEntity<BookingDTO> getByBookingNo(
            @Parameter(description = "预约编号", required = true, example = "BK20260214001")
            @PathVariable String bookingNo) {
        BookingDTO booking = bookingService.getByBookingNo(bookingNo);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(booking);
    }
    
    /**
     * 查询当前用户的预约列表
     *
     * @param status 可选，按状态筛选（PENDING/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW）
     * @return 预约列表
     */
    @Operation(summary = "查询我的预约", description = "查询当前登录用户的预约列表，可按状态筛选")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = BookingDTO.class))))
    })
    @GetMapping("/mine")
    public ResponseEntity<List<BookingDTO>> getMyBookings(
            @Parameter(description = "预约状态筛选", example = "PENDING")
            @RequestParam(required = false) String status) {
        Long currentUserId = getCurrentUserId();
        List<BookingDTO> bookings = bookingService.findByUser(currentUserId, status);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * 根据用户ID查询预约列表（管理员接口）
     *
     * @param userId 用户ID
     * @param status 可选，按状态筛选
     * @return 预约列表
     */
    @Operation(summary = "根据用户查询预约", description = "管理员接口：根据用户ID查询该用户的预约列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = BookingDTO.class))))
    })
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<BookingDTO>> getByUser(
            @Parameter(description = "用户ID", required = true, example = "2001")
            @PathVariable Long userId,
            @Parameter(description = "预约状态筛选", example = "CONFIRMED")
            @RequestParam(required = false) String status) {
        List<BookingDTO> bookings = bookingService.findByUser(userId, status);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * 根据来源查询预约列表
     * 
     * <p>用于查询某个业务实体（如案件、医疗记录）下的所有预约</p>
     *
     * @param sourceType 来源类型，如 "CASE", "MEDICAL_RECORD"
     * @param sourceId   来源ID
     * @return 预约列表
     */
    @Operation(summary = "根据来源查询预约", description = "查询某个业务实体（如案件、服务包）下的所有预约")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = BookingDTO.class))))
    })
    @GetMapping("/by-source")
    public ResponseEntity<List<BookingDTO>> getBySource(
            @Parameter(description = "来源业务类型", required = true, example = "CASE")
            @RequestParam String sourceType,
            @Parameter(description = "来源业务ID", required = true, example = "3001")
            @RequestParam Long sourceId) {
        List<BookingDTO> bookings = bookingService.findBySource(sourceType, sourceId);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * 查询可用时间槽
     * 
     * <p>返回指定资源在指定日期的所有时间槽及其可用情况</p>
     *
     * @param resourceId 资源ID
     * @param date       日期，格式 yyyy-MM-dd
     * @return 时间槽列表
     */
    @Operation(summary = "查询可用时间槽", description = "获取指定资源在指定日期的所有时间槽及其可用情况")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = TimeSlotDTO.class))))
    })
    @GetMapping("/slots")
    public ResponseEntity<List<TimeSlotDTO>> getAvailableSlots(
            @Parameter(description = "可预约资源ID", required = true, example = "100")
            @RequestParam Long resourceId,
            @Parameter(description = "查询日期", required = true, example = "2026-02-20")
            @RequestParam LocalDate date) {
        List<TimeSlotDTO> slots = bookingService.getAvailableSlots(resourceId, date);
        return ResponseEntity.ok(slots);
    }
    
    // ==================== 写操作接口 ====================
    
    /**
     * 创建预约
     *
     * @param request 创建预约请求
     * @return 创建的预约详情，HTTP 201
     */
    @Operation(summary = "创建预约", description = "为用户创建一个新的预约")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "预约创建成功",
            content = @Content(schema = @Schema(implementation = BookingDTO.class))),
        @ApiResponse(responseCode = "400", description = "参数校验失败", content = @Content),
        @ApiResponse(responseCode = "409", description = "时间槽已被预约", content = @Content)
    })
    @PostMapping
    public ResponseEntity<BookingDTO> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建预约请求", required = true,
                content = @Content(schema = @Schema(implementation = CreateBookingRequest.class)))
            @Valid @RequestBody CreateBookingRequest request) {
        BookingDTO booking = bookingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }
    
    /**
     * 确认预约
     *
     * @param id 预约ID
     * @return 无内容，HTTP 204
     */
    @Operation(summary = "确认预约", description = "确认一个待确认的预约")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "确认成功"),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "预约状态不允许确认", content = @Content)
    })
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Void> confirm(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id) {
        bookingService.confirm(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 取消预约
     *
     * @param id   预约ID
     * @param body 请求体，包含取消原因
     * @return 无内容，HTTP 204
     */
    @Operation(summary = "取消预约", description = "取消一个预约，需提供取消原因")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "取消成功"),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "预约状态不允许取消", content = @Content)
    })
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "取消原因", required = true,
                content = @Content(schema = @Schema(example = "{\"reason\": \"用户主动取消\"}" )))
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "用户主动取消");
        bookingService.cancel(id, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 完成预约
     *
     * @param id 预约ID
     * @return 无内容，HTTP 204
     */
    @Operation(summary = "完成预约", description = "将预约标记为已完成")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "完成成功"),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "预约状态不允许完成", content = @Content)
    })
    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> complete(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id) {
        bookingService.complete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 标记预约为未到
     *
     * @param id 预约ID
     * @return 无内容，HTTP 204
     */
    @Operation(summary = "标记未到", description = "将预约标记为未到（No-Show）")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "标记成功"),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "预约状态不允许标记未到", content = @Content)
    })
    @PostMapping("/{id}/no-show")
    public ResponseEntity<Void> markNoShow(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id) {
        bookingService.markNoShow(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 预约改期
     *
     * @param id   预约ID
     * @param body 请求体，包含 newDate, newStartTime, newEndTime
     * @return 更新后的预约详情
     */
    @Operation(summary = "预约改期", description = "将预约改到新的时间")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "改期成功",
            content = @Content(schema = @Schema(implementation = BookingDTO.class))),
        @ApiResponse(responseCode = "404", description = "预约不存在", content = @Content),
        @ApiResponse(responseCode = "409", description = "新时间槽不可用", content = @Content)
    })
    @PostMapping("/{id}/reschedule")
    public ResponseEntity<BookingDTO> reschedule(
            @Parameter(description = "预约ID", required = true, example = "1001")
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        LocalDate newDate = LocalDate.parse(body.get("newDate"));
        LocalTime newStartTime = LocalTime.parse(body.get("newStartTime"));
        LocalTime newEndTime = LocalTime.parse(body.get("newEndTime"));
        
        BookingDTO booking = bookingService.reschedule(id, newDate, newStartTime, newEndTime);
        return ResponseEntity.ok(booking);
    }
    
    // ==================== 私有方法 ====================
    
    /**
     * 获取当前用户ID
     * <p>通过 RuntimeContext 的 AuthContext 能力获取</p>
     * <p>需要将 Principal 转换为 TenantAwarePrincipal 以获取 userId</p>
     *
     * @return 当前用户ID
     */
    private Long getCurrentUserId() {
        var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        if (principal instanceof TenantAwarePrincipal tenantPrincipal) {
            String userId = tenantPrincipal.getUserId();
            return userId != null ? Long.parseLong(userId) : null;
        }
        // 回退方案：使用 Principal.getName() 作为用户标识
        return principal != null && principal.getName() != null 
                ? Long.parseLong(principal.getName()) 
                : null;
    }
}
