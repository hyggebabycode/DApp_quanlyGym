/**
 * server.js
 * Entry point — khởi động Express và event watcher
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { provider } = require("./services/contract");
const { startWatcher, stopWatcher } = require("./services/watcher");
const memberRoutes = require("./routes/member.routes");
const adminRoutes = require("./routes/admin.routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
app.use(cors());
app.use(express.json());

// ════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════
app.get("/health", async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({
      status: "ok",
      blockNumber,
      contract: process.env.CONTRACT_ADDRESS,
      rpc: process.env.RPC_URL,
    });
  } catch (err) {
    res.status(503).json({ status: "error", error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════
app.use("/api", memberRoutes); // GET /api/fee, /api/member/:addr, /api/members
app.use("/api/admin", adminRoutes); // GET /api/admin/balance, /api/admin/events, POST /api/admin/*

// ════════════════════════════════════════════════════════════
// 404
// ════════════════════════════════════════════════════════════
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Route không tồn tại: ${req.method} ${req.path}` });
});

// ════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER (phải đặt CUỐI CÙNG)
// ════════════════════════════════════════════════════════════
app.use(errorHandler);

// ════════════════════════════════════════════════════════════
// START SERVER (chỉ khi chạy trực tiếp)
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 Backend Gym DApp chạy tại http://localhost:${PORT}`);
    logger.info(`📋 Contract : ${process.env.CONTRACT_ADDRESS}`);
    logger.info(`🔗 RPC      : ${process.env.RPC_URL}`);
    startWatcher();
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    stopWatcher();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    stopWatcher();
    process.exit(0);
  });
}

module.exports = app;
