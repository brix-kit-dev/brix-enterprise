package com.shinwa.app.contracts.dto;

import com.shinwa.app.contracts.enums.PartyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 合同参与方数据传输对象
 *
 * <p>用于在API层传输合同参与方信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>partyType - 参与方类型（客户/合作方/平台/见证人）</li>
 *   <li>partyId - 参与方ID（关联外部系统）</li>
 *   <li>partyName - 参与方名称</li>
 *   <li>displayOrder - 签署顺序</li>
 *   <li>hasSigned - 是否已签署</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractPartyDTO {

    /**
     * 参与方ID（主键）
     */
    private Long id;

    /**
     * 参与方类型
     */
    private PartyType partyType;

    /**
     * 参与方业务ID
     * <p>关联外部用户或机构系统的ID
     */
    private String partyId;

    /**
     * 参与方名称
     */
    private String partyName;

    /**
     * 显示顺序
     * <p>控制签署顺序和展示顺序
     */
    private Integer displayOrder;

    /**
     * 是否已签署
     */
    private Boolean hasSigned;

    /**
     * 联系电话
     */
    private String phone;

    /**
     * 电子邮箱
     */
    private String email;

    /**
     * 参与方类型标签
     *
     * @return 参与方类型中文名称
     */
    public String getPartyTypeLabel() {
        return partyType != null ? partyType.getLabel() : null;
    }

    /**
     * 判断是否为必须签署方
     *
     * @return 是否为必须签署方
     */
    public boolean isRequiredSigner() {
        return partyType != null && partyType.isRequiredSigner();
    }
}
