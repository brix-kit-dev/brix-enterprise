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
 * Time Slot Picker Component
 * 
 * @module booking-ui-web
 * @version 3.0.0
 * 
 * Features:
 * - Display available time slots for a given date
 * - Support time slot selection
 * - Show fully booked/expired status
 */

import React from 'react';
import { useI18n, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { TimeSlotDTO } from '../types';

interface TimeSlotPickerProps {
  slots: TimeSlotDTO[];
  selectedSlot: TimeSlotDTO | null;
  onSelectSlot: (slot: TimeSlotDTO) => void;
}

/**
 * Time Slot Picker Component
 */
export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
}: TimeSlotPickerProps): React.ReactElement {
  const { Box, Tag, Stack, Typography } = useUI();
  const { tokens } = useTheme();
  const { t } = useI18n();

  if (slots.length === 0) {
    return (
      <Typography style={{ color: tokens.colors.text.secondary }}>
        {t('booking.slot.noSlots', '暂无可用时间槽')}
      </Typography>
    );
  }

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {slots.map((slot) => {
          const isSelected = selectedSlot?.slotId === slot.slotId;
          const isDisabled = !slot.available || slot.expired;
          
          let label = `${slot.startTime} - ${slot.endTime}`;
          let color: 'default' | 'primary' | 'error' | 'warning' = 'default';
          
          if (slot.expired) {
            color = 'default';
            label += ` (${t('booking.slot.expired', '已过期')})`;
          } else if (!slot.available) {
            color = 'error';
            label += ` (${t('booking.slot.booked', '已约满')})`;
          } else if (slot.availableCount <= 2) {
            color = 'warning';
            label += ` (${t('booking.slot.remaining', '剩余')} ${slot.availableCount})`;
          }
          
          if (isSelected) {
            color = 'primary';
          }
          
          return (
            <Tag
              key={slot.slotId}
              color={color}
              onClick={() => !isDisabled && onSelectSlot(slot)}
              style={{
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >{label}</Tag>
          );
        })}
      </Stack>
      
      {/* Legend */}
      <Stack direction="row" spacing={2} style={{ marginTop: 16 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tag style={{ width: 16, height: 16 }}>{''}</Tag>
          <Typography variant="caption">{t('booking.slot.available', '可预约')}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tag color="warning" style={{ width: 16, height: 16 }}>{''}</Tag>
          <Typography variant="caption">剩余较少</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tag color="error" style={{ width: 16, height: 16 }}>{''}</Tag>
          <Typography variant="caption">{t('booking.slot.booked', '已约满')}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tag style={{ width: 16, height: 16, opacity: 0.5 }}>{''}</Tag>
          <Typography variant="caption">{t('booking.slot.expired', '已过期')}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
