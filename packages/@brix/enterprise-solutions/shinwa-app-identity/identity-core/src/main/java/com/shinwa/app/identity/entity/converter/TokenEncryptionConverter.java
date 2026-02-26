/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity.converter;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import com.shinwa.app.identity.exception.TokenEncryptionException;
import io.runtime.sdk.capability.ConfigStoreCapability;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JPA 属性加密转换器
 *
 * <p>使用 AES-256-GCM 对敏感字段（如 OAuth2 Access Token、Refresh Token）
 * 进行透明加密/解密，确保数据库中不存储明文令牌。</p>
 *
 * <h3>架构红线合规 - v3.2</h3>
 * <ul>
 *   <li><b>红线6</b>：通过 ConfigStoreCapability 获取配置，不直接使用 System.getenv()</li>
 *   <li><b>红线7</b>：Entity/Converter 层不使用 Logger，异常向上抛出由 Service 层处理</li>
 * </ul>
 *
 * <h3>加密算法</h3>
 * <ul>
 *   <li>算法: AES/GCM/NoPadding（认证加密，防篡改）</li>
 *   <li>密钥长度: 256 位</li>
 *   <li>IV 长度: 12 字节（GCM 推荐）</li>
 *   <li>Tag 长度: 128 位</li>
 * </ul>
 *
 * <h3>存储格式</h3>
 * <p>加密后以 Base64 编码存储: {@code ENC:{base64(iv + ciphertext + tag)}}</p>
 *
 * <h3>密钥配置</h3>
 * <p>通过 ConfigStoreCapability 获取配置键 {@code token.encryption.key}。
 * 密钥将经过 SHA-256 哈希以确保 256 位长度。</p>
 *
 * <h3>安全最佳实践</h3>
 * <ul>
 *   <li>每次加密使用随机 IV（防止相同明文产生相同密文）</li>
 *   <li>GCM 模式提供认证加密（同时保证机密性和完整性）</li>
 *   <li>密钥通过 ConfigStoreCapability 统一管理，支持配置中心热更新</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0 - 架构红线合规改造
 */
@Component
@Converter(autoApply = false)
public class TokenEncryptionConverter implements AttributeConverter<String, String> {

    // ==================== 常量定义 ====================

    /** 加密算法标识 */
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    
    /** GCM 初始化向量长度（字节） */
    private static final int GCM_IV_LENGTH = 12;
    
    /** GCM 认证标签长度（位） */
    private static final int GCM_TAG_LENGTH = 128;
    
    /** 加密数据前缀标识 */
    private static final String ENCRYPTED_PREFIX = "ENC:";

    /** 
     * 默认密钥（仅开发环境使用）
     * 【安全警告】生产环境必须通过 ConfigStoreCapability 配置覆盖此值
     */
    private static final String DEFAULT_KEY = "shinwa-platform-token-encryption-key-change-in-production";

    /** 密钥配置键 */
    private static final String CONFIG_KEY_ENCRYPTION_KEY = "token.encryption.key";

    /** 线程安全的安全随机数生成器 */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==================== 能力依赖 ====================

    /**
     * 配置存储能力
     * 
     * <p>【架构说明】通过 ConfigStoreCapability 获取配置，符合红线6要求。
     * Spring 容器会自动注入 Host 层提供的实现。</p>
     */
    private final ConfigStoreCapability configStore;

    /**
     * 构造函数注入配置存储能力
     * 
     * @param configStore 配置存储能力实现
     */
    @Autowired
    public TokenEncryptionConverter(ConfigStoreCapability configStore) {
        this.configStore = configStore;
    }

    // ==================== AttributeConverter 实现 ====================

    /**
     * 将实体属性值加密后存入数据库
     * 
     * <p>加密流程：</p>
     * <ol>
     *   <li>生成随机 IV（12 字节）</li>
     *   <li>使用 AES-256-GCM 加密明文</li>
     *   <li>拼接 IV + 密文并进行 Base64 编码</li>
     *   <li>添加 "ENC:" 前缀标识</li>
     * </ol>
     * 
     * @param attribute 明文属性值
     * @return 加密后的字符串，格式为 "ENC:{base64(iv + ciphertext)}"
     * @throws RuntimeException 如果加密过程中发生错误
     */
    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }

        try {
            SecretKey secretKey = getEncryptionKey();
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec paramSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, paramSpec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // 拼接: IV + CipherText
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + cipherText.length);
            buffer.put(iv);
            buffer.put(cipherText);

            return ENCRYPTED_PREFIX + Base64.getEncoder().encodeToString(buffer.array());

        } catch (Exception e) {
            // [R10 Fix] Use domain-specific TokenEncryptionException instead of RuntimeException
            // Redline 7 compliance: Do not log in Converter layer, propagate to Service layer
            throw new TokenEncryptionException(
                "Token encryption failed - cryptographic operation error",
                TokenEncryptionException.Operation.ENCRYPT, e);
        }
    }

    /**
     * 将数据库中的加密值解密后还原为实体属性
     * 
     * <p>解密流程：</p>
     * <ol>
     *   <li>检查是否有 "ENC:" 前缀（兼容未加密的旧数据）</li>
     *   <li>Base64 解码获取 IV + 密文</li>
     *   <li>使用 AES-256-GCM 解密</li>
     *   <li>返回明文字符串</li>
     * </ol>
     * 
     * @param dbData 数据库中的加密值
     * @return 解密后的明文
     * @throws RuntimeException 如果解密过程中发生错误
     */
    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return dbData;
        }

        // 兼容：未加密的旧数据直接返回
        if (!dbData.startsWith(ENCRYPTED_PREFIX)) {
            return dbData;
        }

        try {
            String encrypted = dbData.substring(ENCRYPTED_PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(encrypted);

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            SecretKey secretKey = getEncryptionKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec paramSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, paramSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);

        } catch (Exception e) {
            // [R10 Fix] Use domain-specific TokenEncryptionException instead of RuntimeException
            // Redline 7 compliance: Do not log in Converter layer, propagate to Service layer
            throw new TokenEncryptionException(
                "Token decryption failed - cryptographic operation error",
                TokenEncryptionException.Operation.DECRYPT, e);
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 获取加密密钥
     * 
     * <p>【架构说明 - 红线6合规】</p>
     * <p>通过 ConfigStoreCapability 获取密钥配置，不直接调用 System.getenv() 或 System.getProperty()。
     * 这允许 Host 层灵活配置密钥来源（环境变量、配置中心、Vault 等）。</p>
     * 
     * <p>密钥将经过 SHA-256 哈希以确保 256 位（32 字节）长度。</p>
     * 
     * @return AES-256 密钥
     */
    private SecretKey getEncryptionKey() {
        // 通过 ConfigStoreCapability 获取配置，符合红线6
        String keyMaterial;
        if (configStore != null) {
            keyMaterial = configStore.getString(CONFIG_KEY_ENCRYPTION_KEY, DEFAULT_KEY);
        } else {
            // 降级处理：如果能力未注入，使用默认密钥（仅开发环境）
            keyMaterial = DEFAULT_KEY;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(keyMaterial.getBytes(StandardCharsets.UTF_8));
            // Use first 32 bytes (256 bits) as AES key
            return new SecretKeySpec(Arrays.copyOf(keyBytes, 32), "AES");
        } catch (Exception e) {
            // [R10 Fix] Use domain-specific TokenEncryptionException instead of RuntimeException
            throw new TokenEncryptionException(
                "Failed to derive encryption key from configured material",
                TokenEncryptionException.Operation.KEY_DERIVATION, e);
        }
    }
}
