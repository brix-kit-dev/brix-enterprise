/**
 * ComplianceStatsDashboard Component
 * Displays compliance check statistics in a dashboard format.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ComplianceStatsDashboard
 */

import React, { memo, useMemo } from 'react';
import type { ComplianceStatistics } from '../repositories';

/**
 * Props interface for ComplianceStatsDashboard component.
 */
export interface ComplianceStatsDashboardProps {
  /** Compliance statistics data */
  statistics: ComplianceStatistics | null;
  /** Loading state indicator */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
  /** Handler for refresh action */
  onRefresh?: () => void;
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Stat card sub-component for individual metrics.
 */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
}

/**
 * Individual statistic card component.
 */
const StatCard: React.FC<StatCardProps> = memo(({ title, value, icon, color, trend }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: color + '15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
    lineHeight: 1.2,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0',
  };

  const trendStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '12px',
    color: trend?.direction === 'up' ? '#10b981' : '#ef4444',
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <p style={valueStyle}>{value}</p>
          <p style={titleStyle}>{title}</p>
        </div>
        <div style={iconContainerStyle}>{icon}</div>
      </div>
      {trend && (
        <div style={trendStyle}>
          {trend.direction === 'up' ? (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <span>{trend.value}%</span>
          <span style={{ color: '#6b7280', marginLeft: '4px' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Component that displays compliance statistics dashboard.
 * Shows key metrics, pass rate, and top violations.
 * @param props - Component props including statistics data and handlers
 * @returns Styled statistics dashboard
 * @example
 * ```tsx
 * const { statistics, loading, error, refresh } = useComplianceStatistics(30);
 * 
 * <ComplianceStatsDashboard
 *   statistics={statistics}
 *   loading={loading}
 *   error={error}
 *   onRefresh={refresh}
 * />
 * ```
 */
export const ComplianceStatsDashboard: React.FC<ComplianceStatsDashboardProps> = memo(({
  statistics,
  loading = false,
  error = null,
  onRefresh,
  className = '',
}) => {
  const passRate = useMemo(() => {
    if (!statistics) return 0;
    return statistics.passRate;
  }, [statistics]);

  const passRateColor = useMemo(() => {
    if (passRate >= 90) return '#10b981';
    if (passRate >= 70) return '#f59e0b';
    return '#ef4444';
  }, [passRate]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 16px',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    color: '#dc2626',
    textAlign: 'center',
  };

  const refreshButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  if (loading) {
    return (
      <div style={loadingStyle} className="compliance-stats__loading">
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle} className="compliance-stats__error">
        <p style={{ margin: '0 0 12px' }}>{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} style={refreshButtonStyle}>
            重试
          </button>
        )}
      </div>
    );
  }

  if (!statistics) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        暂无统计数据
      </div>
    );
  }

  return (
    <div className={`compliance-stats-dashboard ${className}`} style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
          合规检查统计
        </h2>
        {onRefresh && (
          <button style={refreshButtonStyle} onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            刷新
          </button>
        )}
      </div>

      {/* Stat cards grid */}
      <div style={gridStyle}>
        <StatCard
          title="总检查次数"
          value={statistics.totalChecks.toLocaleString()}
          color="#3b82f6"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          title="通过检查"
          value={statistics.passedChecks.toLocaleString()}
          color="#10b981"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          title="未通过检查"
          value={statistics.failedChecks.toLocaleString()}
          color="#ef4444"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          title="通过率"
          value={`${passRate.toFixed(1)}%`}
          color={passRateColor}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          }
        />
      </div>

      {/* Two column layout for violations and chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Top violations */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>高频违规词 (Top 5)</h3>
          {statistics.topViolations.length > 0 ? (
            <div>
              {statistics.topViolations.slice(0, 5).map((violation, index) => (
                <div
                  key={violation.word}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? '#fef3c7' : '#f3f4f6',
                      color: index < 3 ? '#d97706' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}>
                      {violation.word}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                      {violation.count}次
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
              暂无违规记录
            </p>
          )}
        </div>

        {/* Daily checks chart placeholder */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>近期检查趋势</h3>
          {statistics.checksByDay.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statistics.checksByDay.slice(-7).map((day) => (
                <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '80px', fontSize: '12px', color: '#6b7280' }}>
                    {new Date(day.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                  </span>
                  <div style={{ flex: 1, display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                    <div
                      style={{
                        width: `${day.total > 0 ? (day.passed / day.total) * 100 : 0}%`,
                        backgroundColor: '#10b981',
                        transition: 'width 0.3s ease',
                      }}
                    />
                    <div
                      style={{
                        width: `${day.total > 0 ? (day.failed / day.total) * 100 : 0}%`,
                        backgroundColor: '#ef4444',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: '50px', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
                    {day.total}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                  通过
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                  未通过
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
              暂无检查数据
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

ComplianceStatsDashboard.displayName = 'ComplianceStatsDashboard';

export default ComplianceStatsDashboard;
