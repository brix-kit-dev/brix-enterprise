/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.repository;

import com.shinwa.app.intake.core.domain.IntakeChecklistItem;
import com.shinwa.app.intake.core.domain.IntakeItemStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for IntakeChecklistItem entity.
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Repository
public interface IntakeChecklistItemRepository extends JpaRepository<IntakeChecklistItem, Long> {

    /**
     * Finds all checklist items for a task.
     *
     * @param taskId the task ID
     * @return list of checklist items ordered by sort order
     */
    List<IntakeChecklistItem> findByTaskIdOrderBySortOrderAsc(Long taskId);

    /**
     * Finds a checklist item by task ID and item code.
     *
     * @param taskId the task ID
     * @param itemCode the item code
     * @return optional containing the item if found
     */
    Optional<IntakeChecklistItem> findByTaskIdAndItemCode(Long taskId, String itemCode);

    /**
     * Finds all items with a specific status for a task.
     *
     * @param taskId the task ID
     * @param status the item status
     * @return list of matching items
     */
    List<IntakeChecklistItem> findByTaskIdAndStatus(Long taskId, IntakeItemStatusEnum status);

    /**
     * Counts items by task and status.
     *
     * @param taskId the task ID
     * @param status the item status
     * @return count of items
     */
    long countByTaskIdAndStatus(Long taskId, IntakeItemStatusEnum status);

    /**
     * Counts required items for a task.
     *
     * @param taskId the task ID
     * @param required whether required
     * @return count of items
     */
    long countByTaskIdAndRequired(Long taskId, Boolean required);

    /**
     * Deletes all items for a task.
     *
     * @param taskId the task ID
     */
    void deleteByTaskId(Long taskId);
}
