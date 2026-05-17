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
 * Messenger Module - Web UI Entry Point
 * 
 * v3.0 Runtime Shell Architecture
 * Exports all page components for Module Federation usage
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */

// Page components
export { default as InboxPage } from './pages/InboxPage';
export { default as MessageDetailPage } from './pages/MessageDetailPage';
export { default as ComposePage } from './pages/ComposePage';

// Type definitions
export * from './types';
