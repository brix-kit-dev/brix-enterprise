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
 * Message Module route names and parameters, apart from the navigator: the screens name routes, and the
 * navigator imports the screens, so the names cannot live in navigation.tsx without an import cycle
 * (standard-link plan queue item 16, 16i2, D145).
 *
 * @author Brix Team
 * @since 3.0.0
 */

/**
 * Route name constants
 */
export const MessengerRoutes = {
  Inbox: 'Inbox',
  MessageDetail: 'MessageDetail',
  Compose: 'Compose',
} as const;

/**
 * Route parameter types
 */
export type MessengerStackParamList = {
  [MessengerRoutes.Inbox]: undefined;
  [MessengerRoutes.MessageDetail]: { messageId: string };
  [MessengerRoutes.Compose]: { receiverId?: string } | undefined;
};
