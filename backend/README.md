# Demo Backend

Backend server cho ứng dụng demo với SQLite database.

## Cài đặt

```bash
cd backend
npm install
```

## Chạy server

```bash
npm start
# hoặc để development
npm run dev
```

Server sẽ chạy trên http://localhost:3001

## API Endpoints

### Auth
- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `POST /api/login-metamask` - Đăng nhập bằng MetaMask

### Member
- `GET /api/member` - Lấy thông tin member hiện tại
- `POST /api/link-metamask` - Liên kết MetaMask

### Packages
- `GET /api/packages` - Lấy danh sách gói tập đang hoạt động

### Admin Packages
- `GET /api/admin/packages` - Lấy toàn bộ gói tập
- `POST /api/admin/packages` - Tạo gói tập mới
- `PUT /api/admin/packages/:id` - Cập nhật gói tập
- `DELETE /api/admin/packages/:id` - Xóa gói tập

### Admin
- `GET /api/admin/members` - Lấy danh sách tất cả members
- `PUT /api/admin/members/:id` - Cập nhật member
- `DELETE /api/admin/members/:id` - Xóa member

### Setup
- `POST /api/setup-admin` - Tạo admin mặc định (username: admin, password: admin123)

## Database

Sử dụng SQLite với file `members.db`. Schema tự động tạo khi server khởi động.

Các bảng chính:
- `members` - tài khoản người dùng
- `package_requests` - yêu cầu đăng ký gói tập
- `packages` - danh sách gói tập cơ bản được seed sẵn

## Bảo mật

- Mật khẩu được hash bằng bcrypt
- JWT tokens cho authentication
- CORS enabled