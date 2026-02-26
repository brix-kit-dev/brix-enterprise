package com.shinwa.app.contracts.enums;

/**
 * 签署方式枚举
 *
 * <p>定义合同的签署方式，用于记录签署时使用的技术手段。
 *
 * <p>方式说明：
 * <ul>
 *   <li>MANUAL - 手动签署：手写电子签名</li>
 *   <li>ESIGN - 电子签章：使用数字证书的电子签章</li>
 *   <li>BIOMETRIC - 生物识别：指纹、人脸等生物识别签署</li>
 *   <li>SMS_OTP - 短信验证：短信验证码确认签署</li>
 * </ul>
 *
 * <p>设计说明：
 * <ul>
 *   <li>当前版本主要使用 MANUAL 方式</li>
 *   <li>ESIGN 方式可对接第三方电子签章服务</li>
 *   <li>签署方式会影响签署记录的存储结构</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
public enum SignMethod {

    /**
     * 手动签署
     * <p>手写电子签名
     */
    MANUAL("手动签署", "手写电子签名"),

    /**
     * 电子签章
     * <p>使用数字证书的电子签章
     */
    ESIGN("电子签章", "使用数字证书的电子签章"),

    /**
     * 生物识别
     * <p>指纹、人脸等生物识别签署
     */
    BIOMETRIC("生物识别", "指纹、人脸等生物识别签署"),

    /**
     * 短信验证
     * <p>短信验证码确认签署
     */
    SMS_OTP("短信验证", "短信验证码确认签署");

    /**
     * 中文名称
     */
    private final String label;

    /**
     * 描述说明
     */
    private final String description;

    /**
     * 构造函数
     *
     * @param label       中文名称
     * @param description 描述说明
     */
    SignMethod(String label, String description) {
        this.label = label;
        this.description = description;
    }

    /**
     * 获取中文名称
     *
     * @return 中文名称
     */
    public String getLabel() {
        return label;
    }

    /**
     * 获取描述说明
     *
     * @return 描述说明
     */
    public String getDescription() {
        return description;
    }

    /**
     * 判断是否需要签名图片
     * <p>手动签署和电子签章需要签名图片
     *
     * @return 是否需要签名图片
     */
    public boolean requiresSignatureImage() {
        return this == MANUAL || this == ESIGN;
    }

    /**
     * 判断是否需要验证码
     * <p>短信验证需要验证码
     *
     * @return 是否需要验证码
     */
    public boolean requiresVerificationCode() {
        return this == SMS_OTP;
    }

    /**
     * 判断是否具有法律效力认证
     * <p>电子签章具有法律效力认证
     *
     * @return 是否具有法律效力认证
     */
    public boolean hasLegalCertification() {
        return this == ESIGN;
    }
}
