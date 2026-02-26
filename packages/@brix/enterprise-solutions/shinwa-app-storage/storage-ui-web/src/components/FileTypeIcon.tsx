/**
 * @file File Type Icon Component
 * @description Displays appropriate icon based on file MIME type
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer principles:
 * 1. No direct HTTP calls (delegates to ViewModel via props)
 * 2. Receives all data via props
 * 3. Stateless rendering based on file type
 *
 * Architecture Compliance:
 * - Pure View component with no side effects
 * - Uses semantic icon mapping for common MIME types
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { CSSProperties } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * File Type Icon Props
 */
export interface FileTypeIconProps {
  /** MIME content type of the file */
  contentType: string;

  /** Icon size in pixels (default: 24) */
  size?: number;

  /** Additional CSS class names */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * MIME type to icon character mapping
 *
 * Uses Unicode symbols for framework-agnostic rendering.
 * In production, replace with proper icon library (MUI Icons, etc.)
 */
const ICON_MAP: Record<string, string> = {
  // Images
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'image/svg+xml': '🖼️',
  'image/': '🖼️',

  // Documents
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📽️',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
  'text/plain': '📃',
  'text/html': '🌐',
  'text/css': '🎨',
  'text/javascript': '⚙️',
  'application/json': '📋',
  'application/xml': '📋',

  // Videos
  'video/mp4': '🎬',
  'video/webm': '🎬',
  'video/quicktime': '🎬',
  'video/': '🎬',

  // Audio
  'audio/mpeg': '🎵',
  'audio/wav': '🎵',
  'audio/ogg': '🎵',
  'audio/': '🎵',

  // Archives
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/gzip': '📦',

  // Medical
  'application/dicom': '🏥',

  // Default
  'default': '📁',
};

/**
 * Color mapping for file type categories
 */
const COLOR_MAP: Record<string, string> = {
  image: '#4CAF50',   // Green
  document: '#2196F3', // Blue
  video: '#9C27B0',    // Purple
  audio: '#FF9800',    // Orange
  archive: '#795548',  // Brown
  medical: '#F44336',  // Red
  default: '#9E9E9E',  // Grey
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for content type
 *
 * @param contentType - MIME content type
 * @returns Icon character
 */
function getIcon(contentType: string): string {
  // Try exact match first
  if (ICON_MAP[contentType]) {
    return ICON_MAP[contentType];
  }

  // Try prefix match
  const prefix = contentType.split('/')[0] + '/';
  if (ICON_MAP[prefix]) {
    return ICON_MAP[prefix];
  }

  return ICON_MAP['default'];
}

/**
 * Get color for content type category
 *
 * @param contentType - MIME content type
 * @returns Color hex code
 */
function getColor(contentType: string): string {
  const category = contentType.split('/')[0];

  switch (category) {
    case 'image':
      return COLOR_MAP.image;
    case 'video':
      return COLOR_MAP.video;
    case 'audio':
      return COLOR_MAP.audio;
    default:
      if (contentType.includes('dicom')) {
        return COLOR_MAP.medical;
      }
      if (
        contentType.includes('zip') ||
        contentType.includes('rar') ||
        contentType.includes('7z') ||
        contentType.includes('gzip')
      ) {
        return COLOR_MAP.archive;
      }
      if (
        contentType.includes('pdf') ||
        contentType.includes('word') ||
        contentType.includes('excel') ||
        contentType.includes('text')
      ) {
        return COLOR_MAP.document;
      }
      return COLOR_MAP.default;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * File Type Icon Component
 *
 * Renders an appropriate icon based on the file's MIME type.
 * Pure presentational component with no side effects.
 *
 * @param props - Component props
 * @returns Icon element
 *
 * @example
 * ```tsx
 * <FileTypeIcon contentType="application/pdf" size={32} />
 * <FileTypeIcon contentType="image/jpeg" />
 * ```
 */
export function FileTypeIcon({
  contentType,
  size = 24,
  className,
  style,
}: FileTypeIconProps): JSX.Element {
  const icon = getIcon(contentType);
  const color = getColor(contentType);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size}px`,
        lineHeight: 1,
        color,
        ...style,
      }}
      role="img"
      aria-label={`File type: ${contentType}`}
    >
      {icon}
    </span>
  );
}
