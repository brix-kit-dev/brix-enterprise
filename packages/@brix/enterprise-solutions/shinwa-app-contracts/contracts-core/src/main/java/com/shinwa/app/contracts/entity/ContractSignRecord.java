package com.shinwa.app.contracts.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.shinwa.app.contracts.enums.SignMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 合同签署记录实体
 *
 * <p>记录合同签署的详细信息，包括签署方式、签名、时间等。
 * 作为 Contract 聚合内的实体，由聚合根管理生命周期。
 *
 * <p>实体职责：
 * <ul>
 *   <li>记录签署方信息</li>
 *   <li>存储签名图片或电子签章信息</li>
 *   <li>记录签署时的环境信息（IP、UserAgent）</li>
 *   <li>支持扩展信息存储</li>
 * </ul>
 *
 * <p>设计原则：
 * <ul>
 *   <li>签署记录一旦创建不可修改（不可变性）</li>
 *   <li>记录足够的审计信息用于合规</li>
 *   <li>extra字段用于存储电子签章等扩展信息</li>
 * </ul>
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "contract_sign_record", indexes = {
    @Index(name = "idx_sign_contract", columnList = "contract_id"),
    @Index(name = "idx_sign_party", columnList = "party_id"),
    @Index(name = "idx_sign_time", columnList = "signed_at")
})
@Getter
@Setter
@NoArgsConstructor
public class ContractSignRecord {

    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的合同
     * 
     * <p>JSON 序列化说明（v3.2 修复）：
     * 使用 @JsonBackReference 标记为反向引用端，配合 Contract 上的
     * @JsonManagedReference 解决双向关联序列化时的循环引用问题。
     * 这样 ContractSignRecord 序列化时不会包含 contract 字段。
     */
    @JsonBackReference("contract-signRecords")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    /**
     * 签署方ID
     * <p>关联 ContractParty 的 partyId
     */
    @Column(name = "party_id", nullable = false, length = 64)
    private String partyId;

    /**
     * 签署方式
     * <p>MANUAL/ESIGN/BIOMETRIC/SMS_OTP
     */
    @Column(name = "sign_method", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SignMethod signMethod;

    /**
     * 签名图片URL
     * <p>手写签名图片或电子签章图片的存储地址
     */
    @Column(name = "signature_url", length = 500)
    private String signatureUrl;

    /**
     * 签署时间
     */
    @Column(name = "signed_at", nullable = false)
    private LocalDateTime signedAt;

    /**
     * 签署时的IP地址
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * 签署时的User Agent
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 扩展信息（JSON格式）
     * <p>用于存储电子签章证书信息等扩展数据
     */
    @Column(name = "extra", columnDefinition = "TEXT")
    private String extra;

    /**
     * 签署备注
     */
    @Column(name = "remark", length = 500)
    private String remark;

    /**
     * 创建签署记录
     *
     * @param partyId      签署方ID
     * @param signMethod   签署方式
     * @param signatureUrl 签名图片URL
     * @param ipAddress    IP地址
     * @param userAgent    User Agent
     * @return 新建的签署记录
     */
    public static ContractSignRecord create(String partyId, SignMethod signMethod, 
                                           String signatureUrl, String ipAddress, String userAgent) {
        ContractSignRecord record = new ContractSignRecord();
        record.partyId = partyId;
        record.signMethod = signMethod;
        record.signatureUrl = signatureUrl;
        record.signedAt = LocalDateTime.now();
        record.ipAddress = ipAddress;
        record.userAgent = userAgent;
        return record;
    }
}
