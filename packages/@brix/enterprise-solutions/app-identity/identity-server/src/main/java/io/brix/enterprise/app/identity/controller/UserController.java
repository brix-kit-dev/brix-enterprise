/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.controller;

import io.brix.enterprise.app.identity.dto.UserDTO;
import io.brix.enterprise.app.identity.request.CreateUserRequest;
import io.brix.enterprise.app.identity.request.UpdateUserRequest;
import io.brix.enterprise.app.identity.service.UserService;
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
 * User Management REST Controller
 * 
 * <p>Provides RESTful API endpoints for the user identity module, including:</p>
 * <ul>
 *   <li>User CRUD (create, query, update, delete)</li>
 *   <li>User status management (enable, disable, lock, unlock)</li>
 *   <li>Password management (change, reset)</li>
 * </ul>
 * 
 * <h3>API Version</h3>
 * <p>Currently v1, path prefix: {@code /api/v1/users}</p>
 * 
 * <h3>Response Format</h3>
 * <p>All responses are in JSON format; error responses are handled by the global exception handler</p>
 * 
 * <h3>Port Planning</h3>
 * <p>Hosted by brix-service-user, backend port 8081</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "Users", description = "User Management API")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    
    /**
     * User service
     */
    private final UserService userService;
    
    /**
     * Constructor dependency injection
     *
     * @param userService user service
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // ==================== Query endpoints ====================
    
    /**
     * Get user details by ID
     *
     * @param id primary key ID
     * @return user details, returns 404 if not found
     */
    @Operation(summary = "Get user details", description = "Get user details by primary key ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(
            @Parameter(description = "User primary key ID", required = true, example = "1")
            @PathVariable String id) {
        UserDTO user = userService.getById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * Get user by user ID
     *
     * @param userId user ID (business ID)
     * @return user details, returns 404 if not found
     */
    @Operation(summary = "Get by business ID", description = "Get user details by business user ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @GetMapping("/by-user-id/{userId}")
    public ResponseEntity<UserDTO> getByUserId(
            @Parameter(description = "User business ID", required = true, example = "U20260128001")
            @PathVariable String userId) {
        UserDTO user = userService.getByUserId(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * Get user by username
     *
     * @param username username
     * @return user details, returns 404 if not found
     */
    @Operation(summary = "Get by username", description = "Get user details by username")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserDTO> getByUsername(
            @Parameter(description = "Username", required = true, example = "admin")
            @PathVariable String username) {
        UserDTO user = userService.getByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    /**
     * Get all users
     *
     * @return user list
     */
    @Operation(summary = "Get all users", description = "Get the list of all users")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping
    public ResponseEntity<List<UserDTO>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }
    
    /**
     * Get users by status
     *
     * @param status user status (ACTIVE/INACTIVE/LOCKED/DISABLED/DELETED)
     * @return user list
     */
    @Operation(summary = "Get users by status", description = "Filter user list by user status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<UserDTO>> findByStatus(
            @Parameter(description = "User status", required = true, example = "ACTIVE")
            @PathVariable String status) {
        return ResponseEntity.ok(userService.findByStatus(status));
    }
    
    /**
     * Get users by role
     *
     * @param role user role (SUPER_ADMIN/ADMIN/OPERATOR/USER/GUEST)
     * @return user list
     */
    @Operation(summary = "Get users by role", description = "Filter user list by user role")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query successful",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class))))
    })
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<UserDTO>> findByRole(
            @Parameter(description = "User role", required = true, example = "ADMIN")
            @PathVariable String role) {
        return ResponseEntity.ok(userService.findByRole(role));
    }
    
    // ==================== Write endpoints ====================
    
    /**
     * Create user
     *
     * @param request create request
     * @return created user info, returns 201 status code
     */
    @Operation(summary = "Create user", description = "Create a new user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Created successfully",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "409", description = "Username already exists", content = @Content)
    })
    @PostMapping
    public ResponseEntity<UserDTO> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Create user request", required = true,
                content = @Content(schema = @Schema(implementation = CreateUserRequest.class)))
            @Valid @RequestBody CreateUserRequest request) {
        UserDTO user = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    /**
     * Update user information
     *
     * @param userId  user ID
     * @param request update request
     * @return updated user info
     */
    @Operation(summary = "Update user info", description = "Update user basic information")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Updated successfully",
            content = @Content(schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> update(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Update user request", required = true,
                content = @Content(schema = @Schema(implementation = UpdateUserRequest.class)))
            @Valid @RequestBody UpdateUserRequest request) {
        UserDTO user = userService.update(userId, request);
        return ResponseEntity.ok(user);
    }
    
    /**
     * Delete user (soft delete)
     *
     * @param userId user ID
     * @return 204 No Content
     */
    @Operation(summary = "Delete user", description = "Soft delete a user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Deleted successfully"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId) {
        userService.delete(userId);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== Status management endpoints ====================
    
    /**
     * Enable user
     *
     * @param userId user ID
     * @param body   request body containing the reason field
     * @return 204 No Content
     */
    @Operation(summary = "Enable user", description = "Enable a disabled user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Enabled successfully"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/enable")
    public ResponseEntity<Void> enable(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Enabled by admin";
        userService.enable(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Disable user
     *
     * @param userId user ID
     * @param body   request body containing the reason field
     * @return 204 No Content
     */
    @Operation(summary = "Disable user", description = "Disable a user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Disabled successfully"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/disable")
    public ResponseEntity<Void> disable(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Disabled by admin";
        userService.disable(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Lock user
     *
     * @param userId user ID
     * @param body   request body containing the reason field
     * @return 204 No Content
     */
    @Operation(summary = "Lock user", description = "Lock a user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Locked successfully"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/lock")
    public ResponseEntity<Void> lock(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Account locked";
        userService.lock(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Unlock user
     *
     * @param userId user ID
     * @param body   request body containing the reason field
     * @return 204 No Content
     */
    @Operation(summary = "Unlock user", description = "Unlock a locked user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Unlocked successfully"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/unlock")
    public ResponseEntity<Void> unlock(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Unlocked by admin";
        userService.unlock(userId, reason);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== Password management endpoints ====================
    
    /**
     * Change password (user self-service)
     *
     * @param userId user ID
     * @param body   request body containing oldPassword and newPassword
     * @return 204 No Content
     */
    @Operation(summary = "Change password", description = "User changes their own login password")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Changed successfully"),
        @ApiResponse(responseCode = "400", description = "Old password incorrect", content = @Content),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/change-password")
    public ResponseEntity<Void> changePassword(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        
        if (oldPassword == null || newPassword == null) {
            throw new IllegalArgumentException("oldPassword and newPassword must not be empty");
        }
        
        userService.changePassword(userId, oldPassword, newPassword);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Reset password (admin operation)
     *
     * @param userId user ID
     * @param body   request body containing newPassword
     * @return 204 No Content
     */
    @Operation(summary = "Reset password", description = "Admin resets user password")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Reset successful"),
        @ApiResponse(responseCode = "404", description = "User not found", content = @Content)
    })
    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Parameter(description = "User ID", required = true, example = "U20260128001")
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        
        if (newPassword == null) {
            throw new IllegalArgumentException("newPassword must not be empty");
        }
        
        userService.resetPassword(userId, newPassword);
        return ResponseEntity.noContent().build();
    }
}
