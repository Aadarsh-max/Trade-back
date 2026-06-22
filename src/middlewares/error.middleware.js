import { ApiError } from '../utils/apiError.js';

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    details: err.details || null,
  });
};

export const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};