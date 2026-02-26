/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.enums;

/**
 * 资源类型枚举
 * 
 * <p>定义可预约资源的类型分类。资源类型用于：</p>
 * <ul>
 *   <li>资源的业务分类</li>
 *   <li>前端展示的图标/样式选择</li>
 *   <li>不同类型资源的特殊处理逻辑</li>
 * </ul>
 * 
 * <h3>扩展说明</h3>
 * <p>新增资源类型时，需同步更新：</p>
 * <ul>
 *   <li>前端 i18n 资源文件</li>
 *   <li>资源管理界面的类型选择器</li>
 *   <li>相关的业务处理逻辑（如有）</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public enum ResourceType {
    
    /**
     * 医生
     * <p>医疗场景下的医生资源，关联医生信息</p>
     */
    DOCTOR("医生"),
    
    /**
     * 顾问
     * <p>咨询场景下的顾问资源，关联顾问信息</p>
     */
    CONSULTANT("顾问"),
    
    /**
     * 会议室
     * <p>办公场景下的会议室资源，关联会议室信息</p>
     */
    MEETING_ROOM("会议室"),
    
    /**
     * 设备
     * <p>医疗或检测设备资源，关联设备信息</p>
     */
    EQUIPMENT("设备"),
    
    /**
     * 服务
     * <p>通用服务资源，关联服务定义</p>
     */
    SERVICE("服务"),
    
    /**
     * 其他
     * <p>其他类型的可预约资源</p>
     */
    OTHER("其他");
    
    /**
     * 类型显示名称
     */
    private final String displayName;
    
    /**
     * 构造函数
     *
     * @param displayName 类型的中文显示名称
     */
    ResourceType(String displayName) {
        this.displayName = displayName;
    }
    
    /**
     * 获取类型显示名称
     *
     * @return 类型的中文显示名称
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * 检查是否为医疗相关类型
     *
     * @return 如果是医疗相关类型返回true
     */
    public boolean isMedical() {
        return this == DOCTOR || this == EQUIPMENT;
    }
    
    /**
     * 检查是否需要专业资质验证
     *
     * @return 如果需要资质验证返回true
     */
    public boolean requiresQualification() {
        return this == DOCTOR || this == CONSULTANT;
    }
}
