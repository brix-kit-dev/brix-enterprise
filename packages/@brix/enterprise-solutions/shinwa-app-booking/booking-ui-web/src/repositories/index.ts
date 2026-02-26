/**
 * @file Repository layer unified entry point
 * @description API abstraction layer for frontend-backend separation architecture
 * @module booking-ui-web/repositories
 * @version 3.2.0
 * 
 * [v3.2 Architecture Notes]
 * Repository layer is a core component of frontend-backend separation architecture:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  UI Layer (pages/, components/)                                │
 * │    ↓ uses hooks                                                │
 * │  ViewModel Layer (hooks/)                                      │
 * │    ↓ calls repository                                          │
 * │  Repository Layer (repositories/)  ← This module                │
 * │    ↓ uses capability                                           │
 * │  HttpCapability (Shell provided)                                │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * [Layer Responsibilities]
 * - Repository layer: API abstraction, encapsulates backend interaction details
 * 
 * [Change Triggers]
 * - When backend API address/format changes, only Repository layer needs modification
 * - ViewModel and UI layers remain unaffected
 * 
 * @see v3.2-detailed-refactoring-plan.md Phase 5: Frontend-Backend Separation Refactoring
 */

// Booking Repository
export { 
  createBookingRepository,
  type BookingRepository,
  type BookingQueryParams,
} from './BookingRepository';

// Resource Repository
export {
  createResourceRepository,
  type ResourceRepository,
} from './ResourceRepository';
