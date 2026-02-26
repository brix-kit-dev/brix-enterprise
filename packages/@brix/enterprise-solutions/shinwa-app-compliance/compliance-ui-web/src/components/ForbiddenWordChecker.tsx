/**
 * ForbiddenWordChecker Component
 * Real-time text input component with forbidden word detection and highlighting.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ForbiddenWordChecker
 */

import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ForbiddenWordSeverity, SEVERITY_CONFIG } from '@shinwa/compliance-shared';

/**
 * Match information for a detected forbidden word.
 */
export interface ForbiddenWordMatch {
  /** The forbidden word that was matched */
  word: string;
  /** Position (character index) in the text */
  position: number;
  /** Length of the matched text */
  length: number;
  /** Severity level of the word */
  severity: string;
  /** Suggested alternatives if available */
  suggestedAlternatives?: string[];
}

/**
 * Props interface for ForbiddenWordChecker component.
 */
export interface ForbiddenWordCheckerProps {
  /** Current text content value */
  value: string;
  /** Change handler for text content */
  onChange: (value: string) => void;
  /** Array of detected forbidden word matches */
  matches: ForbiddenWordMatch[];
  /** Whether a check is currently pending */
  pending?: boolean;
  /** Whether the content passes compliance */
  passed?: boolean;
  /** Placeholder text for empty input */
  placeholder?: string;
  /** Number of rows for textarea */
  rows?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Handler when user clicks on a match */
  onMatchClick?: (match: ForbiddenWordMatch) => void;
  /** Handler when user selects a replacement suggestion */
  onReplacementSelect?: (match: ForbiddenWordMatch, replacement: string) => void;
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Gets the appropriate color for a severity level.
 * @param severity - The severity level string
 * @returns Color configuration for the severity
 */
function getSeverityStyle(severity: string): { backgroundColor: string; borderColor: string } {
  const severityKey = severity.toUpperCase() as keyof typeof SEVERITY_CONFIG;
  const config = SEVERITY_CONFIG[severityKey as ForbiddenWordSeverity];
  
  if (config) {
    return {
      backgroundColor: config.backgroundColor,
      borderColor: config.color,
    };
  }
  
  return {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  };
}

/**
 * Component that provides a textarea with real-time forbidden word detection.
 * Displays matches in an overlay with highlighting and provides replacement suggestions.
 * @param props - Component props including value, matches, and handlers
 * @returns Styled text checker component with highlighting
 * @example
 * ```tsx
 * const { state, setContent } = useRealTimeComplianceCheck();
 * 
 * <ForbiddenWordChecker
 *   value={state.content}
 *   onChange={setContent}
 *   matches={state.matches}
 *   pending={state.pending}
 *   passed={state.passed}
 *   placeholder="输入文本进行合规检查..."
 * />
 * ```
 */
export const ForbiddenWordChecker: React.FC<ForbiddenWordCheckerProps> = memo(({
  value,
  onChange,
  matches,
  pending = false,
  passed = true,
  placeholder = '请输入要检查的文本...',
  rows = 8,
  disabled = false,
  onMatchClick,
  onReplacementSelect,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [selectedMatch, setSelectedMatch] = useState<ForbiddenWordMatch | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  /**
   * Generates highlighted HTML with forbidden words marked.
   */
  const highlightedContent = useMemo(() => {
    if (matches.length === 0) {
      // Return text with line breaks preserved
      return value.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;') || '&nbsp;';
    }

    // Sort matches by position in reverse order for safe replacement
    const sortedMatches = [...matches].sort((a, b) => b.position - a.position);

    let result = value;
    for (const match of sortedMatches) {
      const before = result.substring(0, match.position);
      const matched = result.substring(match.position, match.position + match.length);
      const after = result.substring(match.position + match.length);
      
      const severityStyle = getSeverityStyle(match.severity);
      
      result = `${before}<mark class="forbidden-word-highlight" data-severity="${match.severity}" style="background-color: ${severityStyle.backgroundColor}; border-bottom: 2px solid ${severityStyle.borderColor}; border-radius: 2px; padding: 0 2px; cursor: pointer;" data-index="${matches.indexOf(match)}">${matched}</mark>${after}`;
    }

    // Preserve line breaks and spaces
    return result.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;') || '&nbsp;';
  }, [value, matches]);

  /**
   * Handles textarea scroll sync with highlight overlay.
   */
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  /**
   * Handles text input changes.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setSelectedMatch(null);
  }, [onChange]);

  /**
   * Handles click on highlighted match.
   */
  const handleHighlightClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('forbidden-word-highlight')) {
      const index = parseInt(target.getAttribute('data-index') || '-1', 10);
      if (index >= 0 && index < matches.length) {
        const match = matches[index];
        setSelectedMatch(match);
        
        // Calculate tooltip position
        const rect = target.getBoundingClientRect();
        const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
        
        onMatchClick?.(match);
      }
    } else {
      setSelectedMatch(null);
      setTooltipPosition(null);
    }
  }, [matches, onMatchClick]);

  /**
   * Handles replacement selection.
   */
  const handleReplacementClick = useCallback((replacement: string) => {
    if (selectedMatch && onReplacementSelect) {
      onReplacementSelect(selectedMatch, replacement);
    }
    setSelectedMatch(null);
    setTooltipPosition(null);
  }, [selectedMatch, onReplacementSelect]);

  /**
   * Closes the tooltip.
   */
  const handleCloseTooltip = useCallback(() => {
    setSelectedMatch(null);
    setTooltipPosition(null);
  }, []);

  // Sync scroll on textarea scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    border: `1px solid ${passed ? '#d1d5db' : '#f87171'}`,
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    transition: 'border-color 0.2s ease',
  };

  const highlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: '12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    color: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'auto',
    pointerEvents: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    padding: '12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.6,
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    backgroundColor: 'transparent',
    color: '#1f2937',
    minHeight: `${rows * 24}px`,
  };

  const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#6b7280',
  };

  const statusIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const tooltipStyle: React.CSSProperties = tooltipPosition ? {
    position: 'absolute',
    top: tooltipPosition.top,
    left: tooltipPosition.left,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
    maxWidth: '280px',
  } : { display: 'none' };

  return (
    <div className={`forbidden-word-checker ${className}`} style={containerStyle}>
      <div style={wrapperStyle} className="forbidden-word-checker__wrapper">
        {/* Highlight overlay */}
        <div
          ref={highlightRef}
          style={{ ...highlightStyle, pointerEvents: 'auto' }}
          className="forbidden-word-checker__highlight"
          onClick={handleHighlightClick}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
          aria-hidden="true"
        />
        
        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          style={textareaStyle}
          className="forbidden-word-checker__textarea"
          rows={rows}
          aria-label="Text input for compliance checking"
        />
      </div>

      {/* Status bar */}
      <div style={statusBarStyle} className="forbidden-word-checker__status">
        <div style={statusIndicatorStyle}>
          {pending ? (
            <>
              <span className="forbidden-word-checker__spinner" style={{
                width: '12px',
                height: '12px',
                border: '2px solid #d1d5db',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <span>检查中...</span>
            </>
          ) : passed ? (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#10b981">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ color: '#10b981' }}>合规通过</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#ef4444">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span style={{ color: '#ef4444' }}>发现 {matches.length} 个违规词</span>
            </>
          )}
        </div>
        <span>{value.length} 字符</span>
      </div>

      {/* Tooltip for selected match */}
      {selectedMatch && tooltipPosition && (
        <div style={tooltipStyle} className="forbidden-word-checker__tooltip">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>
              "{selectedMatch.word}"
            </span>
            <button
              onClick={handleCloseTooltip}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '2px',
                color: '#9ca3af',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            严重程度: {SEVERITY_CONFIG[selectedMatch.severity as ForbiddenWordSeverity]?.label || selectedMatch.severity}
          </div>
          {selectedMatch.suggestedAlternatives && selectedMatch.suggestedAlternatives.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                建议替换为:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedMatch.suggestedAlternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => handleReplacementClick(alt)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#eff6ff',
                      color: '#3b82f6',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyframe animation for spinner */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
});

ForbiddenWordChecker.displayName = 'ForbiddenWordChecker';

export default ForbiddenWordChecker;
