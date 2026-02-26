package com.shinwa.app.contracts.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 发布模板版本请求对象
 *
 * <p>用于发布新的模板版本时传递参数。
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishVersionRequest {

    /**
     * 模板文件URL
     */
    @NotBlank(message = "模板文件URL不能为空")
    private String fileUrl;

    /**
     * 文件类型
     */
    private String fileType;

    /**
     * 变更说明
     */
    private String changeLog;

    /**
     * 变量定义列表
     * <p>如果不传，则继承上一版本的变量定义
     */
    private List<CreateTemplateRequest.VariableRequest> variables;

    /**
     * 是否立即生效
     * <p>true则发布后立即成为当前版本
     */
    private Boolean activateImmediately;
}
