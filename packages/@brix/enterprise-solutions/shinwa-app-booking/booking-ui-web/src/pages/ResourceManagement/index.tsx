/**
 * @file 资源管理页面（v3.0 Manifest-Driven 架构）
 * @description 管理可预约资源（医生、会议室等）
 * @module @shinwa/booking-web/pages/ResourceManagement
 * @version 3.0.0
 * 
 * 【TODO】此页面需要完整迁移
 * 当前为占位符实现，等待完整迁移
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * 资源管理页面
 * 
 * 【迁移状态】占位符
 */
const ResourceManagement: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('booking.resource.title', '资源管理')}
        </Typography>
        <Typography color="text.secondary">
          {t('booking.resource.placeholder', '此页面正在迁移中...')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ResourceManagement;
