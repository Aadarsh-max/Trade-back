import { getIO } from './socket.server.js';

export const notifyOrderFilled = (userId, orderData) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('order:filled', orderData);
};

export const notifyOrderRejected = (userId, orderData) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('order:rejected', orderData);
};