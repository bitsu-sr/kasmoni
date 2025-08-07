import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // SQLite constraint errors
  if (err.message.includes('UNIQUE constraint failed')) {
    const message = 'Duplicate entry found';
    error = { message, statusCode: 400 } as AppError;
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    const message = 'Referenced record not found';
    error = { message, statusCode: 400 } as AppError;
  }

  // SQLite syntax errors
  if (err.message.includes('SQLITE_ERROR')) {
    const message = 'Database error occurred';
    error = { message, statusCode: 500 } as AppError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
}; 