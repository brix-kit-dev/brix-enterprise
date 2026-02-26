/**
 * @file Hooks layer unified entry
 * @description Frontend-backend separation architecture ViewModel layer
 * @module identity-ui-web/hooks
 * @version 3.2.0
 * 
 * v3.2 Architecture Notes:
 * The Hooks layer is the ViewModel layer implementation, responsible for:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  UI Layer (pages/, components/)                                │
 * │    ↓ uses hooks                                                │
 * │  ViewModel Layer (hooks/)  ← This module                       │
 * │    ↓ calls repository                                          │
 * │  Repository Layer (repositories/)                              │
 * │    ↓ uses capability                                           │
 * │  HttpCapability (provided by Shell)                            │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Layer Responsibilities:
 * - State Management: Maintain component required state
 * - Business Orchestration: Coordinate Repository calls and event publishing
 * - Cache Management: Implement data caching and invalidation strategies
 * 
 * Change Triggers:
 * - When business logic changes, modify Hooks layer
 * - UI layer and Repository layer remain stable
 * 
 * @see v3.2-detailed-transformation-plan.md Phase 5: Frontend-backend separation refactoring
 */

// User List Hook
export { 
  useUserList,
  type UserListState,
  type UserListActions,
} from './useUserList';

// User Detail Hook
export {
  useUserDetail,
  type UserDetailState,
  type UserDetailActions,
} from './useUserDetail';

// User Create Hook
export {
  useUserCreate,
  type UserCreateState,
  type UserCreateActions,
} from './useUserCreate';

// Organization List Hook
export {
  useOrganizationList,
  type OrganizationListState,
  type OrganizationListActions,
  type OrganizationListFilters,
} from './useOrganizationList';

// Organization Detail Hook
export {
  useOrganizationDetail,
  type OrganizationDetailState,
  type OrganizationDetailActions,
  type OrganizationUser,
} from './useOrganizationDetail';

// Role List Hook
export {
  useRoleList,
  type RoleListState,
  type RoleListActions,
  type RoleListFilters,
} from './useRoleList';

// Role Detail Hook
export {
  useRoleDetail,
  type RoleDetailState,
  type RoleDetailActions,
  type PermissionCategory,
  type Permission,
} from './useRoleDetail';
