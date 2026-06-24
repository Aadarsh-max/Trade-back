import { placeOrder, cancelOrder, getUserOrders, getOrderById } from './order.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
  try {
    const result = await placeOrder(req.user.userId, req.body);
    const statusCode = result.trade ? 201 : 202;
    const message = result.trade ? 'Order placed and filled' : 'Order placed, pending execution';
    return new ApiResponse(statusCode, message, result).send(res);
  } catch (err) {
    next(err);
  }
};

export const cancelUserOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await cancelOrder(req.user.userId, orderId);
    return new ApiResponse(200, 'Order cancelled', order).send(res);
  } catch (err) {
    next(err);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await getUserOrders(req.user.userId, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return new ApiResponse(200, 'Orders fetched', result).send(res);
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderById(req.user.userId, orderId);
    return new ApiResponse(200, 'Order fetched', order).send(res);
  } catch (err) {
    next(err);
  }
};