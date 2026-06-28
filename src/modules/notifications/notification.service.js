import mongoose from '../../config/mongo.config.js';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export const createNotification = async ({ userId, type, title, message }) => {
  const notification = await NotificationModel.create({ userId, type, title, message });
  return notification;
};

export const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    NotificationModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationModel.countDocuments({ userId }),
    NotificationModel.countDocuments({ userId, read: false }),
  ]);

  return { notifications, total, unreadCount, page, limit };
};

export const markAsRead = async (userId, notificationId) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
  return notification;
};

export const markAllAsRead = async (userId) => {
  await NotificationModel.updateMany({ userId, read: false }, { read: true });
};