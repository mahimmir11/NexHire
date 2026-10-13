import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;
    const isReadFilter = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

    const where: any = {
      recipientId: req.user!.id,
    };

    if (isReadFilter !== undefined) {
      where.isRead = isReadFilter;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { recipientId: req.user!.id, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: error.message,
    });
  }
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: req.user!.id,
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread notification count.',
      error: error.message,
    });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const notificationId = parseInt(req.params.id as string, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID format.' });
      return;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    // IDOR check: must belong to authenticated user
    if (notification.recipientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your own notifications.',
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message,
    });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} notification(s) marked as read.`,
      data: { updatedCount: result.count },
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
      error: error.message,
    });
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const notificationId = parseInt(req.params.id as string, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID format.' });
      return;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    // IDOR check
    if (notification.recipientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own notifications.',
      });
      return;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.status(200).json({
      success: true,
      message: 'Notification dismissed successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification.',
      error: error.message,
    });
  }
}
