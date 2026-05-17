/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service;

/**
 * 密码哈希服务接口
 *
 * <p>提供框架无关的密码加密与校验能力，遵循 v3.0 运行壳架构蓝图约束：
 * 插件层（Layer 1）不得直接依赖 Spring Security 等框架库。</p>
 *
 * <h3>设计说明</h3>
 * <ul>
 *   <li>此接口定义在 identity-api（插件 API 层），保持纯 Java 无框架依赖</li>
 *   <li>具体实现（如 BCrypt）放在 identity-core 层，使用纯 Java 库</li>
 *   <li>替代原先对 {@code org.springframework.security.crypto.password.PasswordEncoder} 的直接依赖</li>
 * </ul>
 *
 * <h3>安全规范</h3>
 * <ul>
 *   <li>实现类必须使用单向哈希算法（如 BCrypt、Argon2）</li>
 *   <li>每次加密必须自动生成随机盐值</li>
 *   <li>禁止使用 MD5、SHA-1 等不安全的哈希算法</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface PasswordHasher {

    /**
     * 对原始密码进行哈希加密
     *
     * <p>实现类应使用 BCrypt 等安全算法，自动加盐处理。
     * 返回的哈希值包含算法标识、盐值和密文，可直接存储到数据库。</p>
     *
     * @param rawPassword 原始明文密码，不能为 null 或空
     * @return 加密后的密码哈希值（包含盐值信息）
     * @throws IllegalArgumentException 如果 rawPassword 为 null 或空
     */
    String hash(String rawPassword);

    /**
     * 校验原始密码与已存储的哈希值是否匹配
     *
     * <p>从已存储的哈希值中提取盐值和算法信息，
     * 对原始密码重新哈希后比较。使用恒定时间比较防止时序攻击。</p>
     *
     * @param rawPassword    原始明文密码
     * @param encodedPassword 已加密存储的密码哈希值
     * @return 如果密码匹配返回 true，否则返回 false
     * @throws IllegalArgumentException 如果任一参数为 null
     */
    boolean verify(String rawPassword, String encodedPassword);
}
