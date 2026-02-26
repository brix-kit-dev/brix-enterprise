/**
 * Partner Module - Mobile Hooks Export
 *
 * [Three-Layer Separation Architecture]
 * - UI layer (components/): Responsible for rendering and user interaction, does not call API directly
 * - Hook layer (hooks/): Encapsulates business logic and state management, calls Repository
 * - Data layer (api/): Communicates with backend through HttpCapability
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @version 3.2.0
 */

export { usePartnerList, type UsePartnerListOptions, type UsePartnerListReturn } from './usePartnerList';
export { usePartnerDetail, type UsePartnerDetailReturn } from './usePartnerDetail';
