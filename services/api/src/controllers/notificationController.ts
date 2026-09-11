import { Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  public static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const patientId = req.query.patientId as string || req.user?.patientId || 'pat-0001';
    const notifs = DataStore.notifications.filter(
      (n) => !n.patientId || n.patientId === patientId || n.userId === req.user?.id
    );

    res.status(200).json({
      success: true,
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.read).length,
    });
  }

  public static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (id === 'all') {
      const patientId = req.user?.patientId || 'pat-0001';
      DataStore.notifications.forEach((n) => {
        if (!n.patientId || n.patientId === patientId) {
          n.read = true;
        }
      });
      res.status(200).json({ success: true, message: 'All notifications marked as read.' });
      return;
    }

    const notif = DataStore.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  }
}
