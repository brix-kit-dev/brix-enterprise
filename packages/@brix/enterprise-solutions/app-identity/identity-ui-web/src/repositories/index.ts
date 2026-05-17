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
 * @file Repository layer unified entry
 * @description Frontend-backend separation architecture API abstraction layer
 * @module identity-ui-web/repositories
 * @version 3.2.0
 * 
 * v3.2 Architecture Notes:
 * Repository layer is a core component of the frontend-backend separation architecture:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  UI Layer (pages/, components/)                                │
 * │    ↓ uses hooks                                                │
 * │  ViewModel Layer (hooks/)                                      │
 * │    ↓ calls repository                                          │
 * │  Repository Layer (repositories/)  ← This module               │
 * │    ↓ uses capability                                           │
 * │  HttpCapability (provided by Shell)                            │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Layer Responsibilities:
 * - UI Layer: Pure rendering, no business logic
 * - ViewModel Layer: State management + business orchestration
 * - Repository Layer: API abstraction, encapsulates backend interaction details
 * 
 * Change Triggers:
 * - When backend API address/format changes, only modify Repository layer
 * - ViewModel and UI layers remain unaffected
 * 
 * @see v3.2-detailed-transformation-plan.md Phase 5: Frontend-backend separation refactoring
 */

// User Repository
export { 
  createUserRepository,
  type UserRepository,
  type UserQueryParams,
} from './UserRepository';

// Role Repository
export {
  createRoleRepository,
  type RoleRepository,
  type Role,
  type CreateRoleParams,
  type UpdateRoleParams,
} from './RoleRepository';

// Organization Repository
export {
  createOrganizationRepository,
  type OrganizationRepository,
} from './OrganizationRepository';
