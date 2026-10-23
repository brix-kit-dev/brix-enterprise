/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity;

import io.runtime.sdk.annotation.Module;
import io.runtime.sdk.capability.HealthStatus;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.support.AbstractModule;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * 用户身份模块入口类
 * 
 * <p>继承 {@link AbstractModule} 基类，响应 Runtime Shell 的生命周期回调。
 * 这是模块与 Runtime Shell 交互的唯一入口点。</p>
 * 
 * <h3>生命周期状态机</h3>
 * <pre>{@code
 * REGISTERED -> INITIALIZING -> STARTING -> RUNNING -> STOPPING -> DESTROYED
 *                   |                          |
 *                   v                          v
 *               (失败)                     DEGRADED (降级运行)
 * }</pre>
 * 
 * <h3>架构说明</h3>
 * <p>本模块遵循 v3.0.6 声明式架构：</p>
 * <ul>
 *   <li>元数据由 {@code @Module} 注解声明，基类自动提取</li>
 *   <li>后端能力声明在 META-INF/plugin-manifest.json</li>
 *   <li>前端路由/菜单声明在 ui-manifest.yaml</li>
 *   <li>扩展点通过 doInit/doStart/doStop/doDestroy 实现</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see AbstractModule
 * @see RuntimeContext
 */
@Module(
    id = "brix-app-identity",
    name = "用户身份管理",
    version = "3.0.0-SNAPSHOT",
    description = "用户、员工、患者档案与第三方账号绑定（本模块自有 identity_* 表）"
)
@Component  // Spring Bean 注册，Host 通过 ApplicationContext 发现模块
public class IdentityModule extends AbstractModule {

    /**
     * 模块启动时间
     */
    private volatile Instant startTime;

    /**
     * {@inheritDoc}
     * 
     * <p>模块初始化回调，在依赖注入完成后、模块启动前调用。</p>
     */
    @Override
    protected void doInit(RuntimeContext context) {
        // 加载模块配置
        int minPasswordLength = context.getConfigStore()
                .getInt("identity.password.min-length", 8);
        int sessionTimeout = context.getConfigStore()
                .getInt("identity.session.timeout-minutes", 30);
        getLogger().info("配置加载完成: password.min-length={}, session.timeout={}min", 
                minPasswordLength, sessionTimeout);
        
        // 验证必需能力
        validateRequiredCapabilities(context);
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块启动回调，在所有依赖模块启动完成后调用。</p>
     */
    @Override
    protected void doStart() {
        // 记录启动时间
        this.startTime = Instant.now();
        
        // 使用可选能力时必须判空（架构约束）
        getScheduling().ifPresent(scheduling -> {
            // 注册定时任务：清理过期会话（每 5 分钟）
            scheduling.scheduleWithCron("session-cleanup", "0 */5 * * * ?", () -> {
                getObservability().debug("执行定时任务：清理过期会话");
                // cleanExpiredSessions();
            });
            getLogger().info("会话清理定时任务注册完成");
        });
        
        getObservability().info("IdentityModule 启动完成，版本: {}", getMetadata().getVersion());
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块停止回调，收到停止信号时调用，用于优雅关闭。</p>
     */
    @Override
    protected void doStop() {
        // 取消定时任务
        getScheduling().ifPresent(scheduling -> {
            getLogger().info("取消定时任务...");
        });
        
        getObservability().info("IdentityModule 正在停止...");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块销毁回调，模块从运行时完全移除时调用。</p>
     */
    @Override
    protected void doDestroy() {
        startTime = null;
    }

    /**
     * {@inheritDoc}
     * 
     * <p>健康检查回调，Runtime Shell 定期调用此方法检查模块健康状态。</p>
     */
    @Override
    protected HealthStatus doHealthCheck() {
        // 检查状态存储连接（会话缓存依赖）
        try {
            getStateStore().exists("health-check-key");
        } catch (Exception e) {
            getLogger().warn("健康检查：StateStore 不可用 - {}", e.getMessage());
            return HealthStatus.DEGRADED;
        }
        
        return HealthStatus.UP;
    }

    /**
     * 验证必需能力是否可用
     */
    private void validateRequiredCapabilities(RuntimeContext context) {
        if (context.getEventBus() == null) {
            throw new IllegalStateException("必需能力 EventBusCapability 不可用");
        }
        if (context.getStateStore() == null) {
            throw new IllegalStateException("必需能力 StateStoreCapability 不可用");
        }
        if (context.getAuthContext() == null) {
            throw new IllegalStateException("必需能力 AuthCapability 不可用");
        }
        if (context.getObservability() == null) {
            throw new IllegalStateException("必需能力 ObservabilityCapability 不可用");
        }
        if (context.getConfigStore() == null) {
            throw new IllegalStateException("必需能力 ConfigStoreCapability 不可用");
        }
        
        getLogger().info("必需能力验证通过");
        
        // 可选能力检查
        if (context.getLock().isEmpty()) {
            getLogger().warn("可选能力 LockCapability 不可用，并发注册防护将降级");
        }
        if (context.getResilience().isEmpty()) {
            getLogger().warn("可选能力 ResilienceCapability 不可用，外部服务调用保护将降级");
        }
    }

    /**
     * 获取模块启动时间
     */
    public Instant getStartTime() {
        return startTime;
    }
}
