/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview TenantMembers Page (View Layer)
 * All UI text is i18n-driven via useTranslation().
 */

import { useState, type ComponentType } from 'react';
import type { TableColumn, TableProps } from '@brix-sdk/runtime-sdk-api-web';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useTenantMembers } from '../../hooks';
import { MemberRole, MemberStatus, TenantMemberType, type TenantMemberDTO } from '@brix-sdk/tenant-shared';

/**
 * Props for TenantMembersPage
 */
interface TenantMembersPageProps {
  tenantId: string;
}

/**
 * Get role display config using i18n translation function.
 */
function getRoleConfig(t: (key: string) => string): Record<MemberRole, { label: string; color: 'primary' | 'warning' | 'default' }> {
  return {
    [MemberRole.OWNER]: { label: t('role.OWNER'), color: 'primary' },
    [MemberRole.ADMIN]: { label: t('role.ADMIN'), color: 'warning' },
    [MemberRole.MEMBER]: { label: t('role.MEMBER'), color: 'default' },
  };
}

function primaryRole(record: { roles?: string[] }): MemberRole {
  const role = record.roles?.[0];
  if (role === MemberRole.OWNER || role === MemberRole.ADMIN || role === MemberRole.MEMBER) {
    return role;
  }
  return MemberRole.MEMBER;
}

/**
 * TenantMembers Page Component
 */
export function TenantMembersPage({ tenantId }: TenantMembersPageProps) {
  const { t } = useI18n('tenant');
  const roleConfig = getRoleConfig(t);
  // =========================================
  // UI Components (via UIAdapter)
  // =========================================
  const {
    Card,
    Button,
    Input,
    Select,
    Table,
    Tag,
    Pagination,
    Modal,
    message,
    Spin,
    Empty,
    Popconfirm,
    Avatar,
  } = useUI();
  const MemberTable = Table as ComponentType<TableProps<TenantMemberDTO>>;

  // =========================================
  // ViewModel Hook
  // =========================================
  const { state, actions } = useTenantMembers(tenantId);

  // =========================================
  // Local State (UI only)
  // =========================================
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<MemberRole>(MemberRole.MEMBER);

  // =========================================
  // Event Handlers
  // =========================================
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      message.warning(t('members.emailRequired'));
      return;
    }

    try {
      await actions.inviteMember({
        email: inviteEmail,
        memberType: TenantMemberType.INDIVIDUAL,
        roles: [inviteRole],
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole(MemberRole.MEMBER);
      message.success(t('members.inviteSuccess'));
    } catch {
      message.error(t('members.inviteFailed'));
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    try {
      await actions.removeMember(memberId);
      message.success(t('members.removeSuccess', { interpolation: { name: memberName } }));
    } catch {
      message.error(t('members.removeFailed'));
    }
  };

  const handleRoleChange = async () => {
    if (!selectedMemberId) return;

    try {
      await actions.updateMember(selectedMemberId, { roles: [newRole] });
      setShowRoleModal(false);
      setSelectedMemberId(null);
      message.success(t('members.roleUpdateSuccess'));
    } catch {
      message.error(t('members.roleUpdateFailed'));
    }
  };

  const openRoleModal = (memberId: string, currentRole: MemberRole) => {
    setSelectedMemberId(memberId);
    setNewRole(currentRole);
    setShowRoleModal(true);
  };

  // =========================================
  // Table Columns
  // =========================================
  const columns: TableColumn<TenantMemberDTO>[] = [
    {
      title: t('members.colMember'),
      dataIndex: 'displayName',
      key: 'displayName',
      render: (_value, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={record.avatarUrl}
            size={32}
          >
            {record.displayName?.charAt(0) || record.email.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.displayName || record.email}</div>
            {record.displayName && (
              <div style={{ color: '#666', fontSize: 12 }}>{record.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t('members.colRole'),
      dataIndex: 'roles',
      key: 'role',
      width: 120,
      render: (_value, record) => {
        const role = primaryRole(record);
        const config = roleConfig[role];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: t('members.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => (
        <Tag color={value === MemberStatus.ACTIVE ? 'success' : 'warning'}>
          {value === MemberStatus.ACTIVE ? t('members.statusActive') : t('members.statusPending')}
        </Tag>
      ),
    },
    {
      title: t('members.colJoinedAt'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 180,
      render: (date) => new Date(String(date)).toLocaleString('zh-CN'),
    },
    {
      title: t('members.colActions'),
      key: 'actions',
      width: 180,
      render: (_value, record) => {
        // Cannot operate on owner
        const role = primaryRole(record);
        if (role === MemberRole.OWNER) {
          return <span style={{ color: '#999' }}>-</span>;
        }

        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="small"
              onClick={() => openRoleModal(record.id, role)}
              data-testid="member-row-change-role"
            >
              {t('members.changeRole')}
            </Button>
            <Popconfirm
              title={t('members.removeConfirm', { interpolation: { name: record.displayName || record.email } })}
              onConfirm={() => handleRemove(record.id, record.displayName || record.email)}
              okText={t('members.removeOk')}
              cancelText={t('members.removeCancel')}
            >
              <Button
                size="small"
                variant="danger"
                data-testid="member-row-remove"
              >
                {t('members.removeBtn')}
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  // =========================================
  // Loading State
  // =========================================
  if (state.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  // =========================================
  // Render
  // =========================================
  return (
    <div className="tenant-members-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button
            onClick={actions.goBack}
            style={{ marginRight: 16 }}
            data-testid="member-back-to-detail"
          >
            {t('members.backToDetail')}
          </Button>
          <h1 style={{ display: 'inline', margin: 0 }}>{t('members.pageTitle')}</h1>
          <span style={{ color: '#666', marginLeft: 12 }}>
            {t('members.totalMembers', { count: state.total, interpolation: { count: state.total } })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={actions.refresh} data-testid="member-refresh">
            {t('members.refresh')}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
            data-testid="member-invite-open"
          >
            {t('members.invite')}
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Input
            placeholder={t('members.searchPlaceholder')}
            value={state.keyword}
            onChange={(e) => actions.search(e.target.value)}
            style={{ width: 300 }}
            data-testid="member-search"
          />
          <Select
            value={state.statusFilter ?? ''}
            onChange={(value) => actions.filterByStatus((value as MemberStatus) || null)}
            style={{ width: 150 }}
            clearable
            placeholder={t('members.roleFilter')}
            data-testid="member-status-filter"
            options={[
              { label: t('members.statusActive'), value: MemberStatus.ACTIVE },
              { label: t('members.statusPending'), value: MemberStatus.INVITED },
            ]}
          />
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        {state.members.length === 0 ? (
          <Empty description={t('members.noMembers')} />
        ) : (
          <>
            <MemberTable
              columns={columns}
              dataSource={state.members}
              rowKey={(record) => record.id}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={state.page}
                pageSize={state.pageSize}
                total={state.total}
                onChange={actions.setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal
        title={t('members.inviteTitle')}
        open={showInviteModal}
        onConfirm={handleInvite}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole(MemberRole.MEMBER);
        }}
        onCancel={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole(MemberRole.MEMBER);
        }}
        confirmText={t('members.inviteOk')}
        cancelText={t('members.inviteCancel')}
        confirmLoading={state.isInviting}
        data-testid="member-invite"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('members.inviteEmailLabel')} <span style={{ color: 'red' }}>*</span>
          </label>
          <Input
            type="email"
            placeholder={t('members.inviteEmailPlaceholder')}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            data-testid="member-invite-email"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('members.inviteRoleLabel')}
          </label>
          <Select
            value={inviteRole}
            onChange={(value) => setInviteRole(value as MemberRole)}
            style={{ width: '100%' }}
            data-testid="member-invite-role"
            options={[
              {
                label: t('role.OWNER'),
                value: MemberRole.OWNER,
                'data-testid': 'member-invite-role-option-owner',
              },
              {
                label: t('role.ADMIN'),
                value: MemberRole.ADMIN,
                'data-testid': 'member-invite-role-option-admin',
              },
              {
                label: t('role.MEMBER'),
                value: MemberRole.MEMBER,
                'data-testid': 'member-invite-role-option-member',
              },
            ]}
          />
          <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
            {inviteRole === MemberRole.ADMIN
              ? t('members.adminRoleDesc')
              : t('members.memberRoleDesc')}
          </div>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        title={t('members.roleChangeTitle')}
        open={showRoleModal}
        onConfirm={handleRoleChange}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedMemberId(null);
        }}
        onCancel={() => {
          setShowRoleModal(false);
          setSelectedMemberId(null);
        }}
        confirmText={t('members.roleChangeOk')}
        cancelText={t('members.roleChangeCancel')}
        data-testid="member-role-change"
      >
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('members.newRoleLabel')}
          </label>
          <Select
            value={newRole}
            onChange={(value) => setNewRole(value as MemberRole)}
            style={{ width: '100%' }}
            data-testid="member-role-change-target"
            options={[
              { label: t('role.ADMIN'), value: MemberRole.ADMIN },
              { label: t('role.MEMBER'), value: MemberRole.MEMBER },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default TenantMembersPage;
