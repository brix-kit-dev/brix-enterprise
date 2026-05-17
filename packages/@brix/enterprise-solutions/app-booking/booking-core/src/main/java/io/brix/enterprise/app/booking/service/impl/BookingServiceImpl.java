/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.service.impl;

import io.brix.enterprise.app.booking.dto.BookingDTO;
import io.brix.enterprise.app.booking.dto.TimeSlotDTO;
import io.brix.enterprise.app.booking.entity.BookableResource;
import io.brix.enterprise.app.booking.entity.Booking;
import io.brix.enterprise.app.booking.enums.BookingStatus;
import io.brix.enterprise.app.booking.event.BookingCancelledEvent;
import io.brix.enterprise.app.booking.event.BookingCompletedEvent;
import io.brix.enterprise.app.booking.event.BookingConfirmedEvent;
import io.brix.enterprise.app.booking.event.BookingCreatedEvent;
import io.brix.enterprise.app.booking.repository.BookableResourceRepository;
import io.brix.enterprise.app.booking.repository.BookingRepository;
import io.brix.enterprise.app.booking.request.CreateBookingRequest;
import io.brix.enterprise.app.booking.service.BookingService;
import io.brix.enterprise.app.booking.service.support.BookingServiceSupport;
import io.brix.enterprise.app.booking.service.support.TimeSlotCalculator;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 预约服务实现
 * 
 * <p>实现预约的创建、取消、确认、完成、改期等核心业务功能，
 * 以及时间槽查询等辅助功能。</p>
 * 
 * <h3>架构说明</h3>
 * <p>本服务遵循 v3.0 Runtime Shell 架构：</p>
 * <ul>
 *   <li>通过 {@link RuntimeContext} 获取所有运行时能力</li>
 *   <li>使用 {@code context.getEventBus()} 发布集成事件</li>
 *   <li>使用 {@code context.getStateStore()} 进行状态缓存</li>
 *   <li>使用 {@code context.getAuthContext()} 获取当前用户/租户</li>
 *   <li><b>禁止</b>直接依赖 Kafka/Redis 等基础设施</li>
 * </ul>
 * 
 * <h3>核心业务规则</h3>
 * <ul>
 *   <li>预约创建前需校验时间槽可用性</li>
 *   <li>取消预约需检查取消截止时间</li>
 *   <li>状态流转需符合状态机规则</li>
 *   <li>所有操作需考虑多租户隔离</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
public class BookingServiceImpl implements BookingService {
    
    // ==================== 依赖注入 ====================
    
    /**
     * 运行时上下文
     * <p>【核心】获取所有运行时能力的唯一入口，替代直接依赖 Kafka/Redis</p>
     */
    private final RuntimeContext runtimeContext;
    
    /**
     * 预约仓库
     */
    private final BookingRepository bookingRepository;
    
    /**
     * 资源仓库
     */
    private final BookableResourceRepository resourceRepository;
    
    /**
     * 时间槽计算器
     * <p>【提取模块】负责时间槽生成和可用性计算</p>
     */
    private final TimeSlotCalculator timeSlotCalculator;
    
    /**
     * 服务支持类
     * <p>【提取模块】提供租户/用户上下文、缓存、DTO转换等工具方法</p>
     */
    private final BookingServiceSupport support;
    
    // ==================== 构造函数 ====================
    
    /**
     * 构造函数注入依赖
     *
     * @param runtimeContext      运行时上下文（核心能力入口）
     * @param bookingRepository   预约仓库
     * @param resourceRepository  资源仓库
     * @param timeSlotCalculator  时间槽计算器
     * @param support             服务支持类
     */
    public BookingServiceImpl(RuntimeContext runtimeContext,
                               BookingRepository bookingRepository,
                               BookableResourceRepository resourceRepository,
                               TimeSlotCalculator timeSlotCalculator,
                               BookingServiceSupport support) {
        this.runtimeContext = runtimeContext;
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.timeSlotCalculator = timeSlotCalculator;
        this.support = support;
    }
    
    // ==================== 查询操作 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    public BookingDTO getById(Long bookingId) {
        Long tenantId = support.getCurrentTenantId();
        
        // 尝试从缓存获取
        String cacheKey = BookingServiceSupport.CACHE_KEY_BOOKING + bookingId;
        return support.getStateStore()
                .get(cacheKey, BookingDTO.class)
                .orElseGet(() -> {
                    // 缓存未命中，从数据库查询
                    return bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                            .map(support::toDTO)
                            .orElse(null);
                });
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public BookingDTO getByBookingNo(String bookingNo) {
        Long tenantId = support.getCurrentTenantId();
        
        return bookingRepository.findByBookingNoAndTenantId(bookingNo, tenantId)
                .map(support::toDTO)
                .orElse(null);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<BookingDTO> findByUser(Long userId, String status) {
        Long tenantId = support.getCurrentTenantId();
        
        List<Booking> bookings;
        if (status == null || status.isEmpty()) {
            bookings = bookingRepository.findByUserIdAndTenantIdOrderByBookedDateDescStartTimeDesc(
                    userId, tenantId);
        } else {
            BookingStatus bookingStatus = BookingStatus.valueOf(status);
            bookings = bookingRepository.findByUserIdAndStatusAndTenantIdOrderByBookedDateDescStartTimeDesc(
                    userId, bookingStatus, tenantId);
        }
        
        return bookings.stream()
                .map(support::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<BookingDTO> findBySource(String sourceType, Long sourceId) {
        Long tenantId = support.getCurrentTenantId();
        
        return bookingRepository.findBySourceTypeAndSourceIdAndTenantIdOrderByBookedDateDescStartTimeDesc(
                        sourceType, sourceId, tenantId)
                .stream()
                .map(support::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * {@inheritDoc}
     * 
     * <p>【委托】时间槽计算逻辑已提取到 TimeSlotCalculator</p>
     */
    @Override
    public List<TimeSlotDTO> getAvailableSlots(Long resourceId, LocalDate date) {
        return timeSlotCalculator.calculateAvailableSlots(resourceId, date);
    }
    
    // ==================== 写操作 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public BookingDTO create(CreateBookingRequest request) {
        Long tenantId = support.getCurrentTenantId();
        Long currentUserId = support.getCurrentUserId();
        
        // 1. 获取并校验资源
        BookableResource resource = resourceRepository.findByIdAndTenantId(request.getResourceId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("资源不存在: " + request.getResourceId()));
        
        if (!resource.getEnabled()) {
            throw new IllegalArgumentException("资源已禁用，无法预约");
        }
        
        // 2. 校验时间槽可用性（使用可选分布式锁防止超卖）
        // 【架构约束】可选能力必须使用 Optional 判空
        String slotLockKey = String.format("booking:slot:%d:%s:%s",
                request.getResourceId(), request.getBookedDate(), request.getStartTime());
        
        runtimeContext.getLock().ifPresentOrElse(
                lockCapability -> {
                    // 有分布式锁能力：使用锁防止超卖
                    boolean locked = lockCapability.tryLock(slotLockKey, 10, java.util.concurrent.TimeUnit.SECONDS);
                    if (locked) {
                        try {
                            support.validateSlotAvailability(request, resource);
                        } finally {
                            lockCapability.unlock(slotLockKey);
                        }
                    } else {
                        throw new IllegalStateException("获取时间槽锁失败，请稍后重试");
                    }
                },
                () -> {
                    // 无分布式锁能力：降级为直接校验（接受一定程度的并发风险）
                    runtimeContext.getObservability().warn(
                            "LockCapability 不可用，时间槽超卖防护降级");
                    support.validateSlotAvailability(request, resource);
                }
        );
        
        // 3. 生成预约编号
        String bookingNo = support.generateBookingNo();
        
        // 4. 创建预约实体
        Booking booking = new Booking();
        booking.setBookingNo(bookingNo);
        booking.setResourceId(request.getResourceId());
        booking.setResourceType(request.getResourceType());
        booking.setResourceName(resource.getResourceName());
        booking.setBookedDate(request.getBookedDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setUserId(request.getUserId());
        booking.setContactName(request.getContactName());
        booking.setContactPhone(request.getContactPhone());
        booking.setSourceType(request.getSourceType());
        booking.setSourceId(request.getSourceId());
        booking.setRemark(request.getRemark());
        booking.setStatus(BookingStatus.PENDING);
        booking.setTenantId(tenantId);
        booking.setCreatedBy(currentUserId);
        
        // 5. 保存预约
        booking = bookingRepository.save(booking);
        
        // 6. 记录日志
        runtimeContext.getObservability().info(
                "预约创建成功: bookingNo={}, resourceId={}, bookedDate={}", 
                bookingNo, request.getResourceId(), request.getBookedDate());
        
        // 7. 发布集成事件 【核心改造点：使用 RuntimeContext 替代 KafkaTemplate】
        BookingCreatedEvent event = new BookingCreatedEvent(
                booking.getId(),
                booking.getBookingNo(),
                booking.getResourceId(),
                booking.getResourceType().name(),
                booking.getResourceName(),
                booking.getUserId(),
                booking.getContactName(),
                booking.getContactPhone(),
                booking.getTenantId(),
                booking.getBookedDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );
        runtimeContext.getEventBus().publishIntegration(event);
        
        // 8. 缓存预约信息 【核心改造点：使用 RuntimeContext 替代 RedisTemplate】
        BookingDTO dto = support.toDTO(booking);
        support.getStateStore().put(
                BookingServiceSupport.CACHE_KEY_BOOKING + booking.getId(),
                dto,
                java.time.Duration.ofHours(24)
        );
        
        return dto;
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void confirm(Long bookingId) {
        Long tenantId = support.getCurrentTenantId();
        Long currentUserId = support.getCurrentUserId();
        
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在: " + bookingId));
        
        // 执行状态变更（会校验状态机）
        booking.confirm();
        bookingRepository.save(booking);
        
        // 记录日志
        runtimeContext.getObservability().info(
                "预约确认成功: bookingId={}, bookingNo={}", bookingId, booking.getBookingNo());
        
        // 发布集成事件
        BookingConfirmedEvent event = new BookingConfirmedEvent(
                booking.getId(),
                booking.getBookingNo(),
                booking.getConfirmedAt(),
                currentUserId,
                booking.getTenantId()
        );
        runtimeContext.getEventBus().publishIntegration(event);
        
        // 更新缓存
        support.invalidateBookingCache(bookingId);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void cancel(Long bookingId, String reason) {
        Long tenantId = support.getCurrentTenantId();
        Long currentUserId = support.getCurrentUserId();
        
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在: " + bookingId));
        
        // 检查取消截止时间
        BookableResource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("资源不存在"));
        
        LocalDateTime bookingDateTime = LocalDateTime.of(booking.getBookedDate(), booking.getStartTime());
        LocalDateTime cancelDeadline = bookingDateTime.minusHours(resource.getCancelDeadlineHours());
        
        if (LocalDateTime.now().isAfter(cancelDeadline)) {
            throw new IllegalStateException(
                    String.format("已超过取消截止时间（预约开始前%d小时）", resource.getCancelDeadlineHours()));
        }
        
        // 执行状态变更
        booking.cancel(reason);
        bookingRepository.save(booking);
        
        // 记录日志
        runtimeContext.getObservability().info(
                "预约取消成功: bookingId={}, bookingNo={}, reason={}", 
                bookingId, booking.getBookingNo(), reason);
        
        // 发布集成事件
        BookingCancelledEvent event = new BookingCancelledEvent(
                booking.getId(),
                booking.getBookingNo(),
                reason,
                booking.getCancelledAt(),
                currentUserId,
                booking.getTenantId()
        );
        runtimeContext.getEventBus().publishIntegration(event);
        
        // 更新缓存
        support.invalidateBookingCache(bookingId);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void complete(Long bookingId) {
        Long tenantId = support.getCurrentTenantId();
        
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在: " + bookingId));
        
        // 执行状态变更
        booking.complete();
        bookingRepository.save(booking);
        
        // 记录日志
        runtimeContext.getObservability().info(
                "预约完成: bookingId={}, bookingNo={}", bookingId, booking.getBookingNo());
        
        // 发布集成事件
        BookingCompletedEvent event = new BookingCompletedEvent(
                booking.getId(),
                booking.getBookingNo(),
                booking.getCompletedAt(),
                booking.getTenantId()
        );
        runtimeContext.getEventBus().publishIntegration(event);
        
        // 更新缓存
        support.invalidateBookingCache(bookingId);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void markNoShow(Long bookingId) {
        Long tenantId = support.getCurrentTenantId();
        
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在: " + bookingId));
        
        booking.markNoShow();
        bookingRepository.save(booking);
        
        runtimeContext.getObservability().info(
                "预约标记为未到: bookingId={}, bookingNo={}", bookingId, booking.getBookingNo());
        
        support.invalidateBookingCache(bookingId);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public BookingDTO reschedule(Long bookingId, LocalDate newDate, 
                                  LocalTime newStartTime, LocalTime newEndTime) {
        Long tenantId = support.getCurrentTenantId();
        
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在: " + bookingId));
        
        // 校验新时间槽可用性（排除当前预约自身）
        BookableResource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("资源不存在"));
        
        int currentBookedCount = bookingRepository.countByResourceIdAndSlotAndStatusIn(
                booking.getResourceId(), newDate, newStartTime, newEndTime, 
                BookingServiceSupport.ACTIVE_STATUSES);
        
        // 如果是同一时间槽，需要减去自身
        if (booking.getBookedDate().equals(newDate) 
                && booking.getStartTime().equals(newStartTime)
                && booking.getEndTime().equals(newEndTime)) {
            currentBookedCount--;
        }
        
        if (currentBookedCount >= resource.getMaxConcurrent()) {
            throw new IllegalArgumentException("新时间槽已满，无法改期");
        }
        
        // 记录原时间（用于事件）
        LocalDate oldDate = booking.getBookedDate();
        LocalTime oldStartTime = booking.getStartTime();
        
        // 执行改期
        booking.reschedule(newDate, newStartTime, newEndTime);
        booking = bookingRepository.save(booking);
        
        runtimeContext.getObservability().info(
                "预约改期成功: bookingId={}, 从 {}/{} 改为 {}/{}", 
                bookingId, oldDate, oldStartTime, newDate, newStartTime);
        
        // 更新缓存
        support.invalidateBookingCache(bookingId);
        
        return support.toDTO(booking);
    }
}
