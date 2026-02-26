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
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Done,
  PersonOff,
  Schedule,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// ============================================================================
// v3.0 能力契约导入（仅导航能力，其他能力由 hook 内部使用）
// ============================================================================
import { useNavigation } from '@brix/runtime-sdk-api-web';

// ============================================================================
// 从 booking-shared 导入共享常量
// ============================================================================
import type { BookingStatus, Booking } from '@shinwa/booking-shared';
import { 
  BOOKING_STATUS, 
  BOOKING_PAGE_IDS,
} from '@shinwa/booking-shared';

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
 * 详情字段展示组件
 * 
 * 用于统一展示详情页的字段样式
 */
const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body1">{value || '-'}</Typography>
  </Box>
);

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
  const { t } = useTranslation();
  
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
      console.warn('导航被拒绝:', result.reason);
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
      console.warn('导航被拒绝:', result.reason);
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
      console.warn('[BookingDetail] 确认预约失败');
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
      console.warn('[BookingDetail] 取消预约失败');
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
      console.warn('[BookingDetail] 完成预约失败');
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
      console.warn('[BookingDetail] 标记爽约失败');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 错误状态
  if (error && !booking) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
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
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {t('common.notFound', '数据不存在')}
        </Alert>
      </Box>
    );
  }

  // ==========================================================================
  // 主渲染
  // ==========================================================================
  
  return (
    <Box sx={{ p: 3 }}>
      {/* 错误提示 */}
      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
          {displayError}
        </Alert>
      )}
      
      {/* 改期模式提示 */}
      {isRescheduleMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('booking.detail.rescheduleMode', '改期模式：请选择新的预约时间')}
        </Alert>
      )}

      {/* 页面标题和操作栏 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<ArrowBack />} onClick={handleBack}>
            {t('common.back', '返回')}
          </Button>
          <Typography variant="h5" component="h1">
            {t('booking.detail.title', '预约详情')}
          </Typography>
          <Chip
            label={t(`booking.status.${booking.status}`, BOOKING_STATUS[booking.status]?.label || booking.status)}
            color={getStatusColor(booking.status)}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          {/* 待确认状态的操作 */}
          {booking.status === 'PENDING' && (
            <>
              {permissions.canConfirm && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<CheckCircle />} 
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {t('booking.list.confirm', '确认')}
                </Button>
              )}
              {permissions.canCancel && (
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Cancel />} 
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
                  variant="contained" 
                  color="success" 
                  startIcon={<Done />} 
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  {t('booking.list.complete', '完成')}
                </Button>
              )}
              <Button 
                variant="outlined" 
                startIcon={<PersonOff />} 
                onClick={handleNoShow}
                disabled={submitting}
              >
                {t('booking.list.noShow', '未到')}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Schedule />} 
                onClick={handleReschedule}
              >
                {t('booking.list.reschedule', '改期')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* 基本信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.basicInfo', '基本信息')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.bookingNo', '预约编号')} 
              value={booking.bookingNo} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.status', '状态')} 
              value={
                <Chip
                  label={t(`booking.status.${booking.status}`, BOOKING_STATUS[booking.status]?.label || booking.status)}
                  color={getStatusColor(booking.status)}
                  size="small"
                />
              } 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.reservedDate', '预约日期')} 
              value={booking.bookedDate} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.list.timeSlot', '时间段')} 
              value={`${booking.startTime} - ${booking.endTime}`} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 资源信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.resourceInfo', '资源信息')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.resourceName', '资源名称')} 
              value={booking.resourceName} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.resourceType', '资源类型')} 
              value={t(`booking.resourceType.${booking.resourceType}`, booking.resourceType)} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 联系信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.contactInfo', '联系信息')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.contactName', '联系人')} 
              value={booking.contactName} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.contactPhone', '联系电话')} 
              value={booking.contactPhone} 
            />
          </Grid>
          <Grid item xs={12}>
            <DetailField 
              label={t('booking.detail.remark', '备注')} 
              value={booking.remark} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 状态信息 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('booking.detail.statusInfo', '状态信息')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.createdAt', '创建时间')} 
              value={booking.createdAt} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailField 
              label={t('booking.detail.updatedAt', '更新时间')} 
              value={booking.updatedAt} 
            />
          </Grid>
          {booking.confirmedAt && (
            <Grid item xs={12} md={6}>
              <DetailField 
                label={t('booking.detail.confirmedAt', '确认时间')} 
                value={booking.confirmedAt} 
              />
            </Grid>
          )}
          {booking.cancelledAt && (
            <>
              <Grid item xs={12} md={6}>
                <DetailField 
                  label={t('booking.detail.cancelledAt', '取消时间')} 
                  value={booking.cancelledAt} 
                />
              </Grid>
              <Grid item xs={12}>
                <DetailField 
                  label={t('booking.detail.cancelReason', '取消原因')} 
                  value={booking.cancelReason} 
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}

export default BookingDetail;
