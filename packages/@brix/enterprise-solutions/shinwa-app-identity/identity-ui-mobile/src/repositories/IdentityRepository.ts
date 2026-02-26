/**
 * Identity Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for identity/user data access.
 * All HTTP calls are routed through HttpCapability.
 * 
 * @module @shinwa/identity-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type {
  User,
  UserProfile,
  UserProfileUpdateRequest,
  PasswordChangeRequest
} from '@shinwa/identity-shared';

/**
 * Identity Repository Interface
 * 
 * 身份数据仓库接口
 */
export interface IdentityRepository {
  /**
   * Gets the current user profile
   * @returns Promise resolving to user profile
   */
  getCurrentUser(): Promise<User>;

  /**
   * Gets detailed user profile
   * @returns Promise resolving to user profile details
   */
  getProfile(): Promise<UserProfile>;

  /**
   * Updates user profile
   * @param request - Profile update request data
   * @returns Promise resolving to updated profile
   */
  updateProfile(request: UserProfileUpdateRequest): Promise<UserProfile>;

  /**
   * Changes user password
   * @param request - Password change request
   * @returns Promise resolving when password is changed
   */
  changePassword(request: PasswordChangeRequest): Promise<void>;

  /**
   * Uploads avatar image
   * @param imageData - Base64 encoded image data
   * @returns Promise resolving to the new avatar URL
   */
  uploadAvatar(imageData: string): Promise<string>;

  /**
   * Logs out the current user
   * @returns Promise resolving when logout is complete
   */
  logout(): Promise<void>;
}

/**
 * Creates an IdentityRepository implementation using HttpCapability
 * 
 * 工厂函数通过注入 HttpCapability 创建身份仓库实例
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns IdentityRepository implementation
 */
export function createIdentityRepository(httpCapability: HttpCapability): IdentityRepository {
  const BASE_PATH = '/api/v1/identity';

  return {
    async getCurrentUser(): Promise<User> {
      return httpCapability.get<User>(`${BASE_PATH}/me`);
    },

    async getProfile(): Promise<UserProfile> {
      return httpCapability.get<UserProfile>(`${BASE_PATH}/profile`);
    },

    async updateProfile(request: UserProfileUpdateRequest): Promise<UserProfile> {
      return httpCapability.put<UserProfile>(`${BASE_PATH}/profile`, request);
    },

    async changePassword(request: PasswordChangeRequest): Promise<void> {
      await httpCapability.post<void>(`${BASE_PATH}/password`, request);
    },

    async uploadAvatar(imageData: string): Promise<string> {
      const response = await httpCapability.post<{ avatarUrl: string }>(
        `${BASE_PATH}/avatar`,
        { image: imageData }
      );
      return response.avatarUrl;
    },

    async logout(): Promise<void> {
      await httpCapability.post<void>(`${BASE_PATH}/logout`, {});
    }
  };
}
