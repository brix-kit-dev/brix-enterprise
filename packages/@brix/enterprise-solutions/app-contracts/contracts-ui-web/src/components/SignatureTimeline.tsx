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
 * @file Signature Timeline Component
 * @description Displays contract signature progress as a timeline
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer guidelines.
 * Visualizes the signature flow of a contract with all parties.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React from 'react';
import type { ContractParty } from '@brix-sdk/enterprise-contracts-shared';
import { SIGNATURE_STATUS_CONFIG, PARTY_TYPE_LABELS } from '@brix-sdk/enterprise-contracts-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface SignatureTimelineProps {
  /** Contract parties list */
  parties: ContractParty[];
  /** Orientation of the timeline */
  orientation?: 'horizontal' | 'vertical';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format timestamp to localized string
 */
function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get party type label
 */
function getPartyTypeLabel(partyType: string): string {
  return PARTY_TYPE_LABELS[partyType] || partyType;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
  },
  horizontal: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    overflowX: 'auto',
  },
  vertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  stepHorizontal: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '140px',
    position: 'relative',
  },
  stepVertical: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    position: 'relative',
    paddingBottom: '24px',
  },
  nodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  node: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    border: '2px solid #E5E7EB',
    backgroundColor: '#fff',
  },
  connectorHorizontal: {
    position: 'absolute',
    top: '16px',
    left: '50%',
    width: '100%',
    height: '2px',
    backgroundColor: '#E5E7EB',
  },
  connectorHorizontalDone: {
    backgroundColor: '#10B981',
  },
  connectorVertical: {
    position: 'absolute',
    left: '15px',
    top: '32px',
    width: '2px',
    height: 'calc(100% - 32px)',
    backgroundColor: '#E5E7EB',
  },
  connectorVerticalDone: {
    backgroundColor: '#10B981',
  },
  content: {
    marginTop: '8px',
    textAlign: 'center',
  },
  contentVertical: {
    flex: 1,
    paddingTop: '4px',
  },
  partyType: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '2px',
  },
  partyName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '4px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  signedTime: {
    fontSize: '11px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Signature Timeline Component
 *
 * Renders a timeline showing the signature progress of all contract parties.
 *
 * @example
 * ```tsx
 * <SignatureTimeline parties={contract.parties} orientation="horizontal" />
 * ```
 */
export const SignatureTimeline: React.FC<SignatureTimelineProps> = ({
  parties,
  orientation = 'horizontal',
}) => {
  // Sort parties by sign order
  const sortedParties = [...parties].sort((a, b) => a.signOrder - b.signOrder);
  const isHorizontal = orientation === 'horizontal';

  return (
    <div style={styles.container}>
      <div style={isHorizontal ? styles.horizontal : styles.vertical}>
        {sortedParties.map((party, index) => {
          const config = SIGNATURE_STATUS_CONFIG[party.signatureStatus] || {
            label: party.signatureStatus,
            color: '#6B7280',
            bgColor: '#F3F4F6',
            icon: '⏳',
          };

          const isSigned = party.signatureStatus === 'SIGNED';
          const isLast = index === sortedParties.length - 1;

          return (
            <div
              key={party.id}
              style={isHorizontal ? styles.stepHorizontal : styles.stepVertical}
            >
              {/* Connector line (not for last item) */}
              {!isLast && isHorizontal && (
                <div
                  style={{
                    ...styles.connectorHorizontal,
                    ...(isSigned ? styles.connectorHorizontalDone : {}),
                  }}
                />
              )}
              {!isLast && !isHorizontal && (
                <div
                  style={{
                    ...styles.connectorVertical,
                    ...(isSigned ? styles.connectorVerticalDone : {}),
                  }}
                />
              )}

              {/* Node */}
              <div style={styles.nodeContainer}>
                <div
                  style={{
                    ...styles.node,
                    borderColor: config.color,
                    backgroundColor: isSigned ? config.bgColor : '#fff',
                  }}
                >
                  {config.icon}
                </div>
              </div>

              {/* Content */}
              <div style={isHorizontal ? styles.content : styles.contentVertical}>
                <div style={styles.partyType}>{getPartyTypeLabel(party.partyType)}</div>
                <div style={styles.partyName}>{party.name}</div>
                <span
                  style={{
                    ...styles.statusBadge,
                    color: config.color,
                    backgroundColor: config.bgColor,
                  }}
                >
                  {config.label}
                </span>
                {party.signedAt && (
                  <div style={styles.signedTime}>
                    签署于 {formatDateTime(party.signedAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignatureTimeline;
