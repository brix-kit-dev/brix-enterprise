/**
 * @file Hooks Layer Index
 * @description Exports all ViewModel hooks for storage module
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This barrel file exports all hook implementations.
 * Hooks layer responsibilities (ViewModel in MVVM):
 * 1. Encapsulate business logic and state management
 * 2. Obtain HttpCapability via useHttp()
 * 3. Call Repository layer for data access
 * 4. Provide reactive state to View layer
 *
 * Architecture Compliance:
 * - Hooks are the only layer that imports Repository
 * - View components import only hooks, not repositories
 * - All side effects (HTTP) are encapsulated in hooks
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

// File List Hook
export { useFileList, type UseFileListResult } from './useFileList';

// File Detail Hook
export { useFileDetail, type UseFileDetailResult } from './useFileDetail';

// File Upload Hook
export {
  useFileUpload,
  type UseFileUploadResult,
  type UploadQueueItem,
  type UploadItemStatus,
} from './useFileUpload';

// File Access Logs Hook
export { useFileAccessLogs, type UseFileAccessLogsResult } from './useFileAccessLogs';
