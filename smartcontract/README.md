# GymPackagePayment Smart Contract

Hop dong thanh toan goi tap bang ETH qua MetaMask.

## Cac ham chinh

- `setPackagePrice(string slug, uint256 priceWei)` - admin set gia goi
- `getPackagePrice(string slug)` - frontend doc gia
- `payForPackage(string slug)` - user thanh toan
- `withdraw(address to, uint256 amount)` - rut tien ve vi admin

## Deploy nhanh bang Remix

1. Mo Remix IDE va copy file `GymPackagePayment.sol`
2. Compile voi Solidity `0.8.20`
3. Deploy voi vi admin
4. Copy dia chi contract da deploy
5. Tao file `.env` o thu muc `demo`, hoac copy tu `.env.example` roi set:

```bash
VITE_GYM_PAYMENT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

6. Restart frontend (`npm run dev`)

## Gia mac dinh demo

- `basic`: `0.001` ETH
- `pro`: `0.002` ETH
- `vip`: `0.003` ETH

Admin co the doi gia bang `setPackagePrice`.
