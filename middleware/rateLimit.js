/**
 * middleware/rateLimit.js
 * Rate limiting middleware để chống DDoS và abuse
 */
const rateLimit = require("express-rate-limit");

// Rate limiter cho public APIs
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests per windowMs per IP
  message: {
    error: "Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter cho admin APIs (hạn chế hơn)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Chỉ 20 requests cho admin APIs
  message: {
    error: "Quá nhiều requests admin, vui lòng thử lại sau 15 phút"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter nghiêm ngặt cho các API nhạy cảm
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Chỉ 5 requests per giờ
  message: {
    error: "API này có giới hạn rất nghiêm ngặt, vui lòng thử lại sau 1 giờ"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  publicLimiter,
  adminLimiter,
  strictLimiter
};