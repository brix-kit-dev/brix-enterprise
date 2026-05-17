/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.repository;

import io.brix.enterprise.app.identity.entity.User;
import io.brix.enterprise.app.identity.enums.UserRole;
import io.brix.enterprise.app.identity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用户仓库接口
 *
 * <p>提供 {@code auth_user} 表的数据访问方法，所有查询均支持租户隔离和软删除过滤。</p>
 *
 * <h3>设计原则</h3>
 * <ul>
 *   <li>所有查询方法必须带 tenantId 参数</li>
 *   <li>所有查询自动过滤 deleted = false</li>
 *   <li>PK 为 VARCHAR(64)，格式 "U" + yyyyMMdd + 6位随机数字</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // ==================== 单条查询 ====================

    /**
     * 根据 ID 和租户 ID 查询用户
     */
    @Query("SELECT u FROM User u WHERE u.id = :id AND u.tenantId = :tenantId AND u.deleted = false")
    Optional<User> findByIdAndTenantId(@Param("id") String id, @Param("tenantId") String tenantId);

    /**
     * 根据用户名和租户 ID 查询
     */
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.tenantId = :tenantId AND u.deleted = false")
    Optional<User> findByUsernameAndTenantId(@Param("username") String username, @Param("tenantId") String tenantId);

    /**
     * 根据邮箱和租户 ID 查询
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.tenantId = :tenantId AND u.deleted = false")
    Optional<User> findByEmailAndTenantId(@Param("email") String email, @Param("tenantId") String tenantId);

    /**
     * 根据手机号和租户 ID 查询
     */
    @Query("SELECT u FROM User u WHERE u.phone = :phone AND u.tenantId = :tenantId AND u.deleted = false")
    Optional<User> findByPhoneAndTenantId(@Param("phone") String phone, @Param("tenantId") String tenantId);

    // ==================== 列表查询 ====================

    /**
     * 查询租户下所有活跃用户
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.deleted = false ORDER BY u.createdAt DESC")
    List<User> findByTenantIdOrderByCreatedAtDesc(@Param("tenantId") String tenantId);

    /**
     * 根据状态查询
     */
    @Query("SELECT u FROM User u WHERE u.status = :status AND u.tenantId = :tenantId AND u.deleted = false ORDER BY u.createdAt DESC")
    List<User> findByStatusAndTenantIdOrderByCreatedAtDesc(
            @Param("status") UserStatus status, @Param("tenantId") String tenantId);

    /**
     * 根据角色查询
     */
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.tenantId = :tenantId AND u.deleted = false ORDER BY u.createdAt DESC")
    List<User> findByRoleAndTenantIdOrderByCreatedAtDesc(
            @Param("role") UserRole role, @Param("tenantId") String tenantId);

    // ==================== 存在性检查 ====================

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.username = :username AND u.tenantId = :tenantId AND u.deleted = false")
    boolean existsByUsernameAndTenantId(@Param("username") String username, @Param("tenantId") String tenantId);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = :email AND u.tenantId = :tenantId AND u.deleted = false")
    boolean existsByEmailAndTenantId(@Param("email") String email, @Param("tenantId") String tenantId);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.phone = :phone AND u.tenantId = :tenantId AND u.deleted = false")
    boolean existsByPhoneAndTenantId(@Param("phone") String phone, @Param("tenantId") String tenantId);

    // ==================== 统计查询 ====================

    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.deleted = false")
    long countByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status AND u.tenantId = :tenantId AND u.deleted = false")
    long countByStatusAndTenantId(@Param("status") UserStatus status, @Param("tenantId") String tenantId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.tenantId = :tenantId AND u.deleted = false")
    long countByRoleAndTenantId(@Param("role") UserRole role, @Param("tenantId") String tenantId);

    // ==================== 搜索 ====================

    /**
     * 搜索用户（用户名、邮箱、手机号、显示名模糊匹配）
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.deleted = false " +
            "AND (u.username LIKE %:keyword% OR u.email LIKE %:keyword% " +
            "OR u.phone LIKE %:keyword% OR u.displayName LIKE %:keyword%) " +
            "ORDER BY u.createdAt DESC")
    List<User> searchByKeyword(@Param("keyword") String keyword, @Param("tenantId") String tenantId);
}
