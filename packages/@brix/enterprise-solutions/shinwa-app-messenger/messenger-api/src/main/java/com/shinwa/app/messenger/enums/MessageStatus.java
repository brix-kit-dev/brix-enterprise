/**
 * 消息状态枚举
 * 
 * v3.0 Runtime Shell 架构
 * 定义消息的生命周期状态
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.messenger.enums;

/**
 * 消息状态枚举
 * 
 * <p>定义消息在其生命周期中的各种状态：
 * <ul>
 *   <li>UNREAD - 未读状态，消息已送达但用户尚未查看</li>
 *   <li>READ - 已读状态，用户已查看该消息</li>
 *   <li>ARCHIVED - 已归档，用户将消息移至归档</li>
 *   <li>DELETED - 已删除，用户删除了该消息（软删除）</li>
 * </ul>
 */
public enum MessageStatus {
    
    /**
     * 未读
     * 消息已成功投递到用户收件箱，但用户尚未查看
     */
    UNREAD("未读"),
    
    /**
     * 已读
     * 用户已打开并查看了该消息
     */
    READ("已读"),
    
    /**
     * 已归档
     * 用户将消息移至归档文件夹，不在主收件箱显示
     */
    ARCHIVED("已归档"),
    
    /**
     * 已删除
     * 用户删除了该消息，执行软删除操作
     */
    DELETED("已删除");
    
    /**
     * 状态描述
     */
    private final String description;
    
    MessageStatus(String description) {
        this.description = description;
    }
    
    /**
     * 获取状态描述
     * 
     * @return 状态描述文本
     */
    public String getDescription() {
        return description;
    }
}
