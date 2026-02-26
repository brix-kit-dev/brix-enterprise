/**
 * Message Module Type Definitions
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */

/**
 * Message Type Enum
 */
export enum MessageType {
  /** System notification */
  SYSTEM = 'SYSTEM',
  /** Personal message */
  PERSONAL = 'PERSONAL',
  /** Announcement */
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  /** Reminder */
  REMINDER = 'REMINDER',
  /** Marketing */
  MARKETING = 'MARKETING',
}

/**
 * Message Status Enum
 */
export enum MessageStatus {
  /** Unread */
  UNREAD = 'UNREAD',
  /** Read */
  READ = 'READ',
  /** Archived */
  ARCHIVED = 'ARCHIVED',
  /** Deleted */
  DELETED = 'DELETED',
}

/**
 * Message DTO
 */
export interface MessageDTO {
  /** Message ID */
  id: string;
  /** Message unique identifier */
  messageId: string;
  /** Tenant ID */
  tenantId: string;
  /** Sender ID */
  senderId: string;
  /** Sender name */
  senderName?: string;
  /** Receiver ID */
  receiverId: string;
  /** Receiver name */
  receiverName?: string;
  /** Message type */
  type: MessageType;
  /** Message title */
  title: string;
  /** Message content */
  content: string;
  /** Message status */
  status: MessageStatus;
  /** Business reference ID */
  referenceId?: string;
  /** Business reference type */
  referenceType?: string;
  /** Created time */
  createdAt: string;
  /** Read time */
  readAt?: string;
}

/**
 * Send Message Request
 */
export interface SendMessageRequest {
  /** Receiver ID */
  receiverId: string;
  /** Message type */
  type?: MessageType;
  /** Message title */
  title: string;
  /** Message content */
  content: string;
  /** Business reference ID */
  referenceId?: string;
  /** Business reference type */
  referenceType?: string;
}

/**
 * Page Response
 */
export interface PageResponse<T> {
  /** Data content */
  content: T[];
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Current page number */
  number: number;
  /** Page size */
  size: number;
  /** Is first page */
  first: boolean;
  /** Is last page */
  last: boolean;
}
