package com.shinwa.app.contracts.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shinwa.app.contracts.enums.SignMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 签署记录数据传输对象
 *
 * <p>用于在API层传输合同签署记录信息。
 *
 * <p>字段说明：
 * <ul>
 *   <li>partyId - 签署方ID</li>
 *   <li>partyName - 签署方名称</li>
 *   <li>signMethod - 签署方式</li>
 *   <li>signatureUrl - 签名图片URL</li>
 *   <li>signedAt - 签署时间</li>
 *   <li>ipAddress - 签署时IP地址</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignRecordDTO {

    /**
     * 签署记录ID
     */
    private Long id;

    /**
     * 签署方ID
     */
    private String partyId;

    /**
     * 签署方名称
     */
    private String partyName;

    /**
     * 签署方式
     */
    private SignMethod signMethod;

    /**
     * 签名图片URL
     */
    private String signatureUrl;

    /**
     * 签署时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime signedAt;

    /**
     * 签署时的IP地址
     */
    private String ipAddress;

    /**
     * 签署时的User Agent
     */
    private String userAgent;

    /**
     * 扩展信息
     * <p>存储电子签章证书信息等扩展数据
     */
    private Map<String, Object> extra;

    /**
     * 获取签署方式标签
     *
     * @return 签署方式中文名称
     */
    public String getSignMethodLabel() {
        return signMethod != null ? signMethod.getLabel() : null;
    }

    /**
     * 判断是否具有法律效力认证
     *
     * @return 是否具有法律效力认证
     */
    public boolean hasLegalCertification() {
        return signMethod != null && signMethod.hasLegalCertification();
    }
}
