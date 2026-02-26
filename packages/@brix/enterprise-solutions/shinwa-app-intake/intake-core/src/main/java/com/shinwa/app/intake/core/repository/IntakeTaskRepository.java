/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.repository;

import com.shinwa.app.intake.core.domain.IntakeTask;
import com.shinwa.app.intake.core.domain.IntakeTaskStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for IntakeTask entity.
 * <p>
 * Provides data access operations for intake tasks.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Interface-based repository (Spring Data JPA)</li>
 *   <li>Implementation provided by Spring at runtime</li>
 *   <li>No direct SQL or infrastructure dependencies</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Repository
public interface IntakeTaskRepository extends JpaRepository<IntakeTask, Long> {

    /**
     * Finds an intake task by its task number.
     *
     * @param taskNo the task number
     * @return optional containing the task if found
     */
    Optional<IntakeTask> findByTaskNo(String taskNo);

    /**
     * Finds an intake task by its submission token.
     *
     * @param submissionToken the submission token
     * @return optional containing the task if found
     */
    Optional<IntakeTask> findBySubmissionToken(String submissionToken);

    /**
     * Finds all tasks for a specific case.
     *
     * @param caseId the case ID
     * @return list of intake tasks
     */
    List<IntakeTask> findByCaseId(Long caseId);

    /**
     * Finds all tasks for a specific case node.
     *
     * @param caseNodeId the case node ID
     * @return list of intake tasks
     */
    List<IntakeTask> findByCaseNodeId(Long caseNodeId);

    /**
     * Finds all tasks for a specific customer.
     *
     * @param customerId the customer ID
     * @param pageable pagination parameters
     * @return page of intake tasks
     */
    Page<IntakeTask> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Finds all tasks assigned to a specific reviewer.
     *
     * @param reviewerId the reviewer ID
     * @param pageable pagination parameters
     * @return page of intake tasks
     */
    Page<IntakeTask> findByAssignedReviewerId(String reviewerId, Pageable pageable);

    /**
     * Finds all tasks with a specific status.
     *
     * @param status the task status
     * @param pageable pagination parameters
     * @return page of intake tasks
     */
    Page<IntakeTask> findByStatus(IntakeTaskStatusEnum status, Pageable pageable);

    /**
     * Finds tasks with due date before the specified date.
     *
     * @param dueDate the due date threshold
     * @param status the task status
     * @return list of overdue tasks
     */
    List<IntakeTask> findByDueDateBeforeAndStatus(LocalDate dueDate, IntakeTaskStatusEnum status);

    /**
     * Searches tasks by keyword in title or description.
     *
     * @param keyword the search keyword
     * @param pageable pagination parameters
     * @return page of matching tasks
     */
    @Query("SELECT t FROM IntakeTask t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.taskNo) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<IntakeTask> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Finds tasks with filters.
     *
     * @param customerId optional customer ID filter
     * @param status optional status filter
     * @param reviewerId optional reviewer ID filter
     * @param dueDateFrom optional due date from filter
     * @param dueDateTo optional due date to filter
     * @param pageable pagination parameters
     * @return page of matching tasks
     */
    @Query("SELECT t FROM IntakeTask t WHERE " +
           "(:customerId IS NULL OR t.customerId = :customerId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:reviewerId IS NULL OR t.assignedReviewerId = :reviewerId) AND " +
           "(:dueDateFrom IS NULL OR t.dueDate >= :dueDateFrom) AND " +
           "(:dueDateTo IS NULL OR t.dueDate <= :dueDateTo)")
    Page<IntakeTask> findWithFilters(
        @Param("customerId") Long customerId,
        @Param("status") IntakeTaskStatusEnum status,
        @Param("reviewerId") String reviewerId,
        @Param("dueDateFrom") LocalDate dueDateFrom,
        @Param("dueDateTo") LocalDate dueDateTo,
        Pageable pageable
    );

    /**
     * Counts tasks by status.
     *
     * @param status the task status
     * @return count of tasks
     */
    long countByStatus(IntakeTaskStatusEnum status);

    /**
     * Counts tasks by customer.
     *
     * @param customerId the customer ID
     * @return count of tasks
     */
    long countByCustomerId(Long customerId);

    /**
     * Checks if a task exists for a case node.
     *
     * @param caseNodeId the case node ID
     * @return true if task exists
     */
    boolean existsByCaseNodeId(Long caseNodeId);
}
