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
 * Message Notification Module - React Native Mobile Entry
 * 
 * v3.0 Runtime Shell Architecture
 * Exports all public components and configuration for the module
 * 
 * @author Brix Team
 * @since 3.0.0
 */

// Export screen components
export { InboxScreen } from './screens/InboxScreen';
export { MessageDetailScreen } from './screens/MessageDetailScreen';
export { ComposeScreen } from './screens/ComposeScreen';

// Export navigation configuration
export { MessengerNavigator, MessengerRoutes } from './navigation';

// Export types
export * from './types';

// Export API
export * from './api';
