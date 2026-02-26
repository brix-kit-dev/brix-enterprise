/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.mapper;

import com.shinwa.app.intake.api.dto.*;
import com.shinwa.app.intake.core.domain.*;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Intake module entities and DTOs.
 * <p>
 * Provides bidirectional mapping between domain entities and DTOs.
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface IntakeMapper {

    // ========================================================================
    // IntakeTask Mappings
    // ========================================================================

    /**
     * Maps IntakeTask entity to DTO.
     *
     * @param entity the domain entity
     * @return the DTO
     */
    @Mapping(target = "status", source = "status", qualifiedByName = "taskStatusToDTO")
    @Mapping(target = "priority", source = "priority", qualifiedByName = "priorityToDTO")
    @Mapping(target = "totalItems", expression = "java(entity.getTotalItems())")
    @Mapping(target = "submittedItems", expression = "java(entity.getSubmittedItems())")
    @Mapping(target = "approvedItems", expression = "java(entity.getApprovedItems())")
    @Mapping(target = "rejectedItems", expression = "java(entity.getRejectedItems())")
    @Mapping(target = "completionPercent", expression = "java(entity.getCompletionPercent())")
    @Mapping(target = "submissionLink", expression = "java(buildSubmissionLink(entity))")
    IntakeTaskDTO toDTO(IntakeTask entity);

    /**
     * Maps a list of IntakeTask entities to DTOs.
     *
     * @param entities the domain entities
     * @return the DTOs
     */
    List<IntakeTaskDTO> toDTOs(List<IntakeTask> entities);

    // ========================================================================
    // IntakeChecklistItem Mappings
    // ========================================================================

    /**
     * Maps IntakeChecklistItem entity to DTO.
     *
     * @param entity the domain entity
     * @return the DTO
     */
    @Mapping(target = "taskId", source = "task.id")
    @Mapping(target = "category", source = "category", qualifiedByName = "categoryToDTO")
    @Mapping(target = "status", source = "status", qualifiedByName = "itemStatusToDTO")
    @Mapping(target = "reviewStatus", source = "reviewStatus", qualifiedByName = "reviewStatusToDTO")
    IntakeChecklistItemDTO toItemDTO(IntakeChecklistItem entity);

    /**
     * Maps a list of IntakeChecklistItem entities to DTOs.
     *
     * @param entities the domain entities
     * @return the DTOs
     */
    List<IntakeChecklistItemDTO> toItemDTOs(List<IntakeChecklistItem> entities);

    // ========================================================================
    // Enum Mapping Methods
    // ========================================================================

    @Named("taskStatusToDTO")
    default IntakeTaskStatus taskStatusToDTO(IntakeTaskStatusEnum status) {
        if (status == null) return null;
        return IntakeTaskStatus.valueOf(status.name());
    }

    @Named("priorityToDTO")
    default IntakeTaskPriority priorityToDTO(IntakeTaskPriorityEnum priority) {
        if (priority == null) return null;
        return IntakeTaskPriority.valueOf(priority.name());
    }

    @Named("categoryToDTO")
    default IntakeDocumentCategory categoryToDTO(IntakeDocumentCategoryEnum category) {
        if (category == null) return null;
        return IntakeDocumentCategory.valueOf(category.name());
    }

    @Named("itemStatusToDTO")
    default IntakeItemStatus itemStatusToDTO(IntakeItemStatusEnum status) {
        if (status == null) return null;
        return IntakeItemStatus.valueOf(status.name());
    }

    @Named("reviewStatusToDTO")
    default IntakeReviewStatus reviewStatusToDTO(IntakeReviewStatusEnum status) {
        if (status == null) return null;
        return IntakeReviewStatus.valueOf(status.name());
    }

    // ========================================================================
    // Default Methods
    // ========================================================================

    /**
     * Builds the submission link for a task.
     *
     * @param task the intake task
     * @return the submission link URL
     */
    default String buildSubmissionLink(IntakeTask task) {
        if (task.getSubmissionToken() == null) {
            return null;
        }
        // Base URL would be configured externally
        return "/intake/submit/" + task.getSubmissionToken();
    }
}
