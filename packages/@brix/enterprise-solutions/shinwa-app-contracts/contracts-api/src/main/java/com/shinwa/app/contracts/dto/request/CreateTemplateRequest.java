package com.shinwa.app.contracts.dto.request;

import com.shinwa.app.contracts.enums.ContractType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 创建合同模板请求对象
 *
 * <p>用于创建合同模板时传递参数。
 *
 * <p>必填字段：
 * <ul>
 *   <li>templateCode - 模板编码</li>
 *   <li>templateName - 模板名称</li>
 *   <li>contractType - 合同类型</li>
 *   <li>fileUrl - 模板文件URL</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTemplateRequest {

    /**
     * 模板编码
     * <p>租户内唯一标识
     */
    @NotBlank(message = "模板编码不能为空")
    @Size(max = 32, message = "模板编码最大32字符")
    private String templateCode;

    /**
     * 模板名称
     */
    @NotBlank(message = "模板名称不能为空")
    @Size(max = 100, message = "模板名称最大100字符")
    private String templateName;

    /**
     * 合同类型
     */
    @NotNull(message = "合同类型不能为空")
    private ContractType contractType;

    /**
     * 模板文件URL
     * <p>存储在文件中心的模板文件
     */
    @NotBlank(message = "模板文件URL不能为空")
    private String fileUrl;

    /**
     * 文件类型
     * <p>如：PDF, DOCX, HTML
     */
    private String fileType;

    /**
     * 模板描述
     */
    @Size(max = 500, message = "描述最大500字符")
    private String description;

    /**
     * 变量定义列表
     */
    private List<VariableRequest> variables;

    /**
     * 变量定义请求对象
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariableRequest {

        /**
         * 变量键名
         */
        @NotBlank(message = "变量键名不能为空")
        private String variableKey;

        /**
         * 变量显示名称
         */
        @NotBlank(message = "变量名称不能为空")
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
    }
}
