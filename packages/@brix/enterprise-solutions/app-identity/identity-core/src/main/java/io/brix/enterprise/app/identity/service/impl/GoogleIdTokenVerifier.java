/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.brix.enterprise.app.identity.dto.GoogleUserInfo;
import io.brix.enterprise.app.identity.exception.JwksRetrievalException;
import io.brix.enterprise.app.identity.exception.OAuth2AuthenticationException;

import io.runtime.sdk.capability.HttpCapability;
import io.runtime.sdk.capability.HttpCapability.HttpResult;

/**
 * Google ID Token 验证器
 * 
 * <p>使用 Google 的 JWKS（JSON Web Key Set）端点验证 ID Token 签名，
 * 实现完整的 OpenID Connect ID Token 验证流程。</p>
 * 
 * <h3>验证步骤</h3>
 * <ol>
 *   <li>验证 JWT 结构（三段式 header.payload.signature）</li>
 *   <li>解析 JWT header 获取 kid（Key ID）</li>
 *   <li>从 Google JWKS 端点获取对应公钥（带缓存）</li>
 *   <li>使用 RSA 公钥验证签名</li>
 *   <li>验证 claims：iss、aud、exp、iat</li>
 * </ol>
 * 
 * <h3>安全最佳实践</h3>
 * <ul>
 *   <li>公钥缓存 1 小时（Google 推荐刷新周期）</li>
 *   <li>验证签名算法必须为 RS256</li>
 *   <li>验证 audience 必须匹配 client_id</li>
 *   <li>验证 issuer 必须为 accounts.google.com</li>
 *   <li>验证 token 未过期，允许 5 分钟时钟偏移</li>
 * </ul>
 * 
 * <h3>架构合规</h3>
 * <p>[红线 R3] 使用 HttpCapability 能力契约获取 JWKS，不直接依赖 HTTP 客户端库。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see <a href="https://developers.google.com/identity/openid-connect/openid-connect#validatinganidtoken">
 *      Google OpenID Connect - Validating an ID Token</a>
 */
@Component
public class GoogleIdTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifier.class);

    /** Google JWKS 端点 */
    private static final String GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

    /** 合法的 issuer 值 */
    private static final String ISSUER_HTTPS = "https://accounts.google.com";
    private static final String ISSUER_SHORT = "accounts.google.com";

    /** 公钥缓存有效期（1 小时） */
    private static final long JWKS_CACHE_TTL_MS = 3600_000L;

    /** 允许的时钟偏移（5 分钟） */
    private static final long CLOCK_SKEW_SECONDS = 300L;

    // ==================== 依赖 ====================

    private final HttpCapability httpClient;
    private final ObjectMapper objectMapper;

    // ==================== JWKS 缓存 ====================

    /**
     * 公钥缓存: kid → PublicKey
     */
    private final ConcurrentHashMap<String, PublicKey> jwksCache = new ConcurrentHashMap<>();

    /**
     * 缓存最后刷新时间
     */
    private final AtomicLong lastJwksRefresh = new AtomicLong(0);

    // ==================== 构造函数 ====================

    public GoogleIdTokenVerifier(HttpCapability httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    // ==================== 公共接口 ====================

    /**
     * 验证 Google ID Token 并返回用户信息
     * 
     * @param idToken      Google 返回的 ID Token（JWT 字符串）
     * @param clientId     Google OAuth2 Client ID（用于 audience 验证）
     * @return 解析后的 Google 用户信息
     * @throws OAuth2AuthenticationException 验证失败时
     */
    public GoogleUserInfo verify(String idToken, String clientId) {
        if (idToken == null || idToken.isBlank()) {
            throw OAuth2AuthenticationException.invalidIdToken("ID token is empty");
        }

        // Step 1: 分割 JWT
        String[] parts = idToken.split("\\.");
        if (parts.length != 3) {
            throw OAuth2AuthenticationException.invalidIdToken("Invalid JWT format");
        }

        try {
            // Step 2: 解析 Header
            String headerJson = decodeBase64Url(parts[0]);
            JsonNode header = objectMapper.readTree(headerJson);

            String alg = header.path("alg").asText();
            if (!"RS256".equals(alg)) {
                throw OAuth2AuthenticationException.invalidIdToken(
                        "Unsupported algorithm: " + alg + ". Expected RS256.");
            }

            String kid = header.path("kid").asText();
            if (kid.isEmpty()) {
                throw OAuth2AuthenticationException.invalidIdToken("Missing kid in header");
            }

            // Step 3: 获取公钥并验证签名
            PublicKey publicKey = getPublicKey(kid);
            verifySignature(parts[0] + "." + parts[1], parts[2], publicKey);

            // Step 4: 解析 Payload
            String payloadJson = decodeBase64Url(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);

            // Step 5: 验证 Claims
            verifyClaims(claims, clientId);

            return GoogleUserInfo.fromMap(claims);

        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify Google ID token", e);
            throw OAuth2AuthenticationException.invalidIdToken(e.getMessage());
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 验证 JWT Claims
     */
    private void verifyClaims(Map<String, Object> claims, String clientId) {
        // 验证 Issuer
        String iss = (String) claims.get("iss");
        if (!ISSUER_HTTPS.equals(iss) && !ISSUER_SHORT.equals(iss)) {
            throw OAuth2AuthenticationException.invalidIdToken("Invalid issuer: " + iss);
        }

        // 验证 Audience
        String aud = (String) claims.get("aud");
        if (!clientId.equals(aud)) {
            throw OAuth2AuthenticationException.invalidIdToken(
                    "Audience mismatch. Expected: " + clientId + ", got: " + aud);
        }

        long now = System.currentTimeMillis() / 1000;

        // 验证过期时间
        Number exp = (Number) claims.get("exp");
        if (exp == null) {
            throw OAuth2AuthenticationException.invalidIdToken("Missing exp claim");
        }
        if (exp.longValue() + CLOCK_SKEW_SECONDS < now) {
            throw OAuth2AuthenticationException.invalidIdToken("Token has expired");
        }

        // 验证签发时间不在遥远的未来
        Number iat = (Number) claims.get("iat");
        if (iat != null && iat.longValue() - CLOCK_SKEW_SECONDS > now) {
            throw OAuth2AuthenticationException.invalidIdToken("Token issued in the future");
        }
    }

    /**
     * 使用 RSA 公钥验证 JWT 签名
     */
    private void verifySignature(String signingInput, String signatureB64, PublicKey publicKey) {
        try {
            byte[] signatureBytes = Base64.getUrlDecoder().decode(signatureB64);

            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(publicKey);
            sig.update(signingInput.getBytes(StandardCharsets.UTF_8));

            if (!sig.verify(signatureBytes)) {
                throw OAuth2AuthenticationException.invalidIdToken("Signature verification failed");
            }
        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw OAuth2AuthenticationException.invalidIdToken(
                    "Signature verification error: " + e.getMessage());
        }
    }

    /**
     * 从 JWKS 缓存中获取公钥，必要时刷新缓存
     */
    private PublicKey getPublicKey(String kid) {
        // 尝试从缓存获取
        PublicKey cached = jwksCache.get(kid);
        if (cached != null && !isJwksCacheExpired()) {
            return cached;
        }

        // 缓存未命中或已过期，刷新 JWKS
        synchronized (this) {
            // Double-check
            cached = jwksCache.get(kid);
            if (cached != null && !isJwksCacheExpired()) {
                return cached;
            }

            refreshJwksCache();
        }

        PublicKey key = jwksCache.get(kid);
        if (key == null) {
            throw OAuth2AuthenticationException.invalidIdToken(
                    "Public key not found for kid: " + kid);
        }
        return key;
    }

    /**
     * 从 Google JWKS 端点刷新公钥缓存
     */
    private void refreshJwksCache() {
        try {
            log.info("Refreshing Google JWKS cache from {}", GOOGLE_JWKS_URL);

            HttpResult response = httpClient.get(GOOGLE_JWKS_URL, Map.of(
                    "Accept", "application/json"
            ));

            if (response.statusCode() != 200) {
                log.error("Failed to fetch Google JWKS: HTTP {}", response.statusCode());
                // [R10 Fix] Use domain-specific JwksRetrievalException instead of RuntimeException
                throw new JwksRetrievalException(
                    "JWKS fetch failed with HTTP status " + response.statusCode(),
                    response.statusCode(), GOOGLE_JWKS_URL);
            }

            JsonNode jwks = objectMapper.readTree(response.body());
            JsonNode keys = jwks.path("keys");

            if (!keys.isArray()) {
                // [R10 Fix] Use domain-specific JwksRetrievalException instead of RuntimeException
                throw new JwksRetrievalException(
                    "Invalid JWKS response: 'keys' field is not an array", GOOGLE_JWKS_URL);
            }

            ConcurrentHashMap<String, PublicKey> newCache = new ConcurrentHashMap<>();
            for (JsonNode keyNode : keys) {
                String kid = keyNode.path("kid").asText();
                String kty = keyNode.path("kty").asText();
                String alg = keyNode.path("alg").asText();

                if ("RSA".equals(kty) && "RS256".equals(alg)) {
                    PublicKey publicKey = buildRsaPublicKey(
                            keyNode.path("n").asText(),
                            keyNode.path("e").asText()
                    );
                    newCache.put(kid, publicKey);
                }
            }

            // 原子替换缓存内容
            jwksCache.clear();
            jwksCache.putAll(newCache);
            lastJwksRefresh.set(System.currentTimeMillis());

            log.info("Google JWKS cache refreshed, loaded {} keys", newCache.size());

        } catch (Exception e) {
            log.error("Failed to refresh Google JWKS cache", e);
            // 如果缓存中还有旧数据，继续使用
            if (jwksCache.isEmpty()) {
                throw OAuth2AuthenticationException.invalidIdToken(
                        "Unable to fetch Google signing keys: " + e.getMessage());
            }
        }
    }

    /**
     * 从 JWK 的 n 和 e 参数构建 RSA 公钥
     */
    private PublicKey buildRsaPublicKey(String modulusB64, String exponentB64) throws Exception {
        byte[] modulusBytes = Base64.getUrlDecoder().decode(modulusB64);
        byte[] exponentBytes = Base64.getUrlDecoder().decode(exponentB64);

        BigInteger modulus = new BigInteger(1, modulusBytes);
        BigInteger exponent = new BigInteger(1, exponentBytes);

        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
        KeyFactory factory = KeyFactory.getInstance("RSA");
        return factory.generatePublic(spec);
    }

    /**
     * 检查 JWKS 缓存是否过期
     */
    private boolean isJwksCacheExpired() {
        return System.currentTimeMillis() - lastJwksRefresh.get() > JWKS_CACHE_TTL_MS;
    }

    /**
     * Base64 URL 解码
     */
    private String decodeBase64Url(String input) {
        return new String(Base64.getUrlDecoder().decode(input), StandardCharsets.UTF_8);
    }
}
