/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.service.support;

import com.shinwa.app.booking.dto.TimeSlotDTO;
import com.shinwa.app.booking.entity.BookableResource;
import com.shinwa.app.booking.entity.Booking;
import com.shinwa.app.booking.entity.TimeSlotTemplate;
import com.shinwa.app.booking.enums.BookingStatus;
import com.shinwa.app.booking.repository.BookableResourceRepository;
import com.shinwa.app.booking.repository.BookingRepository;
import com.shinwa.app.booking.repository.TimeSlotTemplateRepository;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Time Slot Calculator
 * 
 * <p>Calculates available time slots based on resource templates and existing bookings.</p>
 * 
 * <h3>Architecture Note (架构说明)</h3>
 * <p>Extracted from BookingServiceImpl as part of code quality improvement.
 * Contains the complex time slot generation logic to keep the main service file focused.</p>
 * 
 * <p>【中文技术要点】
 * 从 BookingServiceImpl 提取的时间槽计算逻辑，
 * 根据资源的时间槽模板和已有预约计算可用时间槽。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Component
public class TimeSlotCalculator {
    
    /**
     * Active booking statuses for conflict detection
     * 【有效预约状态】用于冲突检测和统计
     */
    private static final List<BookingStatus> ACTIVE_STATUSES = Arrays.asList(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED
    );
    
    private final RuntimeContext runtimeContext;
    private final BookableResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final TimeSlotTemplateRepository timeSlotTemplateRepository;
    
    /**
     * Constructor with dependency injection
     *
     * @param runtimeContext Runtime context for observability
     * @param resourceRepository Resource repository
     * @param bookingRepository Booking repository
     * @param timeSlotTemplateRepository Time slot template repository
     */
    public TimeSlotCalculator(
            RuntimeContext runtimeContext,
            BookableResourceRepository resourceRepository,
            BookingRepository bookingRepository,
            TimeSlotTemplateRepository timeSlotTemplateRepository) {
        this.runtimeContext = runtimeContext;
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.timeSlotTemplateRepository = timeSlotTemplateRepository;
    }
    
    /**
     * Calculate available time slots for a resource on a specific date
     * 
     * <p>Generates time slots based on templates and calculates availability
     * by checking existing bookings.</p>
     * 
     * <p>【中文技术要点】
     * 根据时间槽模板生成指定日期的所有时间槽，
     * 并结合已有预约计算每个时间槽的可用数量。</p>
     *
     * @param resourceId Resource ID
     * @param date Target date
     * @return List of time slots with availability information
     */
    public List<TimeSlotDTO> calculateAvailableSlots(Long resourceId, LocalDate date) {
        // Load resource
        BookableResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("资源不存在: " + resourceId));
        
        // Check advance booking limit
        LocalDate maxDate = LocalDate.now().plusDays(resource.getAdvanceDays());
        if (date.isAfter(maxDate)) {
            runtimeContext.getObservability().debug(
                    "预约日期 {} 超出可提前预约天数限制 {}", date, resource.getAdvanceDays());
            return Collections.emptyList();
        }
        
        // Get day of week (ISO-8601: 1=Monday, 7=Sunday)
        int dayOfWeek = date.getDayOfWeek().getValue();
        
        // Get templates for this day
        List<TimeSlotTemplate> templates = timeSlotTemplateRepository
                .findByResourceIdAndDayOfWeekAndEnabledOrderByStartTimeAsc(resourceId, dayOfWeek, true);
        
        if (templates.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Get existing bookings for this date
        List<Booking> existingBookings = bookingRepository
                .findByResourceIdAndDateAndStatusIn(resourceId, date, ACTIVE_STATUSES);
        
        // Generate slots
        return generateSlots(resourceId, date, templates, existingBookings);
    }
    
    /**
     * Generate time slots from templates
     */
    private List<TimeSlotDTO> generateSlots(
            Long resourceId,
            LocalDate date,
            List<TimeSlotTemplate> templates,
            List<Booking> existingBookings) {
        
        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (TimeSlotTemplate template : templates) {
            // Divide template into slots by duration
            LocalTime currentTime = template.getStartTime();
            while (currentTime.plusMinutes(template.getSlotDuration()).compareTo(template.getEndTime()) <= 0) {
                LocalTime slotEndTime = currentTime.plusMinutes(template.getSlotDuration());
                
                // Count booked slots
                final LocalTime finalStartTime = currentTime;
                final LocalTime finalEndTime = slotEndTime;
                int bookedCount = (int) existingBookings.stream()
                        .filter(b -> b.getStartTime().equals(finalStartTime) && b.getEndTime().equals(finalEndTime))
                        .count();
                
                int availableCount = template.getMaxBookings() - bookedCount;
                
                // Check if expired
                LocalDateTime slotDateTime = LocalDateTime.of(date, slotEndTime);
                boolean expired = slotDateTime.isBefore(now);
                
                // Check availability
                boolean available = !expired && availableCount > 0;
                
                // Generate slot ID
                String slotId = String.format("%d_%s_%s", resourceId, date, currentTime);
                
                TimeSlotDTO slot = TimeSlotDTO.builder()
                        .slotId(slotId)
                        .resourceId(resourceId)
                        .date(date)
                        .startTime(currentTime)
                        .endTime(slotEndTime)
                        .maxBookings(template.getMaxBookings())
                        .bookedCount(bookedCount)
                        .availableCount(availableCount)
                        .available(available)
                        .expired(expired)
                        .build();
                
                slots.add(slot);
                currentTime = slotEndTime;
            }
        }
        
        return slots;
    }
}
