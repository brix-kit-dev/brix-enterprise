/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file 预约列表页面
 * @description v3.2 三层分离架构 - 页面层仅调用 hooks
 * @module booking-ui-web/pages/BookingList
 * @version 3.2.0
 * 
 * 【v3.2 三层分离架构】
 * 1. View 层（本文件）：纯渲染，只调用 hooks
 * 2. ViewModel 层（useBookingList）：状态管理 + 业务编排
 * 3. Repository 层：封装 API 调用
 * 
 * 【v3.0 改造说明】
 * 1. 移除 useNavigate（react-router-dom），改用 useNavigation 能力契约
 * 2. 移除直接 URL 导航，改用 PageId 导航
 * 3. 权限检查通过 hook 返回的 permissions 对象
 * 4. 事件发布由 hook 内部处理
 * 5. 类型从 booking-shared 引入
 * 
 * 【架构红线】
 * ❌ 禁止直接调用 api/ 目录下的服务
 * ❌ 禁止直接使用 Repository
 * ❌ 禁止使用 react-router-dom 的 useNavigate
 * ❌ 禁止直接操作 window.history
 * ✅ 只能通过 hooks 获取数据和执行操作
 * ✅ 只能通过 requestNavigate 请求导航
 */

import React, { useCallback } from 'react';

// ============================================================================
// v3.0 Capability Contract Imports — i18n via useI18n (replacing react-i18next)
// v3.2 BrixUI Governance: All UI components via useUI(), no direct MUI import
// ============================================================================
import { useNavigation, useUI, useI18n } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// 从 booking-shared 导入共享常量
// ============================================================================
import type { BookingStatus, Booking } from '@brix-sdk/enterprise-booking-shared';
import { 
  BOOKING_STATUS, 
  BOOKING_PAGE_IDS,
  BOOKING_PERMISSIONS,
  BOOKING_EVENTS,
} from '@brix-sdk/enterprise-booking-shared';

// ============================================================================
// v3.2 三层分离: 通过 ViewModel Hook 获取数据（符合前端分层架构）
// 【架构合规】页面层仅调用 hooks，禁止直接调用 api/ 或 Repository
// ============================================================================
import { useBookingList } from '../../hooks/useBookingList';

/**
 * 状态颜色映射
 * 
 * 从共享常量获取颜色配置
 */
const getStatusColor = (status: BookingStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  const statusConfig = BOOKING_STATUS[status];
  return statusConfig?.color as 'default' | 'primary' | 'success' | 'error' | 'warning' || 'default';
};

/**
 * 预约列表页面组件
 * 
 * 【v3.0 Manifest-Driven 架构】
 * - 页面不注册路由，通过 ui-manifest.yaml 声明
 * - 导航通过 PageId 而非 URL
 * - 权限通过 AuthCapability 检查
 * - 事件通过 EventBusCapability 发布
 */
export function BookingList(): React.ReactElement {
  const { t } = useI18n();
  
  // ==========================================================================
  // v3.2 BrixUI: All UI components obtained through useUI() capability contract
  // ==========================================================================
  const {
    Box, Typography, Table, Spin, Alert, Stack, Button, Paper,
    Tag, Input, Tooltip, Icon, Pagination,
  } = useUI();
  
  // ==========================================================================
  // v3.0 能力契约 Hooks
  // ==========================================================================
  
  /**
   * 导航能力
   * 
   * 【重要】替代 useNavigate，使用 PageId 导航
   * Host 拥有最终决策权，可拒绝导航请求
   */
  const navigation = useNavigation();
  
  // ==========================================================================
  // v3.2 三层分离: 通过 ViewModel Hook 获取数据
  // 【合规改造】页面层只调用 hooks，不直接访问 api/ 或 Repository
  // ==========================================================================
  
  const {
    bookings,
    loading,
    error,
    pagination,
    keyword,
    permissions,
    refresh,
    setPage,
    setPageSize,
    search,
    filterByStatus,
    clearFilters,
    confirmBooking,
    cancelBooking,
    completeBooking,
    markNoShow,
  } = useBookingList();
  
  // ==========================================================================
  // 本地 UI 状态（仅用于表单输入）
  // ==========================================================================
  
  const [searchInput, setSearchInput] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  // 同步 keyword 到搜索输入框
  React.useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  // ==========================================================================
  // 事件处理（使用 hook 提供的方法）
  // ==========================================================================

  /**
   * 搜索处理
   */
  const handleSearch = useCallback(() => {
    search(searchInput);
  }, [search, searchInput]);

  /**
   * 刷新处理
   */
  const handleRefresh = useCallback(() => {
    setSearchInput('');
    clearFilters();
  }, [clearFilters]);

  /**
   * 分页处理
   */
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
  };

  // ==========================================================================
  // v3.0 导航操作（使用 PageId，非 URL）
  // ==========================================================================

  /**
   * 查看详情
   * 
   * 【v3.0】使用 PageId 导航，Host 决定实际路由
   */
  const handleView = async (id: number) => {
    const result = await navigation.requestNavigate(BOOKING_PAGE_IDS.DETAIL, { id: String(id) });
    if (!result.success) {
      setLocalError(`无法打开详情页: ${result.reason}`);
    }
  };

  /**
   * 新建预约
   * 
   * 【v3.0】使用 PageId 导航
   */
  const handleCreate = async () => {
    // 权限检查（从 hook 获取的 permissions）
    if (!permissions.canCreate) {
      setLocalError('您没有创建预约的权限');
      return;
    }
    
    const result = await navigation.requestNavigate(BOOKING_PAGE_IDS.CREATE);
    if (!result.success) {
      setLocalError(`无法打开创建页: ${result.reason}`);
    }
  };

  /**
   * 改期（跳转到详情页的改期模式）
   */
  const handleReschedule = async (id: number) => {
    const result = await navigation.requestNavigate(BOOKING_PAGE_IDS.DETAIL, { 
      id: String(id),
      mode: 'reschedule' 
    });
    if (!result.success) {
    }
  };

  // ==========================================================================
  // v3.2 业务操作（通过 hook 方法，符合三层分离）
  // 【合规改造】事件发布由 hook 内部处理，页面层只关心 UI 反馈
  // ==========================================================================

  /**
   * 确认预约
   * 
   * 【三层分离】通过 useBookingList hook 调用，hook 内部处理：
   * - Repository 调用
   * - 事件发布
   * - 列表自动刷新
   */
  const handleConfirm = async (id: number) => {
    // 权限检查（从 hook 获取的 permissions）
    if (!permissions.canConfirm) {
      setLocalError('您没有确认预约的权限');
      return;
    }
    
    const success = await confirmBooking(id);
    if (!success) {
      // 错误已在 hook 中设置，无需额外处理
    }
  };

  /**
   * 取消预约
   * 
   * 【三层分离】通过 useBookingList hook 调用
   */
  const handleCancel = async (id: number) => {
    // 权限检查
    if (!permissions.canCancel) {
      setLocalError('您没有取消预约的权限');
      return;
    }
    
    const reason = window.prompt(t('booking.list.cancelReason', '请输入取消原因'));
    if (reason === null) return;
    
    const success = await cancelBooking(id, reason || '用户取消');
    if (!success) {
    }
  };

  /**
   * 完成预约
   * 
   * 【三层分离】通过 useBookingList hook 调用
   */
  const handleComplete = async (id: number) => {
    // 权限检查
    if (!permissions.canComplete) {
      setLocalError('您没有完成预约的权限');
      return;
    }
    
    const success = await completeBooking(id);
    if (!success) {
    }
  };

  /**
   * 标记未到
   * 
   * 【三层分离】通过 useBookingList hook 调用
   */
  const handleNoShow = async (id: number) => {
    const success = await markNoShow(id);
    if (!success) {
    }
  };

  // ==========================================================================
  // 计算派生数据（数据来自 hook，无需本地分页计算）
  // ==========================================================================
  
  // 合并 hook 错误和本地错误
  const displayError = error || localError;

  // ==========================================================================
  // 渲染
  // ==========================================================================
  
  return (
    <Box style={{ padding: 24 }}>
      {/* Page title */}
      <Typography variant="h5">
        {t('booking.list.title', '预约列表')}
      </Typography>

      {/* Error alert */}
      {displayError && (
        <Alert type="error" style={{ marginBottom: 16 }} closable onClose={() => setLocalError(null)}>
          {displayError}
        </Alert>
      )}

      {/* Toolbar */}
      <Paper style={{ padding: 16, marginBottom: 16 }}>
        <Stack direction="row" spacing={8} align="center">
          <Input
            size="small"
            placeholder={t('booking.list.searchPlaceholder', '搜索预约编号/联系人...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            prefix={<Icon name="search" size={16} />}
            style={{ minWidth: 250 }}
          />
          <Button variant="secondary" onClick={handleSearch} startIcon="search">
            {t('common.search', '搜索')}
          </Button>
          <Button variant="secondary" onClick={handleRefresh} startIcon="refresh">
            {t('common.refresh', '刷新')}
          </Button>
          <Box style={{ flexGrow: 1 }} />
          {/* Permission control: only show create button for authorized users */}
          {permissions.canCreate && (
            <Button variant="primary" onClick={handleCreate} startIcon="add">
              {t('booking.list.createBtn', '新建预约')}
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Data table */}
      <Paper>
        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spin />
          </Box>
        ) : (
          <>
            <Table
              columns={[
                { title: t('booking.list.bookingNo', '预约编号'), dataIndex: 'bookingNo', key: 'bookingNo' },
                { title: t('booking.list.resourceName', '资源名称'), dataIndex: 'resourceName', key: 'resourceName' },
                { title: t('booking.list.reservedDate', '预约日期'), dataIndex: 'bookedDate', key: 'bookedDate' },
                { title: t('booking.list.timeSlot', '时间段'), key: 'timeSlot',
                  render: (_: unknown, row: Booking) => `${row.startTime} - ${row.endTime}` },
                { title: t('booking.list.contactName', '联系人'), dataIndex: 'contactName', key: 'contactName' },
                { title: t('booking.list.status', '状态'), key: 'status',
                  render: (_: unknown, row: Booking) => (
                    <Tag color={getStatusColor(row.status)}>
                      {t(`booking.status.${row.status}`, BOOKING_STATUS[row.status]?.label || row.status)}
                    </Tag>
                  ),
                },
                { title: t('booking.list.actions', '操作'), key: 'actions', align: 'right' as const,
                  render: (_: unknown, row: Booking) => (
                    <Stack direction="row" spacing={4} style={{ justifyContent: 'flex-end' }}>
                      {/* View detail — visible to all users */}
                      <Tooltip title={t('booking.list.viewDetail', '查看详情')}>
                        <Button variant="text" size="small" onClick={() => handleView(row.id)} startIcon="visibility">
                          {null}
                        </Button>
                      </Tooltip>

                      {/* Pending status actions */}
                      {row.status === 'PENDING' && (
                        <>
                          {permissions.canConfirm && (
                            <Tooltip title={t('booking.list.confirm', '确认')}>
                              <Button variant="text" size="small" onClick={() => handleConfirm(row.id)} startIcon="check_circle">
                                {null}
                              </Button>
                            </Tooltip>
                          )}
                          {permissions.canCancel && (
                            <Tooltip title={t('booking.list.cancel', '取消预约')}>
                              <Button variant="danger" size="small" onClick={() => handleCancel(row.id)} startIcon="cancel">
                                {null}
                              </Button>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {/* Confirmed status actions */}
                      {row.status === 'CONFIRMED' && (
                        <>
                          {permissions.canComplete && (
                            <Tooltip title={t('booking.list.complete', '完成')}>
                              <Button variant="text" size="small" onClick={() => handleComplete(row.id)} startIcon="done">
                                {null}
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title={t('booking.list.noShow', '未到')}>
                            <Button variant="text" size="small" onClick={() => handleNoShow(row.id)} startIcon="person_off">
                              {null}
                            </Button>
                          </Tooltip>
                          <Tooltip title={t('booking.list.reschedule', '改期')}>
                            <Button variant="text" size="small" onClick={() => handleReschedule(row.id)} startIcon="schedule">
                              {null}
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  ),
                },
              ]}
              dataSource={bookings}
              rowKey="id"
            />
            <Box style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
              <Pagination
                current={pagination.page + 1}
                pageSize={pagination.size}
                total={pagination.totalElements}
                onChange={(page: number, pageSize: number) => {
                  setPage(page - 1);
                  if (pageSize !== pagination.size) setPageSize(pageSize);
                }}
                showSizeChanger
                pageSizeOptions={[5, 10, 25]}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default BookingList;
