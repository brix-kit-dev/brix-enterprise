/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.repository;

import com.shinwa.app.identity.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 患者画像数据访问
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, String> {

    /**
     * 根据 user_profile ID 查找
     */
    @Query("SELECT p FROM PatientProfile p " +
            "WHERE p.userProfile.id = :userProfileId " +
            "AND p.deleted = false")
    Optional<PatientProfile> findByUserProfileId(@Param("userProfileId") String userProfileId);

    /**
     * 根据病历号查找
     */
    @Query("SELECT p FROM PatientProfile p " +
            "WHERE p.medicalRecordNo = :medicalRecordNo " +
            "AND p.tenantId = :tenantId " +
            "AND p.deleted = false")
    Optional<PatientProfile> findByMedicalRecordNo(
            @Param("medicalRecordNo") String medicalRecordNo,
            @Param("tenantId") String tenantId);
}
