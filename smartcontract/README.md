# DappSmartCont

Du an smart contract su dung Hardhat + TypeScript.

## Gioi thieu nhung gi da lam duoc

Du an da hoan thien cac phan chinh cho GymMembership va Supabase backend:

- Xay dung contract GymMembership de quan ly thanh vien, goi tap, diem danh, admin va doanh thu.
- Bo sung event day du de theo doi cac hanh dong quan trong (dang ky, gia han, diem danh, rut tien, quan ly admin).
- Them co che bao mat co ban trong contract nhu reentrancy guard va kiem soat quyen owner/admin.
- Viet bo test tong hop cho GymMembership, bao phu deployment, registration, renewal, validation, attendance, admin, financial va edge cases.
- Ho tro deploy local va deploy Sapphire testnet bang script deployGym.ts va bien moi truong .env.
- Da tich hop Supabase (PostgreSQL cloud) cho du lieu off-chain cua gym.
- Da tao schema Supabase trong sql/supabase_schema.sql va helper scripts/\_supabase.ts.
- Da bo sung script kiem tra ket noi Supabase: npm run db:supabase:test.
- Da cap nhat tai lieu huong dan va cac loi Hardhat thuong gap (HH307, HH601).

## Cai dat

```bash
npm install
```

## Cau hinh .env

Tao file `.env` trong thu muc goc (co the copy tu `.env.example`) va dien cac gia tri sau:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Luu y:

- `PRIVATE_KEY` la private key vi EVM ban dung de deploy tren network tuong ung.
- Khong commit file `.env` len git.

## Database (Supabase)

Du an da chuyen sang Supabase (PostgreSQL cloud) de luu du lieu off-chain cho gym backend.

- Schema Supabase: `sql/supabase_schema.sql`
- Helper code: `scripts/_supabase.ts`

### Mo hinh database day du (admin + user)

Nhom user/admin:

- `app_users`: thong tin user theo wallet, ten hien thi, email, trang thai.
- `app_roles`: danh muc vai tro (`owner`, `admin`, `member`).
- `app_user_roles`: phan quyen user <-> role (nhieu-nhieu).
- `admin_actions`: nhat ky hanh dong admin (audit log).

Nhom gym:

- `gym_member_profiles`: thong tin membership cua user.
- `gym_attendance_records`: lich su diem danh.

### 1. Tao bang tren Supabase

Vao Supabase SQL Editor, copy toan bo noi dung file `sql/supabase_schema.sql` va chay.

### 2. Cau hinh bien moi truong

Tao file `.env` (hoac copy tu `.env.example`) va them:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` lay trong Supabase Dashboard:

- Project Settings -> API -> Project API keys -> service_role
- Key nay co quyen cao, chi dung cho backend/scripts server-side

### 3. Kiem tra ket noi Supabase

```bash
npm run db:supabase:test
```

Neu loi ket noi:

- Kiem tra da chay `sql/supabase_schema.sql` trong SQL Editor chua
- Kiem tra dung `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY`
- Kiem tra project Supabase dang hoat dong

### Loi the khi dung Supabase

1. Truy van nhanh hon va de lam dashboard/bao cao hon so voi doc truc tiep tu blockchain.
2. PostgreSQL cloud de mo rong, backup va restore du lieu de dang.
3. Co SQL Editor + Dashboard de kiem tra du lieu truc quan.
4. Ho tro role, policy, RLS de phan quyen admin/user ro rang.
5. De ket noi voi backend/API trong giai doan mo rong san pham.
6. Giu duoc mo hinh: on-chain la nguon su that, off-chain la lop truy van va thong ke.

## Database

Du an su dung Supabase lam database chinh.

- Schema: `sql/supabase_schema.sql`
- Chay schema trong Supabase SQL Editor

## Huong dan test (GymMembership)

File test chinh cua GymMembership:

```text
test/GymMembership.test.ts
```

### 1. Chay tat ca test

```bash
npx hardhat test
```

### 2. Chi chay test GymMembership

```bash
npx hardhat test test/GymMembership.test.ts
```

### 3. Chay theo tung nhom test (de demo nhanh)

Chay nhom trien khai:

```bash
npx hardhat test test/GymMembership.test.ts --grep "Trien khai"
```

Chay nhom dang ky thanh vien:

```bash
npx hardhat test test/GymMembership.test.ts --grep "Dang ky thanh vien"
```

Chay nhom gia han membership:

```bash
npx hardhat test test/GymMembership.test.ts --grep "Gia han membership"
```

Chay nhom kiem tra membership:

```bash
npx hardhat test test/GymMembership.test.ts --grep "Kiem tra membership"
```

### 4. Neu test fail thi kiem tra gi

- Da chay `npm install` chua
- Dang o thu muc goc du an khi chay lenh chua
- Co sua contract ma chua compile lai khong (chay `npx hardhat compile`)

## Deploy

### Deploy GymMembership

Deploy local:

```bash
npx hardhat run scripts/deployGym.ts
```

Deploy Sapphire testnet:

1. Tao file `.env` trong thu muc goc.
2. Them private key theo dung format:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

3. Chay deploy:

```bash
npx hardhat run scripts/deployGym.ts --network sapphire
```

## Loi thuong gap

`Error HH307: Missing positional argument script`

- Nguyen nhan: chay `npx hardhat run` ma khong truyen file script
- Cach dung: `npx hardhat run scripts/deployGym.ts`

`Error HH601: Script deployGym.ts doesn't exist`

- Nguyen nhan: thieu duong dan `scripts/`
- Cach dung: `npx hardhat run scripts/deployGym.ts`
