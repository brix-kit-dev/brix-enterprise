/**
 * Identity Module - Web UI Entry Point
 * 
 * v3.2 Runtime Shell Architecture
 * - Uses UIRuntimeContext for frontend capabilities
 * - Module Federation exposed components
 * 
 * Phase 5 Enhancement (Week 11):
 * - Added OrganizationListPage export for organization management
 * - Added OrganizationDetailPage export for organization details
 * - Added RoleListPage export for role management
 * - Added RoleDetailPage export for role details and permission configuration
 * 
 * @author Shinwa Team
 * @since 3.0.0
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

// Export types
export * from './types';

// Export API
export * from './api';

// Export components
export { GoogleLoginButton } from './components';

// Export hooks
export {
  useUserList,
  useUserDetail,
  useUserCreate,
  useOrganizationList,
  useOrganizationDetail,
  useRoleList,
  useRoleDetail,
} from './hooks';

// Export repositories
export {
  createUserRepository,
  createOrganizationRepository,
  createRoleRepository,
} from './repositories';

// Export user pages
export { default as UserList } from './pages/UserList';
export { default as UserDetail } from './pages/UserDetail';
export { default as UserCreate } from './pages/UserCreate';

// Export organization pages (Phase 5 Week 11)
export { OrganizationListPage } from './pages/OrganizationList';
export { OrganizationDetailPage } from './pages/OrganizationDetail';

// Export role pages (Phase 5 Week 11)
export { RoleListPage } from './pages/RoleList';
export { RoleDetailPage } from './pages/RoleDetail';

// Default export
export default {
  name: '@shinwa/identity-ui-web',
  version: '3.2.0',
};
