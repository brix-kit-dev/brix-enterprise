/**
 * ScriptEditor Component
 * Rich text editor for creating and editing script templates with variable support.
 * Following v3.0.4 Runtime Shell Architecture Blueprint.
 * @module compliance-ui-web/components/ScriptEditor
 */

import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { ScriptVariable } from '@shinwa/compliance-shared';

/**
 * Props interface for ScriptEditor component.
 */
export interface ScriptEditorProps {
  /** Current content value */
  value: string;
  /** Change handler for content */
  onChange: (value: string) => void;
  /** Array of defined variables in the template */
  variables: ScriptVariable[];
  /** Handler for variable changes */
  onVariablesChange?: (variables: ScriptVariable[]) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Placeholder text for empty content */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Whether to show variable panel */
  showVariablePanel?: boolean;
  /** Validation errors to display */
  validationErrors?: Array<{
    type: string;
    message: string;
    position?: number;
    length?: number;
  }>;
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Variable syntax pattern for detection (e.g., {{variableName}})
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Extracts variable names from content.
 * @param content - The content to parse
 * @returns Array of unique variable names found
 */
function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_PATTERN);
  const names = new Set<string>();
  for (const match of matches) {
    names.add(match[1].trim());
  }
  return Array.from(names);
}

/**
 * Component for editing script template content with variable highlighting.
 * Provides variable detection, insertion, and real-time highlighting.
 * @param props - Component props including value, variables, and handlers
 * @returns Script editor with variable support
 * @example
 * ```tsx
 * <ScriptEditor
 *   value={content}
 *   onChange={setContent}
 *   variables={variables}
 *   onVariablesChange={setVariables}
 *   showVariablePanel={true}
 * />
 * ```
 */
export const ScriptEditor: React.FC<ScriptEditorProps> = memo(({
  value,
  onChange,
  variables,
  onVariablesChange,
  disabled = false,
  placeholder = '请输入话术内容，使用 {{变量名}} 插入变量...',
  minHeight = 300,
  showVariablePanel = true,
  validationErrors = [],
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');

  /**
   * Detected variable names from content.
   */
  const detectedVariables = useMemo(() => extractVariables(value), [value]);

  /**
   * Variables in content that are not defined.
   */
  const undefinedVariables = useMemo(() => {
    const definedNames = new Set(variables.map((v) => v.name));
    return detectedVariables.filter((name) => !definedNames.has(name));
  }, [detectedVariables, variables]);

  /**
   * Generates highlighted HTML with variables marked.
   */
  const highlightedContent = useMemo(() => {
    if (!value) {
      return '&nbsp;';
    }

    let result = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight variables
    result = result.replace(VARIABLE_PATTERN, (match, varName) => {
      const trimmedName = varName.trim();
      const isUndefined = !variables.some((v) => v.name === trimmedName);
      const style = isUndefined
        ? 'background-color: #fef3c7; color: #d97706; border: 1px dashed #f59e0b;'
        : 'background-color: #dbeafe; color: #2563eb; border: 1px solid #93c5fd;';
      
      return `<span class="script-variable" style="${style} padding: 0 4px; border-radius: 4px; font-family: monospace; font-size: 13px;" data-variable="${trimmedName}">${match}</span>`;
    });

    // Highlight validation errors
    for (const error of validationErrors) {
      if (error.position !== undefined && error.length) {
        // This is a simplified approach - in production, you'd need more sophisticated error positioning
      }
    }

    // Preserve line breaks and spaces
    return result.replace(/\n/g, '<br/>').replace(/  /g, '&nbsp;&nbsp;');
  }, [value, variables, validationErrors]);

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
    setCursorPosition(e.target.selectionStart);
  }, [onChange]);

  /**
   * Handles cursor position tracking.
   */
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  }, []);

  /**
   * Inserts a variable at cursor position.
   */
  const insertVariable = useCallback((variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    const variableText = `{{${variableName}}}`;
    
    const newValue = `${before}${variableText}${after}`;
    onChange(newValue);

    // Move cursor after inserted variable
    const newPosition = cursorPosition + variableText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
      setCursorPosition(newPosition);
    }, 0);
  }, [value, cursorPosition, onChange, disabled]);

  /**
   * Adds a new variable to the list.
   */
  const handleAddVariable = useCallback(() => {
    if (!newVariableName.trim() || !onVariablesChange) return;

    const name = newVariableName.trim();
    if (variables.some((v) => v.name === name)) {
      // Variable already exists
      setNewVariableName('');
      setIsAddingVariable(false);
      return;
    }

    const newVariable: ScriptVariable = {
      name,
      description: '',
      defaultValue: '',
      required: false,
    };

    onVariablesChange([...variables, newVariable]);
    setNewVariableName('');
    setIsAddingVariable(false);
  }, [newVariableName, variables, onVariablesChange]);

  /**
   * Removes a variable from the list.
   */
  const handleRemoveVariable = useCallback((variableName: string) => {
    if (!onVariablesChange) return;
    onVariablesChange(variables.filter((v) => v.name !== variableName));
  }, [variables, onVariablesChange]);

  /**
   * Auto-add detected but undefined variables.
   */
  const handleAutoAddVariables = useCallback(() => {
    if (!onVariablesChange || undefinedVariables.length === 0) return;

    const newVariables = undefinedVariables.map((name) => ({
      name,
      description: '',
      defaultValue: '',
      required: false,
    }));

    onVariablesChange([...variables, ...newVariables]);
  }, [variables, undefinedVariables, onVariablesChange]);

  // Sync scroll on textarea scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    width: '100%',
  };

  const editorContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const editorWrapperStyle: React.CSSProperties = {
    position: 'relative',
    border: validationErrors.length > 0 ? '1px solid #f87171' : '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    minHeight,
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
    minHeight,
    padding: '12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.6,
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    backgroundColor: 'transparent',
    color: '#1f2937',
  };

  const variablePanelStyle: React.CSSProperties = {
    width: '240px',
    flexShrink: 0,
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  };

  const variableItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <div className={`script-editor ${className}`} style={containerStyle}>
      {/* Main editor area */}
      <div style={editorContainerStyle} className="script-editor__editor">
        <div style={editorWrapperStyle}>
          {/* Highlight overlay */}
          <div
            ref={highlightRef}
            style={highlightStyle}
            className="script-editor__highlight"
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
            aria-hidden="true"
          />
          
          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onSelect={handleSelect}
            placeholder={placeholder}
            disabled={disabled}
            style={textareaStyle}
            className="script-editor__textarea"
            aria-label="Script content editor"
          />
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {validationErrors.map((error, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#dc2626',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable panel */}
      {showVariablePanel && (
        <div style={variablePanelStyle} className="script-editor__variables">
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              变量列表
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
              点击变量插入到光标位置
            </p>
          </div>

          {/* Undefined variables warning */}
          {undefinedVariables.length > 0 && (
            <div style={{
              padding: '8px 10px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '12px',
            }}>
              <div style={{ color: '#d97706', marginBottom: '6px' }}>
                {undefinedVariables.length} 个变量未定义
              </div>
              <button
                onClick={handleAutoAddVariables}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#92400e',
                  cursor: 'pointer',
                }}
              >
                自动添加
              </button>
            </div>
          )}

          {/* Variable list */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {variables.map((variable) => (
              <div
                key={variable.name}
                style={variableItemStyle}
                onClick={() => insertVariable(variable.name)}
                className="script-editor__variable-item"
              >
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#2563eb' }}>
                  {`{{${variable.name}}}`}
                </span>
                {onVariablesChange && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVariable(variable.name);
                    }}
                    style={{
                      padding: '2px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: '#9ca3af',
                    }}
                    title="删除变量"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add variable button/form */}
          {onVariablesChange && (
            <div style={{ marginTop: '12px' }}>
              {isAddingVariable ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newVariableName}
                    onChange={(e) => setNewVariableName(e.target.value)}
                    placeholder="变量名"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddVariable();
                      if (e.key === 'Escape') {
                        setIsAddingVariable(false);
                        setNewVariableName('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddVariable}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    添加
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingVariable(true)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px dashed #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  添加变量
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ScriptEditor.displayName = 'ScriptEditor';

export default ScriptEditor;
