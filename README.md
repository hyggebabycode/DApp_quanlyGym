# Demo App

Ứng dụng demo với React frontend và Node.js backend, tích hợp MetaMask.

## Cấu trúc

```
dapp5/
├── package.json      # Script chay 1 lenh tu thu muc dapp5
└── dapp_demo_1/
	├── backend/      # Node.js + Express + SQLite
	├── smartcontract/ # Solidity contract thanh toan goi tap
	├── src/          # React frontend
	│   └── web3/     # Helpers ket noi MetaMask va contract
	├── public/       # Static assets
	└── package.json  # Frontend dependencies
```

## Cau hinh Smart Contract Payment (MetaMask)

Luong payment trong dapp5 da duoc dong bo theo dappvs3 (GymMembership tren Oasis Sapphire Testnet):

- STANDARD: `0.5 TEST`
- VIP: `1 TEST`

1. Tao file `.env` tai thu muc `dapp_demo_1` (hoac copy tu `.env.example`).
2. Dien dia chi contract GymMembership (mac dinh da tro den address cua dappvs3):

```bash
VITE_GYM_MEMBERSHIP_CONTRACT_ADDRESS=0xB9816fC57977D5A786E654c7CF76767be63b966e
VITE_API_BASE_URL=http://localhost:3001/api
```

Luu y: voi cau hinh tren, frontend dapp5 se doc du lieu DB + smart contract tu backend local cua dapp5.

3. Khoi dong lai frontend de nhan bien moi truong:

```bash
npm run dev
```

Khi da cau hinh dung, trang Pricing se hien nut `Thanh toan MetaMask` cho moi goi tap.
Khi bam thanh toan, app se tu dong yeu cau chuyen mang MetaMask sang Oasis Sapphire Testnet.

## Cài đặt

Chay toan bo tu thu muc `dapp5`:

```bash
cd dapp5
npm run install:all
```

Neu ban dang o trong `dapp_demo_1` thi van co the cai dat nhu cu:

```bash
# Cài đặt frontend dependencies
npm install

# Cài đặt backend dependencies
cd backend
npm install
cd ..
```

## Chạy ứng dụng

### Chạy cả frontend và backend cùng lúc (tu thu muc dapp5)

```bash
cd dapp5
npm run dev:full
```

### Chạy từ dapp5 nhưng tách riêng

```bash
cd dapp5
npm run server
npm run dev
```

### Hoặc chạy riêng lẻ

Frontend (http://localhost:5173):

```bash
npm run dev
```

Backend (http://localhost:3001):

```bash
npm run server
```

## Tài khoản mặc định

- **Admin**: username: `admin`, password: `admin123`
- **Member**: Đăng ký tài khoản mới

## Tính năng

- ✅ Đăng ký/Đăng nhập
- ✅ Liên kết MetaMask
- ✅ Quản lý thành viên (Admin)
- ✅ Database SQLite
- ✅ JWT Authentication
- ✅ Responsive UI

## API Documentation

Xem `backend/README.md` để biết chi tiết về API endpoints.
