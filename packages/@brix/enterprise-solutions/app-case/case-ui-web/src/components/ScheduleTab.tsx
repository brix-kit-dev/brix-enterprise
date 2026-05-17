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
 * @file Schedule Tab Component
 * @description Displays case schedule with days and items
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a presentational component following v3.0.4 View layer guidelines.
 * It receives schedule data from hooks and renders the calendar view.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState } from 'react';
import type { 
  ScheduleDayDTO, 
  ScheduleItemDTO,
  CreateScheduleDayRequest,
  CreateScheduleItemRequest,
} from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface ScheduleTabProps {
  /** Schedule days */
  days: ScheduleDayDTO[];
  /** Currently selected day */
  selectedDay: ScheduleDayDTO | null;
  /** Loading state */
  isLoading?: boolean;
  /** Whether editing is enabled */
  editable?: boolean;
  /** Handler for selecting a day */
  onSelectDay?: (day: ScheduleDayDTO) => void;
  /** Handler for creating a new day */
  onCreateDay?: (request: CreateScheduleDayRequest) => Promise<void>;
  /** Handler for deleting a day */
  onDeleteDay?: (dayId: number) => Promise<void>;
  /** Handler for adding an item */
  onAddItem?: (dayId: number, request: CreateScheduleItemRequest) => Promise<void>;
  /** Handler for deleting an item */
  onDeleteItem?: (dayId: number, itemId: number) => Promise<void>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5); // HH:MM format
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Schedule Tab Component
 *
 * Renders a view of schedule days and their items.
 *
 * @example
 * ```tsx
 * <ScheduleTab
 *   days={scheduleData}
 *   selectedDay={currentDay}
 *   onSelectDay={handleSelectDay}
 *   editable={true}
 * />
 * ```
 */
export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  days,
  selectedDay,
  isLoading = false,
  editable = false,
  onSelectDay,
  onCreateDay,
  onDeleteDay,
  onAddItem,
  onDeleteItem,
}) => {
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayTitle, setNewDayTitle] = useState('');

  const handleCreateDay = async () => {
    if (!newDayDate || !onCreateDay) return;
    
    await onCreateDay({
      date: newDayDate,
      title: newDayTitle || undefined,
    });
    
    setNewDayDate('');
    setNewDayTitle('');
    setShowAddDay(false);
  };

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <span>⏳</span> 加载日程中...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Days List */}
      <div style={styles.daysPanel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>日程安排</h3>
          {editable && (
            <button
              onClick={() => setShowAddDay(!showAddDay)}
              style={styles.addButton}
            >
              + 添加日期
            </button>
          )}
        </div>

        {/* Add Day Form */}
        {showAddDay && (
          <div style={styles.addForm}>
            <input
              type="date"
              value={newDayDate}
              onChange={(e) => setNewDayDate(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              value={newDayTitle}
              onChange={(e) => setNewDayTitle(e.target.value)}
              placeholder="日程标题（可选）"
              style={styles.input}
            />
            <div style={styles.addFormActions}>
              <button onClick={handleCreateDay} style={styles.confirmButton}>
                确定
              </button>
              <button onClick={() => setShowAddDay(false)} style={styles.cancelButton}>
                取消
              </button>
            </div>
          </div>
        )}

        {/* Days */}
        <div style={styles.daysList}>
          {days.length === 0 ? (
            <div style={styles.emptyDays}>暂无日程安排</div>
          ) : (
            days.map((day) => (
              <div
                key={day.id}
                style={{
                  ...styles.dayCard,
                  ...(selectedDay?.id === day.id ? styles.dayCardSelected : {}),
                }}
                onClick={() => onSelectDay?.(day)}
              >
                <div style={styles.dayDate}>{formatDate(day.date)}</div>
                {day.title && <div style={styles.dayTitle}>{day.title}</div>}
                <div style={styles.dayItemCount}>
                  {day.items.length} 个项目
                </div>
                {editable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDay?.(day.id);
                    }}
                    style={styles.deleteSmall}
                    title="删除日期"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Items Panel */}
      <div style={styles.itemsPanel}>
        {selectedDay ? (
          <>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                {formatDate(selectedDay.date)} 
                {selectedDay.title && ` - ${selectedDay.title}`}
              </h3>
            </div>

            <div style={styles.itemsList}>
              {selectedDay.items.length === 0 ? (
                <div style={styles.emptyItems}>暂无项目</div>
              ) : (
                selectedDay.items.map((item) => (
                  <ScheduleItemCard
                    key={item.id}
                    item={item}
                    editable={editable}
                    onDelete={() => onDeleteItem?.(selectedDay.id, item.id)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div style={styles.selectDayHint}>
            ← 请选择一个日期查看详情
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Schedule Item Card Sub-component
// ============================================================================

interface ScheduleItemCardProps {
  item: ScheduleItemDTO;
  editable?: boolean;
  onDelete?: () => void;
}

const ScheduleItemCard: React.FC<ScheduleItemCardProps> = ({
  item,
  editable,
  onDelete,
}) => {
  return (
    <div style={styles.itemCard}>
      <div style={styles.itemTime}>
        {formatTime(item.startTime)} - {formatTime(item.endTime)}
      </div>
      <div style={styles.itemContent}>
        <div style={styles.itemTitle}>{item.title}</div>
        {item.location && (
          <div style={styles.itemLocation}>📍 {item.location}</div>
        )}
        {item.description && (
          <div style={styles.itemDescription}>{item.description}</div>
        )}
        {item.notes && (
          <div style={styles.itemNotes}>📝 {item.notes}</div>
        )}
      </div>
      {editable && (
        <button onClick={onDelete} style={styles.deleteItemButton}>
          🗑️
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    minHeight: '400px',
  },
  daysPanel: {
    width: '280px',
    flexShrink: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '16px',
  },
  itemsPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #E5E7EB',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '14px',
  },
  addFormActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  confirmButton: {
    padding: '6px 12px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  daysList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dayCard: {
    position: 'relative',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dayCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  dayDate: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  dayTitle: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '4px',
  },
  dayItemCount: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  deleteSmall: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.5,
    padding: '4px',
  },
  emptyDays: {
    padding: '20px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '13px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
  },
  itemTime: {
    flexShrink: 0,
    padding: '4px 8px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    height: 'fit-content',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '4px',
  },
  itemLocation: {
    fontSize: '12px',
    color: '#6B7280',
  },
  itemDescription: {
    fontSize: '13px',
    color: '#374151',
    marginTop: '4px',
  },
  itemNotes: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  deleteItemButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.5,
    padding: '4px',
    alignSelf: 'flex-start',
  },
  emptyItems: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '14px',
  },
  selectDayHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#9CA3AF',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px',
    color: '#6B7280',
  },
};

export default ScheduleTab;
