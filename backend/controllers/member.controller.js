/**
 * controllers/member.controller.js
 * Xử lý nghiệp vụ cho các API liên quan hội viên (read-only)
 */
const { gymContract, ethers } = require("../services/contract");
const cache = require("../utils/cache");
const { BlockchainError } = require("../utils/errors");

const MEMBERSHIP_READ_ABI = [
  "function getMembershipPlan(uint8 _type) view returns (tuple(uint256 price, uint256 durationDays))",
];

const PACKAGE_FEATURES = {
  basic: [
    "Truy cập mọi khung giờ",
    "Tủ đồ riêng",
    "2 buổi PT miễn phí",
    "Gửi xe miễn phí",
  ],
  pro: [
    "Ưu tiên máy tập",
    "Tủ đồ riêng VIP",
    "5 buổi PT miễn phí",
    "Tư vấn dinh dưỡng",
    "Nước uống miễn phí",
  ],
  vip: [
    "Phòng tập riêng biệt",
    "PT kèm 1-1 hàng ngày",
    "Xông hơi & Bể bơi",
    "Massage sau tập",
    "Trái cây & Whey",
  ],
};

// TTL cache (giây)
const TTL = { FEE: 60, MEMBER: 20, MEMBERS: 30 };

// ─── GET /api/fee ────────────────────────────────────────────
async function getFee(req, res, next) {
  try {
    const fee = await cache.getOrFetch(
      "fee",
      () => gymContract.membershipFee(),
      TTL.FEE,
    );

    res.json({
      feeWei: fee.toString(),
      feeEth: ethers.formatEther(fee),
    });
  } catch (err) {
    next(new BlockchainError("Không lấy được phí gói tập", err));
  }
}

// ─── GET /api/member/:address ─────────────────────────────────
async function getMember(req, res, next) {
  try {
    const { address } = req.params;
    const cacheKey = `member:${address.toLowerCase()}`;

    const [expiry, active] = await cache.getOrFetch(
      cacheKey,
      () => gymContract.getMemberStatus(address),
      TTL.MEMBER,
    );

    const expiryTimestamp = Number(expiry);
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = active ? Math.ceil((expiryTimestamp - now) / 86400) : 0;

    res.json({
      address,
      isActive: active,
      expiryTimestamp,
      expiryDate:
        expiryTimestamp > 0
          ? new Date(expiryTimestamp * 1000).toLocaleString("vi-VN")
          : "Chưa có gói",
      daysLeft: Math.max(0, daysLeft),
    });
  } catch (err) {
    next(new BlockchainError("Không lấy được trạng thái hội viên", err));
  }
}

// ─── GET /api/members ─────────────────────────────────────────
async function getMembers(req, res, next) {
  try {
    const members = await cache.getOrFetch(
      "members:all",
      async () => {
        const filter = gymContract.filters.MembershipPurchased();
        const events = await gymContract.queryFilter(filter, 0, "latest");

        // Deduplicate — giữ lần mua mới nhất mỗi địa chỉ
        const seen = new Set();
        const unique = events
          .slice()
          .reverse()
          .filter((e) => {
            const addr = e.args.user.toLowerCase();
            if (seen.has(addr)) return false;
            seen.add(addr);
            return true;
          });

        return Promise.all(
          unique.map(async (e) => {
            const address = e.args.user;
            const [expiry, active] = await gymContract.getMemberStatus(address);
            return {
              address,
              isActive: active,
              expiryDate: new Date(Number(expiry) * 1000).toLocaleString(
                "vi-VN",
              ),
              txHash: e.transactionHash,
            };
          }),
        );
      },
      TTL.MEMBERS,
    );

    res.json({ total: members.length, members });
  } catch (err) {
    next(new BlockchainError("Không lấy được danh sách hội viên", err));
  }
}

// ─── GET /api/packages ───────────────────────────────────────
async function getPackages(req, res, next) {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const readContract = new ethers.Contract(
      contractAddress,
      MEMBERSHIP_READ_ABI,
      gymContract.runner,
    );

    const [standardPlan, vipPlan] = await Promise.all([
      readContract.getMembershipPlan(0),
      readContract.getMembershipPlan(1),
    ]);

    const packages = [
      {
        id: 1,
        slug: "basic",
        name: "Gói Cơ Bản",
        price: `${ethers.formatEther(standardPlan.price)} TEST`,
        features: PACKAGE_FEATURES.basic,
        color: "border-slate-200",
        image_url: "",
        is_active: true,
      },
      {
        id: 2,
        slug: "pro",
        name: "Gói Chuyên Nghiệp",
        price: `${ethers.formatEther(vipPlan.price)} TEST`,
        features: PACKAGE_FEATURES.pro,
        color: "border-orange-200",
        image_url: "",
        is_active: true,
      },
      {
        id: 3,
        slug: "vip",
        name: "Gói VIP",
        price: `${ethers.formatEther(vipPlan.price)} TEST`,
        features: PACKAGE_FEATURES.vip,
        color: "border-yellow-200",
        image_url: "",
        is_active: true,
      },
    ];

    res.json({ packages });
  } catch (err) {
    const fallbackPackages = [
      {
        id: 1,
        slug: "basic",
        name: "Gói Cơ Bản",
        price: "0.5 TEST",
        features: PACKAGE_FEATURES.basic,
        color: "border-slate-200",
        image_url: "",
        is_active: true,
      },
      {
        id: 2,
        slug: "pro",
        name: "Gói Chuyên Nghiệp",
        price: "1 TEST",
        features: PACKAGE_FEATURES.pro,
        color: "border-orange-200",
        image_url: "",
        is_active: true,
      },
      {
        id: 3,
        slug: "vip",
        name: "Gói VIP",
        price: "1 TEST",
        features: PACKAGE_FEATURES.vip,
        color: "border-yellow-200",
        image_url: "",
        is_active: true,
      },
    ];

    res.json({
      packages: fallbackPackages,
      warning: "Không đọc được giá on-chain, đã dùng giá fallback 0.5/1 TEST.",
    });
  }
}

module.exports = { getFee, getMember, getMembers, getPackages };
