/**
 * @file Storage Module Bootstrap Entry
 * @description Module Federation entry point for the storage UI module
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This file is the bootstrap entry for Module Federation.
 * It handles dynamic import of the main App component to ensure
 * shared dependencies are properly loaded before rendering.
 *
 * Architecture Compliance:
 * - Follows v3.0.4 Module Federation pattern
 * - Lazy loads main application for proper dependency resolution
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import('./App').then(({ default: render }) => {
  render();
});
