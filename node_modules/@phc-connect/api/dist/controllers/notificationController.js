"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const dataStore_1 = require("../db/dataStore");
class NotificationController {
    static async getNotifications(req, res) {
        const patientId = req.query.patientId || req.user?.patientId || 'pat-0001';
        const notifs = dataStore_1.DataStore.notifications.filter((n) => !n.patientId || n.patientId === patientId || n.userId === req.user?.id);
        res.status(200).json({
            success: true,
            notifications: notifs,
            unreadCount: notifs.filter((n) => !n.read).length,
        });
    }
    static async markAsRead(req, res) {
        const { id } = req.params;
        if (id === 'all') {
            const patientId = req.user?.patientId || 'pat-0001';
            dataStore_1.DataStore.notifications.forEach((n) => {
                if (!n.patientId || n.patientId === patientId) {
                    n.read = true;
                }
            });
            res.status(200).json({ success: true, message: 'All notifications marked as read.' });
            return;
        }
        const notif = dataStore_1.DataStore.notifications.find((n) => n.id === id);
        if (notif) {
            notif.read = true;
        }
        res.status(200).json({ success: true, message: 'Notification marked as read.' });
    }
}
exports.NotificationController = NotificationController;
