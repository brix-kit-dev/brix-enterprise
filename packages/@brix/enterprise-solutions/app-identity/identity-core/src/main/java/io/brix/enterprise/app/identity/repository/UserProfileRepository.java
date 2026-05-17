/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.repository;

import io.brix.enterprise.app.identity.entity.UserProfile;
import io.brix.enterprise.app.identity.enums.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用户画像数据访问
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, String> {

    /**
     * 根据 auth_user ID 查找画像
     */
    @Query("SELECT p FROM UserProfile p " +
            "WHERE p.authUser.id = :authUserId " +
            "AND p.deleted = false")
    Optional<UserProfile> findByAuthUserId(@Param("authUserId") String authUserId);

    /**
     * 按身份类型和租户查询
     */
    @Query("SELECT p FROM UserProfile p " +
            "WHERE p.userType = :userType " +
            "AND p.tenantId = :tenantId " +
            "AND p.deleted = false")
    List<UserProfile> findByUserTypeAndTenantId(
            @Param("userType") UserType userType,
            @Param("tenantId") String tenantId);
}
