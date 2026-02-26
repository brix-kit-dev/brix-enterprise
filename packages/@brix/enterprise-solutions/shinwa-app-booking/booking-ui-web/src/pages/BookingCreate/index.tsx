/**
 * @file 创建预约页面（v3.0 Manifest-Driven 架构）
 * @description 创建新预约的表单页面
 * @module @shinwa/booking-web/pages/BookingCreate
 * @version 3.0.0
 * 
 * 【TODO】此页面需要完整迁移
 * 当前为占位符实现，等待完整迁移
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * 创建预约页面
 * 
 * 【迁移状态】占位符
 */
const BookingCreate: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('booking.create.title', '创建预约')}
        </Typography>
        <Typography color="text.secondary">
          {t('booking.create.placeholder', '此页面正在迁移中...')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default BookingCreate;
