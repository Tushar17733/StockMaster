// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
        error: 'Duplicate key violation'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Database error',
      error: err.message
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};