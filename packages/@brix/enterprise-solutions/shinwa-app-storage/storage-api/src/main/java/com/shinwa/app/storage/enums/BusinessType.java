package com.shinwa.app.storage.enums;

/**
 * 业务类型枚举
 * 
 * <p>定义文件关联的业务场景类型，用于文件分类、访问控制和存储路径规划。
 * 
 * <h3>存储路径规则</h3>
 * <pre>{bucket}/{tenant_id}/{business_type}/{entity_id}/{file_id}</pre>
 * 
 * <h3>业务场景说明</h3>
 * <ul>
 *   <li><b>MEDICAL_INTAKE</b> - 医疗进件：病历、诊断书、检查报告、影像资料</li>
 *   <li><b>CONTRACT</b> - 合同文件：服务合同、保密协议、授权书、电子签名</li>
 *   <li><b>REPORT</b> - 报告文件：评估报告、审核报告、分析报告、月度报告</li>
 *   <li><b>AVATAR</b> - 用户头像：个人头像、企业Logo</li>
 *   <li><b>CERTIFICATE</b> - 证件资料：身份证、营业执照、资质证书</li>
 *   <li><b>BOOKING</b> - 预约相关：预约确认单、行程单、服务凭证</li>
 *   <li><b>OTHER</b> - 其他文件：不属于以上分类的通用文件</li>
 * </ul>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
public enum BusinessType {

    /**
     * 医疗进件
     * 用于存储医疗相关的进件文件，如病历、诊断书、检查报告、影像资料等
     */
    MEDICAL_INTAKE("medical_intake", "医疗进件"),

    /**
     * 合同文件
     * 用于存储合同类文件，如服务合同、保密协议、授权书、电子签名等
     */
    CONTRACT("contract", "合同"),

    /**
     * 报告文件
     * 用于存储各类报告文件，如评估报告、审核报告、分析报告、月度报告等
     */
    REPORT("report", "报告"),

    /**
     * 用户头像
     * 用于存储用户头像图片或企业Logo
     */
    AVATAR("avatar", "头像"),

    /**
     * 证件资料
     * 用于存储证件类文件，如身份证、营业执照、资质证书等
     */
    CERTIFICATE("certificate", "证件"),

    /**
     * 预约相关
     * 用于存储预约相关文件，如预约确认单、行程单、服务凭证等
     */
    BOOKING("booking", "预约"),

    /**
     * 其他文件
     * 用于存储不属于以上分类的其他文件
     */
    OTHER("other", "其他");

    /**
     * 业务类型编码
     * 用于文件存储路径
     */
    private final String code;

    /**
     * 业务类型描述
     */
    private final String description;

    BusinessType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    /**
     * 获取业务类型编码
     *
     * @return 编码值（用于存储路径）
     */
    public String getCode() {
        return code;
    }

    /**
     * 获取业务类型描述
     *
     * @return 中文描述
     */
    public String getDescription() {
        return description;
    }

    /**
     * 根据编码获取枚举值
     *
     * @param code 编码
     * @return 对应的枚举值，未找到返回null
     */
    public static BusinessType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (BusinessType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return null;
    }
}
