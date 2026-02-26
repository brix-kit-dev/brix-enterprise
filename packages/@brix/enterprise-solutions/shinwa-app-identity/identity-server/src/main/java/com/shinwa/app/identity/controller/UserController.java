/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.controller;

import com.shinwa.app.identity.dto.UserDTO;
import com.shinwa.app.identity.request.CreateUserRequest;
import com.shinwa.app.identity.request.UpdateUserRequest;
import com.shinwa.app.identity.service.UserService;
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
 * 用户管理 REST 控制器
 * 
 * <p>提供用户身份模块的 RESTful API 接口，包括：</p>
 * <ul>
 *   <li>用户的创建、查询、更新、删除</li>
 *   <li>用户状态管理（启用、禁用、锁定、解锁）</li>
 *   <li>密码管理（修改、重置）</li>
 * </ul>
 * 
 * <h3>API 版本</h3>
 * <p>当前为 v1 版本，路径前缀为 {@code /api/v1/users}</p>
 * 
 * <h3>响应格式</h3>
 * <p>所有响应均为 JSON 格式，错误响应统一由全局异常处理器处理</p>
 * 
 * <h3>端口规划</h3>
 * <p>由 shinwa-service-user 服务承载，后端端口 8081</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Tag(name = "Users", description = "用户管理 API")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    
    /**
     * 用户服务
     */
    private final UserService userService;
    
    /**
     * 构造函数注入依赖
     *
     * @param userService 用户服务
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // ==================== 查询接口 ====================
    
    /**
     * 根据ID查询用户详情
     *
     * @param id 主键ID
     * @return 用户详情，不存在时返回 404
     */
    @Operation(summary = "查询用户详情", description = "根据主键ID获取用户详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(
            @Parameter(description = "用户主键ID", required = true, example = "1")
            @PathVariable String id) {
        UserDTO user = userService.getById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * 根据用户ID查询
     *
     * @param userId 用户ID（业务ID）
     * @return 用户详情，不存在时返回 404
     */
    @Operation(summary = "根据业务ID查询", description = "根据用户业务ID获取用户详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @GetMapping("/by-user-id/{userId}")
    public ResponseEntity<UserDTO> getByUserId(
            @Parameter(description = "用户业务ID", required = true, example = "U20260128001")
            @PathVariable String userId) {
        UserDTO user = userService.getByUserId(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * 根据用户名查询
     *
     * @param username 用户名
     * @return 用户详情，不存在时返回 404
     */
    @Operation(summary = "根据用户名查询", description = "根据用户名获取用户详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserDTO> getByUsername(
            @Parameter(description = "用户名", required = true, example = "admin")
            @PathVariable String username) {
        UserDTO user = userService.getByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * 查询所有用户
     *
     * @return 用户列表
     */
    @Operation(summary = "查询所有用户", description = "获取所有用户列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<UserDTO>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }
    
    /**
     * 根据状态查询用户
     *
     * @param status 用户状态（ACTIVE/INACTIVE/LOCKED/DISABLED/DELETED）
     * @return 用户列表
     */
    @Operation(summary = "根据状态查询用户", description = "根据用户状态筛选用户列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<UserDTO>> findByStatus(
            @Parameter(description = "用户状态", required = true, example = "ACTIVE")
            @PathVariable String status) {
        return ResponseEntity.ok(userService.findByStatus(status));
    }
    
    /**
     * 根据角色查询用户
     *
     * @param role 用户角色（SUPER_ADMIN/ADMIN/OPERATOR/USER/GUEST）
     * @return 用户列表
     */
    @Operation(summary = "根据角色查询用户", description = "根据用户角色筛选用户列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<UserDTO>> findByRole(
            @Parameter(description = "用户角色", required = true, example = "ADMIN")
            @PathVariable String role) {
        return ResponseEntity.ok(userService.findByRole(role));
    }
    
    // ==================== 写操作接口 ====================
    
    /**
     * 创建用户
     *
     * @param request 创建请求
     * @return 创建的用户信息，返回 201 状态码
     */
    @Operation(summary = "创建用户", description = "创建新用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "409", description = "用户名已存在", content = @Content)
    })
    @PostMapping
    public ResponseEntity<UserDTO> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "创建用户请求", required = true,
                content = @Content(schema = @Schema(implementation = CreateUserRequest.class)))
            @Valid @RequestBody CreateUserRequest request) {
        UserDTO user = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    /**
     * 更新用户信息
     *
     * @param userId  用户ID
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    @Operation(summary = "更新用户信息", description = "更新用户基本信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> update(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "更新用户请求", required = true,
                content = @Content(schema = @Schema(implementation = UpdateUserRequest.class)))
            @Valid @RequestBody UpdateUserRequest request) {
        UserDTO user = userService.update(userId, request);
        return ResponseEntity.ok(user);
    }
    
    /**
     * 删除用户（软删除）
     *
     * @param userId 用户ID
     * @return 204 No Content
     */
    @Operation(summary = "删除用户", description = "软删除用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId) {
        userService.delete(userId);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== 状态管理接口 ====================
    
    /**
     * 启用用户
     *
     * @param userId 用户ID
     * @param body   请求体，包含 reason 字段
     * @return 204 No Content
     */
    @Operation(summary = "启用用户", description = "启用被禁用的用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "启用成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/enable")
    public ResponseEntity<Void> enable(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "管理员启用";
        userService.enable(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 禁用用户
     *
     * @param userId 用户ID
     * @param body   请求体，包含 reason 字段
     * @return 204 No Content
     */
    @Operation(summary = "禁用用户", description = "禁用用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "禁用成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/disable")
    public ResponseEntity<Void> disable(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "管理员禁用";
        userService.disable(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 锁定用户
     *
     * @param userId 用户ID
     * @param body   请求体，包含 reason 字段
     * @return 204 No Content
     */
    @Operation(summary = "锁定用户", description = "锁定用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "锁定成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/lock")
    public ResponseEntity<Void> lock(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "账户锁定";
        userService.lock(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 解锁用户
     *
     * @param userId 用户ID
     * @param body   请求体，包含 reason 字段
     * @return 204 No Content
     */
    @Operation(summary = "解锁用户", description = "解锁被锁定的用户账号")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "解锁成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/unlock")
    public ResponseEntity<Void> unlock(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "管理员解锁";
        userService.unlock(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== 密码管理接口 ====================
    
    /**
     * 修改密码（用户自己操作）
     *
     * @param userId 用户ID
     * @param body   请求体，包含 oldPassword 和 newPassword
     * @return 204 No Content
     */
    @Operation(summary = "修改密码", description = "用户修改自己的登录密码")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "修改成功"),
        @ApiResponse(responseCode = "400", description = "旧密码错误", content = @Content),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/change-password")
    public ResponseEntity<Void> changePassword(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        
        if (oldPassword == null || newPassword == null) {
            throw new IllegalArgumentException("oldPassword 和 newPassword 不能为空");
        }
        
        userService.changePassword(userId, oldPassword, newPassword);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 重置密码（管理员操作）
     *
     * @param userId 用户ID
     * @param body   请求体，包含 newPassword
     * @return 204 No Content
     */
    @Operation(summary = "重置密码", description = "管理员重置用户密码")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "重置成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在", content = @Content)
    })
    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Parameter(description = "用户ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        
        if (newPassword == null) {
            throw new IllegalArgumentException("newPassword 不能为空");
        }
        
        userService.resetPassword(userId, newPassword);
        return ResponseEntity.noContent().build();
    }
}
