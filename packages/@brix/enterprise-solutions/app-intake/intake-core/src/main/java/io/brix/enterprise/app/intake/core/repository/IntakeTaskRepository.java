/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.core.repository;

import io.brix.enterprise.app.intake.core.domain.IntakeTask;
import io.brix.enterprise.app.intake.core.domain.IntakeTaskStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for {@link IntakeTask} entity.
 *
 * <p>Provides data access operations for intake tasks with optimized fetch strategies
 * to prevent N+1 query issues on the {@code checklistItems} association.</p>
 *
 * <h3>N+1 Prevention Strategy</h3>
 * <p>Methods that return collections of {@link IntakeTask} use
 * {@link EntityGraph @EntityGraph(attributePaths = "checklistItems")} to eagerly
 * fetch the one-to-many {@code checklistItems} association in a single SQL JOIN,
 * avoiding N+1 SELECT storms when the caller iterates over tasks and accesses
 * their checklist items (e.g., for DTO mapping via {@code mapper.toDTO()}).</p>
 *
 * <h3>Pagination Strategy (Phase 4.2)</h3>
 * <p>Previously unbounded {@code List<>} methods ({@code findByCaseId},
 * {@code findByCaseNodeId}) have been converted to {@code Page<>} return types
 * with mandatory {@link Pageable} parameters to prevent memory exhaustion on
 * large result sets. This aligns with the Spring Data best practice of never
 * returning unbounded collections from repository methods.</p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Interface-based repository (Spring Data JPA)</li>
 *   <li>Implementation provided by Spring at runtime</li>
 *   <li>No direct SQL or infrastructure dependencies</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface IntakeTaskRepository extends JpaRepository<IntakeTask, Long> {

    /**
     * Finds an intake task by its task number.
     *
     * <p>Uses {@code @EntityGraph} to eagerly fetch {@code checklistItems},
     * since callers typically need the full task aggregate for display or processing.</p>
     *
     * @param taskNo the task number (unique business identifier, e.g., "INT-2026-0001")
     * @return optional containing the task with its checklist items if found
     */
    @EntityGraph(attributePaths = "checklistItems")
    Optional<IntakeTask> findByTaskNo(String taskNo);

    /**
     * Finds an intake task by its submission token (customer-facing access).
     *
     * <p>Uses {@code @EntityGraph} to eagerly fetch {@code checklistItems},
     * as the customer submission flow requires the complete checklist.</p>
     *
     * @param submissionToken the submission token (UUID-based, for customer portal links)
     * @return optional containing the task with its checklist items if found
     */
    @EntityGraph(attributePaths = "checklistItems")
    Optional<IntakeTask> findBySubmissionToken(String submissionToken);

    /**
     * Finds paginated tasks for a specific case, with checklist items eagerly fetched.
     *
     * <p><b>N+1 Prevention:</b> {@code @EntityGraph} ensures checklist items are loaded
     * in the same query via SQL JOIN, avoiding separate SELECT per task.</p>
     *
     * <p><b>Pagination (Phase 4.2):</b> Previously returned unbounded {@code List<>}.
     * Now requires {@link Pageable} to prevent memory exhaustion when a case has
     * many associated tasks.</p>
     *
     * @param caseId   the case ID to filter by
     * @param pageable pagination and sorting parameters
     * @return page of intake tasks with their checklist items
     */
    @EntityGraph(attributePaths = "checklistItems")
    Page<IntakeTask> findByCaseId(Long caseId, Pageable pageable);

    /**
     * Finds paginated tasks for a specific case node (workflow step), with checklist items eagerly fetched.
     *
     * <p><b>N+1 Prevention:</b> {@code @EntityGraph} ensures checklist items are loaded
     * in the same query via SQL JOIN.</p>
     *
     * <p><b>Pagination (Phase 4.2):</b> Previously returned unbounded {@code List<>}.
     * Now requires {@link Pageable} to prevent memory exhaustion.</p>
     *
     * @param caseNodeId the case node ID (workflow step identifier)
     * @param pageable   pagination and sorting parameters
     * @return page of intake tasks with their checklist items
     */
    @EntityGraph(attributePaths = "checklistItems")
    Page<IntakeTask> findByCaseNodeId(Long caseNodeId, Pageable pageable);

    /**
     * Finds paginated tasks for a specific customer, with checklist items eagerly fetched.
     *
     * <p><b>N+1 Prevention:</b> {@code @EntityGraph} ensures checklist items are loaded
     * in the same query via SQL JOIN.</p>
     *
     * @param customerId the customer ID
     * @param pageable   pagination parameters
     * @return page of intake tasks with their checklist items
     */
    @EntityGraph(attributePaths = "checklistItems")
    Page<IntakeTask> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Finds paginated tasks assigned to a specific reviewer, with checklist items eagerly fetched.
     *
     * <p><b>N+1 Prevention:</b> {@code @EntityGraph} ensures checklist items are loaded
     * in the same query via SQL JOIN.</p>
     *
     * @param reviewerId the reviewer user ID
     * @param pageable   pagination parameters
     * @return page of intake tasks with their checklist items
     */
    @EntityGraph(attributePaths = "checklistItems")
    Page<IntakeTask> findByAssignedReviewerId(String reviewerId, Pageable pageable);

    /**
     * Finds paginated tasks with a specific status, with checklist items eagerly fetched.
     *
     * <p><b>N+1 Prevention:</b> {@code @EntityGraph} ensures checklist items are loaded
     * in the same query via SQL JOIN.</p>
     *
     * @param status   the task status to filter by
     * @param pageable pagination parameters
     * @return page of intake tasks with their checklist items
     */
    @EntityGraph(attributePaths = "checklistItems")
    Page<IntakeTask> findByStatus(IntakeTaskStatusEnum status, Pageable pageable);

    /**
     * Finds overdue tasks: tasks with due date before the specified threshold and matching status.
     *
     * <p><b>N+1 Prevention:</b> Uses {@code JOIN FETCH} in a custom JPQL query to eagerly
     * load checklist items. This is preferred over {@code @EntityGraph} here because
     * the method returns a {@code List<>} (overdue task sets are typically small and
     * bounded by business rules), and the explicit JOIN FETCH makes the fetch strategy
     * visible in the query itself.</p>
     *
     * @param dueDate the due date threshold (exclusive upper bound)
     * @param status  the task status to match (typically {@code PENDING} or {@code IN_PROGRESS})
     * @return list of overdue tasks with their checklist items
     */
    @Query("SELECT DISTINCT t FROM IntakeTask t LEFT JOIN FETCH t.checklistItems " +
           "WHERE t.dueDate < :dueDate AND t.status = :status ORDER BY t.dueDate ASC")
    List<IntakeTask> findByDueDateBeforeAndStatus(
        @Param("dueDate") LocalDate dueDate,
        @Param("status") IntakeTaskStatusEnum status
    );

    /**
     * Searches tasks by keyword in title, description, or task number.
     *
     * <p><b>N+1 Prevention:</b> Uses {@code JOIN FETCH} to eagerly load checklist items
     * within the same JPQL query, so DTO mapping does not trigger lazy loading.</p>
     *
     * @param keyword  the search keyword (case-insensitive partial match)
     * @param pageable pagination parameters
     * @return page of matching tasks with their checklist items
     */
    @Query(value = "SELECT DISTINCT t FROM IntakeTask t LEFT JOIN FETCH t.checklistItems " +
           "WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.taskNo) LIKE LOWER(CONCAT('%', :keyword, '%'))",
           countQuery = "SELECT COUNT(t) FROM IntakeTask t " +
           "WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.taskNo) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<IntakeTask> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Finds tasks with composite filters and eager checklist items fetch.
     *
     * <p><b>N+1 Prevention:</b> Uses {@code JOIN FETCH} in a custom JPQL query.
     * A separate {@code countQuery} is provided because {@code JOIN FETCH} with
     * {@code Page<>} requires an explicit count query without the fetch join
     * (Hibernate limitation: fetch joins in count queries cause errors).</p>
     *
     * @param customerId  optional customer ID filter (null = no filter)
     * @param status      optional status filter (null = no filter)
     * @param reviewerId  optional reviewer ID filter (null = no filter)
     * @param dueDateFrom optional due date lower bound inclusive (null = no filter)
     * @param dueDateTo   optional due date upper bound inclusive (null = no filter)
     * @param pageable    pagination parameters
     * @return page of matching tasks with their checklist items
     */
    @Query(value = "SELECT DISTINCT t FROM IntakeTask t LEFT JOIN FETCH t.checklistItems " +
           "WHERE (:customerId IS NULL OR t.customerId = :customerId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:reviewerId IS NULL OR t.assignedReviewerId = :reviewerId) AND " +
           "(:dueDateFrom IS NULL OR t.dueDate >= :dueDateFrom) AND " +
           "(:dueDateTo IS NULL OR t.dueDate <= :dueDateTo)",
           countQuery = "SELECT COUNT(t) FROM IntakeTask t " +
           "WHERE (:customerId IS NULL OR t.customerId = :customerId) AND " +
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
     * @return count of tasks with the given status
     */
    long countByStatus(IntakeTaskStatusEnum status);

    /**
     * Counts tasks by customer.
     *
     * @param customerId the customer ID
     * @return count of tasks for the given customer
     */
    long countByCustomerId(Long customerId);

    /**
     * Checks if a task exists for a case node.
     *
     * @param caseNodeId the case node ID
     * @return true if at least one task exists for the given case node
     */
    boolean existsByCaseNodeId(Long caseNodeId);
}
