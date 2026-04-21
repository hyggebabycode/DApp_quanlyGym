/**
 * routes/member.routes.js
 * Public routes — tra cứu phí và trạng thái hội viên
 */
const router = require("express").Router();
const { publicLimiter } = require("../middleware/rateLimit");
const { validateAddress } = require("../middleware/validate");
const {
  getFee,
  getMember,
  getMembers,
  getPackages,
} = require("../controllers/member.controller");

// Áp dụng rate limiting cho tất cả routes trong file này
router.use(publicLimiter);

// GET /api/fee
router.get("/fee", getFee);

// GET /api/members
router.get("/members", getMembers);

// GET /api/packages
router.get("/packages", getPackages);

// GET /api/member/:address
router.get("/member/:address", validateAddress, getMember);

module.exports = router;
