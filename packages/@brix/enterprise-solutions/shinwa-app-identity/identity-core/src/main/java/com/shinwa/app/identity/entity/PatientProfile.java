/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 患者画像实体
 *
 * <p>存储患者专有的业务信息，通过 {@link UserProfile} 关联到用户。</p>
 * <p>仅当 {@code UserProfile.userType = PATIENT} 时创建此记录。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "identity_patient_profile", indexes = {
        @Index(name = "idx_patient_tenant", columnList = "tenant_id"),
        @Index(name = "idx_patient_medical_no", columnList = "medical_record_no"),
        @Index(name = "idx_patient_passport", columnList = "passport_no")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_patient_user_profile", columnNames = {"user_profile_id"})
})
public class PatientProfile {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** 关联用户画像（一对一） */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", nullable = false, unique = true)
    private UserProfile userProfile;

    // ==================== 患者业务信息 ====================

    @Column(name = "medical_record_no", length = 64)
    private String medicalRecordNo;

    @Column(name = "insurance_type", length = 32)
    private String insuranceType;

    @Column(name = "insurance_no", length = 64)
    private String insuranceNo;

    @Column(name = "nationality", length = 64)
    private String nationality;

    @Column(name = "passport_no", length = 64)
    private String passportNo;

    @Column(name = "preferred_language", length = 16)
    private String preferredLanguage;

    @Column(name = "blood_type", length = 8)
    private String bloodType;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 32)
    private String emergencyContactPhone;

    // ==================== 多租户 ====================

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    // ==================== 审计字段 ====================

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ==================== 预留字段（8 个）====================

    @Column(name = "ext_varchar_1", length = 255)
    private String extVarchar1;

    @Column(name = "ext_varchar_2", length = 255)
    private String extVarchar2;

    @Column(name = "ext_varchar_3", length = 255)
    private String extVarchar3;

    @Column(name = "ext_varchar_4", length = 255)
    private String extVarchar4;

    @Column(name = "ext_varchar_5", length = 255)
    private String extVarchar5;

    @Column(name = "ext_int_1")
    private Integer extInt1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ext_json_1", columnDefinition = "jsonb")
    private String extJson1;

    @Column(name = "ext_timestamp_1")
    private LocalDateTime extTimestamp1;

    // ==================== 构造函数 ====================

    protected PatientProfile() {
    }

    public PatientProfile(String id, UserProfile userProfile, String tenantId) {
        this.id = id;
        this.userProfile = userProfile;
        this.tenantId = tenantId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== Getters & Setters ====================

    public String getId() { return id; }
    public UserProfile getUserProfile() { return userProfile; }
    public String getMedicalRecordNo() { return medicalRecordNo; }
    public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getInsuranceType() { return insuranceType; }
    public void setInsuranceType(String insuranceType) { this.insuranceType = insuranceType; }
    public String getInsuranceNo() { return insuranceNo; }
    public void setInsuranceNo(String insuranceNo) { this.insuranceNo = insuranceNo; }
    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }
    public String getPassportNo() { return passportNo; }
    public void setPassportNo(String passportNo) { this.passportNo = passportNo; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public String getMedicalNotes() { return medicalNotes; }
    public void setMedicalNotes(String medicalNotes) { this.medicalNotes = medicalNotes; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
    public String getTenantId() { return tenantId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
