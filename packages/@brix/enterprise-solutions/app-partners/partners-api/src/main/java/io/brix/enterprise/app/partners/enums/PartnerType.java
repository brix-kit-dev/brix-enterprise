/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴类型枚举
 */
package io.brix.enterprise.app.partners.enums;

/**
 * 合作伙伴类型枚举
 *
 * <p>定义系统支持的合作伙伴类型，包括医疗机构、酒店、交通服务和翻译服务等。
 * 不同类型的合作伙伴有不同的资质要求和业务属性。</p>
 *
 * <h3>支持的类型</h3>
 * <ul>
 *   <li>HOSPITAL - 医院/医疗机构</li>
 *   <li>HOTEL - 酒店/住宿服务</li>
 *   <li>TRANSPORT - 交通运输服务</li>
 *   <li>TRANSLATION - 翻译服务</li>
 *   <li>OTHER - 其他类型</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum PartnerType {

    /**
     * 医院/医疗机构
     * <p>提供体检、诊疗等医疗服务的合作方</p>
     */
    HOSPITAL("医院"),

    /**
     * 酒店/住宿服务
     * <p>提供住宿服务的合作方</p>
     */
    HOTEL("酒店"),

    /**
     * 交通运输服务
     * <p>提供接送机、城市交通等服务的合作方</p>
     */
    TRANSPORT("交通"),

    /**
     * 翻译服务
     * <p>提供医疗翻译、陪同翻译等服务的合作方</p>
     */
    TRANSLATION("翻译"),

    /**
     * 其他类型
     * <p>未分类的其他服务合作方</p>
     */
    OTHER("其他");

    /**
     * 类型显示名称
     */
    private final String displayName;

    /**
     * 构造函数
     *
     * @param displayName 显示名称
     */
    PartnerType(String displayName) {
        this.displayName = displayName;
    }

    /**
     * 获取类型的显示名称
     *
     * @return 显示名称
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * 根据名称获取枚举值
     *
     * @param name 枚举名称
     * @return 对应的枚举值，如果不存在返回回 null
     */
    public static PartnerType fromName(String name) {
        if (name == null) {
            return null;
        }
        try {
            return PartnerType.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
