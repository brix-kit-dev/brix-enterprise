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
 * @file 创建预约页面（v3.0 Manifest-Driven 架构）
 * @description 创建新预约的表单页面
 * @module @brix-sdk/enterprise-booking-web/pages/BookingCreate
 * @version 3.0.0
 * 
 * 【DECISION】保留为占位符 (2025-07, Phase 3.8)
 * 创建预约页面将在 v4.0 业务迁移阶段完整实现。
 * 当前版本使用 placeholder 渲染，表单逻辑待 booking-shared 数据模型稳定后迁入。
 * @see https://github.com/AstroBrix/brix/issues — 跟踪迁移进度
 */

import React from 'react';
import { useI18n, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';

/**
 * 创建预约页面
 * 
 * 【迁移状态】占位符
 */
const BookingCreate: React.FC = () => {
  const { Box, Typography, Paper } = useUI();
  const { tokens } = useTheme();
  const { t } = useI18n();
  
  return (
    <Box style={{ padding: 24 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h5" gutterBottom>
          {t('booking.create.title', '创建预约')}
        </Typography>
        <Typography style={{ color: tokens.colors.text.secondary }}>
          {t('booking.create.placeholder', '此页面正在迁移中...')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default BookingCreate;
