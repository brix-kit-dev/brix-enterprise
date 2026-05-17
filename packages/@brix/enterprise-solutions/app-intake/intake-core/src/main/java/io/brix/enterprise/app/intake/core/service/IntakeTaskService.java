/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.core.service;

import io.brix.enterprise.app.intake.api.dto.*;
import io.brix.enterprise.app.intake.api.request.*;
import io.brix.enterprise.app.intake.core.domain.*;
import io.brix.enterprise.app.intake.core.mapper.IntakeMapper;
import io.brix.enterprise.app.intake.core.repository.IntakeChecklistItemRepository;
import io.brix.enterprise.app.intake.core.repository.IntakeTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Intake Task Application Service.
 * <p>
 * Provides business operations for managing intake tasks.
 * Orchestrates domain logic and publishes domain events.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Service layer orchestrates domain operations</li>
 *   <li>Uses EventBusCapability for event publishing (Runtime Shell abstraction)</li>
 *   <li>No direct infrastructure dependencies</li>
 *   <li>Transaction boundary at service method level</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class IntakeTaskService {

    private final IntakeTaskRepository taskRepository;
    private final IntakeChecklistItemRepository itemRepository;
    private final IntakeMapper mapper;
    private final IntakeEventPublisher eventPublisher;

    // ========================================================================
    // Task CRUD Operations
    // ========================================================================

    /**
     * Creates a new intake task.
     *
     * @param request the creation request
     * @param userId the creator user ID
     * @return the created task DTO
     */
    public IntakeTaskDTO createTask(CreateIntakeTaskRequest request, String userId) {
        log.info("Creating intake task for customer: {}", request.getCustomerId());

        // Build domain entity
        IntakeTask task = IntakeTask.builder()
            .taskNo(generateTaskNo())
            .title(request.getTitle())
            .description(request.getDescription())
            .status(IntakeTaskStatusEnum.DRAFT)
            .priority(mapPriority(request.getPriority()))
            .caseId(request.getCaseId())
            .caseNodeId(request.getCaseNodeId())
            .customerId(request.getCustomerId())
            .templateId(request.getTemplateId())
            .dueDate(request.getDueDate())
            .instructions(request.getInstructions())
            .allowPartialSubmission(request.getAllowPartialSubmission() != null ? request.getAllowPartialSubmission() : true)
            .reminderEnabled(request.getReminderEnabled() != null ? request.getReminderEnabled() : true)
            .assignedReviewerId(request.getAssignedReviewerId())
            .submissionToken(generateSubmissionToken())
            .createdBy(userId)
            .updatedBy(userId)
            .build();

        // Add checklist items if provided
        if (request.getChecklistItems() != null) {
            int sortOrder = 0;
            for (CreateChecklistItemRequest itemRequest : request.getChecklistItems()) {
                IntakeChecklistItem item = buildChecklistItem(itemRequest, sortOrder++);
                task.addChecklistItem(item);
            }
        }

        // Save
        IntakeTask saved = taskRepository.save(task);
        log.info("Created intake task: {} with {} items", saved.getTaskNo(), saved.getTotalItems());

        // Publish event
        publishTaskCreatedEvent(saved);

        return mapper.toDTO(saved);
    }

    /**
     * Gets a task by ID.
     *
     * @param taskId the task ID
     * @return the task DTO
     */
    @Transactional(readOnly = true)
    public IntakeTaskDTO getTask(Long taskId) {
        IntakeTask task = findTaskOrThrow(taskId);
        return mapper.toDTO(task);
    }

    /**
     * Gets a task by submission token (for customer access).
     *
     * @param token the submission token
     * @return the task DTO
     */
    @Transactional(readOnly = true)
    public IntakeTaskDTO getTaskByToken(String token) {
        IntakeTask task = taskRepository.findBySubmissionToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid submission token"));
        return mapper.toDTO(task);
    }

    /**
     * Updates a task.
     *
     * @param taskId the task ID
     * @param request the update request
     * @param userId the updater user ID
     * @return the updated task DTO
     */
    public IntakeTaskDTO updateTask(Long taskId, UpdateIntakeTaskRequest request, String userId) {
        log.info("Updating intake task: {}", taskId);

        IntakeTask task = findTaskOrThrow(taskId);

        // Update fields if provided
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getInstructions() != null) {
            task.setInstructions(request.getInstructions());
        }
        if (request.getPriority() != null) {
            task.setPriority(mapPriority(request.getPriority()));
        }
        if (request.getAllowPartialSubmission() != null) {
            task.setAllowPartialSubmission(request.getAllowPartialSubmission());
        }
        if (request.getReminderEnabled() != null) {
            task.setReminderEnabled(request.getReminderEnabled());
        }
        if (request.getAssignedReviewerId() != null) {
            task.setAssignedReviewerId(request.getAssignedReviewerId());
        }
        if (request.getReviewerNotes() != null) {
            task.setReviewerNotes(request.getReviewerNotes());
        }

        task.setUpdatedBy(userId);
        IntakeTask saved = taskRepository.save(task);

        return mapper.toDTO(saved);
    }

    /**
     * Activates a draft task (changes status to PENDING).
     *
     * @param taskId the task ID
     * @param userId the user ID
     * @return the updated task DTO
     */
    public IntakeTaskDTO activateTask(Long taskId, String userId) {
        log.info("Activating intake task: {}", taskId);

        IntakeTask task = findTaskOrThrow(taskId);
        if (task.getStatus() != IntakeTaskStatusEnum.DRAFT) {
            throw new IllegalStateException("Only DRAFT tasks can be activated");
        }

        task.setStatus(IntakeTaskStatusEnum.PENDING);
        task.setUpdatedBy(userId);
        IntakeTask saved = taskRepository.save(task);

        return mapper.toDTO(saved);
    }

    /**
     * Cancels a task.
     *
     * @param taskId the task ID
     * @param userId the user ID
     * @return the updated task DTO
     */
    public IntakeTaskDTO cancelTask(Long taskId, String userId) {
        log.info("Cancelling intake task: {}", taskId);

        IntakeTask task = findTaskOrThrow(taskId);
        if (task.getStatus() == IntakeTaskStatusEnum.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed task");
        }

        task.setStatus(IntakeTaskStatusEnum.CANCELLED);
        task.setUpdatedBy(userId);
        IntakeTask saved = taskRepository.save(task);

        return mapper.toDTO(saved);
    }

    /**
     * Deletes a task.
     *
     * @param taskId the task ID
     */
    public void deleteTask(Long taskId) {
        log.info("Deleting intake task: {}", taskId);
        IntakeTask task = findTaskOrThrow(taskId);
        taskRepository.delete(task);
    }

    // ========================================================================
    // Query Operations
    // ========================================================================

    /**
     * Lists tasks with pagination and filters.
     *
     * @param customerId optional customer filter
     * @param status optional status filter
     * @param reviewerId optional reviewer filter
     * @param dueDateFrom optional due date from filter
     * @param dueDateTo optional due date to filter
     * @param page page number
     * @param size page size
     * @param sort sort field
     * @param direction sort direction
     * @return page of task DTOs
     */
    @Transactional(readOnly = true)
    public Page<IntakeTaskDTO> listTasks(
        Long customerId,
        String status,
        String reviewerId,
        LocalDate dueDateFrom,
        LocalDate dueDateTo,
        int page,
        int size,
        String sort,
        String direction
    ) {
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = sort != null ? sort : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortField));

        IntakeTaskStatusEnum statusEnum = status != null ? 
            IntakeTaskStatusEnum.valueOf(status) : null;

        Page<IntakeTask> tasks = taskRepository.findWithFilters(
            customerId, statusEnum, reviewerId, dueDateFrom, dueDateTo, pageable
        );

        return tasks.map(mapper::toDTO);
    }

    /**
     * Searches tasks by keyword.
     *
     * @param keyword the search keyword
     * @param page page number
     * @param size page size
     * @return page of task DTOs
     */
    @Transactional(readOnly = true)
    public Page<IntakeTaskDTO> searchTasks(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IntakeTask> tasks = taskRepository.searchByKeyword(keyword, pageable);
        return tasks.map(mapper::toDTO);
    }

    /**
     * Gets paginated tasks for a specific case.
     *
     * <p><b>Phase 4.1/4.2:</b> Uses {@code @EntityGraph} on the repository method
     * to eagerly fetch checklist items (N+1 prevention), and returns {@code Page<>}
     * instead of unbounded {@code List<>} (memory safety).</p>
     *
     * @param caseId the case ID
     * @param page   zero-based page number
     * @param size   page size (number of tasks per page)
     * @return page of task DTOs with pagination metadata
     */
    @Transactional(readOnly = true)
    public Page<IntakeTaskDTO> getTasksByCase(Long caseId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IntakeTask> tasks = taskRepository.findByCaseId(caseId, pageable);
        return tasks.map(mapper::toDTO);
    }

    // ========================================================================
    // Document Submission Operations
    // ========================================================================

    /**
     * Submits a document to a checklist item.
     *
     * @param taskId the task ID
     * @param request the submission request
     * @param userId the submitter user ID
     * @return the updated checklist item DTO
     */
    public IntakeChecklistItemDTO submitDocument(Long taskId, SubmitDocumentRequest request, String userId) {
        log.info("Submitting document for task: {}, item: {}", taskId, request.getItemId());

        IntakeTask task = findTaskOrThrow(taskId);
        IntakeChecklistItem item = findItemOrThrow(request.getItemId());

        // Validate item belongs to task
        if (!item.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Item does not belong to this task");
        }

        // Submit document
        item.submitDocument(request.getFileId(), request.getFileName(), userId);
        IntakeChecklistItem savedItem = itemRepository.save(item);

        // Update task status
        task.updateStatusBasedOnItems();
        task.setUpdatedBy(userId);
        taskRepository.save(task);

        // Publish event
        publishDocumentSubmittedEvent(task, savedItem);

        return mapper.toItemDTO(savedItem);
    }

    // ========================================================================
    // Document Review Operations
    // ========================================================================

    /**
     * Reviews a submitted document.
     *
     * @param taskId the task ID
     * @param request the review request
     * @param userId the reviewer user ID
     * @return the updated checklist item DTO
     */
    public IntakeChecklistItemDTO reviewDocument(Long taskId, ReviewDocumentRequest request, String userId) {
        log.info("Reviewing document for task: {}, item: {}, decision: {}", 
            taskId, request.getItemId(), request.getDecision());

        IntakeTask task = findTaskOrThrow(taskId);
        IntakeChecklistItem item = findItemOrThrow(request.getItemId());

        // Validate item belongs to task
        if (!item.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Item does not belong to this task");
        }

        // Validate item has been submitted
        if (item.getUploadedFileId() == null) {
            throw new IllegalStateException("Item has no document to review");
        }

        // Apply review decision
        String decision = request.getDecision().toUpperCase();
        if ("APPROVED".equals(decision)) {
            item.approve(userId, request.getComment());
        } else if ("REJECTED".equals(decision)) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required");
            }
            item.reject(userId, request.getRejectionReason());
        } else {
            throw new IllegalArgumentException("Invalid decision: " + decision);
        }

        IntakeChecklistItem savedItem = itemRepository.save(item);

        // Update task status
        task.updateStatusBasedOnItems();
        task.setUpdatedBy(userId);
        IntakeTask savedTask = taskRepository.save(task);

        // Check if task is now complete
        if (savedTask.isComplete()) {
            publishTaskCompletedEvent(savedTask, userId);
        }

        return mapper.toItemDTO(savedItem);
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    private IntakeTask findTaskOrThrow(Long taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Intake task not found: " + taskId));
    }

    private IntakeChecklistItem findItemOrThrow(Long itemId) {
        return itemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Checklist item not found: " + itemId));
    }

    private String generateTaskNo() {
        int year = LocalDate.now().getYear();
        long count = taskRepository.count() + 1;
        return String.format("INT-%d-%04d", year, count);
    }

    private String generateSubmissionToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private IntakeTaskPriorityEnum mapPriority(String priority) {
        if (priority == null) {
            return IntakeTaskPriorityEnum.NORMAL;
        }
        try {
            return IntakeTaskPriorityEnum.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return IntakeTaskPriorityEnum.NORMAL;
        }
    }

    private IntakeChecklistItem buildChecklistItem(CreateChecklistItemRequest request, int sortOrder) {
        IntakeDocumentCategoryEnum category = null;
        if (request.getCategory() != null) {
            try {
                category = IntakeDocumentCategoryEnum.valueOf(request.getCategory().toUpperCase());
            } catch (IllegalArgumentException e) {
                category = IntakeDocumentCategoryEnum.OTHER;
            }
        }

        return IntakeChecklistItem.builder()
            .itemCode(request.getItemCode())
            .name(request.getName())
            .description(request.getDescription())
            .category(category)
            .required(request.getRequired() != null ? request.getRequired() : true)
            .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : sortOrder)
            .acceptedFormats(request.getAcceptedFormats() != null ? request.getAcceptedFormats() : "PDF,JPG,PNG")
            .maxFileSize(request.getMaxFileSize() != null ? request.getMaxFileSize() : 10 * 1024 * 1024L)
            .minFiles(request.getMinFiles() != null ? request.getMinFiles() : 1)
            .maxFiles(request.getMaxFiles() != null ? request.getMaxFiles() : 5)
            .sampleDocumentUrl(request.getSampleDocumentUrl())
            .helpText(request.getHelpText())
            .validationRules(request.getValidationRules())
            .build();
    }

    private void publishTaskCreatedEvent(IntakeTask task) {
        eventPublisher.publishTaskCreatedEvent(task);
    }

    private void publishDocumentSubmittedEvent(IntakeTask task, IntakeChecklistItem item) {
        eventPublisher.publishDocumentSubmittedEvent(task, item);
    }

    private void publishTaskCompletedEvent(IntakeTask task, String reviewerId) {
        eventPublisher.publishTaskCompletedEvent(task, reviewerId);
    }
}
