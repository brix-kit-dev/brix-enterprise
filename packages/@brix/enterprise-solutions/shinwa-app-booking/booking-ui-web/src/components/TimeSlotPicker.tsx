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
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (slots.length === 0) {
    return (
      <Typography color="text.secondary">
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
            <Chip
              key={slot.slotId}
              label={label}
              color={color}
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => !isDisabled && onSelectSlot(slot)}
              disabled={isDisabled}
              sx={{
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            />
          );
        })}
      </Stack>
      
      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip size="small" variant="outlined" label="" sx={{ width: 16, height: 16 }} />
          <Typography variant="caption">{t('booking.slot.available', '可预约')}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip size="small" color="warning" variant="outlined" label="" sx={{ width: 16, height: 16 }} />
          <Typography variant="caption">剩余较少</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip size="small" color="error" variant="outlined" label="" sx={{ width: 16, height: 16 }} />
          <Typography variant="caption">{t('booking.slot.booked', '已约满')}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip size="small" disabled label="" sx={{ width: 16, height: 16 }} />
          <Typography variant="caption">{t('booking.slot.expired', '已过期')}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
