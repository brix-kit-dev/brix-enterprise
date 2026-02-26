package com.shinwa.app.contracts.enums;

/**
 * 合同参与方类型枚举
 *
 * <p>定义合同的参与方类型，用于区分不同角色的签署方。
 *
 * <p>类型说明：
 * <ul>
 *   <li>CUSTOMER - 客户：接受服务的一方，如患者、委托人</li>
 *   <li>PARTNER - 合作方：提供服务的一方，如医疗机构、服务商</li>
 *   <li>PLATFORM - 平台：作为中介或担保方的平台</li>
 *   <li>WITNESS - 见证人：见证合同签署的第三方</li>
 * </ul>
 *
 * <p>使用场景：
 * <ul>
 *   <li>合同签署顺序控制</li>
 *   <li>签署方权限管理</li>
 *   <li>合同展示和通知分发</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
public enum PartyType {

    /**
     * 客户
     * <p>接受服务的一方，如患者、委托人
     */
    CUSTOMER("客户", "接受服务的一方"),

    /**
     * 合作方
     * <p>提供服务的一方，如医疗机构、服务商
     */
    PARTNER("合作方", "提供服务的一方"),

    /**
     * 平台
     * <p>作为中介或担保方的平台
     */
    PLATFORM("平台", "中介或担保方"),

    /**
     * 见证人
     * <p>见证合同签署的第三方
     */
    WITNESS("见证人", "见证合同签署的第三方");

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
    PartyType(String label, String description) {
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
     * 判断是否为必须签署方
     * <p>客户和合作方为必须签署方
     *
     * @return 是否为必须签署方
     */
    public boolean isRequiredSigner() {
        return this == CUSTOMER || this == PARTNER;
    }
}
