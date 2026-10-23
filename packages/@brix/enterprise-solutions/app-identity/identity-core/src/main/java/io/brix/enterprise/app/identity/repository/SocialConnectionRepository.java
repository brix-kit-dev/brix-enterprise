/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.repository;

import io.brix.enterprise.app.identity.entity.SocialConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * 第三方账号绑定数据访问
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface SocialConnectionRepository extends JpaRepository<SocialConnection, String> {

    /**
     * 根据提供商和第三方用户 ID 查找绑定（多租户）
     */
    @Query("SELECT sc FROM SocialConnection sc " +
            "WHERE sc.provider = :provider " +
            "AND sc.providerUserId = :providerUserId " +
            "AND sc.tenantId = :tenantId " +
            "AND sc.deleted = false")
    Optional<SocialConnection> findByProviderAndProviderUserId(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId,
            @Param("tenantId") String tenantId);

    /**
     * 查找用户的所有第三方绑定
     */
    @Query("SELECT sc FROM SocialConnection sc " +
            "WHERE sc.authUserId = :authUserId " +
            "AND sc.tenantId = :tenantId " +
            "AND sc.deleted = false")
    List<SocialConnection> findByAuthUserIdAndTenantId(
            @Param("authUserId") String authUserId,
            @Param("tenantId") String tenantId);

    /**
     * 软删除：解绑指定提供商
     */
    @Query("UPDATE SocialConnection sc " +
            "SET sc.deleted = true, sc.deletedAt = CURRENT_TIMESTAMP " +
            "WHERE sc.authUserId = :authUserId " +
            "AND sc.provider = :provider " +
            "AND sc.tenantId = :tenantId " +
            "AND sc.deleted = false")
    void softDeleteByAuthUserIdAndProvider(
            @Param("authUserId") String authUserId,
            @Param("provider") String provider,
            @Param("tenantId") String tenantId);
}
