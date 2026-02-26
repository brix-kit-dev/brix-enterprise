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
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
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
  const { t: _t } = useTranslation(); // Reserved for future i18n use
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
    <Paper sx={{ p: 2 }}>
      {/* 头部导航 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Stack>
        <IconButton onClick={handleToday} title="今天">
          <Today />
        </IconButton>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* 星期头 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1,
            }}
          >
            {weekDays.map((day) => (
              <Box
                key={day}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  fontWeight: 'bold',
                  color: 'text.secondary',
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* 日期网格 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
            }}
          >
            {days.map((date, index) => {
              if (!date) {
                return <Box key={`empty-${index}`} sx={{ minHeight: 80 }} />;
              }

              const isToday = date.getTime() === today.getTime();
              const dayBookings = getBookingsForDate(date);

              return (
                <Box
                  key={date.toISOString()}
                  sx={{
                    minHeight: 80,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: isToday ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: isToday ? 'primary.light' : 'background.paper',
                    cursor: onDateClick ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => onDateClick?.(date)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {date.getDate()}
                  </Typography>
                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {dayBookings.slice(0, 3).map((booking) => (
                      <Chip
                        key={booking.id}
                        label={`${booking.startTime} ${booking.resourceName}`}
                        size="small"
                        sx={{
                          height: 'auto',
                          '& .MuiChip-label': {
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.65rem',
                            py: 0.25,
                          },
                          bgcolor: statusColorMap[booking.status],
                          color: 'white',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
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
