package com.shinwa.app.contracts.repository;

import com.shinwa.app.contracts.entity.Contract;
import com.shinwa.app.contracts.enums.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 合同仓储接口
 *
 * <p>提供合同实体的数据访问操作，所有查询自动过滤已删除数据。
 *
 * <p>N+1查询优化说明：
 * <ul>
 *   <li>{@link #findByIdAndTenantId} - 使用 @EntityGraph 急加载 parties 和 signRecords</li>
 *   <li>{@link #findByIdWithDetails} - 使用 JOIN FETCH 显式加载关联数据</li>
 * </ul>
 *
 * <p>这两个方法适用于需要访问合同参与方或签署记录的场景，
 * 避免在遍历关联集合时触发 N+1 查询问题。
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    /**
     * 按租户和ID查询合同（包含关联数据）
     *
     * <p>使用 @EntityGraph 实现急加载，一次查询获取合同及其参与方、签署记录。
     * 
     * <p>适用场景：
     * <ul>
     *   <li>合同签署流程 - 需要访问 parties 判断签署顺序</li>
     *   <li>合同详情查看 - 需要展示 parties 和 signRecords</li>
     *   <li>合同状态变更 - 需要检查所有 parties 的签署状态</li>
     * </ul>
     *
     * <p>性能说明：通过 @EntityGraph 避免 N+1 查询，将原本可能的
     * 1 + N(parties) + M(signRecords) 次查询优化为单次查询。
     *
     * @param id       合同ID
     * @param tenantId 租户ID
     * @return 合同实体（包含 parties 和 signRecords）
     */
    @EntityGraph(attributePaths = {"parties", "signRecords"})
    @Query("SELECT c FROM Contract c WHERE c.id = :id AND c.tenantId = :tenantId AND c.deleted = false")
    Optional<Contract> findByIdAndTenantId(@Param("id") Long id, @Param("tenantId") String tenantId);

    /**
     * 按租户和ID查询合同，使用 JOIN FETCH 显式加载关联数据
     *
     * <p>使用 JPQL JOIN FETCH 语法实现急加载。与 @EntityGraph 方式相比：
     * <ul>
     *   <li>JOIN FETCH 可以在复杂查询中更灵活地控制加载策略</li>
     *   <li>支持在 JPQL 中添加额外的过滤条件</li>
     *   <li>LEFT JOIN FETCH 确保即使没有关联数据也能返回主实体</li>
     * </ul>
     *
     * <p>适用于需要更细粒度控制加载策略的场景。
     *
     * @param id       合同ID
     * @param tenantId 租户ID
     * @return 合同实体（包含 parties 和 signRecords）
     */
    @Query("SELECT DISTINCT c FROM Contract c " +
           "LEFT JOIN FETCH c.parties " +
           "LEFT JOIN FETCH c.signRecords " +
           "WHERE c.id = :id AND c.tenantId = :tenantId AND c.deleted = false")
    Optional<Contract> findByIdWithDetails(@Param("id") Long id, @Param("tenantId") String tenantId);

    /**
     * 按合同编号查询
     *
     * @param contractNo 合同编号
     * @param tenantId   租户ID
     * @return 合同实体
     */
    @Query("SELECT c FROM Contract c WHERE c.contractNo = :contractNo AND c.tenantId = :tenantId AND c.deleted = false")
    Optional<Contract> findByContractNoAndTenantId(@Param("contractNo") String contractNo, 
                                                    @Param("tenantId") String tenantId);

    /**
     * 按案例ID查询合同列表
     *
     * @param caseId   案例ID
     * @param tenantId 租户ID
     * @return 合同列表
     */
    @Query("SELECT c FROM Contract c WHERE c.caseId = :caseId AND c.tenantId = :tenantId AND c.deleted = false ORDER BY c.createdAt DESC")
    List<Contract> findByCaseIdAndTenantId(@Param("caseId") String caseId, 
                                           @Param("tenantId") String tenantId);

    /**
     * 按状态查询合同列表
     *
     * @param status   合同状态
     * @param tenantId 租户ID
     * @return 合同列表
     */
    @Query("SELECT c FROM Contract c WHERE c.status = :status AND c.tenantId = :tenantId AND c.deleted = false ORDER BY c.createdAt DESC")
    List<Contract> findByStatusAndTenantId(@Param("status") ContractStatus status, 
                                           @Param("tenantId") String tenantId);

    /**
     * 按参与方ID查询合同列表
     *
     * @param partyId  参与方ID
     * @param tenantId 租户ID
     * @return 合同列表
     */
    @Query("SELECT DISTINCT c FROM Contract c JOIN c.parties p WHERE p.partyId = :partyId AND c.tenantId = :tenantId AND c.deleted = false ORDER BY c.createdAt DESC")
    List<Contract> findByPartyIdAndTenantId(@Param("partyId") String partyId, 
                                            @Param("tenantId") String tenantId);

    /**
     * 按创建人查询合同列表
     *
     * @param createdBy 创建人ID
     * @param tenantId  租户ID
     * @return 合同列表
     */
    @Query("SELECT c FROM Contract c WHERE c.createdBy = :createdBy AND c.tenantId = :tenantId AND c.deleted = false ORDER BY c.createdAt DESC")
    List<Contract> findByCreatedByAndTenantId(@Param("createdBy") String createdBy, 
                                              @Param("tenantId") String tenantId);

    /**
     * 查询所有合同（分页）
     *
     * @param tenantId 租户ID
     * @param pageable 分页参数
     * @return 合同分页
     */
    @Query("SELECT c FROM Contract c WHERE c.tenantId = :tenantId AND c.deleted = false")
    Page<Contract> findAllByTenantId(@Param("tenantId") String tenantId, Pageable pageable);

    /**
     * 综合查询
     *
     * @param tenantId   租户ID
     * @param contractNo 合同编号（模糊匹配，可为null）
     * @param caseId     案例ID（可为null）
     * @param templateId 模板ID（可为null）
     * @param status     状态（可为null）
     * @param createdBy  创建人（可为null）
     * @param pageable   分页参数
     * @return 合同分页
     */
    @Query("SELECT c FROM Contract c WHERE c.tenantId = :tenantId AND c.deleted = false " +
           "AND (:contractNo IS NULL OR c.contractNo LIKE CONCAT('%', :contractNo, '%')) " +
           "AND (:caseId IS NULL OR c.caseId = :caseId) " +
           "AND (:templateId IS NULL OR c.templateId = :templateId) " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:createdBy IS NULL OR c.createdBy = :createdBy)")
    Page<Contract> search(@Param("tenantId") String tenantId,
                         @Param("contractNo") String contractNo,
                         @Param("caseId") String caseId,
                         @Param("templateId") Long templateId,
                         @Param("status") ContractStatus status,
                         @Param("createdBy") String createdBy,
                         Pageable pageable);

    /**
     * 查询已签署且已过期的合同
     *
     * @param status    状态（已签署）
     * @param expiresAt 过期日期
     * @return 过期合同列表
     */
    @Query("SELECT c FROM Contract c WHERE c.status = :status AND c.expiresAt < :expiresAt AND c.deleted = false")
    List<Contract> findExpiredContracts(@Param("status") ContractStatus status, 
                                        @Param("expiresAt") LocalDate expiresAt);

    /**
     * 统计合同数量
     *
     * @param tenantId 租户ID
     * @param status   状态（可为null）
     * @return 数量
     */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.tenantId = :tenantId AND c.deleted = false " +
           "AND (:status IS NULL OR c.status = :status)")
    long countByTenantIdAndStatus(@Param("tenantId") String tenantId, 
                                  @Param("status") ContractStatus status);

    /**
     * 获取下一个合同序号
     *
     * @param tenantId 租户ID
     * @param datePrefix 日期前缀（YYYYMMDD）
     * @return 当天已有合同数量
     */
    @Query("SELECT COUNT(c) FROM Contract c WHERE c.tenantId = :tenantId AND c.contractNo LIKE CONCAT('CT-', :datePrefix, '%')")
    int getNextContractSerial(@Param("tenantId") String tenantId, 
                              @Param("datePrefix") String datePrefix);

    /**
     * 批量更新过期状态
     *
     * @param newStatus 新状态
     * @param oldStatus 旧状态
     * @param expiresAt 过期日期
     * @return 更新数量
     */
    @Modifying
    @Query("UPDATE Contract c SET c.status = :newStatus, c.updatedAt = CURRENT_TIMESTAMP WHERE c.status = :oldStatus AND c.expiresAt < :expiresAt AND c.deleted = false")
    int updateExpiredContracts(@Param("newStatus") ContractStatus newStatus,
                               @Param("oldStatus") ContractStatus oldStatus,
                               @Param("expiresAt") LocalDate expiresAt);
}
