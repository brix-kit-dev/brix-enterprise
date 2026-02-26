/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.server.controller;

import com.shinwa.app.intake.api.dto.IntakeChecklistItemDTO;
import com.shinwa.app.intake.api.dto.IntakeTaskDTO;
import com.shinwa.app.intake.api.request.*;
import com.shinwa.app.intake.core.service.IntakeTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for Intake Task Management.
 * <p>
 * Provides RESTful API endpoints for managing medical document intake tasks.
 * All business logic is delegated to the service layer.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Controller only handles HTTP request/response</li>
 *   <li>No business logic in controller</li>
 *   <li>Full OpenAPI documentation</li>
 *   <li>Proper HTTP status codes and error handling</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@RestController
@RequestMapping("/api/v1/intake/tasks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Intake Tasks", description = "Medical document intake task management APIs")
public class IntakeTaskController {

    private final IntakeTaskService taskService;

    // ========================================================================
    // Task CRUD Endpoints
    // ========================================================================

    /**
     * Creates a new intake task.
     *
     * @param request the creation request
     * @param principal the authenticated user
     * @return the created task
     */
    @PostMapping
    @Operation(summary = "Create intake task", description = "Creates a new document intake task")
    public ResponseEntity<IntakeTaskDTO> createTask(
        @Valid @RequestBody CreateIntakeTaskRequest request,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("POST /api/v1/intake/tasks - user: {}", userId);
        IntakeTaskDTO task = taskService.createTask(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    /**
     * Gets a task by ID.
     *
     * @param taskId the task ID
     * @return the task
     */
    @GetMapping("/{taskId}")
    @Operation(summary = "Get intake task", description = "Gets an intake task by ID")
    public ResponseEntity<IntakeTaskDTO> getTask(
        @Parameter(description = "Task ID") @PathVariable Long taskId
    ) {
        log.info("GET /api/v1/intake/tasks/{}", taskId);
        IntakeTaskDTO task = taskService.getTask(taskId);
        return ResponseEntity.ok(task);
    }

    /**
     * Updates a task.
     *
     * @param taskId the task ID
     * @param request the update request
     * @param principal the authenticated user
     * @return the updated task
     */
    @PutMapping("/{taskId}")
    @Operation(summary = "Update intake task", description = "Updates an existing intake task")
    public ResponseEntity<IntakeTaskDTO> updateTask(
        @Parameter(description = "Task ID") @PathVariable Long taskId,
        @Valid @RequestBody UpdateIntakeTaskRequest request,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("PUT /api/v1/intake/tasks/{} - user: {}", taskId, userId);
        IntakeTaskDTO task = taskService.updateTask(taskId, request, userId);
        return ResponseEntity.ok(task);
    }

    /**
     * Deletes a task.
     *
     * @param taskId the task ID
     * @return no content
     */
    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete intake task", description = "Deletes an intake task")
    public ResponseEntity<Void> deleteTask(
        @Parameter(description = "Task ID") @PathVariable Long taskId
    ) {
        log.info("DELETE /api/v1/intake/tasks/{}", taskId);
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    // ========================================================================
    // Task Status Operations
    // ========================================================================

    /**
     * Activates a draft task.
     *
     * @param taskId the task ID
     * @param principal the authenticated user
     * @return the updated task
     */
    @PostMapping("/{taskId}/activate")
    @Operation(summary = "Activate task", description = "Activates a draft task for customer submission")
    public ResponseEntity<IntakeTaskDTO> activateTask(
        @Parameter(description = "Task ID") @PathVariable Long taskId,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("POST /api/v1/intake/tasks/{}/activate - user: {}", taskId, userId);
        IntakeTaskDTO task = taskService.activateTask(taskId, userId);
        return ResponseEntity.ok(task);
    }

    /**
     * Cancels a task.
     *
     * @param taskId the task ID
     * @param principal the authenticated user
     * @return the updated task
     */
    @PostMapping("/{taskId}/cancel")
    @Operation(summary = "Cancel task", description = "Cancels an intake task")
    public ResponseEntity<IntakeTaskDTO> cancelTask(
        @Parameter(description = "Task ID") @PathVariable Long taskId,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("POST /api/v1/intake/tasks/{}/cancel - user: {}", taskId, userId);
        IntakeTaskDTO task = taskService.cancelTask(taskId, userId);
        return ResponseEntity.ok(task);
    }

    // ========================================================================
    // Query Endpoints
    // ========================================================================

    /**
     * Lists tasks with pagination and filters.
     *
     * @param customerId optional customer filter
     * @param status optional status filter
     * @param reviewerId optional reviewer filter
     * @param dueDateFrom optional due date from filter
     * @param dueDateTo optional due date to filter
     * @param page page number (0-based)
     * @param size page size
     * @param sort sort field
     * @param direction sort direction
     * @return page of tasks
     */
    @GetMapping
    @Operation(summary = "List intake tasks", description = "Lists intake tasks with pagination and filters")
    public ResponseEntity<Page<IntakeTaskDTO>> listTasks(
        @Parameter(description = "Customer ID filter") @RequestParam(required = false) Long customerId,
        @Parameter(description = "Status filter") @RequestParam(required = false) String status,
        @Parameter(description = "Reviewer ID filter") @RequestParam(required = false) String reviewerId,
        @Parameter(description = "Due date from") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
        @Parameter(description = "Due date to") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
        @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sort,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String direction
    ) {
        log.info("GET /api/v1/intake/tasks - page: {}, size: {}", page, size);
        Page<IntakeTaskDTO> tasks = taskService.listTasks(
            customerId, status, reviewerId, dueDateFrom, dueDateTo, page, size, sort, direction
        );
        return ResponseEntity.ok(tasks);
    }

    /**
     * Searches tasks by keyword.
     *
     * @param keyword search keyword
     * @param page page number
     * @param size page size
     * @return page of matching tasks
     */
    @GetMapping("/search")
    @Operation(summary = "Search tasks", description = "Searches intake tasks by keyword")
    public ResponseEntity<Page<IntakeTaskDTO>> searchTasks(
        @Parameter(description = "Search keyword") @RequestParam String keyword,
        @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size
    ) {
        log.info("GET /api/v1/intake/tasks/search - keyword: {}", keyword);
        Page<IntakeTaskDTO> tasks = taskService.searchTasks(keyword, page, size);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Gets tasks for a specific case.
     *
     * @param caseId the case ID
     * @return list of tasks
     */
    @GetMapping("/by-case/{caseId}")
    @Operation(summary = "Get tasks by case", description = "Gets all intake tasks for a case")
    public ResponseEntity<List<IntakeTaskDTO>> getTasksByCase(
        @Parameter(description = "Case ID") @PathVariable Long caseId
    ) {
        log.info("GET /api/v1/intake/tasks/by-case/{}", caseId);
        List<IntakeTaskDTO> tasks = taskService.getTasksByCase(caseId);
        return ResponseEntity.ok(tasks);
    }

    // ========================================================================
    // Document Submission Endpoints
    // ========================================================================

    /**
     * Submits a document to a checklist item.
     *
     * @param taskId the task ID
     * @param request the submission request
     * @param principal the authenticated user
     * @return the updated checklist item
     */
    @PostMapping("/{taskId}/documents")
    @Operation(summary = "Submit document", description = "Submits a document to a checklist item")
    public ResponseEntity<IntakeChecklistItemDTO> submitDocument(
        @Parameter(description = "Task ID") @PathVariable Long taskId,
        @Valid @RequestBody SubmitDocumentRequest request,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("POST /api/v1/intake/tasks/{}/documents - user: {}, item: {}", taskId, userId, request.getItemId());
        IntakeChecklistItemDTO item = taskService.submitDocument(taskId, request, userId);
        return ResponseEntity.ok(item);
    }

    // ========================================================================
    // Document Review Endpoints
    // ========================================================================

    /**
     * Reviews a submitted document.
     *
     * @param taskId the task ID
     * @param request the review request
     * @param principal the authenticated user
     * @return the updated checklist item
     */
    @PostMapping("/{taskId}/review")
    @Operation(summary = "Review document", description = "Reviews a submitted document")
    public ResponseEntity<IntakeChecklistItemDTO> reviewDocument(
        @Parameter(description = "Task ID") @PathVariable Long taskId,
        @Valid @RequestBody ReviewDocumentRequest request,
        Principal principal
    ) {
        String userId = getUserId(principal);
        log.info("POST /api/v1/intake/tasks/{}/review - user: {}, item: {}, decision: {}", 
            taskId, userId, request.getItemId(), request.getDecision());
        IntakeChecklistItemDTO item = taskService.reviewDocument(taskId, request, userId);
        return ResponseEntity.ok(item);
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Extracts user ID from the principal.
     *
     * @param principal the authenticated user principal
     * @return the user ID
     */
    private String getUserId(Principal principal) {
        return principal != null ? principal.getName() : "anonymous";
    }
}
