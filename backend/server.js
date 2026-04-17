const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your_jwt_secret_key_here'; // Thay đổi trong production

app.use(cors());
app.use(express.json({ limit: '12mb' }));

// Khởi tạo database
const db = new sqlite3.Database('./members.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    createTables();
  }
});

// Tạo bảng members
function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    metamask_address TEXT,
    current_package_slug TEXT,
    current_package_name TEXT,
    current_package_price TEXT,
    current_package_features TEXT,
    package_status TEXT DEFAULT 'inactive',
    package_updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating members table:', err.message);
    } else {
      console.log('Members table created or already exists.');
      ensureMemberPackageColumns();
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS package_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name TEXT NOT NULL,
    package_slug TEXT,
    package_name TEXT NOT NULL,
    package_price TEXT NOT NULL,
    package_features TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error creating package_requests table:', err.message);
    } else {
      console.log('Package requests table created or already exists.');
      ensurePackageRequestColumns();
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    features TEXT NOT NULL,
    color TEXT,
    image_url TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating packages table:', err.message);
      return;
    }

    console.log('Packages table created or already exists.');
    ensurePackageColumns();

    db.get(`SELECT COUNT(*) AS count FROM packages`, (countErr, row) => {
      if (countErr) {
        console.error('Error checking packages table:', countErr.message);
        return;
      }

      if (row.count === 0) {
        const seedPackages = [
          {
            slug: 'basic',
            name: 'Gói Cơ Bản',
            price: '499.000',
            features: JSON.stringify(['Truy cập mọi khung giờ', 'Tủ đồ riêng', '2 buổi PT miễn phí', 'Gửi xe miễn phí']),
            color: 'border-zinc-700'
          },
          {
            slug: 'pro',
            name: 'Gói Chuyên Nghiệp',
            price: '999.000',
            features: JSON.stringify(['Ưu tiên máy tập', 'Tủ đồ riêng VIP', '5 buổi PT miễn phí', 'Tư vấn dinh dưỡng', 'Nước uống miễn phí']),
            color: 'border-orange-600'
          },
          {
            slug: 'vip',
            name: 'Gói VIP',
            price: '1.999.000',
            features: JSON.stringify(['Phòng tập riêng biệt', 'PT kèm 1-1 hàng ngày', 'Xông hơi & Bể bơi', 'Massage sau tập', 'Trái cây & Whey']),
            color: 'border-yellow-500'
          }
        ];

        const insertPackage = db.prepare(`
          INSERT INTO packages (slug, name, price, features, color)
          VALUES (?, ?, ?, ?, ?)
        `);

        seedPackages.forEach((pkg) => {
          insertPackage.run([pkg.slug, pkg.name, pkg.price, pkg.features, pkg.color]);
        });

        insertPackage.finalize((finalizeErr) => {
          if (finalizeErr) {
            console.error('Error seeding packages:', finalizeErr.message);
          } else {
            console.log('Seeded default packages.');
          }
        });
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS site_hero_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_text TEXT NOT NULL,
    primary_cta_text TEXT NOT NULL,
    primary_cta_href TEXT NOT NULL,
    secondary_cta_text TEXT NOT NULL,
    secondary_cta_href TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating site_hero_content table:', err.message);
      return;
    }

    db.get(`SELECT COUNT(*) AS count FROM site_hero_content`, (countErr, row) => {
      if (countErr) {
        console.error('Error checking site_hero_content table:', countErr.message);
        return;
      }

      if (row.count === 0) {
        db.run(`INSERT INTO site_hero_content (title, subtitle, description, badge_text, primary_cta_text, primary_cta_href, secondary_cta_text, secondary_cta_href)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
          'THÁCH THỨC',
          'Đừng chỉ mơ ước về một thân hình đẹp. Hãy bắt đầu hành trình thay đổi vóc dáng của bạn tại môi trường tập luyện đẳng cấp nhất.',
          'Đây là nơi bạn nâng cấp thể chất với gói tập, huấn luyện viên và trải nghiệm Web3.',
          'No Pain, No Gain',
          'Bắt đầu tập luyện',
          '#contact',
          'Xem bảng giá',
          '#pricing'
        ]);
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS contact_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    hotline TEXT NOT NULL,
    email TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating contact_settings table:', err.message);
      return;
    }

    db.get(`SELECT COUNT(*) AS count FROM contact_settings`, (countErr, row) => {
      if (countErr) {
        console.error('Error checking contact_settings table:', countErr.message);
        return;
      }

      if (row.count === 0) {
        db.run(`INSERT INTO contact_settings (title, headline, description, address, hotline, email)
          VALUES (?, ?, ?, ?, ?, ?)`, [
          'Gia nhập cộng đồng',
          'BẮT ĐẦU THAY ĐỔI',
          'Đăng ký tư vấn và nhận đặc quyền hội viên theo dữ liệu được quản lý tập trung trong database.',
          'Số 1 UTC, Cầu Giấy, Hà Nội',
          '1900 6789',
          'contact@powergym.io'
        ]);
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS footer_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT NOT NULL,
    brand_suffix TEXT NOT NULL,
    description TEXT NOT NULL,
    explore_title TEXT NOT NULL,
    member_title TEXT NOT NULL,
    contact_title TEXT NOT NULL,
    address TEXT NOT NULL,
    hotline TEXT NOT NULL,
    email TEXT NOT NULL,
    copyright_text TEXT NOT NULL,
    designer_text TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating footer_settings table:', err.message);
      return;
    }

    db.get(`SELECT COUNT(*) AS count FROM footer_settings`, (countErr, row) => {
      if (countErr) {
        console.error('Error checking footer_settings table:', countErr.message);
        return;
      }

      if (row.count === 0) {
        db.run(`INSERT INTO footer_settings (brand_name, brand_suffix, description, explore_title, member_title, contact_title, address, hotline, email, copyright_text, designer_text)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          'POWER',
          'GYM',
          'Hệ thống phòng tập Web3 đầu tiên tại Việt Nam. Thay đổi hình thể, làm chủ công nghệ.',
          'Khám phá',
          'Hội viên',
          'Liên hệ',
          'Số 1 UTC, Cầu Giấy, Hà Nội',
          '1900 6789',
          'contact@powergym.io',
          '© 2026 POWER GYM WEB3 PROJECT',
          'DESIGNED BY TRONG TRAN'
        ]);
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    role TEXT NOT NULL,
    experience TEXT NOT NULL,
    bio TEXT NOT NULL,
    specialties TEXT NOT NULL,
    achievement TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating trainers table:', err.message);
      return;
    }

    ensureTrainerColumns();

    db.all(`PRAGMA table_info(trainers)`, (schemaErr, columns) => {
      if (schemaErr) {
        console.error('Error reading trainers schema for package assignment:', schemaErr.message);
        return;
      }

      const hasPackageSlug = Array.isArray(columns) && columns.some((column) => column.name === 'package_slug');
      if (!hasPackageSlug) {
        return;
      }

      db.run(
        `UPDATE trainers
         SET package_slug = CASE
           WHEN slug = 'tranhung' THEN 'basic'
           WHEN slug = 'luulinh' THEN 'pro'
           WHEN slug = 'hoanglong' THEN 'vip'
           ELSE package_slug
         END
         WHERE COALESCE(package_slug, '') = ''`,
        (updateErr) => {
          if (updateErr) {
            console.error('Error assigning default trainer packages:', updateErr.message);
          }
        }
      );
    });

    db.get(`SELECT COUNT(*) AS count FROM trainers`, (countErr, row) => {
      if (countErr) {
        console.error('Error checking trainers table:', countErr.message);
        return;
      }

      if (row.count === 0) {
        const seedTrainers = getDefaultTrainerSeeds();

        const insertTrainer = db.prepare(`
          INSERT INTO trainers (slug, name, nickname, role, experience, bio, specialties, achievement, sort_order, image_url, package_slug)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        seedTrainers.forEach((trainer) => {
          insertTrainer.run([
            trainer.slug,
            trainer.name,
            trainer.nickname,
            trainer.role,
            trainer.experience,
            trainer.bio,
            trainer.specialties,
            trainer.achievement,
            trainer.sort_order,
            trainer.image_url || '',
            trainer.package_slug || ''
          ]);
        });

        insertTrainer.finalize((finalizeErr) => {
          if (finalizeErr) {
            console.error('Error seeding trainers:', finalizeErr.message);
          }
        });
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS member_profiles (
    member_id INTEGER PRIMARY KEY,
    trainer_id INTEGER,
    goal TEXT,
    weekly_sessions TEXT,
    next_session_at DATETIME,
    schedule_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY(trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating member_profiles table:', err.message);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    package_name TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating contact_messages table:', err.message);
    }
  });
}

function ensureMemberPackageColumns() {
  const packageColumns = [
    ['current_package_slug', 'TEXT'],
    ['current_package_name', 'TEXT'],
    ['current_package_price', 'TEXT'],
    ['current_package_features', 'TEXT'],
    ['package_status', 'TEXT DEFAULT "inactive"'],
    ['package_updated_at', 'DATETIME']
  ];

  addMissingColumns('members', packageColumns);
}

function ensurePackageRequestColumns() {
  const requestColumns = [
    ['package_slug', 'TEXT'],
    ['package_features', 'TEXT']
  ];

  addMissingColumns('package_requests', requestColumns);
}

function ensurePackageColumns() {
  const packageColumns = [
    ['image_url', "TEXT DEFAULT ''"]
  ];

  addMissingColumns('packages', packageColumns);
}

function ensureTrainerColumns() {
  const trainerColumns = [
    ['image_url', "TEXT DEFAULT ''"],
    ['package_slug', "TEXT DEFAULT ''"]
  ];

  addMissingColumns('trainers', trainerColumns);
}

function addMissingColumns(tableName, columns) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      console.error(`Error reading ${tableName} schema:`, err.message);
      return;
    }

    const existingColumns = new Set(rows.map((column) => column.name));

    columns.forEach(([columnName, columnType]) => {
      if (!existingColumns.has(columnName)) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (alterErr) => {
          if (alterErr) {
            console.error(`Error adding ${columnName} column to ${tableName}:`, alterErr.message);
          } else {
            console.log(`Added ${columnName} column to ${tableName}.`);
          }
        });
      }
    });
  });
}

function normalizePackageFeatures(features) {
  if (Array.isArray(features)) {
    return JSON.stringify(features);
  }

  if (typeof features === 'string') {
    const trimmed = features.trim();
    if (!trimmed) {
      return JSON.stringify([]);
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch (err) {
      // Fall through to comma-separated parsing.
    }

    return JSON.stringify(
      trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return JSON.stringify([]);
}

function normalizeTrainerSpecialties(specialties) {
  if (Array.isArray(specialties)) {
    return JSON.stringify(specialties.map((item) => String(item).trim()).filter(Boolean));
  }

  if (typeof specialties === 'string') {
    const trimmed = specialties.trim();
    if (!trimmed) {
      return JSON.stringify([]);
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map((item) => String(item).trim()).filter(Boolean));
      }
    } catch (err) {
      // Fall through to comma-separated parsing.
    }

    return JSON.stringify(
      trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return JSON.stringify([]);
}

function mapPackageRows(rows) {
  return rows.map((item) => ({
    ...item,
    is_active: Boolean(item.is_active),
    features: JSON.parse(item.features),
    image_url: item.image_url || ''
  }));
}

function mapTrainerRows(rows) {
  return rows.map((item) => ({
    ...item,
    specialties: parseJsonList(item.specialties),
    is_active: Boolean(item.is_active),
    image_url: item.image_url || '',
    package_slug: item.package_slug || ''
  }));
}

function parseMoney(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  const normalized = String(value).replace(/\./g, '').replace(/,/g, '').trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
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
  } catch (err) {
    return [];
  }
}

function getDefaultTrainerSeeds() {
  return [
    {
      slug: 'tranhung',
      name: 'Trần Hùng',
      nickname: 'Iron Hung',
      role: 'Huấn luyện viên Trưởng',
      experience: '12 năm',
      bio: 'Chuyên gia phục hồi thể chất và xây dựng cơ bắp chuyên sâu. Đã giúp hơn 500 khách hàng thay đổi hình thể thành công.',
      specialties: JSON.stringify(['Bodybuilding', 'Powerlifting', 'Dinh dưỡng lâm sàng']),
      achievement: 'Vô địch thể hình quốc gia 2022',
      sort_order: 1,
      image_url: '',
      package_slug: 'basic'
    },
    {
      slug: 'luulinh',
      name: 'Luu Linh',
      nickname: 'Theresa',
      role: 'Chuyên gia Yoga & Pilates',
      experience: '8 năm',
      bio: 'Tập trung vào sự dẻo dai và hơi thở. Giúp học viên tìm thấy sự cân bằng giữa tâm trí và cơ thể qua các bài tập chuyên sâu.',
      specialties: JSON.stringify(['Hatha Yoga', 'Mat Pilates', 'Trị liệu cột sống']),
      achievement: 'Chứng chỉ Yoga quốc tế Alliance 500h',
      sort_order: 2,
      image_url: '',
      package_slug: 'pro'
    },
    {
      slug: 'hoanglong',
      name: 'Hoàng Long',
      nickname: 'MCK',
      role: 'HLV Boxing & Kickfit',
      experience: '10 năm',
      bio: 'Cựu vận động viên Boxing. Phương pháp huấn luyện cường độ cao, tập trung vào phản xạ và sức bền tim mạch.',
      specialties: JSON.stringify(['Boxing', 'Muay Thai', 'HIIT']),
      achievement: 'Huy chương Vàng Boxing trẻ toàn quốc',
      sort_order: 3,
      image_url: '',
      package_slug: 'vip'
    }
  ];
}

function createDefaultMemberProfile(memberId) {
  db.run(
    `INSERT OR IGNORE INTO member_profiles (member_id) VALUES (?)`,
    [memberId],
    (err) => {
      if (err) {
        console.error('Error creating default member profile:', err.message);
      }
    }
  );
}

function upsertMemberProfile(memberId, profileData, callback) {
  const hasProfileData = [
    profileData.trainer_id,
    profileData.goal,
    profileData.weekly_sessions,
    profileData.next_session_at,
    profileData.schedule_notes
  ].some((value) => value !== undefined);

  if (!hasProfileData) {
    if (callback) callback(null);
    return;
  }

  db.run(
    `INSERT INTO member_profiles (member_id, trainer_id, goal, weekly_sessions, next_session_at, schedule_notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(member_id) DO UPDATE SET
       trainer_id = excluded.trainer_id,
       goal = excluded.goal,
       weekly_sessions = excluded.weekly_sessions,
       next_session_at = excluded.next_session_at,
       schedule_notes = excluded.schedule_notes,
       updated_at = CURRENT_TIMESTAMP`,
    [
      memberId,
      profileData.trainer_id ?? null,
      profileData.goal ?? null,
      profileData.weekly_sessions ?? null,
      profileData.next_session_at ?? null,
      profileData.schedule_notes ?? null
    ],
    callback
  );
}

// Middleware xác thực JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// API Routes

// Đăng ký
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO members (username, password, role) VALUES (?, ?, ?)`,
      [username, hashedPassword, 'member'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          message: 'Registration successful',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Đăng nhập
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(`SELECT * FROM members WHERE username = ?`, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          metamask_address: user.metamask_address
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Đăng nhập bằng MetaMask
app.post('/api/login-metamask', (req, res) => {
  const { metamaskAddress } = req.body;

  if (!metamaskAddress) {
    return res.status(400).json({ error: 'MetaMask address is required' });
  }

  db.get(`SELECT * FROM members WHERE LOWER(metamask_address) = LOWER(?)`,
    [metamaskAddress],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'No account linked to this MetaMask address' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          metamask_address: user.metamask_address
        }
      });
    }
  );
});

// Lấy thông tin member hiện tại
app.get('/api/member', authenticateToken, (req, res) => {
  db.get(
    `SELECT
      m.id,
      m.username,
      m.role,
      m.metamask_address,
      m.current_package_slug,
      m.current_package_name,
      m.current_package_price,
      m.current_package_features,
      m.package_status,
      m.package_updated_at,
      m.created_at,
      mp.trainer_id,
      mp.goal,
      mp.weekly_sessions,
      mp.next_session_at,
      mp.schedule_notes,
      t.name AS trainer_name
    FROM members m
    LEFT JOIN member_profiles mp ON mp.member_id = m.id
    LEFT JOIN trainers t ON t.id = mp.trainer_id
    WHERE m.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

// Liên kết MetaMask
app.post('/api/link-metamask', authenticateToken, (req, res) => {
  const { metamaskAddress } = req.body;

  if (!metamaskAddress) {
    return res.status(400).json({ error: 'MetaMask address is required' });
  }

  db.run(`UPDATE members SET metamask_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [metamaskAddress, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'MetaMask linked successfully' });
    }
  );
});

// Admin: Lấy danh sách tất cả members
app.get('/api/admin/members', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`SELECT id, username, role, metamask_address, current_package_slug, current_package_name, current_package_price, current_package_features, package_status, package_updated_at, created_at FROM members ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ members: rows });
    }
  );
});

// Admin: Cập nhật member
app.put('/api/admin/members/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { role, metamask_address } = req.body;
  const memberId = req.params.id;

  db.run(`UPDATE members SET role = ?, metamask_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [role, metamask_address, memberId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json({ message: 'Member updated successfully' });
    }
  );
});

// Admin: Xóa member
app.delete('/api/admin/members/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const memberId = req.params.id;

  db.run(`DELETE FROM members WHERE id = ?`, [memberId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member deleted successfully' });
  });
});

// Tạo admin mặc định (chỉ chạy một lần)
app.post('/api/setup-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    db.run(`INSERT OR IGNORE INTO members (username, password, role) VALUES (?, ?, ?)`,
      ['admin', hashedPassword, 'admin'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Admin setup completed' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Member: Yêu cầu gói tập
app.post('/api/member/package-request', authenticateToken, (req, res) => {
  const { packageSlug, packageName, packagePrice, packageFeatures } = req.body;

  if (!packageName || !packagePrice) {
    return res.status(400).json({ error: 'Package name and price are required' });
  }

  const memberId = req.user.id;
  const memberName = req.user.username;

  db.run(
    `INSERT INTO package_requests (member_id, member_name, package_slug, package_name, package_price, package_features) VALUES (?, ?, ?, ?, ?, ?)`,
    [memberId, memberName, packageSlug || '', packageName, packagePrice, normalizePackageFeatures(packageFeatures || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        message: 'Package request created successfully',
        requestId: this.lastID
      });
    }
  );
});

// Admin: Lấy danh sách yêu cầu gói tập
app.get('/api/admin/package-requests', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT * FROM package_requests ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ requests: rows });
    }
  );
});

// Admin: Thống kê doanh thu theo gói
app.get('/api/admin/revenue-summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT package_name, package_price, package_slug
     FROM package_requests
     WHERE status = 'approved'
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const revenueByPackage = rows.reduce((accumulator, row) => {
        const key = row.package_slug || row.package_name;
        const current = accumulator[key] || {
          slug: row.package_slug || '',
          package_name: row.package_name,
          total_revenue: 0,
          approved_count: 0
        };

        current.total_revenue += parseMoney(row.package_price);
        current.approved_count += 1;
        accumulator[key] = current;
        return accumulator;
      }, {});

      const packageRevenueList = Object.values(revenueByPackage).sort((first, second) => second.total_revenue - first.total_revenue);
      const totalRevenue = packageRevenueList.reduce((sum, item) => sum + item.total_revenue, 0);

      res.json({
        totalRevenue,
        packageRevenueList
      });
    }
  );
});

// Public: Lấy danh sách gói tập
app.get('/api/packages', (req, res) => {
  db.all(
    `SELECT * FROM packages WHERE is_active = 1 ORDER BY id ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const packages = mapPackageRows(rows);

      res.json({ packages });
    }
  );
});

// Public: Lấy danh sách huấn luyện viên
app.get('/api/trainers', (req, res) => {
  db.all(
    `SELECT * FROM trainers WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ trainers: mapTrainerRows(rows) });
    }
  );
});

// Admin: Lấy danh sách huấn luyện viên
app.get('/api/admin/trainers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT * FROM trainers ORDER BY sort_order ASC, id ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ trainers: mapTrainerRows(rows) });
    }
  );
});

// Admin: Tạo huấn luyện viên mới
app.post('/api/admin/trainers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    slug,
    name,
    nickname,
    role,
    experience,
    bio,
    specialties,
    achievement,
    package_slug,
    sort_order,
    is_active,
    image_url
  } = req.body;

  if (!slug || !name || !nickname || !role || !experience || !bio || !achievement) {
    return res.status(400).json({ error: 'Missing required trainer fields' });
  }

  const serializedSpecialties = normalizeTrainerSpecialties(specialties);
  const activeValue = is_active === false || is_active === 0 || is_active === '0' ? 0 : 1;
  const sortOrderValue = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;

  db.run(
    `INSERT INTO trainers (slug, name, nickname, role, experience, bio, specialties, achievement, package_slug, sort_order, is_active, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(slug).trim(),
      String(name).trim(),
      String(nickname).trim(),
      String(role).trim(),
      String(experience).trim(),
      String(bio).trim(),
      serializedSpecialties,
      String(achievement).trim(),
      String(package_slug || '').trim(),
      sortOrderValue,
      activeValue,
      image_url || ''
    ],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Slug already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        message: 'Trainer created successfully',
        trainerId: this.lastID
      });
    }
  );
});

// Admin: Cập nhật huấn luyện viên
app.put('/api/admin/trainers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const trainerId = req.params.id;
  const {
    slug,
    name,
    nickname,
    role,
    experience,
    bio,
    specialties,
    achievement,
    package_slug,
    sort_order,
    is_active,
    image_url
  } = req.body;

  if (!slug || !name || !nickname || !role || !experience || !bio || !achievement) {
    return res.status(400).json({ error: 'Missing required trainer fields' });
  }

  const serializedSpecialties = normalizeTrainerSpecialties(specialties);
  const activeValue = is_active === false || is_active === 0 || is_active === '0' ? 0 : 1;
  const sortOrderValue = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;

  db.run(
    `UPDATE trainers
     SET slug = ?,
         name = ?,
         nickname = ?,
         role = ?,
         experience = ?,
         bio = ?,
         specialties = ?,
         achievement = ?,
         package_slug = ?,
         sort_order = ?,
         is_active = ?,
         image_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      String(slug).trim(),
      String(name).trim(),
      String(nickname).trim(),
      String(role).trim(),
      String(experience).trim(),
      String(bio).trim(),
      serializedSpecialties,
      String(achievement).trim(),
      String(package_slug || '').trim(),
      sortOrderValue,
      activeValue,
      image_url || '',
      trainerId
    ],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Slug already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Trainer not found' });
      }

      res.json({ message: 'Trainer updated successfully' });
    }
  );
});

// Admin: Xóa huấn luyện viên
app.delete('/api/admin/trainers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const trainerId = req.params.id;

  db.run(
    `DELETE FROM trainers WHERE id = ?`,
    [trainerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Trainer not found' });
      }

      res.json({ message: 'Trainer deleted successfully' });
    }
  );
});

// Admin: Lấy danh sách gói tập
app.get('/api/admin/packages', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT * FROM packages ORDER BY id ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ packages: mapPackageRows(rows) });
    }
  );
});

// Admin: Tạo gói tập mới
app.post('/api/admin/packages', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { slug, name, price, features, color, image_url, is_active } = req.body;

  if (!slug || !name || !price || !features) {
    return res.status(400).json({ error: 'Slug, name, price and features are required' });
  }

  const serializedFeatures = normalizePackageFeatures(features);
  const activeValue = is_active === false || is_active === 0 || is_active === '0' ? 0 : 1;

  db.run(
    `INSERT INTO packages (slug, name, price, features, color, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [slug, name, price, serializedFeatures, color || '', image_url || '', activeValue],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Slug already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        message: 'Package created successfully',
        packageId: this.lastID
      });
    }
  );
});

// Admin: Cập nhật gói tập
app.put('/api/admin/packages/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const packageId = req.params.id;
  const { slug, name, price, features, color, image_url, is_active } = req.body;

  if (!slug || !name || !price || !features) {
    return res.status(400).json({ error: 'Slug, name, price and features are required' });
  }

  const serializedFeatures = normalizePackageFeatures(features);
  const activeValue = is_active === false || is_active === 0 || is_active === '0' ? 0 : 1;

  db.run(
    `UPDATE packages
     SET slug = ?, name = ?, price = ?, features = ?, color = ?, image_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [slug, name, price, serializedFeatures, color || '', image_url || '', activeValue, packageId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Slug already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Package not found' });
      }

      res.json({ message: 'Package updated successfully' });
    }
  );
});

// Admin: Xóa gói tập
app.delete('/api/admin/packages/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const packageId = req.params.id;

  db.run(
    `DELETE FROM packages WHERE id = ?`,
    [packageId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Package not found' });
      }

      res.json({ message: 'Package deleted successfully' });
    }
  );
});

// Admin: Cập nhật trạng thái yêu cầu gói tập
app.put('/api/admin/package-requests/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status } = req.body;
  const requestId = req.params.id;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get(
    `SELECT member_id, package_slug, package_name, package_price, package_features FROM package_requests WHERE id = ?`,
    [requestId],
    (selectErr, requestRow) => {
      if (selectErr) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!requestRow) {
        return res.status(404).json({ error: 'Request not found' });
      }

      db.run(
        `UPDATE package_requests SET status = ? WHERE id = ?`,
        [status, requestId],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Request not found' });
          }

          const finish = () => res.json({ message: 'Request updated successfully' });

          if (status === 'approved') {
            db.run(
              `UPDATE members
               SET current_package_slug = ?,
                   current_package_name = ?,
                   current_package_price = ?,
                   current_package_features = ?,
                   package_status = ?,
                   package_updated_at = CURRENT_TIMESTAMP,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                requestRow.package_slug || requestRow.package_name.toLowerCase().replace(/\s+/g, '-'),
                requestRow.package_name,
                requestRow.package_price,
                requestRow.package_features || JSON.stringify([]),
                'active',
                requestRow.member_id
              ],
              (memberErr) => {
                if (memberErr) {
                  return res.status(500).json({ error: 'Database error' });
                }

                finish();
              }
            );
            return;
          }

          finish();
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});