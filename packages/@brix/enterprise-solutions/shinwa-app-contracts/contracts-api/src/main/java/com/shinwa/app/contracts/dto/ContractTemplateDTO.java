package com.shinwa.app.contracts.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shinwa.app.contracts.enums.ContractType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 合同模板数据传输对象
 *
 * <p>用于在API层传输合同模板信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>templateCode - 模板编码</li>
 *   <li>templateName - 模板名称</li>
 *   <li>contractType - 合同类型</li>
 *   <li>currentVersion - 当前版本号</li>
 *   <li>isActive - 是否启用</li>
 *   <li>versions - 版本列表</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractTemplateDTO {

    /**
     * 模板ID
     */
    private Long id;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 模板编码
     * <p>租户内唯一的模板标识符
     */
    private String templateCode;

    /**
     * 模板名称
     */
    private String templateName;

    /**
     * 合同类型
     */
    private ContractType contractType;

    /**
     * 当前版本号
     */
    private Integer currentVersion;

    /**
     * 是否启用
     */
    private Boolean isActive;

    /**
     * 模板描述
     */
    private String description;

    /**
     * 版本列表
     */
    private List<TemplateVersionDTO> versions;

    /**
     * 合同使用次数
     */
    private Long usageCount;

    /**
     * 创建人ID
     */
    private String createdBy;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 获取合同类型标签
     *
     * @return 合同类型中文名称
     */
    public String getContractTypeLabel() {
        return contractType != null ? contractType.getLabel() : null;
    }

    /**
     * 判断模板是否可用
     * <p>启用状态且版本号大于0
     *
     * @return 是否可用
     */
    public boolean isAvailable() {
        return Boolean.TRUE.equals(isActive) && currentVersion != null && currentVersion > 0;
    }
}
