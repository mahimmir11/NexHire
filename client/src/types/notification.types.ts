export type NotificationType =
  | 'APPLICATION_UPDATE'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER_RELEASED'
  | 'DEADLINE_ALERT'
  | 'GENERAL'
  | 'SYSTEM';

export interface AppNotification {
  id: number;
  recipientId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  actionUrl: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: NotificationPagination;
}
