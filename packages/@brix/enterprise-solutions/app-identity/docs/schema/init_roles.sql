-- 初始化系统角色
-- 使用 UTF-8 编码保存此文件

INSERT INTO auth_role (id, code, name, description, type, scope, status, tenant_id, sort_order)
VALUES 
    ('role-super-admin', 'SUPER_ADMIN', '超级管理员', '系统超级管理员，拥有所有权限', 'SYSTEM', 'GLOBAL', 'ACTIVE', 'default', 1),
    ('role-tenant-admin', 'TENANT_ADMIN', '租户管理员', '租户级别管理员', 'SYSTEM', 'TENANT', 'ACTIVE', 'default', 2),
    ('role-user', 'USER', '普通用户', '普通注册用户', 'SYSTEM', 'TENANT', 'ACTIVE', 'default', 3)
ON CONFLICT (code, tenant_id) DO NOTHING;
