/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.enums;

/**
 * 用户状态枚举
 * 
 * <p>定义用户账户的各种状态，用于控制用户的访问权限。</p>
 * 
 * <h3>状态说明</h3>
 * <ul>
 *   <li>ACTIVE: 正常状态，可正常登录和使用</li>
 *   <li>INACTIVE: 未激活，需要完成激活流程</li>
 *   <li>LOCKED: 已锁定，通常因登录失败次数过多</li>
 *   <li>DISABLED: 已禁用，被管理员手动禁用</li>
 *   <li>DELETED: 已删除，软删除状态</li>
 * </ul>
 * 
 * <h3>状态流转</h3>
 * <pre>
 *   INACTIVE → ACTIVE → LOCKED → ACTIVE
 *                   ↓
 *               DISABLED → DELETED
 * </pre>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public enum UserStatus {
    
    /**
     * 正常激活状态
     * <p>用户可正常登录和使用系统功能</p>
     */
    ACTIVE("正常"),
    
    /**
     * 未激活状态
     * <p>新注册用户，尚未完成邮箱/手机验证</p>
     */
    INACTIVE("未激活"),
    
    /**
     * 锁定状态
     * <p>因安全原因被锁定（如多次登录失败），可自动解锁或管理员解锁</p>
     */
    LOCKED("已锁定"),
    
    /**
     * 禁用状态
     * <p>被管理员手动禁用，需管理员手动启用</p>
     */
    DISABLED("已禁用"),
    
    /**
     * 删除状态
     * <p>软删除状态，数据保留但不可登录</p>
     */
    DELETED("已删除");
    
    /**
     * 状态显示名称
     */
    private final String displayName;
    
    UserStatus(String displayName) {
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
     * 判断用户是否可登录
     *
     * @return 如果状态为 ACTIVE 则返回 true
     */
    public boolean canLogin() {
        return this == ACTIVE;
    }
    
    /**
     * 判断用户是否可被修改
     *
     * @return 如果状态不为 DELETED 则返回 true
     */
    public boolean canModify() {
        return this != DELETED;
    }
}
