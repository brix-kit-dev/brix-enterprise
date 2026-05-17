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
 * Booking Calendar Component
 * 
 * @module booking-ui-web
 * @version 3.0.0
 * 
 * Features:
 * - Display bookings in calendar view
 * - Support day/week/month switching
 * - Can be embedded in other modules
 */

import React, { useState } from 'react';
import { useI18n, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { BookingStatus } from '../types';
import type { Booking } from 'booking-shared';
import { useBookingCalendar } from '../hooks';

interface BookingCalendarProps {
  /**
   * Resource ID, used to filter bookings for specific resource
   */
  resourceId?: number;
  /**
   * Source type, used to filter bookings from specific source
   */
  sourceType?: string;
  /**
   * Source ID
   */
  sourceId?: number;
  /**
   * Date click event
   */
  onDateClick?: (date: Date) => void;
  /**
   * Booking click event
   */
  onBookingClick?: (booking: Booking) => void;
}

/**
 * Status color mapping
 */
const statusColorMap: Record<BookingStatus, string> = {
  PENDING: '#ff9800',
  CONFIRMED: '#2196f3',
  COMPLETED: '#4caf50',
  CANCELLED: '#f44336',
  NO_SHOW: '#9e9e9e',
};

/**
 * Booking Calendar Component
 */
export default function BookingCalendar({
  resourceId,
  sourceType,
  sourceId,
  onDateClick,
  onBookingClick,
}: BookingCalendarProps): React.ReactElement {
  const { Box, Paper, Typography, Button, Stack, Tag, Spin } = useUI();
  const { tokens } = useTheme();
  const { t: _t } = useI18n(); // Reserved for future i18n use
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Use ViewModel hook for data fetching (Repository → HTTP)
  const { bookings, loading } = useBookingCalendar({
    currentDate,
    resourceId,
    sourceType,
    sourceId,
  });

  // Get current month date grid
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Fill beginning of month blanks
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Fill dates
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // 获取某日的预约
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.reservedDate === dateStr);
  };

  // 上个月
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 下个月
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 回到今天
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Paper style={{ padding: 16 }}>
      {/* 头部导航 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="text" size="small" onClick={handlePrevMonth} startIcon="chevron_left">{null}</Button>
          <Typography variant="h6">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </Typography>
          <Button variant="text" size="small" onClick={handleNextMonth} startIcon="chevron_right">{null}</Button>
        </Stack>
        <Button variant="text" size="small" onClick={handleToday} startIcon="today" title="今天">{null}</Button>
      </Stack>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </Box>
      ) : (
        <>
          {/* 星期头 */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginBottom: 8,
            }}
          >
            {weekDays.map((day) => (
              <Box
                key={day}
                style={{
                  textAlign: 'center',
                  paddingTop: 8,
                  paddingBottom: 8,
                  fontWeight: 'bold',
                  color: tokens.colors.text.secondary,
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* 日期网格 */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {days.map((date, index) => {
              if (!date) {
                return <Box key={`empty-${index}`} style={{ minHeight: 80 }} />;
              }

              const isToday = date.getTime() === today.getTime();
              const dayBookings = getBookingsForDate(date);

              return (
                <Box
                  key={date.toISOString()}
                  style={{
                    minHeight: 80,
                    padding: 4,
                    border: '1px solid',
                    borderColor: isToday ? tokens.colors.brand.primary : tokens.colors.border.default,
                    borderRadius: 4,
                    backgroundColor: isToday ? tokens.colors.brand.primaryLight : tokens.colors.surface.card,
                    cursor: onDateClick ? 'pointer' : 'default',
                  }}
                  onClick={() => onDateClick?.(date)}
                >
                  <Typography
                    variant="body2"
                    style={{
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? tokens.colors.brand.primary : 'inherit',
                    }}
                  >
                    {date.getDate()}
                  </Typography>
                  <Stack spacing={0.25} style={{ marginTop: 4 }}>
                    {dayBookings.slice(0, 3).map((booking) => (
                      <Tag
                        key={booking.id}
                        style={{
                          height: 'auto',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.65rem',
                          backgroundColor: statusColorMap[booking.status],
                          color: 'white',
                          cursor: 'pointer',
                        }}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                      >{`${booking.startTime} ${booking.resourceName}`}</Tag>
                    ))}
                    {dayBookings.length > 3 && (
                      <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                        +{dayBookings.length - 3} 更多
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
}
