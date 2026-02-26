/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.repository;

import com.shinwa.app.booking.entity.TimeSlotTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 时间槽模板仓库接口
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Repository
public interface TimeSlotTemplateRepository extends JpaRepository<TimeSlotTemplate, Long> {
    
    /**
     * 查询资源在指定星期几的时间槽模板
     *
     * @param resourceId 资源ID
     * @param dayOfWeek  星期几
     * @param enabled    是否启用
     * @return 时间槽模板列表
     */
    List<TimeSlotTemplate> findByResourceIdAndDayOfWeekAndEnabledOrderByStartTimeAsc(
            Long resourceId, Integer dayOfWeek, Boolean enabled);
    
    /**
     * 查询资源的所有启用的时间槽模板
     *
     * @param resourceId 资源ID
     * @param enabled    是否启用
     * @return 时间槽模板列表
     */
    List<TimeSlotTemplate> findByResourceIdAndEnabledOrderByDayOfWeekAscStartTimeAsc(
            Long resourceId, Boolean enabled);
    
    /**
     * 查询资源的所有时间槽模板
     *
     * @param resourceId 资源ID
     * @return 时间槽模板列表
     */
    List<TimeSlotTemplate> findByResourceIdOrderByDayOfWeekAscStartTimeAsc(Long resourceId);
}
