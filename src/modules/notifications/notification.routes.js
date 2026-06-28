import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from './notification.service.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await getNotifications(req.user.userId, { page, limit });
    return new ApiResponse(200, 'Notifications fetched', result).send(res);
  } catch (err) {
    next(err);
  }
});

router.patch('/:notificationId/read', async (req, res, next) => {
  try {
    const notification = await markAsRead(req.user.userId, req.params.notificationId);
    return new ApiResponse(200, 'Notification marked as read', notification).send(res);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await markAllAsRead(req.user.userId);
    return new ApiResponse(200, 'All notifications marked as read').send(res);
  } catch (err) {
    next(err);
  }
});

export default router;