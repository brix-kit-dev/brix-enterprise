/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.enums;

/**
 * 用户角色枚举
 * 
 * <p>定义系统中的用户角色类型，用于权限控制和功能授权。</p>
 * 
 * <h3>角色层级</h3>
 * <ul>
 *   <li>SUPER_ADMIN: 超级管理员，拥有所有权限</li>
 *   <li>ADMIN: 租户管理员，拥有租户内所有权限</li>
 *   <li>OPERATOR: 操作员，拥有业务操作权限</li>
 *   <li>USER: 普通用户，拥有基本权限</li>
 *   <li>GUEST: 访客，仅拥有只读权限</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum UserRole {
    
    /**
     * 超级管理员
     * <p>系统最高权限，可管理所有租户</p>
     */
    SUPER_ADMIN("超级管理员"),
    
    /**
     * 租户管理员
     * <p>租户内最高权限，可管理租户内所有用户和配置</p>
     */
    ADMIN("管理员"),
    
    /**
     * 操作员
     * <p>拥有业务操作权限，可执行日常业务操作</p>
     */
    OPERATOR("操作员"),
    
    /**
     * 普通用户
     * <p>标准用户权限，可使用系统基本功能</p>
     */
    USER("普通用户"),
    
    /**
     * 访客
     * <p>只读权限，仅可查看公开信息</p>
     */
    GUEST("访客");
    
    /**
     * 角色显示名称
     */
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    /**
     * 获取角色显示名称
     *
     * @return 角色的中文显示名称
     */
    public String getDisplayName() {
        return displayName;
    }
}
