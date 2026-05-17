/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.enums;

/**
 * 用户身份类型枚举
 *
 * <p>区分不同身份的用户，每种类型对应一张独立的画像子表。</p>
 *
 * <h3>业务场景（医疗中介）</h3>
 * <ul>
 *   <li>PATIENT  — 患者（关联 identity_patient_profile）</li>
 *   <li>EMPLOYEE — 中介公司员工（关联 identity_employee_profile）</li>
 *   <li>DOCTOR   — 医生（预留，未来扩展）</li>
 *   <li>GENERAL  — 通用用户（无子画像表）</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum UserType {

    /** 通用用户（默认，无子画像） */
    GENERAL("通用用户"),

    /** 患者 */
    PATIENT("患者"),

    /** 中介公司员工 */
    EMPLOYEE("中介员工"),

    /** 医生（预留） */
    DOCTOR("医生");

    private final String label;

    UserType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
