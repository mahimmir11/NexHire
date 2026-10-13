import { prisma } from '../config/database.js';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  recipientId: number;
  title: string;
  message: string;
  type?: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
}

export const notificationService = {
  /**
   * Create an in-app notification for a user
   */
  async notify(params: CreateNotificationParams) {
    try {
      return await prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          title: params.title,
          message: params.message,
          type: params.type || NotificationType.GENERAL,
          relatedEntityType: params.relatedEntityType || null,
          relatedEntityId: params.relatedEntityId || null,
          actionUrl: params.actionUrl || null,
        },
      });
    } catch (error) {
      // Soft-fail notification to not break the primary business transaction
      console.error('Failed to create notification:', error);
      return null;
    }
  },

  /**
   * Broadcast notification to all active users with specific role(s)
   */
  async notifyRole(roles: Array<'SUPER_ADMIN' | 'PLACEMENT_ADMIN'>, title: string, message: string, actionUrl?: string) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: roles }, isActive: true },
        select: { id: true },
      });

      const promises = admins.map((admin) =>
        prisma.notification.create({
          data: {
            recipientId: admin.id,
            title,
            message,
            type: NotificationType.SYSTEM,
            actionUrl: actionUrl || null,
          },
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to broadcast notification to role:', error);
    }
  },
};
