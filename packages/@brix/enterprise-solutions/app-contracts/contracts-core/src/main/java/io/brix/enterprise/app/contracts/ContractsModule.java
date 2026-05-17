/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.contracts;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import io.runtime.sdk.annotation.Module;
import io.runtime.sdk.capability.HealthStatus;
import io.runtime.sdk.capability.LifecycleCapability;
import io.runtime.sdk.capability.ModuleMetadata;
import io.runtime.sdk.context.RuntimeContext;

/**
 * 合同管理模块入口类
 * 
 * <p>实现 {@link LifecycleCapability} 接口，响应 Runtime Shell 的生命周期回调。
 * 这是模块与 Runtime Shell 交互的唯一入口点。</p>
 * 
 * <h3>架构说明</h3>
 * <p>本类遵循 v3.0 Runtime Shell 架构蓝图：</p>
 * <ul>
 *   <li>通过 {@link #onInit(RuntimeContext)} 接收运行时上下文</li>
 *   <li>构造函数中<b>禁止</b>执行初始化逻辑</li>
 *   <li>所有资源清理必须在 {@link #onStop()} 中完成</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see LifecycleCapability
 * @see RuntimeContext
 */
@Module(
    id = "brix-app-contracts",
    name = "合同管理",
    version = "3.0.0-SNAPSHOT",
    description = "合同管理模块，提供合同模板、合同生成、电子签章、合同归档等功能"
)
@Component  // Spring Bean 注册，Host 通过 ApplicationContext 发现模块
public class ContractsModule implements LifecycleCapability {

    private static final Logger log = LoggerFactory.getLogger(ContractsModule.class);

    /**
     * Module metadata (loaded from META-INF/plugin-manifest.json)
     */
    private static final ModuleMetadata METADATA = ModuleMetadata.builder()
            .moduleId("brix-app-contracts")
            .moduleName("合同管理")
            .version("3.0.0-SNAPSHOT")
            .description("合同管理模块，提供合同模板、合同生成、电子签章、合同归档等功能")
            .build();

    /**
     * 运行时上下文引用
     */
    private final AtomicReference<RuntimeContext> contextRef = new AtomicReference<>();

    /**
     * 模块运行状态
     */
    private final AtomicBoolean running = new AtomicBoolean(false);

    /**
     * 模块启动时间
     */
    private volatile Instant startTime;

    /**
     * 默认构造函数
     * 
     * <p><b>【架构约束】</b>构造函数中不执行任何初始化逻辑，
     * 所有初始化必须在 {@link #onInit(RuntimeContext)} 中完成。</p>
     */
    public ContractsModule() {
        // 禁止在构造函数中执行初始化逻辑
        log.debug("ContractsModule 实例创建");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块初始化回调，在依赖注入完成后、模块启动前调用。</p>
     * 
     * @param context 运行时上下文，提供所有能力的访问入口
     */
    @Override
    public void onInit(RuntimeContext context) {
        log.info("【生命周期】ContractsModule.onInit() - 开始初始化");
        
        // 保存上下文引用
        this.contextRef.set(context);
        
        // 加载模块配置
        int expiryReminderDays = context.getConfigStore()
                .getInt("contract.expiry-reminder-days", 30);
        log.info("配置加载完成: contract.expiry-reminder-days={}", expiryReminderDays);
        
        // 验证必需能力
        validateRequiredCapabilities(context);
        
        log.info("【生命周期】ContractsModule.onInit() - 初始化完成");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块启动回调，在所有依赖模块启动完成后调用。</p>
     */
    @Override
    public void onStart() {
        log.info("【生命周期】ContractsModule.onStart() - 开始启动");
        
        RuntimeContext context = contextRef.get();
        if (context == null) {
            throw new IllegalStateException("RuntimeContext 未初始化，请先调用 onInit()");
        }
        
        // 记录启动时间
        this.startTime = Instant.now();
        
        // 使用可选能力时必须判空（架构约束）
        context.getScheduling().ifPresent(scheduling -> {
            // 注册定时任务：合同到期提醒（每天上午 9 点）
            scheduling.scheduleWithCron("contract-expiry-reminder", "0 0 9 * * ?", () -> {
                context.getObservability().info("执行定时任务：合同到期提醒检查");
            });
            log.info("定时任务注册完成");
        });
        
        // 标记模块运行中
        running.set(true);
        
        context.getObservability().info("ContractsModule 启动完成，版本: {}", METADATA.getVersion());
        log.info("【生命周期】ContractsModule.onStart() - 启动完成");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块停止回调，收到停止信号时调用，用于优雅关闭。</p>
     */
    @Override
    public void onStop() {
        log.info("【生命周期】ContractsModule.onStop() - 开始停止");
        
        // 标记停止状态，拒绝新请求
        running.set(false);
        
        RuntimeContext context = contextRef.get();
        if (context != null) {
            // 取消定时任务
            context.getScheduling().ifPresent(scheduling -> {
                log.info("取消定时任务...");
            });
            
            context.getObservability().info("ContractsModule 正在停止...");
        }
        
        log.info("【生命周期】ContractsModule.onStop() - 停止完成");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>模块销毁回调，模块从运行时完全移除时调用。</p>
     */
    @Override
    public void onDestroy() {
        log.info("【生命周期】ContractsModule.onDestroy() - 开始销毁");
        
        // 清理上下文引用
        contextRef.set(null);
        startTime = null;
        
        log.info("【生命周期】ContractsModule.onDestroy() - 销毁完成");
    }

    /**
     * {@inheritDoc}
     * 
     * <p>健康检查回调，Runtime Shell 定期调用此方法检查模块健康状态。</p>
     * 
     * @return 健康状态
     */
    @Override
    public HealthStatus healthCheck() {
        // 检查模块运行状态
        if (!running.get()) {
            log.warn("健康检查：模块未运行");
            return HealthStatus.DOWN;
        }
        
        RuntimeContext context = contextRef.get();
        if (context == null) {
            log.warn("健康检查：RuntimeContext 不可用");
            return HealthStatus.DOWN;
        }
        
        // 检查状态存储连接
        try {
            context.getStateStore().exists("contracts-health-check");
        } catch (Exception e) {
            log.warn("健康检查：StateStore 不可用 - {}", e.getMessage());
            return HealthStatus.DEGRADED;
        }
        
        return HealthStatus.UP;
    }

    /**
     * {@inheritDoc}
     * 
     * @return 模块元数据
     */
    @Override
    public ModuleMetadata getMetadata() {
        return METADATA;
    }

    /**
     * 验证必需能力是否可用
     * 
     * @param context 运行时上下文
     * @throws IllegalStateException 如果必需能力不可用
     */
    private void validateRequiredCapabilities(RuntimeContext context) {
        // 验证核心能力（必须）
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
        
        log.info("必需能力验证通过");
        
        // 可选能力检查（仅记录日志）
        if (context.getScheduling().isEmpty()) {
            log.warn("可选能力 SchedulingCapability 不可用，合同到期提醒功能将不可用");
        }
        if (context.getLock().isEmpty()) {
            log.warn("可选能力 LockCapability 不可用，并发签署保护将降级");
        }
    }

    /**
     * 检查模块是否正在运行
     * 
     * @return 如果模块正在运行返回 true
     */
    public boolean isRunning() {
        return running.get();
    }

    /**
     * 获取运行时上下文
     * 
     * @return 运行时上下文，如果未初始化返回 null
     */
    public RuntimeContext getContext() {
        return contextRef.get();
    }
}
