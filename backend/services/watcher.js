/**
 * services/watcher.js
 * Lắng nghe contract events real-time và ghi log
 */
const { gymContract, provider } = require("./contract");
const logger = require("../utils/logger");

function formatTimestamp(ts) {
  return new Date(Number(ts) * 1000).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function onMembershipPurchased(user, expiry, event) {
  logger.info("🛒 Hội viên mới mua gói tập", {
    user,
    expiry: formatTimestamp(expiry),
    txHash: event.log.transactionHash,
    block: event.log.blockNumber,
  });
}

function onMembershipRenewed(user, newExpiry, event) {
  logger.info("🔄 Hội viên gia hạn gói tập", {
    user,
    newExpiry: formatTimestamp(newExpiry),
    txHash: event.log.transactionHash,
    block: event.log.blockNumber,
  });
}

function onFeeUpdated(oldFee, newFee, event) {
  const { ethers } = require("ethers");
  logger.info("💰 Phí gói tập được cập nhật", {
    oldFeeEth: ethers.formatEther(oldFee),
    newFeeEth: ethers.formatEther(newFee),
    txHash: event.log.transactionHash,
  });
}

function onWithdrawn(owner, amount, event) {
  const { ethers } = require("ethers");
  logger.info("🏦 Owner rút tiền", {
    owner,
    amountEth: ethers.formatEther(amount),
    txHash: event.log.transactionHash,
  });
}

let watcherStarted = false;

async function startWatcher() {
  if (watcherStarted) return;
  watcherStarted = true;

  try {
    await provider.getBlockNumber();

    gymContract.on("MembershipPurchased", onMembershipPurchased);
    gymContract.on("MembershipRenewed", onMembershipRenewed);
    gymContract.on("FeeUpdated", onFeeUpdated);
    gymContract.on("Withdrawn", onWithdrawn);

    logger.info("👂 Event watcher đã khởi động — đang lắng nghe contract");
  } catch (err) {
    logger.error("Event watcher khởi động thất bại, thử lại sau 10s", {
      error: err.message,
    });
    watcherStarted = false;
    setTimeout(startWatcher, 10_000);
  }
}

function stopWatcher() {
  gymContract.removeAllListeners();
  watcherStarted = false;
  logger.info("Event watcher đã dừng");
}

module.exports = { startWatcher, stopWatcher };
