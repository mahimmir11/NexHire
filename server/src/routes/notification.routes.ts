import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';

export const notificationRouter = Router();

// Get current user's notifications with pagination
notificationRouter.get('/', authenticateUser, getMyNotifications);
notificationRouter.get('/my-notifications', authenticateUser, getMyNotifications);

// Fast unread count for bell badges
notificationRouter.get('/unread-count', authenticateUser, getUnreadCount);

// Mark all as read
notificationRouter.put('/mark-all-read', authenticateUser, markAllAsRead);

// Mark single notification as read
notificationRouter.put('/:id/read', authenticateUser, markAsRead);

// Delete/dismiss notification
notificationRouter.delete('/:id', authenticateUser, deleteNotification);
