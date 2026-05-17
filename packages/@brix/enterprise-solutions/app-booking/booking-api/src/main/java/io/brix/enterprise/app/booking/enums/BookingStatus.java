/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.enums;

/**
 * 预约状态枚举
 * 
 * <p>定义预约的生命周期状态，支持状态流转：</p>
 * <ul>
 *   <li>PENDING → CONFIRMED → COMPLETED</li>
 *   <li>PENDING → CANCELLED</li>
 *   <li>CONFIRMED → CANCELLED</li>
 *   <li>CONFIRMED → NO_SHOW</li>
 * </ul>
 * 
 * <h3>状态机示意</h3>
 * <pre>
 *                    ┌───────────┐
 *     创建预约 ──────▶│  PENDING  │
 *                    └─────┬─────┘
 *                          │
 *          ┌───────────────┼───────────────┐
 *          │ confirm()     │ cancel()      │
 *          ▼               ▼               │
 *    ┌───────────┐   ┌───────────┐         │
 *    │ CONFIRMED │   │ CANCELLED │◀────────┘
 *    └─────┬─────┘   └───────────┘
 *          │
 *    ┌─────┼─────────────┐
 *    │     │ complete()  │ markNoShow()
 *    ▼     ▼             ▼
 * ┌─────┐ ┌─────────┐ ┌─────────┐
 * │CANC.│ │COMPLETED│ │ NO_SHOW │
 * └─────┘ └─────────┘ └─────────┘
 * </pre>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum BookingStatus {
    
    /**
     * 待确认
     * <p>用户提交预约后的初始状态，等待资源方确认</p>
     */
    PENDING("待确认"),
    
    /**
     * 已确认
     * <p>资源方已确认预约，等待履约</p>
     */
    CONFIRMED("已确认"),
    
    /**
     * 已取消
     * <p>用户或资源方取消了预约</p>
     */
    CANCELLED("已取消"),
    
    /**
     * 已完成
     * <p>预约已按时履约完成</p>
     */
    COMPLETED("已完成"),
    
    /**
     * 未到
     * <p>用户未按时赴约</p>
     */
    NO_SHOW("未到");
    
    /**
     * 状态显示名称
     */
    private final String displayName;
    
    /**
     * 构造函数
     *
     * @param displayName 状态的中文显示名称
     */
    BookingStatus(String displayName) {
        this.displayName = displayName;
    }
    
    /**
     * 获取状态显示名称
     *
     * @return 状态的中文显示名称
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * 检查是否可以取消
     * <p>只有待确认和已确认状态可以取消</p>
     *
     * @return 如果当前状态可以取消返回true
     */
    public boolean canCancel() {
        return this == PENDING || this == CONFIRMED;
    }
    
    /**
     * 检查是否可以确认
     * <p>只有待确认状态可以确认</p>
     *
     * @return 如果当前状态可以确认返回true
     */
    public boolean canConfirm() {
        return this == PENDING;
    }
    
    /**
     * 检查是否可以完成
     * <p>只有已确认状态可以完成</p>
     *
     * @return 如果当前状态可以完成返回true
     */
    public boolean canComplete() {
        return this == CONFIRMED;
    }
    
    /**
     * 检查是否可以标记为未到
     * <p>只有已确认状态可以标记为未到</p>
     *
     * @return 如果当前状态可以标记为未到返回true
     */
    public boolean canMarkNoShow() {
        return this == CONFIRMED;
    }
    
    /**
     * 检查是否为终态
     * <p>已取消、已完成、未到为终态，不可再变更</p>
     *
     * @return 如果当前状态是终态返回true
     */
    public boolean isFinal() {
        return this == CANCELLED || this == COMPLETED || this == NO_SHOW;
    }
    
    /**
     * 检查是否为有效预约状态
     * <p>待确认和已确认为有效状态，用于冲突检测</p>
     *
     * @return 如果是有效预约状态返回true
     */
    public boolean isActive() {
        return this == PENDING || this == CONFIRMED;
    }
}
