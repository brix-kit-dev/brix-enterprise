/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工画像实体
 *
 * <p>存储医疗中介公司员工专有的业务信息，通过 {@link UserProfile} 关联到用户。</p>
 * <p>仅当 {@code UserProfile.userType = EMPLOYEE} 时创建此记录。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "identity_employee_profile", indexes = {
        @Index(name = "idx_employee_tenant", columnList = "tenant_id"),
        @Index(name = "idx_employee_no", columnList = "employee_no"),
        @Index(name = "idx_employee_department", columnList = "department"),
        @Index(name = "idx_employee_status", columnList = "employee_status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_employee_user_profile", columnNames = {"user_profile_id"})
})
public class EmployeeProfile {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** 关联用户画像（一对一） */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", nullable = false, unique = true)
    private UserProfile userProfile;

    // ==================== 员工业务信息 ====================

    @Column(name = "employee_no", length = 64)
    private String employeeNo;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "work_phone", length = 32)
    private String workPhone;

    @Column(name = "work_email", length = 255)
    private String workEmail;

    @Column(name = "manager_id", length = 64)
    private String managerId;

    /** 在职状态: ON_DUTY, ON_LEAVE, RESIGNED */
    @Column(name = "employee_status", length = 32, nullable = false)
    private String employeeStatus = "ON_DUTY";

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

    protected EmployeeProfile() {
    }

    public EmployeeProfile(String id, UserProfile userProfile, String tenantId) {
        this.id = id;
        this.userProfile = userProfile;
        this.tenantId = tenantId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== Getters & Setters ====================

    public String getId() { return id; }
    public UserProfile getUserProfile() { return userProfile; }
    public String getEmployeeNo() { return employeeNo; }
    public void setEmployeeNo(String employeeNo) { this.employeeNo = employeeNo; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public String getWorkPhone() { return workPhone; }
    public void setWorkPhone(String workPhone) { this.workPhone = workPhone; }
    public String getWorkEmail() { return workEmail; }
    public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    public String getEmployeeStatus() { return employeeStatus; }
    public void setEmployeeStatus(String employeeStatus) { this.employeeStatus = employeeStatus; }
    public String getTenantId() { return tenantId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
