# DApp_quanlyGym

Ung dung DApp quan ly phong gym voi bo khung Hardhat co ban + giao dien frontend tinh.

## Cau truc du an

- contracts/: Smart contract Solidity
- ignition/modules/: Module deploy bang Hardhat Ignition
- test/: Unit test bang Hardhat + Chai
- hardhat.config.ts: Cau hinh Hardhat
- index.html, app.js, styles.css: Frontend demo ket noi vi

## Bat dau nhanh

1. Cai dependency:

```bash
npm install
```

2. Compile contract:

```bash
npm run compile
```

3. Chay test:

```bash
npm test
```

4. Chay local node:

```bash
npm run node
```

5. Deploy local (mo terminal moi):

```bash
npm run deploy:local
```

6. Frontend demo: mo index.html bang Live Server va bam "Ket noi vi".

## Hop dong mau

GymManager.sol cung cap cac chuc nang co ban:

- Mua goi tap theo gia co dinh
- Gia han goi tap
- Truy van thong tin goi tap cua user
- Owner rut tien tu hop dong