const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "powergym-dev-secret";
const RPC_URL =
  process.env.RPC_URL || "https://testnet.sapphire.oasis.dev";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_WALLET_ADDRESS = normalizeAddress(
  process.env.ADMIN_WALLET_ADDRESS ||
    "0xC91DD3d721f7146e4DC759716b158546F2a4E551",
);

const CHAIN_CONFIG = {
  chainId: 23295,
  chainIdHex: "0x5aff",
  chainName: "Oasis Sapphire Testnet",
  rpcUrl: "https://testnet.sapphire.oasis.dev",
  explorerUrl: "https://explorer.oasis.io/testnet/sapphire",
  currencySymbol: "TEST",
};

const MEMBERSHIP_TYPE_BY_SLUG = {
  basic: 0,
  pro: 1,
  vip: 1,
};

const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function treasuryWallet() view returns (address)",
  "function getMembershipPlan(uint8 _type) view returns (tuple(uint256 price, uint256 durationDays))",
  "function registerMember(string _name, uint8 _type) payable",
  "function getMemberInfo(address _memberAddress) view returns (tuple(address memberAddress, string name, uint8 membershipType, uint256 registrationDate, uint256 expiryDate, uint256 totalAttendance, bool isActive))",
  "function isMember(address _memberAddress) view returns (bool)",
  "function isMembershipValid(address _memberAddress) view returns (bool)",
  "function getTotalMembers() view returns (uint256)",
  "function getTotalRevenue() view returns (uint256)",
  "event MemberRegistered(address indexed memberAddress, string name, uint8 indexed membershipType)",
  "event MembershipRenewed(address indexed memberAddress, uint8 indexed membershipType, uint256 newExpiryDate)",
  "event PaymentReceived(address indexed memberAddress, uint256 amount, uint8 membershipType)",
];

const contractInterface = new ethers.Interface(CONTRACT_ABI);
const provider = new ethers.JsonRpcProvider(RPC_URL);
const walletChallenges = new Map();

const db = new sqlite3.Database("./members.db", (error) => {
  if (error) {
    console.error("Failed to open SQLite database:", error.message);
    process.exit(1);
  }
});

app.use(cors());
app.use(express.json({ limit: "4mb" }));

function normalizeAddress(value) {
  if (!value) {
    return "";
  }

  try {
    return ethers.getAddress(value);
  } catch (error) {
    return "";
  }
}

function parseJsonList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function serializePackage(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    is_active: Boolean(row.is_active),
    features: parseJsonList(row.features),
    image_url: row.image_url || "",
  };
}

function serializeTrainer(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    is_active: Boolean(row.is_active),
    specialties: parseJsonList(row.specialties),
    image_url: row.image_url || "",
    package_slug: row.package_slug || "",
  };
}

function serializeMember(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    current_package_features: parseJsonList(row.current_package_features),
  };
}

function createJwt(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function createWalletMessage({ walletAddress, nonce, purpose }) {
  const action =
    purpose === "link" ? "link your wallet" : "log in to PowerGym";

  return [
    "PowerGym Authentication",
    "",
    `Wallet: ${walletAddress}`,
    `Purpose: ${action}`,
    `Nonce: ${nonce}`,
    "This signature does not spend funds.",
  ].join("\n");
}

function rememberWalletChallenge(walletAddress, purpose, userId = null) {
  const normalizedWallet = normalizeAddress(walletAddress);
  if (!normalizedWallet) {
    throw new Error("Invalid wallet address");
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const message = createWalletMessage({
    walletAddress: normalizedWallet,
    nonce,
    purpose,
  });

  walletChallenges.set(`${purpose}:${normalizedWallet}`, {
    nonce,
    purpose,
    message,
    userId,
    expiresAt,
  });

  return { message, nonce, expiresAt };
}

function consumeWalletChallenge(walletAddress, purpose) {
  const normalizedWallet = normalizeAddress(walletAddress);
  const key = `${purpose}:${normalizedWallet}`;
  const challenge = walletChallenges.get(key);
  walletChallenges.delete(key);

  if (!challenge) {
    return null;
  }

  if (challenge.expiresAt < Date.now()) {
    return null;
  }

  return challenge;
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row || null);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows || []);
    });
  });
}

async function ensureColumns(tableName, columnDefinitions) {
  const rows = await dbAll(`PRAGMA table_info(${tableName})`);
  const existing = new Set(rows.map((row) => row.name));

  for (const [columnName, definition] of columnDefinitions) {
    if (!existing.has(columnName)) {
      await dbRun(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }
}

async function initializeDatabase() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT DEFAULT '',
      role TEXT DEFAULT 'member',
      metamask_address TEXT UNIQUE,
      current_package_slug TEXT,
      current_package_name TEXT,
      current_package_price TEXT,
      current_package_features TEXT,
      package_status TEXT DEFAULT 'inactive',
      package_updated_at DATETIME,
      wallet_verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureColumns("members", [
    ["full_name", "TEXT DEFAULT ''"],
    ["wallet_verified_at", "DATETIME"],
  ]);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      features TEXT NOT NULL,
      color TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureColumns("packages", [
    ["color", "TEXT DEFAULT ''"],
    ["image_url", "TEXT DEFAULT ''"],
    ["is_active", "INTEGER DEFAULT 1"],
  ]);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL,
      package_slug TEXT DEFAULT '',
      experience TEXT NOT NULL,
      bio TEXT NOT NULL,
      specialties TEXT NOT NULL,
      achievement TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureColumns("trainers", [
    ["package_slug", "TEXT DEFAULT ''"],
    ["image_url", "TEXT DEFAULT ''"],
    ["is_active", "INTEGER DEFAULT 1"],
  ]);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      package_slug TEXT DEFAULT '',
      package_name TEXT NOT NULL,
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureColumns("contact_messages", [
    ["email", "TEXT DEFAULT ''"],
    ["package_slug", "TEXT DEFAULT ''"],
    ["status", "TEXT DEFAULT 'new'"],
  ]);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS package_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      package_slug TEXT NOT NULL,
      package_name TEXT NOT NULL,
      package_price TEXT NOT NULL,
      package_features TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);
  await ensureColumns("package_requests", [
    ["updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
    ["package_features", "TEXT DEFAULT '[]'"],
  ]);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      wallet_address TEXT NOT NULL,
      package_slug TEXT NOT NULL,
      package_name TEXT NOT NULL,
      amount_test REAL NOT NULL,
      amount_wei TEXT NOT NULL,
      membership_type INTEGER NOT NULL,
      tx_hash TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'confirmed',
      confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  const packages = await dbAll(`SELECT id FROM packages LIMIT 1`);
  if (packages.length === 0) {
    const defaults = [
      {
        slug: "basic",
        name: "Basic Start",
        price: "0.5 TEST",
        features: JSON.stringify([
          "Full access khung gio co ban",
          "Locker rieng",
          "Huong dan khoi dong",
          "1 buoi danh gia the luc",
        ]),
        color: "amber",
      },
      {
        slug: "pro",
        name: "Pro Lift",
        price: "1 TEST",
        features: JSON.stringify([
          "Khung gio uu tien",
          "Lich tap theo muc tieu",
          "PT support hang tuan",
          "Huong dan dinh duong",
        ]),
        color: "orange",
      },
      {
        slug: "vip",
        name: "VIP Elite",
        price: "1 TEST",
        features: JSON.stringify([
          "Khu tap uu tien",
          "PT 1-1",
          "Theo doi chi so tien do",
          "Ho tro recovery",
        ]),
        color: "sky",
      },
    ];

    for (const item of defaults) {
      await dbRun(
        `
          INSERT INTO packages (slug, name, price, features, color)
          VALUES (?, ?, ?, ?, ?)
        `,
        [item.slug, item.name, item.price, item.features, item.color],
      );
    }
  }

  const trainers = await dbAll(`SELECT id FROM trainers LIMIT 1`);
  if (trainers.length === 0) {
    const defaults = [
      {
        slug: "coach-linh",
        name: "Linh Nguyen",
        nickname: "Mobility Coach",
        role: "Strength & Mobility",
        package_slug: "basic",
        experience: "4 nam",
        bio: "Chuyen huong dan nguoi moi bat dau, chinh form va tao nen tang ben vung.",
        specialties: JSON.stringify([
          "Bodyweight training",
          "Mobility",
          "Foundational lifting",
        ]),
        achievement: "300+ hoc vien moi",
        sort_order: 1,
      },
      {
        slug: "coach-hai",
        name: "Hai Tran",
        nickname: "Performance Lead",
        role: "Muscle Building",
        package_slug: "pro",
        experience: "7 nam",
        bio: "Tap trung vao tang co, giam mo va nang cap lich tap theo muc tieu ro rang.",
        specialties: JSON.stringify([
          "Hypertrophy",
          "Strength progression",
          "Nutrition planning",
        ]),
        achievement: "Top transformation coach",
        sort_order: 2,
      },
      {
        slug: "coach-anh",
        name: "Anh Vu",
        nickname: "Elite PT",
        role: "Premium Coaching",
        package_slug: "vip",
        experience: "9 nam",
        bio: "Dong hanh 1-1 voi hoc vien can ke hoach tap luyen va recovery chi tiet.",
        specialties: JSON.stringify([
          "1-1 coaching",
          "Recovery protocols",
          "Competition prep",
        ]),
        achievement: "Elite member specialist",
        sort_order: 3,
      },
    ];

    for (const item of defaults) {
      await dbRun(
        `
          INSERT INTO trainers
          (slug, name, nickname, role, package_slug, experience, bio, specialties, achievement, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          item.slug,
          item.name,
          item.nickname,
          item.role,
          item.package_slug,
          item.experience,
          item.bio,
          item.specialties,
          item.achievement,
          item.sort_order,
        ],
      );
    }
  }

  await seedAdminAccount();
}

async function seedAdminAccount() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await dbRun(
    `UPDATE members
     SET metamask_address = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE LOWER(COALESCE(metamask_address, '')) = LOWER(?)
       AND username <> ?`,
    [ADMIN_WALLET_ADDRESS, ADMIN_USERNAME],
  );

  const existing = await dbGet(
    `SELECT id FROM members WHERE username = ?`,
    [ADMIN_USERNAME],
  );

  if (!existing) {
    await dbRun(
      `
        INSERT INTO members
        (username, password, full_name, role, metamask_address, wallet_verified_at)
        VALUES (?, ?, ?, 'admin', ?, CURRENT_TIMESTAMP)
      `,
      [
        ADMIN_USERNAME,
        hashedPassword,
        "PowerGym Administrator",
        ADMIN_WALLET_ADDRESS,
      ],
    );
    return;
  }

  await dbRun(
    `
      UPDATE members
      SET password = ?,
          full_name = ?,
          role = 'admin',
          metamask_address = ?,
          wallet_verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `,
    [
      hashedPassword,
      "PowerGym Administrator",
      ADMIN_WALLET_ADDRESS,
      ADMIN_USERNAME,
    ],
  );
}

async function getPackageBySlug(slug) {
  return dbGet(`SELECT * FROM packages WHERE slug = ?`, [slug]);
}

async function getChainSummary() {
  const normalizedContract = normalizeAddress(CONTRACT_ADDRESS);
  if (!normalizedContract) {
    return {
      connected: false,
      contractAddress: "",
      owner: "",
      treasuryWallet: ADMIN_WALLET_ADDRESS,
      totalMembers: 0,
      totalRevenue: "0",
    };
  }

  const contract = new ethers.Contract(
    normalizedContract,
    CONTRACT_ABI,
    provider,
  );

  const [owner, treasuryWallet, totalMembers, totalRevenue] = await Promise.all([
    contract.owner(),
    contract.treasuryWallet(),
    contract.getTotalMembers(),
    contract.getTotalRevenue(),
  ]);

  return {
    connected: true,
    contractAddress: normalizedContract,
    owner,
    treasuryWallet,
    totalMembers: Number(totalMembers),
    totalRevenue: ethers.formatEther(totalRevenue),
  };
}

async function verifyPaymentTransaction({ txHash, packageSlug, walletAddress }) {
  const normalizedWallet = normalizeAddress(walletAddress);
  const normalizedContract = normalizeAddress(CONTRACT_ADDRESS);
  if (!normalizedWallet) {
    throw new Error("Vi MetaMask khong hop le.");
  }
  if (!normalizedContract) {
    throw new Error("Backend chua duoc cau hinh contract address.");
  }

  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    throw new Error("Khong tim thay giao dich tren Sapphire.");
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    throw new Error("Giao dich chua thanh cong.");
  }

  if (normalizeAddress(tx.to) !== normalizedContract) {
    throw new Error("Giao dich khong duoc gui den contract PowerGym hien tai.");
  }

  if (normalizeAddress(tx.from) !== normalizedWallet) {
    throw new Error("Vi gui giao dich khong khop voi vi dang nhap.");
  }

  const membershipType = MEMBERSHIP_TYPE_BY_SLUG[packageSlug] ?? 0;
  const contract = new ethers.Contract(
    normalizedContract,
    CONTRACT_ABI,
    provider,
  );
  const plan = await contract.getMembershipPlan(membershipType);
  if (tx.value !== plan.price) {
    throw new Error("So TEST thanh toan khong dung voi gia goi tap.");
  }

  let decodedTransaction = null;
  try {
    decodedTransaction = contractInterface.parseTransaction({
      data: tx.data,
      value: tx.value,
    });
  } catch (error) {
    decodedTransaction = null;
  }

  if (!decodedTransaction || decodedTransaction.name !== "registerMember") {
    throw new Error("Giao dich khong phai lenh dang ky membership hop le.");
  }

  if (Number(decodedTransaction.args[1]) !== membershipType) {
    throw new Error("Membership type trong giao dich khong khop voi goi tap.");
  }

  let paymentLog = null;
  for (const log of receipt.logs) {
    if (normalizeAddress(log.address) !== normalizedContract) {
      continue;
    }

    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed && parsed.name === "PaymentReceived") {
        paymentLog = parsed;
        break;
      }
    } catch (error) {
      // Ignore unrelated logs.
    }
  }

  const memberExists = await contract.isMember(normalizedWallet);
  const memberInfo = memberExists
    ? await contract.getMemberInfo(normalizedWallet)
    : null;
  const membershipValid = memberExists
    ? await contract.isMembershipValid(normalizedWallet)
    : false;

  if (!memberExists || !memberInfo) {
    throw new Error("Contract chua ghi nhan member sau giao dich.");
  }

  if (Number(memberInfo.membershipType) !== membershipType) {
    throw new Error("Membership type tren contract khong khop voi goi tap.");
  }

  if (paymentLog) {
    const paidBy = normalizeAddress(paymentLog.args.memberAddress);
    if (paidBy !== normalizedWallet) {
      throw new Error("Thanh vien trong event thanh toan khong khop voi vi hien tai.");
    }
  }

  return {
    txHash,
    walletAddress: normalizedWallet,
    amountWei: tx.value.toString(),
    amountTest: Number(ethers.formatEther(tx.value)),
    membershipType,
    membershipValid,
    blockNumber: receipt.blockNumber,
    memberInfo: memberInfo
      ? {
          membershipType: Number(memberInfo.membershipType),
          registrationDate: Number(memberInfo.registrationDate),
          expiryDate: Number(memberInfo.expiryDate),
          totalAttendance: Number(memberInfo.totalAttendance),
          isActive: Boolean(memberInfo.isActive),
          name: memberInfo.name,
        }
      : null,
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    res.status(401).json({ error: "Ban can dang nhap de tiep tuc." });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(403).json({ error: "Token khong hop le hoac da het han." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Chi admin moi duoc truy cap." });
    return;
  }

  next();
}

app.get("/health", async (req, res) => {
  try {
    const chain = await getChainSummary();
    res.json({
      ok: true,
      service: "powergym-backend",
      port: PORT,
      chain,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Backend dang chay nhung khong doc duoc du lieu blockchain.",
    });
  }
});

app.get("/api/packages", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM packages WHERE is_active = 1 ORDER BY id ASC`,
    );
    res.json({ packages: rows.map(serializePackage) });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai danh sach goi tap." });
  }
});

app.get("/api/trainers", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM trainers WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    );
    res.json({ trainers: rows.map(serializeTrainer) });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai danh sach huan luyen vien." });
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, email = "", packageSlug = "", packageName = "", message = "" } =
    req.body || {};

  if (!name || !phone || !packageName) {
    res
      .status(400)
      .json({ error: "Vui long nhap ten, so dien thoai va goi tap quan tam." });
    return;
  }

  try {
    await dbRun(
      `
        INSERT INTO contact_messages (name, phone, email, package_slug, package_name, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        String(name).trim(),
        String(phone).trim(),
        String(email || "").trim(),
        String(packageSlug || "").trim(),
        String(packageName).trim(),
        String(message || "").trim(),
      ],
    );

    res.status(201).json({ message: "Da gui yeu cau tu van thanh cong." });
  } catch (error) {
    res.status(500).json({ error: "Khong the luu yeu cau tu van." });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, fullName = "" } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: "Username va password la bat buoc." });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: "Password phai co it nhat 6 ky tu." });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      `
        INSERT INTO members (username, password, full_name, role)
        VALUES (?, ?, ?, 'member')
      `,
      [
        String(username).trim(),
        hashedPassword,
        String(fullName || "").trim(),
      ],
    );

    res.status(201).json({
      message: "Dang ky thanh cong.",
      userId: result.lastID,
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Username da ton tai." });
      return;
    }

    res.status(500).json({ error: "Khong the tao tai khoan moi." });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: "Username va password la bat buoc." });
    return;
  }

  try {
    const user = await dbGet(
      `SELECT * FROM members WHERE username = ?`,
      [String(username).trim()],
    );

    if (!user) {
      res.status(401).json({ error: "Thong tin dang nhap khong dung." });
      return;
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      res.status(401).json({ error: "Thong tin dang nhap khong dung." });
      return;
    }

    const safeUser = serializeMember(user);
    const token = createJwt(safeUser);
    res.json({
      token,
      user: {
        id: safeUser.id,
        username: safeUser.username,
        full_name: safeUser.full_name,
        role: safeUser.role,
        metamask_address: safeUser.metamask_address || "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the dang nhap luc nay." });
  }
});

app.post("/api/auth/wallet/challenge", (req, res) => {
  const { walletAddress } = req.body || {};
  const normalizedWallet = normalizeAddress(walletAddress);

  if (!normalizedWallet) {
    res.status(400).json({ error: "Dia chi vi khong hop le." });
    return;
  }

  try {
    const challenge = rememberWalletChallenge(normalizedWallet, "login");
    res.json({
      walletAddress: normalizedWallet,
      ...challenge,
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the tao challenge dang nhap." });
  }
});

app.post("/api/auth/wallet/verify", async (req, res) => {
  const { walletAddress, signature } = req.body || {};
  const normalizedWallet = normalizeAddress(walletAddress);

  if (!normalizedWallet || !signature) {
    res.status(400).json({ error: "Can walletAddress va signature." });
    return;
  }

  try {
    const challenge = consumeWalletChallenge(normalizedWallet, "login");
    if (!challenge) {
      res.status(400).json({ error: "Challenge dang nhap khong hop le hoac da het han." });
      return;
    }

    const recoveredAddress = normalizeAddress(
      ethers.verifyMessage(challenge.message, signature),
    );

    if (recoveredAddress !== normalizedWallet) {
      res.status(401).json({ error: "Chu ky MetaMask khong hop le." });
      return;
    }

    let user = await dbGet(
      `SELECT * FROM members WHERE LOWER(COALESCE(metamask_address, '')) = LOWER(?)`,
      [normalizedWallet],
    );

    if (!user && normalizedWallet === ADMIN_WALLET_ADDRESS) {
      await seedAdminAccount();
      user = await dbGet(`SELECT * FROM members WHERE username = ?`, [
        ADMIN_USERNAME,
      ]);
    }

    if (!user) {
      const generatedUsername = `member_${normalizedWallet.slice(2, 8).toLowerCase()}`;
      const generatedPassword = crypto.randomBytes(12).toString("hex");
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      const result = await dbRun(
        `
          INSERT INTO members (username, password, full_name, role, metamask_address, wallet_verified_at)
          VALUES (?, ?, ?, 'member', ?, CURRENT_TIMESTAMP)
        `,
        [
          `${generatedUsername}_${Date.now().toString().slice(-4)}`,
          hashedPassword,
          `Member ${normalizedWallet.slice(0, 6)}`,
          normalizedWallet,
        ],
      );

      user = await dbGet(`SELECT * FROM members WHERE id = ?`, [result.lastID]);
    }

    await dbRun(
      `
        UPDATE members
        SET metamask_address = ?, wallet_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [normalizedWallet, user.id],
    );

    const refreshedUser = await dbGet(`SELECT * FROM members WHERE id = ?`, [
      user.id,
    ]);
    const safeUser = serializeMember(refreshedUser);
    const token = createJwt(safeUser);
    res.json({
      token,
      user: {
        id: safeUser.id,
        username: safeUser.username,
        full_name: safeUser.full_name,
        role: safeUser.role,
        metamask_address: safeUser.metamask_address || "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the xac thuc MetaMask luc nay." });
  }
});

app.post("/api/member/link-wallet/challenge", authenticateToken, (req, res) => {
  const { walletAddress } = req.body || {};
  const normalizedWallet = normalizeAddress(walletAddress);

  if (!normalizedWallet) {
    res.status(400).json({ error: "Dia chi vi khong hop le." });
    return;
  }

  try {
    const challenge = rememberWalletChallenge(
      normalizedWallet,
      "link",
      req.user.id,
    );
    res.json({
      walletAddress: normalizedWallet,
      ...challenge,
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the tao challenge lien ket vi." });
  }
});

app.post("/api/member/link-wallet/verify", authenticateToken, async (req, res) => {
  const { walletAddress, signature } = req.body || {};
  const normalizedWallet = normalizeAddress(walletAddress);

  if (!normalizedWallet || !signature) {
    res.status(400).json({ error: "Can walletAddress va signature." });
    return;
  }

  try {
    const challenge = consumeWalletChallenge(normalizedWallet, "link");
    if (!challenge || challenge.userId !== req.user.id) {
      res.status(400).json({ error: "Challenge lien ket vi khong hop le." });
      return;
    }

    const recoveredAddress = normalizeAddress(
      ethers.verifyMessage(challenge.message, signature),
    );
    if (recoveredAddress !== normalizedWallet) {
      res.status(401).json({ error: "Chu ky MetaMask khong hop le." });
      return;
    }

    const ownerRow = await dbGet(
      `SELECT id FROM members WHERE LOWER(COALESCE(metamask_address, '')) = LOWER(?) AND id <> ?`,
      [normalizedWallet, req.user.id],
    );
    if (ownerRow) {
      res.status(409).json({ error: "Vi nay dang duoc lien ket voi tai khoan khac." });
      return;
    }

    await dbRun(
      `
        UPDATE members
        SET metamask_address = ?, wallet_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [normalizedWallet, req.user.id],
    );

    res.json({ message: "Lien ket MetaMask thanh cong.", walletAddress: normalizedWallet });
  } catch (error) {
    res.status(500).json({ error: "Khong the lien ket MetaMask luc nay." });
  }
});

app.get("/api/member", authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(`SELECT * FROM members WHERE id = ?`, [req.user.id]);
    if (!user) {
      res.status(404).json({ error: "Khong tim thay tai khoan." });
      return;
    }

    const payments = await dbAll(
      `
        SELECT id, package_slug, package_name, amount_test, tx_hash, confirmed_at
        FROM payments
        WHERE member_id = ?
        ORDER BY confirmed_at DESC, id DESC
      `,
      [req.user.id],
    );

    res.json({
      user: serializeMember(user),
      payments,
      chain: await getChainSummary(),
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai thong tin thanh vien." });
  }
});

app.get("/api/member/payments", authenticateToken, async (req, res) => {
  try {
    const payments = await dbAll(
      `
        SELECT id, package_slug, package_name, amount_test, amount_wei, tx_hash, status, confirmed_at
        FROM payments
        WHERE member_id = ?
        ORDER BY confirmed_at DESC, id DESC
      `,
      [req.user.id],
    );
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai lich su thanh toan." });
  }
});

app.post("/api/member/package-request", authenticateToken, async (req, res) => {
  const { packageSlug } = req.body || {};
  if (!packageSlug) {
    res.status(400).json({ error: "Vui long chon goi tap." });
    return;
  }

  try {
    const pkg = await getPackageBySlug(packageSlug);
    if (!pkg) {
      res.status(404).json({ error: "Khong tim thay goi tap." });
      return;
    }

    await dbRun(
      `
        INSERT INTO package_requests
        (member_id, member_name, package_slug, package_name, package_price, package_features)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        req.user.username,
        pkg.slug,
        pkg.name,
        pkg.price,
        pkg.features,
      ],
    );

    res.status(201).json({ message: "Da gui yeu cau dang ky goi tap." });
  } catch (error) {
    res.status(500).json({ error: "Khong the tao yeu cau goi tap." });
  }
});

app.post("/api/member/payments/confirm", authenticateToken, async (req, res) => {
  const { txHash, packageSlug, walletAddress } = req.body || {};

  if (!txHash || !packageSlug || !walletAddress) {
    res.status(400).json({ error: "Can txHash, packageSlug va walletAddress." });
    return;
  }

  try {
    const existingPayment = await dbGet(
      `SELECT * FROM payments WHERE tx_hash = ?`,
      [txHash],
    );
    if (existingPayment) {
      res.json({
        message: "Giao dich nay da duoc dong bo truoc do.",
        payment: existingPayment,
      });
      return;
    }

    const pkg = await getPackageBySlug(packageSlug);
    if (!pkg) {
      res.status(404).json({ error: "Khong tim thay goi tap de xac nhan." });
      return;
    }

    const verification = await verifyPaymentTransaction({
      txHash: String(txHash).trim(),
      packageSlug: String(packageSlug).trim(),
      walletAddress,
    });

    await dbRun(
      `
        INSERT INTO payments
        (member_id, wallet_address, package_slug, package_name, amount_test, amount_wei, membership_type, tx_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        verification.walletAddress,
        pkg.slug,
        pkg.name,
        verification.amountTest,
        verification.amountWei,
        verification.membershipType,
        txHash,
      ],
    );

    await dbRun(
      `
        UPDATE members
        SET metamask_address = ?,
            wallet_verified_at = CURRENT_TIMESTAMP,
            current_package_slug = ?,
            current_package_name = ?,
            current_package_price = ?,
            current_package_features = ?,
            package_status = 'active',
            package_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        verification.walletAddress,
        pkg.slug,
        pkg.name,
        pkg.price,
        pkg.features,
        req.user.id,
      ],
    );

    res.status(201).json({
      message: "Da xac nhan thanh toan va kich hoat goi tap.",
      payment: {
        txHash,
        amountTest: verification.amountTest,
        walletAddress: verification.walletAddress,
      },
      contract: verification.memberInfo,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Khong the xac nhan thanh toan." });
  }
});

app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [members, requests, payments] = await Promise.all([
      dbAll(`SELECT * FROM members ORDER BY created_at DESC`),
      dbAll(`SELECT * FROM package_requests ORDER BY created_at DESC`),
      dbAll(`SELECT * FROM payments ORDER BY confirmed_at DESC, id DESC`),
    ]);

    const packageRevenueMap = payments.reduce((accumulator, item) => {
      const key = item.package_slug;
      if (!accumulator[key]) {
        accumulator[key] = {
          slug: item.package_slug,
          package_name: item.package_name,
          total_revenue: 0,
          approved_count: 0,
        };
      }

      accumulator[key].total_revenue += Number(item.amount_test || 0);
      accumulator[key].approved_count += 1;
      return accumulator;
    }, {});

    res.json({
      stats: {
        memberCount: members.length,
        activePackageCount: members.filter(
          (member) => member.package_status === "active",
        ).length,
        pendingRequestCount: requests.filter(
          (request) => request.status === "pending",
        ).length,
        approvedRequestCount: requests.filter(
          (request) => request.status === "approved",
        ).length,
        paymentCount: payments.length,
        totalRevenue: payments.reduce(
          (sum, item) => sum + Number(item.amount_test || 0),
          0,
        ),
        packageRevenueList: Object.values(packageRevenueMap).sort(
          (left, right) => right.total_revenue - left.total_revenue,
        ),
      },
      chain: await getChainSummary(),
    });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai dashboard admin." });
  }
});

app.get("/api/admin/members", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `
        SELECT id, username, full_name, role, metamask_address, current_package_slug,
               current_package_name, current_package_price, current_package_features,
               package_status, package_updated_at, wallet_verified_at, created_at
        FROM members
        ORDER BY created_at DESC
      `,
    );
    res.json({ members: rows.map(serializeMember) });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai danh sach thanh vien." });
  }
});

app.put("/api/admin/members/:id", authenticateToken, requireAdmin, async (req, res) => {
  const memberId = Number(req.params.id);
  const {
    full_name = "",
    role = "member",
    metamask_address = "",
    package_status = "inactive",
  } = req.body || {};

  if (!memberId) {
    res.status(400).json({ error: "Member id khong hop le." });
    return;
  }

  const normalizedWallet = metamask_address
    ? normalizeAddress(metamask_address)
    : "";
  if (metamask_address && !normalizedWallet) {
    res.status(400).json({ error: "Dia chi vi MetaMask khong hop le." });
    return;
  }

  try {
    await dbRun(
      `
        UPDATE members
        SET full_name = ?, role = ?, metamask_address = ?, package_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        String(full_name || "").trim(),
        role === "admin" ? "admin" : "member",
        normalizedWallet || null,
        package_status === "active" ? "active" : "inactive",
        memberId,
      ],
    );

    res.json({ message: "Da cap nhat thanh vien." });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Vi MetaMask nay da duoc su dung." });
      return;
    }
    res.status(500).json({ error: "Khong the cap nhat thanh vien." });
  }
});

app.delete("/api/admin/members/:id", authenticateToken, requireAdmin, async (req, res) => {
  const memberId = Number(req.params.id);
  if (!memberId) {
    res.status(400).json({ error: "Member id khong hop le." });
    return;
  }

  try {
    const result = await dbRun(`DELETE FROM members WHERE id = ?`, [memberId]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Khong tim thay thanh vien." });
      return;
    }

    res.json({ message: "Da xoa thanh vien." });
  } catch (error) {
    res.status(500).json({ error: "Khong the xoa thanh vien." });
  }
});

app.get("/api/admin/package-requests", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM package_requests ORDER BY created_at DESC, id DESC`,
    );
    res.json({ requests: rows });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai danh sach yeu cau." });
  }
});

app.put("/api/admin/package-requests/:id", authenticateToken, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const { status } = req.body || {};
  if (!requestId || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Trang thai yeu cau khong hop le." });
    return;
  }

  try {
    const request = await dbGet(`SELECT * FROM package_requests WHERE id = ?`, [
      requestId,
    ]);
    if (!request) {
      res.status(404).json({ error: "Khong tim thay yeu cau." });
      return;
    }

    await dbRun(
      `
        UPDATE package_requests
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [status, requestId],
    );

    if (status === "approved") {
      await dbRun(
        `
          UPDATE members
          SET current_package_slug = ?,
              current_package_name = ?,
              current_package_price = ?,
              current_package_features = ?,
              package_status = 'active',
              package_updated_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          request.package_slug,
          request.package_name,
          request.package_price,
          request.package_features,
          request.member_id,
        ],
      );
    }

    res.json({ message: "Da cap nhat trang thai yeu cau." });
  } catch (error) {
    res.status(500).json({ error: "Khong the cap nhat yeu cau." });
  }
});

app.get("/api/admin/payments", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `
        SELECT p.*, m.username, m.full_name
        FROM payments p
        LEFT JOIN members m ON m.id = p.member_id
        ORDER BY p.confirmed_at DESC, p.id DESC
      `,
    );
    res.json({ payments: rows });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai lich su thanh toan." });
  }
});

app.get("/api/admin/contacts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC`,
    );
    res.json({ contacts: rows });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai tin nhan lien he." });
  }
});

app.get("/api/admin/packages", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM packages ORDER BY id ASC`);
    res.json({ packages: rows.map(serializePackage) });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai goi tap cho admin." });
  }
});

app.post("/api/admin/packages", authenticateToken, requireAdmin, async (req, res) => {
  const { slug, name, price, features, color = "", image_url = "", is_active = true } =
    req.body || {};

  if (!slug || !name || !price || !features) {
    res.status(400).json({ error: "Can slug, ten goi, gia va danh sach quyen loi." });
    return;
  }

  try {
    const result = await dbRun(
      `
        INSERT INTO packages (slug, name, price, features, color, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(slug).trim(),
        String(name).trim(),
        String(price).trim(),
        JSON.stringify(parseJsonList(features)),
        String(color || "").trim(),
        String(image_url || "").trim(),
        is_active ? 1 : 0,
      ],
    );

    res.status(201).json({ message: "Da tao goi tap moi.", packageId: result.lastID });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Slug goi tap da ton tai." });
      return;
    }
    res.status(500).json({ error: "Khong the tao goi tap moi." });
  }
});

app.put("/api/admin/packages/:id", authenticateToken, requireAdmin, async (req, res) => {
  const packageId = Number(req.params.id);
  const { slug, name, price, features, color = "", image_url = "", is_active = true } =
    req.body || {};

  if (!packageId || !slug || !name || !price || !features) {
    res.status(400).json({ error: "Du lieu goi tap chua day du." });
    return;
  }

  try {
    await dbRun(
      `
        UPDATE packages
        SET slug = ?, name = ?, price = ?, features = ?, color = ?, image_url = ?,
            is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        String(slug).trim(),
        String(name).trim(),
        String(price).trim(),
        JSON.stringify(parseJsonList(features)),
        String(color || "").trim(),
        String(image_url || "").trim(),
        is_active ? 1 : 0,
        packageId,
      ],
    );

    res.json({ message: "Da cap nhat goi tap." });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Slug goi tap da ton tai." });
      return;
    }
    res.status(500).json({ error: "Khong the cap nhat goi tap." });
  }
});

app.delete("/api/admin/packages/:id", authenticateToken, requireAdmin, async (req, res) => {
  const packageId = Number(req.params.id);
  if (!packageId) {
    res.status(400).json({ error: "Package id khong hop le." });
    return;
  }

  try {
    const result = await dbRun(`DELETE FROM packages WHERE id = ?`, [packageId]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Khong tim thay goi tap." });
      return;
    }
    res.json({ message: "Da xoa goi tap." });
  } catch (error) {
    res.status(500).json({ error: "Khong the xoa goi tap." });
  }
});

app.get("/api/admin/trainers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM trainers ORDER BY sort_order ASC, id ASC`,
    );
    res.json({ trainers: rows.map(serializeTrainer) });
  } catch (error) {
    res.status(500).json({ error: "Khong the tai huan luyen vien cho admin." });
  }
});

app.post("/api/admin/trainers", authenticateToken, requireAdmin, async (req, res) => {
  const {
    slug,
    name,
    nickname,
    role,
    package_slug = "",
    experience,
    bio,
    specialties,
    achievement,
    sort_order = 0,
    image_url = "",
    is_active = true,
  } = req.body || {};

  if (!slug || !name || !nickname || !role || !experience || !bio || !achievement) {
    res.status(400).json({ error: "Du lieu huan luyen vien chua day du." });
    return;
  }

  try {
    const result = await dbRun(
      `
        INSERT INTO trainers
        (slug, name, nickname, role, package_slug, experience, bio, specialties, achievement, sort_order, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(slug).trim(),
        String(name).trim(),
        String(nickname).trim(),
        String(role).trim(),
        String(package_slug || "").trim(),
        String(experience).trim(),
        String(bio).trim(),
        JSON.stringify(parseJsonList(specialties)),
        String(achievement).trim(),
        Number(sort_order) || 0,
        String(image_url || "").trim(),
        is_active ? 1 : 0,
      ],
    );

    res.status(201).json({ message: "Da tao huan luyen vien moi.", trainerId: result.lastID });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Slug huan luyen vien da ton tai." });
      return;
    }
    res.status(500).json({ error: "Khong the tao huan luyen vien moi." });
  }
});

app.put("/api/admin/trainers/:id", authenticateToken, requireAdmin, async (req, res) => {
  const trainerId = Number(req.params.id);
  const {
    slug,
    name,
    nickname,
    role,
    package_slug = "",
    experience,
    bio,
    specialties,
    achievement,
    sort_order = 0,
    image_url = "",
    is_active = true,
  } = req.body || {};

  if (!trainerId || !slug || !name || !nickname || !role || !experience || !bio || !achievement) {
    res.status(400).json({ error: "Du lieu huan luyen vien chua day du." });
    return;
  }

  try {
    await dbRun(
      `
        UPDATE trainers
        SET slug = ?, name = ?, nickname = ?, role = ?, package_slug = ?,
            experience = ?, bio = ?, specialties = ?, achievement = ?,
            sort_order = ?, image_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        String(slug).trim(),
        String(name).trim(),
        String(nickname).trim(),
        String(role).trim(),
        String(package_slug || "").trim(),
        String(experience).trim(),
        String(bio).trim(),
        JSON.stringify(parseJsonList(specialties)),
        String(achievement).trim(),
        Number(sort_order) || 0,
        String(image_url || "").trim(),
        is_active ? 1 : 0,
        trainerId,
      ],
    );

    res.json({ message: "Da cap nhat huan luyen vien." });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      res.status(409).json({ error: "Slug huan luyen vien da ton tai." });
      return;
    }
    res.status(500).json({ error: "Khong the cap nhat huan luyen vien." });
  }
});

app.delete("/api/admin/trainers/:id", authenticateToken, requireAdmin, async (req, res) => {
  const trainerId = Number(req.params.id);
  if (!trainerId) {
    res.status(400).json({ error: "Trainer id khong hop le." });
    return;
  }

  try {
    const result = await dbRun(`DELETE FROM trainers WHERE id = ?`, [trainerId]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Khong tim thay huan luyen vien." });
      return;
    }
    res.json({ message: "Da xoa huan luyen vien." });
  } catch (error) {
    res.status(500).json({ error: "Khong the xoa huan luyen vien." });
  }
});

async function start() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`PowerGym backend listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});

module.exports = app;
