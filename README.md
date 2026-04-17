# Demo App

Ứng dụng demo với React frontend và Node.js backend, tích hợp MetaMask.

## Cấu trúc

```
demo/
├── backend/          # Node.js + Express + SQLite
├── smartcontract/    # Solidity contract thanh toan goi tap
├── src/             # React frontend
│   └── web3/         # Helpers ket noi MetaMask va contract
├── public/          # Static assets
└── package.json     # Frontend dependencies
```

## Cau hinh Smart Contract Payment (MetaMask)

1. Deploy contract `smartcontract/GymPackagePayment.sol` (xem huong dan trong `smartcontract/README.md`).
2. Tao file `.env` tai thu muc `demo`, hoac copy tu `.env.example` roi dien dia chi contract:

```bash
VITE_GYM_PAYMENT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

3. Khoi dong lai frontend de nhan bien moi truong:

```bash
npm run dev
```

Khi da cau hinh dung, trang Pricing se hien nut `Thanh toan MetaMask` cho moi goi tap.

## Cài đặt

```bash
# Cài đặt frontend dependencies
npm install

# Cài đặt backend dependencies
cd backend
npm install
cd ..
```

## Chạy ứng dụng

### Chạy cả frontend và backend cùng lúc
```bash
npm run dev:full
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
