-- ================================================================
-- Case 模块 数据库初始化脚本
-- 
-- 模块: shinwa-app-case
-- 版本: 3.0.0-SNAPSHOT
-- 日期: 2026-02-23
-- 作者: Shinwa Team
-- 
-- 【v3.0 多租户说明】
-- - 所有业务表必须包含 tenant_id 字段
-- - 使用复合唯一约束保证租户内数据唯一性
-- ================================================================

-- 创建 Case 模块 主表
CREATE TABLE IF NOT EXISTS case (
    -- 主键
    id VARCHAR(36) PRIMARY KEY,
    
    -- 业务字段
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'DRAFT',
    
    -- 多租户字段（必需）
    tenant_id VARCHAR(36) NOT NULL,
    
    -- 审计字段
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP,
    
    -- 索引
    CONSTRAINT uk_case_tenant_name UNIQUE (tenant_id, name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_case_tenant_id 
    ON case(tenant_id);

CREATE INDEX IF NOT EXISTS idx_case_status 
    ON case(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_case_created_at 
    ON case(tenant_id, created_at DESC);

-- 添加表注释
COMMENT ON TABLE case IS 'Case 模块主表';
COMMENT ON COLUMN case.id IS '主键 ID';
COMMENT ON COLUMN case.name IS '名称';
COMMENT ON COLUMN case.description IS '描述';
COMMENT ON COLUMN case.status IS '状态：DRAFT/ACTIVE/COMPLETED/CANCELLED';
COMMENT ON COLUMN case.tenant_id IS '租户 ID';
COMMENT ON COLUMN case.created_by IS '创建者 ID';
COMMENT ON COLUMN case.created_at IS '创建时间';
COMMENT ON COLUMN case.updated_by IS '更新者 ID';
COMMENT ON COLUMN case.updated_at IS '更新时间';
