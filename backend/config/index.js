/**
 * config/index.js
 * Centralized configuration management
 */
require("dotenv").config();

const config = {
  // Server config
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || "development",
  },

  // Blockchain config
  blockchain: {
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
  },

  // Cache config
  cache: {
    fee: { ttl: 60 },      // 1 phút
    member: { ttl: 20 },   // 20 giây
    members: { ttl: 30 },  // 30 giây
    events: { ttl: 20 },   // 20 giây
  },

  // Rate limiting config
  rateLimit: {
    public: {
      windowMs: 15 * 60 * 1000, // 15 phút
      max: 100, // 100 requests per window
    },
    admin: {
      windowMs: 15 * 60 * 1000, // 15 phút
      max: 20, // 20 requests per window
    },
    strict: {
      windowMs: 60 * 60 * 1000, // 1 giờ
      max: 5, // 5 requests per window
    },
  },

  // Logging config
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  // Validation config
  validation: {
    maxFeeEth: 10, // Maximum fee in ETH
    minFeeEth: 0.0001, // Minimum fee in ETH
  },
};

// Validation
const requiredEnvVars = ["RPC_URL", "PRIVATE_KEY", "CONTRACT_ADDRESS"];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`);
  }
}

module.exports = config;