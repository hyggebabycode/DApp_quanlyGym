/**
 * controllers/admin.controller.js
 * Xử lý nghiệp vụ Admin — cần ví owner trong .env
 */
const { gymContract, ethers, provider } = require("../services/contract");
const cache = require("../utils/cache");
const { BlockchainError } = require("../utils/errors");

// ─── GET /api/admin/balance ───────────────────────────────────
async function getBalance(req, res, next) {
  try {
    const balance = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    res.json({
      balanceWei: balance.toString(),
      balanceEth: ethers.formatEther(balance),
    });
  } catch (err) {
    next(new BlockchainError("Không lấy được số dư contract", err));
  }
}

// ─── GET /api/events ──────────────────────────────────────────
async function getEvents(req, res, next) {
  try {
    const events = await cache.getOrFetch(
      "events:all",
      async () => {
        const [purchased, renewed, feeUpdated, withdrawn] = await Promise.all([
          gymContract.queryFilter(
            gymContract.filters.MembershipPurchased(),
            0,
            "latest",
          ),
          gymContract.queryFilter(
            gymContract.filters.MembershipRenewed(),
            0,
            "latest",
          ),
          gymContract.queryFilter(gymContract.filters.FeeUpdated(), 0, "latest"),
          gymContract.queryFilter(gymContract.filters.Withdrawn(), 0, "latest"),
        ]);

        const format = (evts, type) =>
          evts.map((e) => ({
            type,
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
            data: Object.fromEntries(
              Object.entries(e.args).filter(([k]) => isNaN(k)),
            ),
          }));

        return [
          ...format(purchased, "MembershipPurchased"),
          ...format(renewed, "MembershipRenewed"),
          ...format(feeUpdated, "FeeUpdated"),
          ...format(withdrawn, "Withdrawn"),
        ].sort((a, b) => b.blockNumber - a.blockNumber);
      },
      20, // cache 20s
    );

    res.json({ total: events.length, events });
  } catch (err) {
    next(new BlockchainError("Không lấy được lịch sử events", err));
  }
}

// ─── POST /api/admin/withdraw ─────────────────────────────────
async function withdraw(req, res, next) {
  try {
    const balanceBefore = await provider.getBalance(
      process.env.CONTRACT_ADDRESS,
    );

    if (balanceBefore === 0n) {
      return res.status(400).json({ error: "Contract không có ETH để rút" });
    }

    const tx = await gymContract.withdraw();
    const receipt = await tx.wait();

    // Xóa cache liên quan
    cache.del("events:all");

    res.json({
      message: "Rút tiền thành công!",
      amountEth: ethers.formatEther(balanceBefore),
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    });
  } catch (err) {
    next(new BlockchainError("Rút tiền thất bại", err));
  }
}

// ─── POST /api/admin/set-fee ──────────────────────────────────
async function setFee(req, res, next) {
  try {
    const { feeEth } = req.body;
    const feeWei = ethers.parseEther(String(feeEth));

    const tx = await gymContract.setMembershipFee(feeWei);
    const receipt = await tx.wait();

    // Xóa cache fee cũ
    cache.del("fee");

    res.json({
      message: `Đã cập nhật phí gói tập thành ${feeEth} ETH`,
      txHash: receipt.hash,
    });
  } catch (err) {
    next(new BlockchainError("Cập nhật phí thất bại", err));
  }
}

// ─── POST /api/admin/renew ─────────────────────────────────────
async function renewMember(req, res, next) {
  try {
    const { address } = req.body;

    const fee = await gymContract.membershipFee();
    const tx = await gymContract.adminRenewMembership(address, { value: fee });
    const receipt = await tx.wait();

    const [newExpiry] = await gymContract.getMemberStatus(address);

    // Invalidate cache hội viên đó + danh sách + events
    cache.del(`member:${address.toLowerCase()}`);
    cache.del("members:all");
    cache.del("events:all");

    res.json({
      message: `Đã gia hạn gói tập cho ${address}`,
      newExpiry: new Date(Number(newExpiry) * 1000).toLocaleString("vi-VN"),
      paidEth: ethers.formatEther(fee),
      txHash: receipt.hash,
    });
  } catch (err) {
    next(new BlockchainError("Gia hạn gói tập thất bại", err));
  }
}

module.exports = { getBalance, getEvents, withdraw, setFee, renewMember };
