/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.repository;

import io.brix.enterprise.app.identity.entity.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 员工画像数据访问
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, String> {

    /**
     * 根据 user_profile ID 查找
     */
    @Query("SELECT p FROM EmployeeProfile p " +
            "WHERE p.userProfile.id = :userProfileId " +
            "AND p.deleted = false")
    Optional<EmployeeProfile> findByUserProfileId(@Param("userProfileId") String userProfileId);

    /**
     * 根据工号查找
     */
    @Query("SELECT p FROM EmployeeProfile p " +
            "WHERE p.employeeNo = :employeeNo " +
            "AND p.tenantId = :tenantId " +
            "AND p.deleted = false")
    Optional<EmployeeProfile> findByEmployeeNo(
            @Param("employeeNo") String employeeNo,
            @Param("tenantId") String tenantId);
}
