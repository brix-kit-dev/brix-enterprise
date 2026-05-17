/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import io.brix.enterprise.app.identity.service.PasswordHasher;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 基于 BCrypt 算法的密码哈希实现
 *
 * <p>提供纯 Java 实现的 BCrypt 密码哈希能力，不依赖 Spring Security 框架。
 * 遵循 v3.0 运行壳架构蓝图约束：插件层（Layer 1）不得直接依赖 Spring 框架库。</p>
 *
 * <h3>算法说明</h3>
 * <ul>
 *   <li>使用 BCrypt 单向哈希算法，自动生成 16 字节随机盐值</li>
 *   <li>默认 cost factor 为 10（2^10 = 1024 次迭代），兼顾安全性和性能</li>
 *   <li>输出格式：{@code $2a$10$<22字符盐值><31字符哈希值>}，与业界 BCrypt 标准兼容</li>
 *   <li>密码校验使用恒定时间比较，防止时序攻击（Timing Attack）</li>
 * </ul>
 *
 * <h3>线程安全性</h3>
 * <p>本类是线程安全的，可作为单例 Bean 在多线程环境下使用。
 * 内部的 {@link SecureRandom} 实例是线程安全的。</p>
 *
 * <h3>架构说明</h3>
 * <p>替代原先 identity-core 对 {@code spring-security-crypto} 的直接依赖
 * （评审报告 D-9），消除插件核心层的 Spring 框架耦合。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see PasswordHasher
 * @deprecated Since 3.2.0 — D4 阶段已停用。运行时由 {@code IdentityAutoConfiguration.passwordHasher()}
 *     委托给 {@code io.runtime.sdk.capability.PasswordCapability}（Layer 2A）。
 *     本类保留仅作为 PasswordCapability 不可用时的降级回退，将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
public class BCryptPasswordHasher implements PasswordHasher {

    /**
     * BCrypt 算法版本标识（2a 表示标准 BCrypt）
     */
    private static final String BCRYPT_VERSION = "$2a$";

    /**
     * 默认 cost factor（迭代次数 = 2^COST）
     * <p>值为 10 表示 1024 次迭代，在安全性和性能之间取得平衡。
     * 可通过构造函数调整，推荐范围 10-14。</p>
     */
    private static final int DEFAULT_COST = 10;

    /**
     * BCrypt 盐值长度（16 字节）
     */
    private static final int BCRYPT_SALT_LEN = 16;

    /**
     * 安全随机数生成器（线程安全）
     */
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * BCrypt cost factor
     */
    private final int cost;

    /**
     * 使用默认 cost factor (10) 创建实例
     */
    public BCryptPasswordHasher() {
        this(DEFAULT_COST);
    }

    /**
     * 使用指定 cost factor 创建实例
     *
     * @param cost BCrypt cost factor（推荐范围 10-14，值越大越安全但越慢）
     * @throws IllegalArgumentException 如果 cost 不在 4-31 范围内
     */
    public BCryptPasswordHasher(int cost) {
        if (cost < 4 || cost > 31) {
            throw new IllegalArgumentException("BCrypt cost factor 必须在 4-31 范围内，当前值: " + cost);
        }
        this.cost = cost;
    }

    /**
     * {@inheritDoc}
     *
     * <p>使用 BCrypt 算法加密密码，自动生成随机盐值。
     * 每次调用即使密码相同，也会因盐值不同产生不同的哈希值。</p>
     */
    @Override
    public String hash(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("密码不能为 null 或空");
        }
        // 生成随机盐值
        byte[] salt = new byte[BCRYPT_SALT_LEN];
        secureRandom.nextBytes(salt);
        // 使用 BCrypt 算法哈希
        return BCryptUtil.hashpw(rawPassword, BCryptUtil.gensalt(cost, secureRandom));
    }

    /**
     * {@inheritDoc}
     *
     * <p>从已存储的哈希值中提取盐值和 cost factor，
     * 重新计算哈希后使用恒定时间比较。</p>
     */
    @Override
    public boolean verify(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            throw new IllegalArgumentException("密码和哈希值均不能为 null");
        }
        return BCryptUtil.checkpw(rawPassword, encodedPassword);
    }
}
