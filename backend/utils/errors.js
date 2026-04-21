/**
 * backend/utils/errors.js
 * Custom error classes — giúp phân biệt loại lỗi và trả HTTP status đúng
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Không có quyền truy cập") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Bị từ chối truy cập") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy") {
    super(message, 404);
  }
}

class BlockchainError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502);
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BlockchainError,
};
