package com.shinwa.app.contracts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 模板变量数据传输对象
 *
 * <p>用于在API层传输模板变量定义信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>variableKey - 变量键名</li>
 *   <li>variableName - 变量显示名称</li>
 *   <li>variableType - 变量类型（TEXT/NUMBER/DATE/SELECT）</li>
 *   <li>isRequired - 是否必填</li>
 *   <li>defaultValue - 默认值</li>
 *   <li>options - 可选值（SELECT类型使用）</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateVariableDTO {

    /**
     * 变量ID
     */
    private Long id;

    /**
     * 变量键名
     * <p>用于在模板中定位替换位置，如：${customerName}
     */
    private String variableKey;

    /**
     * 变量显示名称
     * <p>用于前端展示，如：客户姓名
     */
    private String variableName;

    /**
     * 变量类型
     * <p>TEXT/NUMBER/DATE/SELECT/TEXTAREA
     */
    private String variableType;

    /**
     * 是否必填
     */
    private Boolean isRequired;

    /**
     * 默认值
     */
    private String defaultValue;

    /**
     * 可选值
     * <p>SELECT类型使用，用逗号分隔
     */
    private String options;

    /**
     * 校验规则
     * <p>正则表达式或内置规则名
     */
    private String validationRule;

    /**
     * 校验失败提示
     */
    private String validationMessage;

    /**
     * 显示顺序
     */
    private Integer displayOrder;

    /**
     * 获取可选值数组
     *
     * @return 可选值数组
     */
    public String[] getOptionsArray() {
        if (options == null || options.isEmpty()) {
            return new String[0];
        }
        return options.split(",");
    }

    /**
     * 判断是否为文本类型
     *
     * @return 是否为文本类型
     */
    public boolean isTextType() {
        return "TEXT".equals(variableType) || "TEXTAREA".equals(variableType);
    }

    /**
     * 判断是否为选择类型
     *
     * @return 是否为选择类型
     */
    public boolean isSelectType() {
        return "SELECT".equals(variableType);
    }
}
