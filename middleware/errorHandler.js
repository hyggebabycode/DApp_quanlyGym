// middleware/errorHandler.js
const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Lỗi server không xác định";

  logger.error(`[${status}] ${message}`, {
    path: req.path,
    method: req.method,
    ...(err.originalError && { cause: err.originalError.message }),
  });

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
