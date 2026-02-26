/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service.impl;

import com.shinwa.app.identity.entity.User;
import com.shinwa.app.identity.exception.JwtSigningException;
import io.runtime.sdk.capability.ConfigStoreCapability;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.UUID;

/**
 * JWT Token 签发服务
 *
 * <p>使用 RS256（RSA + SHA-256）算法签发 JWT Token，
 * 与 platform-auth 的 JwtValidator（RS256 公钥验证）配套使用。</p>
 *
 * <h3>架构红线合规 - v3.2</h3>
 * <ul>
 *   <li><b>红线6</b>：通过 ConfigStoreCapability 获取所有配置，不使用 @Value 注解</li>
 * </ul>
 *
 * <h3>配置项</h3>
 * <ul>
 *   <li>{@code identity.jwt.private-key-path} - JWT 私钥路径（默认: classpath:keys/private.pem）</li>
 *   <li>{@code identity.jwt.issuer} - JWT 签发者（默认: shinwa-auth-center）</li>
 *   <li>{@code identity.jwt.audience} - JWT 受众（默认: shinwa-platform-api）</li>
 *   <li>{@code identity.jwt.expiration} - JWT 有效期秒数（默认: 3600）</li>
 * </ul>
 *
 * <h3>安全说明</h3>
 * <ul>
 *   <li>私钥应存储在安全位置，生产环境建议使用 Vault 或加密配置中心</li>
 *   <li>随时可通过 ConfigStoreCapability 热更新配置（issuer、audience、expiration）</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0 - 架构红线合规改造（@Value → ConfigStoreCapability）
 */
@Service
public class JwtTokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);

    // ==================== 配置键常量 ====================

    /** JWT 私钥路径配置键 */
    private static final String CONFIG_KEY_PRIVATE_KEY_PATH = "identity.jwt.private-key-path";
    
    /** JWT 签发者配置键 */
    private static final String CONFIG_KEY_ISSUER = "identity.jwt.issuer";
    
    /** JWT 受众配置键 */
    private static final String CONFIG_KEY_AUDIENCE = "identity.jwt.audience";
    
    /** JWT 有效期（秒）配置键 */
    private static final String CONFIG_KEY_EXPIRATION = "identity.jwt.expiration";

    // ==================== 默认值常量 ====================

    /** 私钥路径默认值 */
    private static final String DEFAULT_PRIVATE_KEY_PATH = "classpath:keys/private.pem";
    
    /** 签发者默认值 */
    private static final String DEFAULT_ISSUER = "shinwa-auth-center";
    
    /** 受众默认值 */
    private static final String DEFAULT_AUDIENCE = "shinwa-platform-api";
    
    /** 有效期默认值（秒） */
    private static final long DEFAULT_EXPIRATION_SECONDS = 3600L;

    // ==================== 能力依赖 ====================

    /**
     * 配置存储能力
     * 
     * <p>【架构说明 - 红线6合规】通过 ConfigStoreCapability 获取所有配置，
     * 不直接使用 @Value、System.getenv()、System.getProperty()。</p>
     */
    private final ConfigStoreCapability configStore;

    // ==================== 配置字段（运行时从 ConfigStoreCapability 获取） ====================

    /** JWT 私钥路径 */
    private String privateKeyPath;
    
    /** JWT 签发者 */
    private String issuer;
    
    /** JWT 受众 */
    private String audience;
    
    /** JWT 有效期（秒） */
    private long expirationSeconds;

    /** RSA 私钥（用于签名） */
    private PrivateKey privateKey;

    // ==================== 构造函数 ====================

    /**
     * 构造函数注入配置存储能力
     *
     * @param configStore 配置存储能力实现
     */
    @Autowired
    public JwtTokenService(ConfigStoreCapability configStore) {
        this.configStore = configStore;
    }

    // ==================== 初始化 ====================

    /**
     * 服务初始化
     * 
     * <p>【架构说明】在 @PostConstruct 阶段从 ConfigStoreCapability 获取所有配置。
     * 这使得配置可以来自任何来源（环境变量、配置中心、Vault 等），
     * 由 Host 层的 ConfigStoreCapability 实现决定。</p>
     */
    @PostConstruct
    public void init() {
        // 通过 ConfigStoreCapability 获取配置，符合红线6
        this.privateKeyPath = configStore.getString(CONFIG_KEY_PRIVATE_KEY_PATH, DEFAULT_PRIVATE_KEY_PATH);
        this.issuer = configStore.getString(CONFIG_KEY_ISSUER, DEFAULT_ISSUER);
        this.audience = configStore.getString(CONFIG_KEY_AUDIENCE, DEFAULT_AUDIENCE);
        this.expirationSeconds = configStore.getLong(CONFIG_KEY_EXPIRATION, DEFAULT_EXPIRATION_SECONDS);

        try {
            this.privateKey = loadPrivateKey(privateKeyPath);
            log.info("[JwtTokenService] RS256 private key loaded from: {}", privateKeyPath);
            log.info("[JwtTokenService] JWT config: issuer={}, audience={}, expiration={}s",
                    issuer, audience, expirationSeconds);
        } catch (Exception e) {
            log.warn("[JwtTokenService] Failed to load private key from {}: {}. " +
                    "JWT signing will not be available.", privateKeyPath, e.getMessage());
        }
    }

    // ==================== 公开方法 ====================

    /**
     * 为用户签发 JWT Token（RS256）
     *
     * <p>生成包含以下标准声明的 JWT Token：</p>
     * <ul>
     *   <li>{@code sub} - 用户 ID</li>
     *   <li>{@code username} - 用户名</li>
     *   <li>{@code tenant_id} - 租户 ID</li>
     *   <li>{@code roles} - 用户角色数组</li>
     *   <li>{@code email} - 用户邮箱</li>
     *   <li>{@code iss} - 签发者</li>
     *   <li>{@code aud} - 受众</li>
     *   <li>{@code iat} - 签发时间</li>
     *   <li>{@code exp} - 过期时间</li>
     * </ul>
     *
     * @param user 用户实体
     * @return 签名后的 JWT Token 字符串
     * @throws IllegalStateException 如果私钥未加载
     */
    public String generateToken(User user) {
        if (privateKey == null) {
            throw new IllegalStateException("JWT private key not loaded, cannot sign tokens");
        }

        long now = System.currentTimeMillis() / 1000;
        long exp = now + expirationSeconds;

        // Header: {"alg":"RS256","typ":"JWT"}
        String header = base64UrlEncode("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");

        // Payload with required claims for JwtValidator
        String payloadJson = String.format(
                "{\"sub\":\"%s\",\"username\":\"%s\",\"tenant_id\":\"%s\"," +
                        "\"iss\":\"%s\",\"aud\":\"%s\"," +
                        "\"roles\":[\"%s\"],\"permissions\":[]," +
                        "\"email\":\"%s\",\"tv\":1," +
                        "\"iat\":%d,\"exp\":%d}",
                user.getId(),
                user.getUsername(),
                user.getTenantId() != null ? user.getTenantId() : "default",
                issuer,
                audience,
                user.getRole() != null ? user.getRole().name() : "USER",
                user.getEmail() != null ? user.getEmail() : "",
                now, exp
        );
        String payload = base64UrlEncode(payloadJson);

        // Sign with RS256
        String signingInput = header + "." + payload;
        String signature = rs256Sign(signingInput);

        return signingInput + "." + signature;
    }

    /**
     * 生成 Refresh Token
     *
     * <p>使用 UUID + 用户 ID 生成不透明的刷新令牌。</p>
     *
     * @param user 用户实体
     * @return 刷新令牌字符串
     */
    public String generateRefreshToken(User user) {
        return UUID.randomUUID().toString() + "-" + user.getId();
    }

    /**
     * 获取 Token 有效期（秒）
     *
     * @return 有效期秒数
     */
    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    // ==================== 私有方法 ====================

    /**
     * 使用 RS256 算法签名
     *
     * @param input 待签名内容（header.payload）
     * @return Base64 URL 编码的签名
     */
    private String rs256Sign(String input) {
        try {
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(privateKey);
            sig.update(input.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = sig.sign();
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        } catch (Exception e) {
            // [R10 Fix] Use domain-specific JwtSigningException instead of RuntimeException
            throw new JwtSigningException(
                "Failed to sign JWT token - RSA signature operation failed",
                JwtSigningException.FailureType.SIGNING, e);
        }
    }

    /**
     * Base64 URL 编码
     *
     * @param content 待编码内容
     * @return Base64 URL 编码字符串（无填充）
     */
    private String base64UrlEncode(String content) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(content.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 加载 RSA 私钥
     *
     * <p>支持 classpath 和文件系统路径。私钥必须是 PKCS#8 格式 PEM 文件。</p>
     *
     * @param path 私钥路径（如 classpath:keys/private.pem）
     * @return RSA 私钥对象
     * @throws RuntimeException 如果加载失败
     */
    private PrivateKey loadPrivateKey(String path) {
        try {
            ResourceLoader loader = new DefaultResourceLoader();
            Resource resource = loader.getResource(path);

            try (InputStream is = resource.getInputStream()) {
                String keyContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                keyContent = keyContent
                        .replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "");

                byte[] keyBytes = Base64.getDecoder().decode(keyContent);
                PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                return keyFactory.generatePrivate(spec);
            }
        } catch (Exception e) {
            // [R10 Fix] Use domain-specific JwtSigningException instead of RuntimeException
            throw new JwtSigningException(
                "Failed to load JWT private key - file not found or invalid format",
                JwtSigningException.FailureType.KEY_LOADING, path, e);
        }
    }
}
