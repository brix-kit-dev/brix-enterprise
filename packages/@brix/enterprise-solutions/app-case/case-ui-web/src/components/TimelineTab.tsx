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
 * @file Timeline Tab Component
 * @description Displays case timeline/history events
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a presentational component following v3.0.4 View layer guidelines.
 * It renders timeline events in a vertical timeline format.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import type { TimelineEventDTO } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface TimelineTabProps {
  /** Timeline events */
  events: TimelineEventDTO[];
  /** Loading state */
  isLoading?: boolean;
  /** Has more events to load */
  hasMore?: boolean;
  /** Handler for loading more events */
  onLoadMore?: () => void;
  /** Handler for filtering by type */
  onFilterByType?: (type: string | undefined) => void;
  /** Currently selected filter type */
  filterType?: string;
}

// ============================================================================
// Event Type Configuration
// ============================================================================

const EVENT_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  CASE_CREATED: { icon: '🎉', color: '#10B981', bgColor: '#ECFDF5' },
  CASE_UPDATED: { icon: '✏️', color: '#3B82F6', bgColor: '#EFF6FF' },
  NODE_STARTED: { icon: '▶️', color: '#6366F1', bgColor: '#EEF2FF' },
  NODE_COMPLETED: { icon: '✅', color: '#10B981', bgColor: '#ECFDF5' },
  NODE_SKIPPED: { icon: '⏭️', color: '#F59E0B', bgColor: '#FFFBEB' },
  STATUS_CHANGED: { icon: '🔄', color: '#8B5CF6', bgColor: '#F5F3FF' },
  COMMENT_ADDED: { icon: '💬', color: '#06B6D4', bgColor: '#ECFEFF' },
  ATTACHMENT_ADDED: { icon: '📎', color: '#14B8A6', bgColor: '#F0FDFA' },
  SCHEDULE_ADDED: { icon: '📅', color: '#F97316', bgColor: '#FFF7ED' },
  PARAMETER_SET: { icon: '⚙️', color: '#6B7280', bgColor: '#F3F4F6' },
};

const EVENT_TYPE_OPTIONS = [
  { value: undefined, label: '全部类型' },
  { value: 'CASE_CREATED', label: '案例创建' },
  { value: 'CASE_UPDATED', label: '案例更新' },
  { value: 'NODE_STARTED', label: '节点开始' },
  { value: 'NODE_COMPLETED', label: '节点完成' },
  { value: 'STATUS_CHANGED', label: '状态变更' },
  { value: 'COMMENT_ADDED', label: '评论添加' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getEventConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] || {
    icon: '📌',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  };
}

/**
 * Group events by date
 */
function groupEventsByDate(events: TimelineEventDTO[]): Map<string, TimelineEventDTO[]> {
  const grouped = new Map<string, TimelineEventDTO[]>();
  
  events.forEach(event => {
    const dateKey = event.createdAt.split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });
  
  return grouped;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Timeline Tab Component
 *
 * Renders a vertical timeline of case events.
 *
 * @example
 * ```tsx
 * <TimelineTab
 *   events={timelineEvents}
 *   hasMore={hasMoreEvents}
 *   onLoadMore={loadMoreEvents}
 * />
 * ```
 */
export const TimelineTab: React.FC<TimelineTabProps> = ({
  events,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onFilterByType,
  filterType,
}) => {
  const groupedEvents = groupEventsByDate(events);

  return (
    <div style={styles.container}>
      {/* Filter Bar */}
      {onFilterByType && (
        <div style={styles.filterBar}>
          <select
            value={filterType ?? ''}
            onChange={(e) => onFilterByType(e.target.value || undefined)}
            style={styles.filterSelect}
          >
            {EVENT_TYPE_OPTIONS.map(option => (
              <option key={option.value ?? 'all'} value={option.value ?? ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timeline */}
      <div style={styles.timeline}>
        {events.length === 0 && !isLoading ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>📭</span>
            <span>暂无时间线记录</span>
          </div>
        ) : (
          Array.from(groupedEvents.entries()).map(([dateKey, dayEvents]) => (
            <div key={dateKey} style={styles.dateGroup}>
              {/* Date Header */}
              <div style={styles.dateHeader}>
                <span style={styles.dateLine} />
                <span style={styles.dateLabel}>{formatDate(dateKey)}</span>
                <span style={styles.dateLine} />
              </div>

              {/* Events for this date */}
              {dayEvents.map((event, index) => {
                const config = getEventConfig(event.eventType);
                const isLast = index === dayEvents.length - 1;

                return (
                  <div key={event.id} style={styles.eventItem}>
                    {/* Timeline indicator */}
                    <div style={styles.eventIndicator}>
                      <div
                        style={{
                          ...styles.eventIcon,
                          backgroundColor: config.bgColor,
                        }}
                      >
                        {config.icon}
                      </div>
                      {!isLast && <div style={styles.eventConnector} />}
                    </div>

                    {/* Event content */}
                    <div style={styles.eventContent}>
                      <div style={styles.eventHeader}>
                        <span style={styles.eventTime}>
                          {formatDateTime(event.createdAt)}
                        </span>
                        <span
                          style={{
                            ...styles.eventType,
                            color: config.color,
                            backgroundColor: config.bgColor,
                          }}
                        >
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={styles.eventTitle}>{event.title}</div>
                      {event.description && (
                        <div style={styles.eventDescription}>{event.description}</div>
                      )}
                      {event.operatorName && (
                        <div style={styles.eventOperator}>
                          👤 {event.operatorName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Loading */}
        {isLoading && (
          <div style={styles.loading}>
            <span>⏳</span> 加载中...
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div style={styles.loadMore}>
            <button onClick={onLoadMore} style={styles.loadMoreButton}>
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0',
  },
  filterBar: {
    marginBottom: '16px',
    display: 'flex',
    gap: '12px',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  timeline: {
    position: 'relative',
  },
  dateGroup: {
    marginBottom: '24px',
  },
  dateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  dateLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E5E7EB',
  },
  dateLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6B7280',
    whiteSpace: 'nowrap',
  },
  eventItem: {
    display: 'flex',
    gap: '12px',
    marginLeft: '16px',
  },
  eventIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '40px',
    flexShrink: 0,
  },
  eventIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  eventConnector: {
    width: '2px',
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: '4px',
    marginBottom: '-4px',
    minHeight: '20px',
  },
  eventContent: {
    flex: 1,
    paddingBottom: '16px',
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  eventTime: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  eventType: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '4px',
  },
  eventDescription: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.5,
  },
  eventOperator: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    color: '#6B7280',
  },
  loadMore: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
  },
  loadMoreButton: {
    padding: '8px 24px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
};

export default TimelineTab;
