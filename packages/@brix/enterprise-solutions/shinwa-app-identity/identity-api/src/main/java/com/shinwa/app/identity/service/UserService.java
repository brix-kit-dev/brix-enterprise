/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service;

import com.shinwa.app.identity.dto.UserDTO;
import com.shinwa.app.identity.request.CreateUserRequest;
import com.shinwa.app.identity.request.UpdateUserRequest;

import java.util.List;

/**
 * 用户服务接口
 * 
 * <p>定义用户身份管理的核心业务接口，包括用户的增删改查、状态管理等。</p>
 * 
 * <h3>接口设计原则</h3>
 * <ul>
 *   <li>所有操作均为租户隔离</li>
 *   <li>返回 DTO，不暴露实体</li>
 *   <li>查询不存在的记录返回 null，不抛异常</li>
 *   <li>业务异常使用自定义异常类</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public interface UserService {
    
    // ==================== 查询操作 ====================
    
    /**
     * 根据ID查询用户
     *
     * @param id 用户ID（业务主键，如 U20260128123456）
     * @return 用户信息，不存在时返回 null
     */
    UserDTO getById(String id);
    
    /**
     * 根据用户ID查询用户
     *
     * @param userId 用户ID（业务ID）
     * @return 用户信息，不存在时返回 null
     */
    UserDTO getByUserId(String userId);
    
    /**
     * 根据用户名查询用户
     *
     * @param username 用户名
     * @return 用户信息，不存在时返回 null
     */
    UserDTO getByUsername(String username);
    
    /**
     * 查询租户下的所有用户
     *
     * @return 用户列表
     */
    List<UserDTO> findAll();
    
    /**
     * 根据状态查询用户列表
     *
     * @param status 用户状态
     * @return 用户列表
     */
    List<UserDTO> findByStatus(String status);
    
    /**
     * 根据角色查询用户列表
     *
     * @param role 用户角色
     * @return 用户列表
     */
    List<UserDTO> findByRole(String role);
    
    // ==================== 写操作 ====================
    
    /**
     * 创建用户
     *
     * @param request 创建请求
     * @return 创建的用户信息
     * @throws IllegalArgumentException 如果用户名已存在
     */
    UserDTO create(CreateUserRequest request);
    
    /**
     * 更新用户信息
     *
     * @param userId  用户ID
     * @param request 更新请求
     * @return 更新后的用户信息
     * @throws IllegalArgumentException 如果用户不存在
     */
    UserDTO update(String userId, UpdateUserRequest request);
    
    /**
     * 删除用户（软删除）
     *
     * @param userId 用户ID
     * @throws IllegalArgumentException 如果用户不存在
     */
    void delete(String userId);
    
    // ==================== 状态管理 ====================
    
    /**
     * 启用用户
     *
     * @param userId 用户ID
     * @param reason 原因说明
     * @throws IllegalArgumentException 如果用户不存在或状态不允许启用
     */
    void enable(String userId, String reason);
    
    /**
     * 禁用用户
     *
     * @param userId 用户ID
     * @param reason 原因说明
     * @throws IllegalArgumentException 如果用户不存在或状态不允许禁用
     */
    void disable(String userId, String reason);
    
    /**
     * 锁定用户
     *
     * @param userId 用户ID
     * @param reason 原因说明
     * @throws IllegalArgumentException 如果用户不存在或状态不允许锁定
     */
    void lock(String userId, String reason);
    
    /**
     * 解锁用户
     *
     * @param userId 用户ID
     * @param reason 原因说明
     * @throws IllegalArgumentException 如果用户不存在或状态不为锁定
     */
    void unlock(String userId, String reason);
    
    // ==================== 密码管理 ====================
    
    /**
     * 修改密码
     *
     * @param userId      用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @throws IllegalArgumentException 如果旧密码错误
     */
    void changePassword(String userId, String oldPassword, String newPassword);
    
    /**
     * 重置密码（管理员操作）
     *
     * @param userId      用户ID
     * @param newPassword 新密码
     */
    void resetPassword(String userId, String newPassword);
}
