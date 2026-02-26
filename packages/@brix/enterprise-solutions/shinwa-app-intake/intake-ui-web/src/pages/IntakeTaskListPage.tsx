/**
 * @file Intake Task List Page
 * @description Page component for listing intake tasks
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Page component following v3.0.4 View layer principles:
 * - Uses hooks for state management (ViewModel layer)
 * - Uses components for presentation (View layer)
 * - No direct data fetching in the page
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React, { useCallback } from 'react';
import { useNavigation } from '@brix/runtime-sdk-react';
import { useIntakeTasks } from '../hooks';
import { IntakeStatusBadge, IntakeProgressBar } from '../components';
import type { IntakeTask } from '@shinwa/intake-shared';
import { INTAKE_TASK_PRIORITY_LABELS } from '@shinwa/intake-shared';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Intake Task List Page
 *
 * Displays a paginated list of intake tasks with filtering and search.
 *
 * @example
 * ```tsx
 * <Route path="/intake/tasks" element={<IntakeTaskListPage />} />
 * ```
 */
export const IntakeTaskListPage: React.FC = () => {
  const navigation = useNavigation();

  // Use the intake tasks hook for state management
  const {
    tasks,
    isLoading,
    error,
    pagination,
    filter,
    refresh,
    setPage,
    setPageSize,
    search,
    filterByStatus,
    activateTask,
    cancelTask,
    deleteTask,
  } = useIntakeTasks();

  /**
   * Navigate to task detail
   */
  const handleTaskClick = useCallback(
    (task: IntakeTask) => {
      navigation.navigate(`/intake/tasks/${task.id}`);
    },
    [navigation]
  );

  /**
   * Navigate to create page
   */
  const handleCreate = useCallback(() => {
    navigation.navigate('/intake/tasks/create');
  }, [navigation]);

  /**
   * Handle search input
   */
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      search(event.target.value);
    },
    [search]
  );

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      filterByStatus(value ? (value as any) : undefined);
    },
    [filterByStatus]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          资料收集任务
        </h1>
        <button
          onClick={handleCreate}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + 创建任务
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="搜索任务..."
          onChange={handleSearchChange}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        />

        {/* Status filter */}
        <select
          onChange={handleStatusFilterChange}
          value={filter.status || ''}
          style={{
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '0.875rem',
            minWidth: '120px',
          }}
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="ACTIVE">进行中</option>
          <option value="IN_REVIEW">审核中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>

        {/* Refresh button */}
        <button
          onClick={refresh}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          刷新
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
          加载中...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            color: '#c62828',
            marginBottom: '24px',
          }}
        >
          {error.message}
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && (
        <>
          {tasks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                color: '#666',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
              }}
            >
              暂无任务
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 100px 120px 100px 120px',
                  padding: '12px 16px',
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #e0e0e0',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: '#424242',
                }}
              >
                <div>标题</div>
                <div>状态</div>
                <div>优先级</div>
                <div>进度</div>
                <div>截止日期</div>
                <div>操作</div>
              </div>

              {/* Table rows */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 100px 120px 100px 120px',
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Title */}
                  <div>
                    <div style={{ fontWeight: 500, color: '#212121' }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          marginTop: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <IntakeStatusBadge status={task.status} size="small" />
                  </div>

                  {/* Priority */}
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {INTAKE_TASK_PRIORITY_LABELS[task.priority]}
                  </div>

                  {/* Progress */}
                  <div>
                    <IntakeProgressBar
                      completed={task.completedItems}
                      total={task.totalItems}
                      showPercentage={false}
                      showCount
                      height={4}
                    />
                  </div>

                  {/* Due date */}
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {formatDate(task.dueDate)}
                  </div>

                  {/* Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', gap: '4px' }}
                  >
                    {task.status === 'DRAFT' && (
                      <button
                        onClick={() => activateTask(task.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#4caf50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        激活
                      </button>
                    )}
                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <button
                        onClick={() => cancelTask(task.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ff9800',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
              }}
            >
              <button
                disabled={pagination.page === 0}
                onClick={() => handlePageChange(pagination.page - 1)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: pagination.page === 0 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === 0 ? 0.5 : 1,
                }}
              >
                上一页
              </button>

              <span style={{ padding: '0 16px', color: '#666' }}>
                第 {pagination.page + 1} / {pagination.totalPages} 页
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => handlePageChange(pagination.page + 1)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor:
                    pagination.page >= pagination.totalPages - 1
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: pagination.page >= pagination.totalPages - 1 ? 0.5 : 1,
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IntakeTaskListPage;
