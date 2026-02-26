/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.repository;

import com.shinwa.app.booking.entity.Booking;
import com.shinwa.app.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 预约仓库接口
 * 
 * <p>定义预约实体的数据访问方法。所有查询方法均需考虑租户隔离。</p>
 * 
 * <h3>查询方法命名约定</h3>
 * <ul>
 *   <li>findByXxx: 返回列表或Optional</li>
 *   <li>existsByXxx: 返回boolean</li>
 *   <li>countByXxx: 返回数量</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    // ==================== 单条查询 ====================
    
    /**
     * 根据ID和租户ID查询预约
     *
     * @param id       预约ID
     * @param tenantId 租户ID
     * @return 预约实体
     */
    Optional<Booking> findByIdAndTenantId(Long id, Long tenantId);
    
    /**
     * 根据预约编号查询
     *
     * @param bookingNo 预约编号
     * @param tenantId  租户ID
     * @return 预约实体
     */
    Optional<Booking> findByBookingNoAndTenantId(String bookingNo, Long tenantId);
    
    // ==================== 列表查询 ====================
    
    /**
     * 查询用户的预约列表
     *
     * @param userId   用户ID
     * @param tenantId 租户ID
     * @return 预约列表
     */
    List<Booking> findByUserIdAndTenantIdOrderByBookedDateDescStartTimeDesc(
            Long userId, Long tenantId);
    
    /**
     * 查询用户指定状态的预约列表
     *
     * @param userId   用户ID
     * @param status   预约状态
     * @param tenantId 租户ID
     * @return 预约列表
     */
    List<Booking> findByUserIdAndStatusAndTenantIdOrderByBookedDateDescStartTimeDesc(
            Long userId, BookingStatus status, Long tenantId);
    
    /**
     * 按来源查询预约
     *
     * @param sourceType 来源类型
     * @param sourceId   来源ID
     * @param tenantId   租户ID
     * @return 预约列表
     */
    List<Booking> findBySourceTypeAndSourceIdAndTenantIdOrderByBookedDateDescStartTimeDesc(
            String sourceType, Long sourceId, Long tenantId);
    
    /**
     * 根据用户ID和状态列表查询预约（用于跨模块事件处理）
     *
     * @param userId   用户ID
     * @param statuses 状态列表
     * @return 预约列表
     */
    List<Booking> findByUserIdAndStatusIn(Long userId, List<BookingStatus> statuses);
    
    /**
     * 查询资源在指定日期的预约
     *
     * @param resourceId 资源ID
     * @param bookedDate 预约日期
     * @param statuses   状态列表
     * @return 预约列表
     */
    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId " +
            "AND b.bookedDate = :bookedDate AND b.status IN :statuses")
    List<Booking> findByResourceIdAndDateAndStatusIn(
            @Param("resourceId") Long resourceId,
            @Param("bookedDate") LocalDate bookedDate,
            @Param("statuses") List<BookingStatus> statuses);
    
    /**
     * 查询资源在日期范围内的预约
     *
     * @param resourceId 资源ID
     * @param startDate  开始日期
     * @param endDate    结束日期
     * @param statuses   状态列表
     * @return 预约列表
     */
    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId " +
            "AND b.bookedDate >= :startDate AND b.bookedDate <= :endDate " +
            "AND b.status IN :statuses")
    List<Booking> findByResourceIdAndDateRangeAndStatusIn(
            @Param("resourceId") Long resourceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<BookingStatus> statuses);
    
    // ==================== 统计查询 ====================
    
    /**
     * 统计资源在指定日期指定时间槽的有效预约数
     * <p>用于时间槽可用性判断</p>
     *
     * @param resourceId 资源ID
     * @param bookedDate 预约日期
     * @param startTime  开始时间
     * @param endTime    结束时间
     * @param statuses   有效状态列表
     * @return 预约数量
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.resourceId = :resourceId " +
            "AND b.bookedDate = :bookedDate " +
            "AND b.startTime = :startTime AND b.endTime = :endTime " +
            "AND b.status IN :statuses")
    int countByResourceIdAndSlotAndStatusIn(
            @Param("resourceId") Long resourceId,
            @Param("bookedDate") LocalDate bookedDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("statuses") List<BookingStatus> statuses);
    
    // ==================== 存在性检查 ====================
    
    /**
     * 检查是否存在冲突预约
     * <p>用于创建预约前的时间槽可用性校验</p>
     *
     * @param resourceId 资源ID
     * @param bookedDate 预约日期
     * @param startTime  开始时间
     * @param endTime    结束时间
     * @param statuses   有效状态列表
     * @param maxCount   最大允许数量
     * @return 如果存在冲突返回true
     */
    @Query("SELECT CASE WHEN COUNT(b) >= :maxCount THEN true ELSE false END " +
            "FROM Booking b WHERE b.resourceId = :resourceId " +
            "AND b.bookedDate = :bookedDate " +
            "AND b.startTime = :startTime AND b.endTime = :endTime " +
            "AND b.status IN :statuses")
    boolean hasConflict(
            @Param("resourceId") Long resourceId,
            @Param("bookedDate") LocalDate bookedDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("maxCount") int maxCount);
}
