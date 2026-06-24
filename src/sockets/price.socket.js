import { getIO } from './socket.server.js';

export const broadcastPriceUpdate = (symbol, quote) => {
  const io = getIO();
  io.to(`symbol:${symbol.toUpperCase()}`).emit('price:update', quote);
};