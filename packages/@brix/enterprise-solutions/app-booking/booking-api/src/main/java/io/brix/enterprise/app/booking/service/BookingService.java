/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.service;

import io.brix.enterprise.app.booking.dto.BookingDTO;
import io.brix.enterprise.app.booking.dto.TimeSlotDTO;
import io.brix.enterprise.app.booking.request.CreateBookingRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

/**
 * 预约服务接口
 * 
 * <p>定义预约相关的所有业务操作，包括：</p>
 * <ul>
 *   <li>预约的创建、确认、取消、完成</li>
 *   <li>预约查询（按ID、编号、用户、来源）</li>
 *   <li>可用时间槽查询</li>
 *   <li>预约改期</li>
 * </ul>
 * 
 * <h3>事务说明</h3>
 * <p>所有写操作均需在事务中执行，确保数据一致性。</p>
 * 
 * <h3>多租户说明</h3>
 * <p>所有操作均需考虑租户隔离，通过 AuthContext 获取当前租户。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface BookingService {
    
    // ==================== 查询操作 ====================
    
    /**
     * 根据ID获取预约详情
     *
     * @param bookingId 预约ID
     * @return 预约详情，如果不存在返回回null
     */
    BookingDTO getById(Long bookingId);
    
    /**
     * 根据预约编号获取预约详情
     *
     * @param bookingNo 预约编号
     * @return 预约详情，如果不存在返回回null
     */
    BookingDTO getByBookingNo(String bookingNo);
    
    /**
     * 查询用户的预约列表
     *
     * @param userId 用户ID
     * @param status 状态过滤（可选，null表示查询全部）
     * @return 预约列表
     */
    List<BookingDTO> findByUser(Long userId, String status);
    
    /**
     * 按来源查询预约
     * <p>用于查询某个案件/服务包关联的所有预约</p>
     *
     * @param sourceType 来源类型
     * @param sourceId   来源ID
     * @return 预约列表
     */
    List<BookingDTO> findBySource(String sourceType, Long sourceId);
    
    /**
     * 查询资源在指定日期的可用时间槽
     *
     * @param resourceId 资源ID
     * @param date       日期
     * @return 时间槽列表
     */
    List<TimeSlotDTO> getAvailableSlots(Long resourceId, LocalDate date);
    
    // ==================== 写操作 ====================
    
    /**
     * 创建预约
     * <p>会自动校验时间槽可用性，并发布预约创建事件</p>
     *
     * @param request 创建请求
     * @return 创建的预约信息
     * @throws IllegalArgumentException 如果时间槽不可用
     */
    BookingDTO create(CreateBookingRequest request);
    
    /**
     * 确认预约
     * <p>将预约状态从 PENDING 变更为 CONFIRMED，并发布确认事件</p>
     *
     * @param bookingId 预约ID
     * @throws IllegalStateException 如果当前状态不允许确认
     */
    void confirm(Long bookingId);
    
    /**
     * 取消预约
     * <p>将预约状态变更为 CANCELLED，并发布取消事件</p>
     *
     * @param bookingId 预约ID
     * @param reason    取消原因
     * @throws IllegalStateException 如果当前状态不允许取消
     */
    void cancel(Long bookingId, String reason);
    
    /**
     * 完成预约
     * <p>将预约状态从 CONFIRMED 变更为 COMPLETED，并发布完成事件</p>
     *
     * @param bookingId 预约ID
     * @throws IllegalStateException 如果当前状态不允许完成
     */
    void complete(Long bookingId);
    
    /**
     * 标记为未到
     * <p>将预约状态从 CONFIRMED 变更为 NO_SHOW</p>
     *
     * @param bookingId 预约ID
     * @throws IllegalStateException 如果当前状态不允许标记
     */
    void markNoShow(Long bookingId);
    
    /**
     * 预约改期
     * <p>变更预约的日期和时间，会自动校验新时间槽可用性</p>
     *
     * @param bookingId    预约ID
     * @param newDate      新日期
     * @param newStartTime 新开始时间
     * @param newEndTime   新结束时间
     * @return 更新后的预约信息
     * @throws IllegalArgumentException 如果新时间槽不可用
     * @throws IllegalStateException    如果当前状态不允许改期
     */
    BookingDTO reschedule(Long bookingId, LocalDate newDate, 
                          LocalTime newStartTime, LocalTime newEndTime);
}
