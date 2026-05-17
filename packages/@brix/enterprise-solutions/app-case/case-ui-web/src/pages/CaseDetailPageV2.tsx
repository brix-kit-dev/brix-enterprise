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
 * @file Case Detail Page
 * @description View layer - Case detail with tabbed content sections
 * @module @brix-sdk/enterprise-case-ui-web/pages
 * @version 3.2.1
 *
 * Design Notes:
 * This page follows the v3.0.9 blueprint three-layer architecture:
 * View → ViewModel (hooks) → Repository
 *
 * Architecture Compliance (Red Line R3 + Phase 6 Design Token Migration):
 * - Pure View layer component with no business logic
 * - All data and operations obtained through hooks (useCaseDetail, useTimeline, etc.)
 * - No direct HTTP/fetch/axios calls
 * - Navigation via runtime router capability
 * - UI components obtained via useUI() hook (UIAdapter pattern)
 * - Platform-level visual styling via useTheme().tokens (Brix DesignTokens)
 * - Business-domain colors retained in caseTheme.ts constants
 *
 * Layout Reference:
 * Design follows Figma mockup specifications:
 * - Header card with case info and node progress
 * - Tabbed content: Overview, Nodes, Timeline, Schedule
 * - Action buttons for editing and node advancement
 *
 * @author Brix Platform Team
 * @date 2026-02-28
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Runtime SDK imports - UIAdapter pattern per v3.0.8 Blueprint
import { useNavigation, useUI, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { useCaseDetail } from '../hooks/useCase';
import { useCaseNodes } from '../hooks/useCaseNodes';
import { useTimeline } from '../hooks/useTimeline';
import { useSchedule } from '../hooks/useSchedule';
import { NodeProgressBar } from '../components/NodeProgressBar';
import { CASE_STATUS_COLORS, TEMPLATE_TYPE_COLORS, NODE_STATUS_COLORS } from '../theme/caseTheme';
import type {
  CaseDTO,
  CaseNodeDTO,
  TimelineEventDTO,
  ScheduleDayDTO,
  ScheduleItemDTO,
  CaseNodeStatus,
  TimelineEventType,
  ScheduleItemType,
} from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tab type enumeration
 */
type TabType = 'overview' | 'nodes' | 'timeline' | 'schedule';

// ============================================================================
// Constants
// ============================================================================

/**
 * Icon mapping from timeline event type to Icon name
 */
const TIMELINE_EVENT_ICON_NAMES: Record<TimelineEventType, string> = {
  CASE_CREATED: 'play_circle',
  CASE_UPDATED: 'edit',
  STATUS_CHANGED: 'check_circle',
  NODE_STARTED: 'play_arrow',
  NODE_COMPLETED: 'check_circle',
  PARAMETER_SET: 'list',
  FILE_UPLOADED: 'list',
  DOCUMENT_SIGNED: 'check_circle',
  SCHEDULE_UPDATED: 'schedule',
  NOTE_ADDED: 'edit',
  ASSIGNMENT_CHANGED: 'person',
  CUSTOM: 'list',
};

/**
 * Icon mapping from schedule item type to Icon name
 */
const SCHEDULE_ITEM_ICON_NAMES: Record<ScheduleItemType, string> = {
  APPOINTMENT: 'local_hospital',
  TRANSPORT: 'directions_car',
  ACCOMMODATION: 'hotel',
  MEAL: 'list',
  TRANSLATION: 'translate',
  CUSTOM: 'list',
};

/**
 * Node status icon mapping
 */
const NODE_STATUS_ICON_NAMES: Record<CaseNodeStatus, string> = {
  DONE: 'check_circle',
  ACTIVE: 'play_circle',
  SKIPPED: 'skip_next',
  PENDING: 'radio_button_unchecked',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get style configuration for status tag
 */
const getStatusTagStyle = (status: string): { background: string; color: string } => {
  const colors = CASE_STATUS_COLORS[status as keyof typeof CASE_STATUS_COLORS] || CASE_STATUS_COLORS.PENDING;
  return { background: colors.background, color: colors.text };
};

/**
 * Get style configuration for template tag
 */
const getTemplateTagStyle = (templateCode: string): { background: string; color: string; label: string } => {
  const config = TEMPLATE_TYPE_COLORS[templateCode as keyof typeof TEMPLATE_TYPE_COLORS];
  if (!config) return { background: '#E5E7EB', color: '#374151', label: templateCode };
  return { background: config.background, color: config.text, label: config.label };
};

/**
 * Get node status icon configuration
 */
const getNodeStatusConfig = (status: CaseNodeStatus): { iconName: string; color: string } => {
  const colors = NODE_STATUS_COLORS[status];
  return { iconName: NODE_STATUS_ICON_NAMES[status], color: colors.icon };
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Case Detail Page Component
 *
 * Displays comprehensive case information with tabbed content sections.
 * Provides workflow node management and case editing capabilities.
 *
 * @returns React element
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/cases/:id" element={<CaseDetailPageV2 />} />
 * ```
 */
export const CaseDetailPageV2: React.FC = () => {
  // Get UI components from UIAdapter pattern
  const { Box, Card, Typography, Button, Tag, Tabs, Collapse, Avatar, Spin, Alert, Tooltip, Divider, Icon } = useUI();

  // Brix semantic design tokens — platform-level visual styling (Phase 6 migration)
  const { tokens } = useTheme();

  // Route params
  const { id } = useParams<{ id: string }>();

  // Navigation capability
  const navigation = useNavigation();

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // ViewModel hooks - provide all data and operations
  const {
    item: caseData,
    isLoading: isLoadingCase,
    error: caseError,
    refresh: refreshCase,
  } = useCaseDetail(id || '');

  const {
    nodes: caseNodes,
    isLoadingNodes,
    refreshNodes: loadNodes,
    markInProgress,
    markCompleted,
    skipNode,
  } = useCaseNodes(id);

  const {
    events: timelineEvents,
    isLoading: isLoadingTimeline,
  } = useTimeline(id || '');

  const {
    days: scheduleDays,
    isLoading: isLoadingSchedule,
  } = useSchedule(id || '');

  // =========================================================================
  // Sub-Components (using UI components from useUI)
  // =========================================================================

  /**
   * Parameter Item Component
   */
  const ParameterItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 12, backgroundColor: tokens.colors.surface.page, borderRadius: 4 }}>
      <Typography variant="caption" style={{ color: tokens.colors.text.secondary, minWidth: 100 }}>
        {label}
      </Typography>
      <Typography variant="body2" style={{ color: tokens.colors.text.primary, fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  );

  /**
   * Node Summary Card Component
   */
  const NodeSummaryCard: React.FC<{ node: CaseNodeDTO; highlight?: boolean }> = ({ node, highlight }) => {
    const colors = NODE_STATUS_COLORS[node.status];
    const statusConfig = getNodeStatusConfig(node.status);
    return (
      <Box
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid',
          borderColor: highlight ? colors.icon : tokens.colors.border.default,
          backgroundColor: highlight ? colors.background : tokens.colors.surface.page,
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={statusConfig.iconName} size={18} style={{ color: statusConfig.color }} />
            <Typography variant="body2" style={{ fontWeight: 500, color: tokens.colors.text.primary }}>
              {node.nodeName}
            </Typography>
          </Box>
          <Tag style={{ backgroundColor: colors.background, color: colors.text, fontSize: '0.65rem' }}>
            {node.status}
          </Tag>
        </Box>
        {node.remarks && (
          <Typography variant="caption" style={{ color: tokens.colors.text.secondary, marginTop: 8, display: 'block', paddingLeft: 24 }}>
            {node.remarks}
          </Typography>
        )}
        {node.actualEndTime && (
          <Typography variant="caption" style={{ color: tokens.colors.text.secondary, marginTop: 4, display: 'block', paddingLeft: 24 }}>
            Completed: {new Date(node.actualEndTime).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    );
  };

  /**
   * Status Chip Component
   */
  const StatusChip: React.FC<{ status: string }> = ({ status }) => {
    const tagStyle = getStatusTagStyle(status);
    return (
      <Tag style={{ backgroundColor: tagStyle.background, color: tagStyle.color }}>
        {status}
      </Tag>
    );
  };

  /**
   * Template Chip Component
   */
  const TemplateChip: React.FC<{ templateCode: string }> = ({ templateCode }) => {
    const tagStyle = getTemplateTagStyle(templateCode);
    return (
      <Tag style={{ backgroundColor: tagStyle.background, color: tagStyle.color }}>
        {tagStyle.label}
      </Tag>
    );
  };

  /**
   * Overview Tab Content
   */
  const OverviewTabContent: React.FC<{
    caseData: CaseDTO;
    nodes: CaseNodeDTO[];
  }> = ({ caseData, nodes }) => {
    const currentNodes = nodes.filter(n => n.status === 'ACTIVE');
    const completedNodes = nodes.filter(n => n.status === 'DONE');
    const pendingNodes = nodes.filter(n => n.status === 'PENDING');

    return (
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Case Parameters */}
        <Box>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            Case Parameters
          </Typography>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ParameterItem label="Customer" value={caseData.customerName} />
            <ParameterItem label="Phone" value={caseData.customerPhone || 'Not provided'} />
            <ParameterItem label="Package" value={caseData.packageName || 'Not selected'} />
            <ParameterItem label="Estimated Start" value={caseData.estimatedStartDate || 'TBD'} />
            <ParameterItem label="Estimated End" value={caseData.estimatedEndDate || 'TBD'} />
            {caseData.budgetAmount && (
              <ParameterItem
                label="Budget"
                value={`${caseData.budgetCurrency || 'CNY'} ${caseData.budgetAmount.toLocaleString()}`}
              />
            )}
          </Box>
        </Box>

        {/* Current Node Status */}
        <Box>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            Current Node Status
          </Typography>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Active nodes */}
            {currentNodes.map(node => (
              <NodeSummaryCard key={node.id} node={node} highlight />
            ))}

            {/* Recently completed */}
            {completedNodes.slice(-2).reverse().map(node => (
              <NodeSummaryCard key={node.id} node={node} />
            ))}

            {/* Pending summary */}
            {pendingNodes.length > 0 && (
              <Box
                style={{
                  padding: 16,
                  border: `1px dashed ${tokens.colors.border.default}`,
                  borderRadius: 8,
                }}
              >
                <Typography variant="caption" style={{ color: tokens.colors.text.secondary, marginBottom: 8, display: 'block' }}>
                  Pending Nodes
                </Typography>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pendingNodes.slice(0, 3).map(node => (
                    <Box key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="radio_button_unchecked" size={14} style={{ color: tokens.colors.text.disabled }} />
                      <Typography variant="body2" style={{ color: tokens.colors.text.secondary }}>
                        {node.nodeName}
                      </Typography>
                    </Box>
                  ))}
                  {pendingNodes.length > 3 && (
                    <Typography variant="caption" style={{ color: tokens.colors.text.secondary, marginLeft: 20 }}>
                      +{pendingNodes.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Nodes Tab Content
   */
  const NodesTabContent: React.FC<{
    nodes: CaseNodeDTO[];
    onMarkInProgress: (node: CaseNodeDTO) => void;
    onMarkCompleted: (node: CaseNodeDTO) => void;
    onSkip: (node: CaseNodeDTO) => void;
  }> = ({ nodes, onMarkInProgress, onMarkCompleted, onSkip }) => {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nodes.sort((a, b) => a.sequence - b.sequence).map(node => {
          const colors = NODE_STATUS_COLORS[node.status];
          const isActive = node.status === 'ACTIVE';
          const isPending = node.status === 'PENDING';
          const isDone = node.status === 'DONE';

          return (
            <Box
              key={node.id}
              style={{
                padding: 16,
                borderRadius: 8,
                border: '1px solid',
                borderColor: isActive ? colors.icon : tokens.colors.border.default,
                backgroundColor: isActive ? colors.background : isDone ? tokens.colors.surface.page : tokens.colors.surface.card,
              }}
            >
              <Box style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {node.sequence}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" style={{ fontWeight: 500, color: tokens.colors.text.primary }}>
                      {node.nodeName}
                    </Typography>
                    <Typography variant="caption" style={{ color: tokens.colors.text.secondary, fontFamily: 'monospace' }}>
                      {node.nodeCode}
                    </Typography>
                  </Box>
                </Box>

                <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Node actions */}
                  {isPending && (
                    <Button size="small" variant="outlined" onClick={() => onMarkInProgress(node)}>
                      Start
                    </Button>
                  )}
                  {isActive && (
                    <>
                      <Button size="small" variant="contained" onClick={() => onMarkCompleted(node)}>
                        Complete
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => onSkip(node)}>
                        Skip
                      </Button>
                    </>
                  )}
                  <Tag style={{ backgroundColor: colors.background, color: colors.text, fontSize: '0.65rem' }}>
                    {node.status}
                  </Tag>
                </Box>
              </Box>

              {/* Node details */}
              {(node.actualStartTime || node.actualEndTime || node.remarks) && (
                <Box style={{ marginTop: 12, marginLeft: 44, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {node.actualStartTime && (
                    <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                      Started: {new Date(node.actualStartTime).toLocaleString()}
                    </Typography>
                  )}
                  {node.actualEndTime && (
                    <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                      Completed: {new Date(node.actualEndTime).toLocaleString()}
                    </Typography>
                  )}
                  {node.remarks && (
                    <Box style={{ marginTop: 4, padding: 12, backgroundColor: tokens.colors.surface.card, borderRadius: 4, border: `1px solid ${tokens.colors.border.default}` }}>
                      <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                        {node.remarks}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  /**
   * Timeline Tab Content
   */
  const TimelineTabContent: React.FC<{
    events: TimelineEventDTO[];
    isLoading: boolean;
  }> = ({ events, isLoading }) => {
    if (isLoading) {
      return (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin size="small" />
        </Box>
      );
    }

    if (events.length === 0) {
      return (
        <Box style={{ textAlign: 'center', padding: 48, color: tokens.colors.text.secondary }}>
          <Icon name="access_time" size={40} style={{ color: tokens.colors.border.subtle, marginBottom: 8 }} />
          <Typography variant="body2">No timeline events</Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Box style={{ marginBottom: 16 }}>
          <Typography variant="body2" style={{ fontWeight: 500 }}>
            Immutable Fact Record
          </Typography>
          <Typography variant="caption" style={{ color: tokens.colors.status.warning }}>
            Warning: Timeline only allows INSERT, UPDATE/DELETE forbidden (legal-level facts)
          </Typography>
        </Box>

        <Box style={{ position: 'relative' }}>
          {/* Timeline line */}
          <Box
            style={{
              position: 'absolute',
              left: 20,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: tokens.colors.border.default,
            }}
          />

          {/* Events */}
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...events].reverse().map(event => {
              const iconName = TIMELINE_EVENT_ICON_NAMES[event.eventType] || 'list';
              return (
                <Box key={event.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  <Avatar
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: tokens.colors.brand.primaryLight,
                      zIndex: 1,
                    }}
                  >
                    <Icon name={iconName} size={18} style={{ color: tokens.colors.brand.primary }} />
                  </Avatar>
                  <Box style={{ flex: 1, paddingBottom: 16 }}>
                    <Box style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <Box>
                        <Typography variant="body2" style={{ fontWeight: 500 }}>
                          {event.title}
                        </Typography>
                        <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                          {new Date(event.timestamp).toLocaleString()} · {event.userName || 'System'}
                        </Typography>
                      </Box>
                      <Tag style={{ fontSize: '0.6rem', fontFamily: 'monospace', backgroundColor: tokens.colors.surface.page }}>
                        {event.id}
                      </Tag>
                    </Box>
                    {event.description && (
                      <Box
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: tokens.colors.surface.page,
                          borderRadius: 4,
                          border: `1px solid ${tokens.colors.border.default}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          component="pre"
                          style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}
                        >
                          {event.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Schedule Tab Content
   */
  const ScheduleTabContent: React.FC<{
    days: ScheduleDayDTO[];
    isLoading: boolean;
  }> = ({ days, isLoading }) => {
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
      // Default: expand all days
      const initialState: Record<string, boolean> = {};
      days.forEach(day => {
        initialState[day.id] = true;
      });
      return initialState;
    });

    const toggleDay = (dayId: string) => {
      setExpandedDays(prev => ({
        ...prev,
        [dayId]: !prev[dayId],
      }));
    };

    if (isLoading) {
      return (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin size="small" />
        </Box>
      );
    }

    if (days.length === 0) {
      return (
        <Box style={{ textAlign: 'center', padding: 48, color: tokens.colors.text.secondary }}>
          <Icon name="calendar_today" size={40} style={{ color: tokens.colors.border.subtle, marginBottom: 8 }} />
          <Typography variant="body2">No schedule arranged</Typography>
          <Typography variant="caption" style={{ display: 'block', marginTop: 4 }}>
            Schedule will be generated after SCHEDULE_CONFIRM node
          </Typography>
          <Button variant="contained" size="small" style={{ marginTop: 16 }}>
            Create Schedule
          </Button>
        </Box>
      );
    }

    return (
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {days.map(day => (
          <Box
            key={day.id}
            style={{
              borderRadius: 8,
              border: `1px solid ${tokens.colors.border.default}`,
              overflow: 'hidden',
            }}
          >
            {/* Day Header */}
            <Box
              onClick={() => toggleDay(day.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                cursor: 'pointer',
                backgroundColor: tokens.colors.surface.card,
              }}
            >
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: tokens.colors.brand.primary,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: tokens.colors.brand.primaryContrast,
                  }}
                >
                  {day.dayNumber}
                </Avatar>
                <Box>
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    Day {day.dayNumber} · {day.date}
                  </Typography>
                  <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                    {day.title || `${day.items.length} items`}
                  </Typography>
                </Box>
              </Box>
              <Icon
                name={expandedDays[day.id] ? 'expand_less' : 'expand_more'}
                size={20}
                style={{ color: tokens.colors.text.secondary }}
              />
            </Box>

            {/* Day Content */}
            <Collapse isOpen={expandedDays[day.id] !== false}>
              <Divider />
              <Box style={{ padding: 16 }}>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {day.items.map(item => {
                    const iconName = SCHEDULE_ITEM_ICON_NAMES[item.itemType] || 'list';
                    return (
                      <Box
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 12,
                          borderRadius: 4,
                        }}
                      >
                        <Avatar
                          style={{
                            width: 28,
                            height: 28,
                            backgroundColor: tokens.colors.surface.page,
                            borderRadius: 4,
                          }}
                        >
                          <Icon name={iconName} size={16} style={{ color: tokens.colors.text.secondary }} />
                        </Avatar>
                        <Box style={{ flex: 1 }}>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Typography variant="body2" style={{ fontWeight: 500 }}>
                              {item.title}
                            </Typography>
                            <Tag style={{ fontSize: '0.6rem' }}>{item.itemType}</Tag>
                          </Box>
                          {item.description && (
                            <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                              {item.description}
                            </Typography>
                          )}
                          {item.location && (
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Icon name="location_on" size={12} style={{ color: tokens.colors.text.secondary }} />
                              <Typography variant="caption" style={{ color: tokens.colors.text.secondary }}>
                                {item.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box style={{ textAlign: 'right' }}>
                          <Typography variant="caption" style={{ fontFamily: 'monospace' }}>
                            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          <Tag style={{ display: 'block', marginTop: 4, fontSize: '0.6rem' }}>
                            {item.status}
                          </Tag>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))}
      </Box>
    );
  };

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Navigate back to case list
   */
  const handleBack = useCallback(() => {
    navigation.navigate('/cases');
  }, [navigation]);

  /**
   * Navigate to edit page
   */
  const handleEdit = useCallback(() => {
    navigation.navigate(`/cases/${id}/edit`);
  }, [navigation, id]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((newValue: string) => {
    setActiveTab(newValue as TabType);
  }, []);

  /**
   * Handle node mark in progress
   */
  const handleMarkInProgress = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    try {
      await markInProgress(caseData.id, node.id);
      refreshCase();
      loadNodes();
    } catch (err) {
    }
  }, [caseData, markInProgress, refreshCase, loadNodes]);

  /**
   * Handle node mark completed
   */
  const handleMarkCompleted = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    try {
      await markCompleted(caseData.id, node.id);
      refreshCase();
      loadNodes();
    } catch (err) {
    }
  }, [caseData, markCompleted, refreshCase, loadNodes]);

  /**
   * Handle node skip
   */
  const handleSkipNode = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    const reason = window.prompt('Please enter skip reason:');
    if (!reason) return;
    try {
      await skipNode(caseData.id, node.id, reason);
      refreshCase();
      loadNodes();
    } catch (err) {
    }
  }, [caseData, skipNode, refreshCase, loadNodes]);

  // =========================================================================
  // Tab Configuration
  // =========================================================================

  const tabItems = useMemo(() => [
    {
      key: 'overview',
      label: 'Overview',
      icon: <Icon name="list" size={18} />,
      children: <OverviewTabContent caseData={caseData!} nodes={caseNodes} />,
    },
    {
      key: 'nodes',
      label: 'Nodes',
      icon: <Icon name="timeline" size={18} />,
      children: (
        <NodesTabContent
          nodes={caseNodes}
          onMarkInProgress={handleMarkInProgress}
          onMarkCompleted={handleMarkCompleted}
          onSkip={handleSkipNode}
        />
      ),
    },
    {
      key: 'timeline',
      label: `Timeline (${timelineEvents.length})`,
      icon: <Icon name="access_time" size={18} />,
      children: <TimelineTabContent events={timelineEvents} isLoading={isLoadingTimeline} />,
    },
    {
      key: 'schedule',
      label: `Schedule (${scheduleDays.reduce((sum, d) => sum + d.items.length, 0)})`,
      icon: <Icon name="schedule" size={18} />,
      children: <ScheduleTabContent days={scheduleDays} isLoading={isLoadingSchedule} />,
    },
  ], [caseData, caseNodes, timelineEvents, scheduleDays, isLoadingTimeline, isLoadingSchedule, handleMarkInProgress, handleMarkCompleted, handleSkipNode]);

  // =========================================================================
  // Render States
  // =========================================================================

  // Loading state
  if (isLoadingCase) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin />
      </Box>
    );
  }

  // Error state
  if (caseError || !caseData) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert
          type="error"
          message={caseError?.message || 'Case not found'}
          action={
            <Button size="small" onClick={handleBack}>
              Back to List
            </Button>
          }
        />
      </Box>
    );
  }

  // =========================================================================
  // Main Render
  // =========================================================================

  return (
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Back Button */}
      <Button
        onClick={handleBack}
        style={{ marginBottom: 16, color: tokens.colors.text.secondary }}
      >
        <Icon name="arrow_back" size={18} style={{ marginRight: 8 }} />
        Back to Case List
      </Button>

      {/* Header Card */}
      <Card style={{ marginBottom: 24 }}>
        <Box style={{ padding: 24 }}>
          {/* Case Info Header */}
          <Box style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Typography variant="h1" style={{ fontFamily: 'monospace' }}>
                  {caseData.caseNo}
                </Typography>
                <StatusChip status={caseData.status} />
                <TemplateChip templateCode={caseData.templateCode} />
              </Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 24, color: tokens.colors.text.secondary }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="person" size={16} />
                  <Typography variant="body2">{caseData.customerName}</Typography>
                </Box>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="person" size={16} style={{ color: tokens.colors.brand.primary }} />
                  <Typography variant="body2">Manager: {caseData.assignedToName || 'Unassigned'}</Typography>
                </Box>
                <Typography variant="body2">
                  Created: {new Date(caseData.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box style={{ display: 'flex', gap: 8 }}>
              <Button variant="outlined" onClick={handleEdit}>
                <Icon name="edit" size={16} style={{ marginRight: 8 }} />
                Edit Case
              </Button>
              <Button variant="contained">
                <Icon name="play_arrow" size={16} style={{ marginRight: 8 }} />
                Advance Node
              </Button>
            </Box>
          </Box>

          <Divider style={{ marginTop: 16, marginBottom: 16 }} />

          {/* Node Progress */}
          <NodeProgressBar nodes={caseNodes} />
        </Box>
      </Card>

      {/* Tabbed Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Card>
    </Box>
  );
};

export default CaseDetailPageV2;
