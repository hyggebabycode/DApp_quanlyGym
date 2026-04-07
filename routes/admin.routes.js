/**
 * routes/admin.routes.js
 * Admin routes — yêu cầu ví owner trong .env (không cần auth middleware
 * vì chỉ owner mới có PRIVATE_KEY hợp lệ để ký transaction)
 */
const router = require("express").Router();
const { adminLimiter, strictLimiter } = require("../middleware/rateLimit");
const {
  validateFeeBody,
  validateAddressBody,
} = require("../middleware/validate");
const {
  getBalance,
  getEvents,
  withdraw,
  setFee,
  renewMember,
} = require("../controllers/admin.controller");

// Áp dụng rate limiting cho admin routes
router.use(adminLimiter);

// GET /api/admin/balance    — số dư ETH trong contract
router.get("/balance", getBalance);

// GET /api/events           — lịch sử tất cả events
router.get("/events", getEvents);

// POST /api/admin/withdraw  — rút ETH về ví owner
router.post("/withdraw", strictLimiter, withdraw);

// POST /api/admin/set-fee   — cập nhật phí gói tập
// body: { feeEth: "0.05" }
router.post("/set-fee", validateFeeBody, setFee);

// POST /api/admin/renew     — admin gia hạn cho 1 hội viên
// body: { address: "0x..." }
router.post("/renew", validateAddressBody, renewMember);

module.exports = router;
