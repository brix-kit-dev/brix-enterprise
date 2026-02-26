/**
 * Message Notification Module - React Native Mobile Entry
 * 
 * v3.0 Runtime Shell Architecture
 * Exports all public components and configuration for the module
 * 
 * @author Shinwa Team
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
