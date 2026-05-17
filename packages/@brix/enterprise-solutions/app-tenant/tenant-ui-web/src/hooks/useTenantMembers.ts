/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview useTenantMembers - ViewModel Hook for Member Management Page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../repositories';
import type { 
  TenantMemberDTO, 
  MemberListQuery,
  InviteMemberRequest,
  UpdateMemberRequest,
  MemberStatus,
  PagedResponse,
} from '@brix-sdk/tenant-shared';
import { TenantEvents } from '@brix-sdk/tenant-shared';

/**
 * Tenant Members ViewModel State
 */
export interface TenantMembersState {
  /** Member list */
  members: TenantMemberDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total count */
  total: number;
  /** Total pages */
  totalPages: number;
  /** Search keyword */
  keyword: string;
  /** Status filter */
  statusFilter: MemberStatus | null;
  /** Invite dialog state */
  isInviteDialogOpen: boolean;
  /** Invite loading */
  isInviting: boolean;
}

/**
 * Tenant Members ViewModel Actions
 */
export interface TenantMembersActions {
  /** Refresh member list */
  refresh: () => Promise<void>;
  /** Change page */
  setPage: (page: number) => void;
  /** Change page size */
  setPageSize: (pageSize: number) => void;
  /** Search */
  search: (keyword: string) => void;
  /** Filter by status */
  filterByStatus: (status: MemberStatus | null) => void;
  /** Open invite dialog */
  openInviteDialog: () => void;
  /** Close invite dialog */
  closeInviteDialog: () => void;
  /** Invite a member */
  inviteMember: (request: InviteMemberRequest) => Promise<void>;
  /** Update member */
  updateMember: (memberId: string, request: UpdateMemberRequest) => Promise<void>;
  /** Remove member */
  removeMember: (memberId: string) => Promise<void>;
  /** Resend invitation */
  resendInvitation: (memberId: string) => Promise<void>;
  /** Navigate back to tenant detail */
  goBack: () => void;
}

/**
 * useTenantMembers Hook - ViewModel for Member Management Page
 * 
 * @param tenantId - Tenant ID
 */
export function useTenantMembers(tenantId: string): { state: TenantMembersState; actions: TenantMembersActions } {
  // =========================================
  // Capabilities
  // =========================================
  const http = useHttp();
  const eventBus = useEventBus();
  const { requestNavigate } = useNavigation();
  
  // =========================================
  // Repository
  // =========================================
  const repository = useMemo(() => createTenantAdminRepository(http), [http]);
  
  // =========================================
  // State
  // =========================================
  const [members, setMembers] = useState<TenantMemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // =========================================
  // Data Fetching
  // =========================================
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query: MemberListQuery = {
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      };
      
      const response: PagedResponse<TenantMemberDTO> = await repository.getMembers(tenantId, query);
      
      setMembers(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  }, [repository, tenantId, page, pageSize, keyword, statusFilter]);
  
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);
  
  // =========================================
  // Event Subscriptions
  // =========================================
  useEffect(() => {
    const handleMemberEvent = (event: { payload: { tenantId: string } }) => {
      if (event.payload.tenantId === tenantId) {
        fetchMembers();
      }
    };
    
    const unsubscribes = [
      eventBus.on(TenantEvents.MEMBER_INVITED, handleMemberEvent),
      eventBus.on(TenantEvents.MEMBER_JOINED, handleMemberEvent),
      eventBus.on(TenantEvents.MEMBER_REMOVED, handleMemberEvent),
      eventBus.on(TenantEvents.MEMBER_ROLE_CHANGED, handleMemberEvent),
    ];
    
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [eventBus, tenantId, fetchMembers]);
  
  // =========================================
  // Actions
  // =========================================
  const actions: TenantMembersActions = useMemo(() => ({
    refresh: fetchMembers,
    
    setPage: (newPage: number) => setPage(newPage),
    
    setPageSize: (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage(1);
    },
    
    search: (newKeyword: string) => {
      setKeyword(newKeyword);
      setPage(1);
    },
    
    filterByStatus: (status: MemberStatus | null) => {
      setStatusFilter(status);
      setPage(1);
    },
    
    openInviteDialog: () => setIsInviteDialogOpen(true),
    
    closeInviteDialog: () => setIsInviteDialogOpen(false),
    
    inviteMember: async (request: InviteMemberRequest) => {
      setIsInviting(true);
      try {
        await repository.inviteMember(tenantId, request);
        eventBus.emit({ type: TenantEvents.MEMBER_INVITED, payload: { tenantId, email: request.email } });
        setIsInviteDialogOpen(false);
      } finally {
        setIsInviting(false);
      }
    },
    
    updateMember: async (memberId: string, request: UpdateMemberRequest) => {
      try {
        await repository.updateMember(tenantId, memberId, request);
        if (request.roles) {
          eventBus.emit({ type: TenantEvents.MEMBER_ROLE_CHANGED, payload: { tenantId, memberId } });
        }
      } catch (err) {
        throw err;
      }
    },
    
    removeMember: async (memberId: string) => {
      try {
        await repository.removeMember(tenantId, memberId);
        eventBus.emit({ type: TenantEvents.MEMBER_REMOVED, payload: { tenantId, memberId } });
      } catch (err) {
        throw err;
      }
    },
    
    resendInvitation: async (memberId: string) => {
      try {
        await repository.resendInvitation(tenantId, memberId);
      } catch (err) {
        throw err;
      }
    },
    
    goBack: () => {
      requestNavigate(`/admin/tenants/${tenantId}`);
    },
  }), [fetchMembers, repository, tenantId, eventBus, requestNavigate]);
  
  // =========================================
  // Return ViewModel
  // =========================================
  const state: TenantMembersState = {
    members,
    isLoading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    keyword,
    statusFilter,
    isInviteDialogOpen,
    isInviting,
  };
  
  return { state, actions };
}

export default useTenantMembers;
