/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.event;

import io.brix.enterprise.app.booking.enums.BookingStatus;
import io.brix.enterprise.app.booking.repository.BookingRepository;
import io.brix.enterprise.shared.event.UserDisabledEvent;
import io.runtime.sdk.context.RuntimeContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handler for the UserDisabledEvent integration event.
 *
 * <p>When the identity plugin disables a user account, this handler
 * automatically cancels all pending/confirmed bookings belonging to
 * that user and publishes {@link BookingCancelledEvent} for each.</p>
 *
 * <h3>Event Source</h3>
 * <p>Declared as a subscription in META-INF/plugin-manifest.json:</p>
 * <pre>{@code
 * "events": {
 *   "subscribe": [
 *     "UserCreated",
 *     "UserDisabled",        // ← this event
 *     "PaymentCompleted",
 *     "PartnerStatusChanged"
 *   ]
 * }
 * }</pre>
 *
 * <h3>Idempotency</h3>
 * <p>Duplicate delivery is tolerated via a two-tier idempotency check:
 * in-memory {@code ConcurrentHashMap} (fast path) and persistent
 * {@code StateStoreCapability} (durable, 24 h TTL).</p>
 *
 * <h3>Architecture</h3>
 * <ul>
 *   <li>Subscribes to {@link io.brix.enterprise.shared.event.UserDisabledEvent}
 *       from the {@code shared-events} module — no compile-time dependency
 *       on identity-api (R8.1 fix).</li>
 *   <li>Uses RuntimeContext capabilities (EventBus, StateStore, Observability)
 *       per the v3.0 Runtime Shell contract.</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Component
public class UserDisabledEventHandler {

    private static final Logger log = LoggerFactory.getLogger(UserDisabledEventHandler.class);

    /**
     * 已处理事件 ID 集合（幂等去重）
     * <p>生产环境应使用 StateStoreCapability 持久化存储</p>
     */
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    /**
     * 有效预约状态（待取消）
     */
    private static final List<BookingStatus> PENDING_STATUSES = Arrays.asList(
            BookingStatus.PENDING, BookingStatus.CONFIRMED);

    private final BookingRepository bookingRepository;
    private final RuntimeContext runtimeContext;

    /**
     * 构造函数注入依赖
     *
     * @param bookingRepository 预约仓库
     * @param runtimeContext    运行时上下文
     */
    public UserDisabledEventHandler(BookingRepository bookingRepository,
                                     RuntimeContext runtimeContext) {
        this.bookingRepository = bookingRepository;
        this.runtimeContext = runtimeContext;
    }

    /**
     * 处理用户禁用事件
     * 
     * <p>当用户被禁用时，自动取消该用户所有待处理的预约。</p>
     * 
     * <h4>处理流程</h4>
     * <ol>
     *   <li>幂等检查：通过 eventId 判断是否已处理</li>
     *   <li>查询该用户的待处理预约</li>
     *   <li>批量取消预约</li>
     *   <li>发布预约取消事件</li>
     *   <li>记录已处理事件 ID</li>
     * </ol>
     * 
     * @param event 用户禁用事件
     */
    @Transactional
    public void onUserDisabled(UserDisabledEvent event) {
        String eventId = event.getEventId();
        String userId = event.getUserId();
        
        log.info("收到用户禁用事件: eventId={}, userId={}", eventId, userId);
        
        // 1. 幂等检查
        if (isAlreadyProcessed(eventId)) {
            log.info("事件已处理，跳过: eventId={}", eventId);
            return;
        }
        
        try {
            // 2. 查询待处理预约
            Long userIdLong = Long.parseLong(userId);
            var pendingBookings = bookingRepository
                    .findByUserIdAndStatusIn(userIdLong, PENDING_STATUSES);
            
            if (pendingBookings.isEmpty()) {
                log.info("用户 {} 无待处理预约，无需取消", userId);
                markAsProcessed(eventId);
                return;
            }
            
            log.info("用户 {} 有 {} 个待处理预约需要取消", userId, pendingBookings.size());
            
            // 3. 批量取消预约
            for (var booking : pendingBookings) {
                booking.cancel("用户账号已被禁用");
                bookingRepository.save(booking);
                
                // 4. 发布预约取消事件
                BookingCancelledEvent cancelEvent = new BookingCancelledEvent(
                        booking.getId(),
                        booking.getBookingNo(),
                        "用户账号已被禁用",
                        LocalDateTime.now(),
                        null,  // 系统自动取消，无操作人
                        booking.getTenantId()  // 租户ID
                );
                runtimeContext.getEventBus().publishIntegration(cancelEvent);
                
                runtimeContext.getObservability().info(
                        "预约已自动取消: bookingId={}, bookingNo={}, 原因=用户禁用",
                        booking.getId(), booking.getBookingNo());
            }
            
            // 5. 标记事件已处理
            markAsProcessed(eventId);
            
            log.info("用户禁用事件处理完成: userId={}, 取消预约数={}", userId, pendingBookings.size());
            
        } catch (Exception e) {
            log.error("处理用户禁用事件失败: eventId={}, userId={}", eventId, userId, e);
            // 不标记为已处理，允许重试
            throw e;
        }
    }

    /**
     * 检查事件是否已处理（幂等判断）
     * 
     * @param eventId 事件ID
     * @return 如果已处理返回 true
     */
    private boolean isAlreadyProcessed(String eventId) {
        // 先检查内存缓存
        if (processedEventIds.contains(eventId)) {
            return true;
        }
        
        // 再检查持久化存储（StateStore）
        String cacheKey = "event:processed:" + eventId;
        return runtimeContext.getStateStore()
                .get(cacheKey, Boolean.class)
                .orElse(false);
    }

    /**
     * 标记事件为已处理
     * 
     * @param eventId 事件ID
     */
    private void markAsProcessed(String eventId) {
        // 内存缓存
        processedEventIds.add(eventId);
        
        // 持久化到 StateStore（24小时过期，足够覆盖重试窗口）
        String cacheKey = "event:processed:" + eventId;
        runtimeContext.getStateStore().put(cacheKey, true, java.time.Duration.ofHours(24));
    }
}
