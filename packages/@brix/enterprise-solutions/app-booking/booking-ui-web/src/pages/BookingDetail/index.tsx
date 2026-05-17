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
 * @file 预约详情页面
 * @description v3.2 三层分离架构 - 页面层仅调用 hooks
 * @module booking-ui-web/pages/BookingDetail
 * @version 3.2.0
 * 
 * 【v3.2 三层分离架构】
 * 1. View 层（本文件）：纯渲染，只调用 hooks
 * 2. ViewModel 层（useBookingDetail）：状态管理 + 业务编排
 * 3. Repository 层：封装 API 调用
 * 
 * 【v3.0 改造说明】
 * 1. 移除 useNavigate/useParams（react-router-dom），改用能力契约
 * 2. 使用 useNavigation 获取 PageId 参数
 * 3. 权限检查通过 hook 返回的 permissions 对象
 * 4. 事件发布由 hook 内部处理
 * 5. 类型从 booking-shared 引入
 * 
 * 【架构红线】
 * ❌ 禁止直接调用 api/ 目录下的服务
 * ❌ 禁止直接使用 Repository
 * ❌ 禁止使用 react-router-dom
 * ✅ 只能通过 hooks 获取数据和执行操作
 * ✅ 只能通过 requestNavigate 请求导航
 */

import React, { useCallback } from 'react';

// ============================================================================
// v3.0 Capability Contract Imports — i18n via useI18n (replacing react-i18next)
// ============================================================================
import { useNavigation, useUI, useI18n, useTheme } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// 从 booking-shared 导入共享常量
// ============================================================================
import type { BookingStatus, Booking } from '@brix-sdk/enterprise-booking-shared';
import { 
  BOOKING_STATUS, 
  BOOKING_PAGE_IDS,
} from '@brix-sdk/enterprise-booking-shared';

// ============================================================================
// v3.2 三层分离: 通过 ViewModel Hook 获取数据（符合前端分层架构）
// 【架构合规】页面层仅调用 hooks，禁止直接调用 api/ 或 Repository
// ============================================================================
import { useBookingDetail } from '../../hooks/useBookingDetail';

// ============================================================================
// 子组件
// ============================================================================

/**
 * 详情字段组件
 */
interface DetailFieldProps {
  /** 字段标签 */
  label: string;
  /** 字段值 */
  value: React.ReactNode;
}

/**
 * 获取状态颜色
 */
const getStatusColor = (status: BookingStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  const statusConfig = BOOKING_STATUS[status];
  return statusConfig?.color as 'default' | 'primary' | 'success' | 'error' | 'warning' || 'default';
};

// ============================================================================
// 主组件
// ============================================================================

/**
 * 预约详情页面组件
 * 
 * 【v3.0 Manifest-Driven 架构】
 * - 页面不注册路由，通过 ui-manifest.yaml 声明
 * - 通过 navigation.getParams() 获取参数（而非 useParams）
 * - 导航通过 PageId 而非 URL
 * - 权限通过 AuthCapability 检查
 * - 事件通过 EventBusCapability 发布
 */
export function BookingDetail(): React.ReactElement {
  const { Box, Typography, Paper, Spin, Alert, Stack, Button, Divider, Tag } = useUI();
  const { tokens } = useTheme();
  const { t } = useI18n();

  /**
   * 详情字段展示组件（使用 useUI 闭包中的组件）
   */
  const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => (
    <Box style={{ marginBottom: 16 }}>
      <Typography variant="caption" style={{ color: tokens.colors.text.secondary, display: 'block', marginBottom: 4 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Box>
  );
  
  // ==========================================================================
  // v3.0 能力契约 Hooks
  // ==========================================================================
  
  /**
   * 导航能力
   * 
   * 【重要】
   * - 替代 useNavigate，使用 PageId 导航
   * - 替代 useParams，使用 getParams() 获取参数
   */
  const navigation = useNavigation();
  
  // ==========================================================================
  // 获取页面参数
  // ==========================================================================
  
  /**
   * 从导航能力获取参数
   * 
   * 【v3.0】替代 useParams
   */
  const params = navigation.getPageParams<{ id: string; mode?: string }>();
  const bookingId = params?.id ? parseInt(params.id, 10) : 0;
  const isRescheduleMode = params?.mode === 'reschedule';
  
  // ==========================================================================
  // v3.2 三层分离: 通过 ViewModel Hook 获取数据
  // 【合规改造】页面层只调用 hooks，不直接访问 api/ 或 Repository
  // ==========================================================================
  
  const {
    booking,
    loading,
    submitting,
    error,
    permissions,
    refresh,
    confirmBooking,
    cancelBooking,
    completeBooking,
    markNoShow,
  } = useBookingDetail(bookingId);
  
  // ==========================================================================
  // 本地 UI 状态
  // ==========================================================================
  
  const [localError, setLocalError] = React.useState<string | null>(null);

  // ==========================================================================
  // v3.0 导航操作（使用 PageId，非 URL）
  // ==========================================================================

  /**
   * 返回列表
   * 
   * 【v3.0】使用 PageId 导航
   */
  const handleBack = async () => {
    const result = await navigation.requestNavigate(BOOKING_PAGE_IDS.LIST);
    if (!result.success) {
    }
  };

  /**
   * 改期
   * 
   * 【v3.0】使用 PageId 导航，并携带改期模式参数
   */
  const handleReschedule = async () => {
    if (!booking) return;
    const result = await navigation.requestNavigate(BOOKING_PAGE_IDS.DETAIL, {
      id: String(booking.id),
      mode: 'reschedule',
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
   * 【三层分离】通过 useBookingDetail hook 调用
   */
  const handleConfirm = async () => {
    if (!booking) return;
    
    if (!permissions.canConfirm) {
      setLocalError('您没有确认预约的权限');
      return;
    }
    
    const success = await confirmBooking();
    if (!success) {
    }
  };

  /**
   * 取消预约
   * 
   * 【三层分离】通过 useBookingDetail hook 调用
   */
  const handleCancel = async () => {
    if (!booking) return;
    
    if (!permissions.canCancel) {
      setLocalError('您没有取消预约的权限');
      return;
    }
    
    const reason = window.prompt(t('booking.detail.cancelReason', '请输入取消原因'));
    if (reason === null) return;
    
    const success = await cancelBooking(reason || '用户取消');
    if (!success) {
    }
  };

  /**
   * 完成预约
   * 
   * 【三层分离】通过 useBookingDetail hook 调用
   */
  const handleComplete = async () => {
    if (!booking) return;
    
    if (!permissions.canComplete) {
      setLocalError('您没有完成预约的权限');
      return;
    }
    
    const success = await completeBooking();
    if (!success) {
    }
  };

  /**
   * 标记未到
   * 
   * 【三层分离】通过 useBookingDetail hook 调用
   */
  const handleNoShow = async () => {
    if (!booking) return;
    
    const success = await markNoShow();
    if (!success) {
    }
  };

  // ==========================================================================
  // 合并错误显示
  // ==========================================================================
  
  const displayError = error || localError;

  // ==========================================================================
  // 加载状态渲染
  // ==========================================================================
  
  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin />
      </Box>
    );
  }

  // 错误状态
  if (error && !booking) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert type="error" action={
          <Button color="inherit" size="small" onClick={refresh}>
            {t('common.retry', '重试')}
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // 数据不存在
  if (!booking) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert type="warning">
          {t('common.notFound', '数据不存在')}
        </Alert>
      </Box>
    );
  }

  // ==========================================================================
  // 主渲染
  // ==========================================================================
  
  return (
    <Box style={{ padding: 24 }}>
      {/* 错误提示 */}
      {displayError && (
        <Alert type="error" style={{ marginBottom: 16 }} onClose={() => setLocalError(null)}>
          {displayError}
        </Alert>
      )}
      
      {/* 改期模式提示 */}
      {isRescheduleMode && (
        <Alert type="info" style={{ marginBottom: 16 }}>
          {t('booking.detail.rescheduleMode', '改期模式：请选择新的预约时间')}
        </Alert>
      )}

      {/* 页面标题和操作栏 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={{ marginBottom: 24 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon="arrow_back" onClick={handleBack}>
            {t('common.back', '返回')}
          </Button>
          <Typography variant="h5" component="h1">
            {t('booking.detail.title', '预约详情')}
          </Typography>
          <Tag
            color={getStatusColor(booking.status)}
          >
            {t(`booking.status.${booking.status}`, BOOKING_STATUS[booking.status]?.label || booking.status)}
          </Tag>
        </Stack>
        <Stack direction="row" spacing={1}>
          {/* 待确认状态的操作 */}
          {booking.status === 'PENDING' && (
            <>
              {permissions.canConfirm && (
                <Button 
                  variant="primary" 
                  color="primary" 
                  startIcon="check_circle" 
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {t('booking.list.confirm', '确认')}
                </Button>
              )}
              {permissions.canCancel && (
                <Button 
                  variant="secondary" 
                  color="error" 
                  startIcon="cancel" 
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  {t('booking.list.cancel', '取消')}
                </Button>
              )}
            </>
          )}
          {/* 已确认状态的操作 */}
          {booking.status === 'CONFIRMED' && (
            <>
              {permissions.canComplete && (
                <Button 
                  variant="primary" 
                  color="success" 
                  startIcon="done" 
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  {t('booking.list.complete', '完成')}
                </Button>
              )}
              <Button 
                variant="secondary" 
                startIcon="person_off" 
                onClick={handleNoShow}
                disabled={submitting}
              >
                {t('booking.list.noShow', '未到')}
              </Button>
              <Button 
                variant="secondary" 
                startIcon="schedule" 
                onClick={handleReschedule}
              >
                {t('booking.list.reschedule', '改期')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* 基本信息 */}
      <Paper style={{ padding: 24, marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.basicInfo', '基本信息')}
        </Typography>
        <Divider style={{ marginBottom: 16 }} />
        
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          <Box>
            <DetailField 
              label={t('booking.detail.bookingNo', '预约编号')} 
              value={booking.bookingNo} 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.detail.status', '状态')} 
              value={
                <Tag
                  color={getStatusColor(booking.status)}
                >
                  {t(`booking.status.${booking.status}`, BOOKING_STATUS[booking.status]?.label || booking.status)}
                </Tag>
              } 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.detail.reservedDate', '预约日期')} 
              value={booking.bookedDate} 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.list.timeSlot', '时间段')} 
              value={`${booking.startTime} - ${booking.endTime}`} 
            />
          </Box>
        </Box>
      </Paper>

      {/* 资源信息 */}
      <Paper style={{ padding: 24, marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.resourceInfo', '资源信息')}
        </Typography>
        <Divider style={{ marginBottom: 16 }} />
        
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          <Box>
            <DetailField 
              label={t('booking.detail.resourceName', '资源名称')} 
              value={booking.resourceName} 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.detail.resourceType', '资源类型')} 
              value={t(`booking.resourceType.${booking.resourceType}`, booking.resourceType)} 
            />
          </Box>
        </Box>
      </Paper>

      {/* 联系信息 */}
      <Paper style={{ padding: 24, marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.contactInfo', '联系信息')}
        </Typography>
        <Divider style={{ marginBottom: 16 }} />
        
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          <Box>
            <DetailField 
              label={t('booking.detail.contactName', '联系人')} 
              value={booking.contactName} 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.detail.contactPhone', '联系电话')} 
              value={booking.contactPhone} 
            />
          </Box>
          <Box style={{ gridColumn: '1 / -1' }}>
            <DetailField 
              label={t('booking.detail.remark', '备注')} 
              value={booking.remark} 
            />
          </Box>
        </Box>
      </Paper>

      {/* 状态信息 */}
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.statusInfo', '状态信息')}
        </Typography>
        <Divider style={{ marginBottom: 16 }} />
        
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          <Box>
            <DetailField 
              label={t('booking.detail.createdAt', '创建时间')} 
              value={booking.createdAt} 
            />
          </Box>
          <Box>
            <DetailField 
              label={t('booking.detail.updatedAt', '更新时间')} 
              value={booking.updatedAt} 
            />
          </Box>
          {booking.confirmedAt && (
            <Box>
              <DetailField 
                label={t('booking.detail.confirmedAt', '确认时间')} 
                value={booking.confirmedAt} 
              />
            </Box>
          )}
          {booking.cancelledAt && (
            <>
              <Box>
                <DetailField 
                  label={t('booking.detail.cancelledAt', '取消时间')} 
                  value={booking.cancelledAt} 
                />
              </Box>
              <Box style={{ gridColumn: '1 / -1' }}>
                <DetailField 
                  label={t('booking.detail.cancelReason', '取消原因')} 
                  value={booking.cancelReason} 
                />
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default BookingDetail;
