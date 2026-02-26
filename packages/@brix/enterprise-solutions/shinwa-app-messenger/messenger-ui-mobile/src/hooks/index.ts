/**
 * Message Module - Mobile Hooks Export
 *
 * [Three-Layer Separation Architecture]
 * - UI layer (screens/): Responsible for rendering and user interaction, does not call API directly
 * - Hook layer (hooks/): Encapsulates business logic and state management, calls Repository
 * - Data layer (api/): Communicates with backend through HttpCapability
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

export { useInbox, type UseInboxOptions, type UseInboxReturn } from './useInbox';
export { useMessageDetail, type UseMessageDetailReturn } from './useMessageDetail';
export { useCompose, type UseComposeReturn } from './useCompose';
