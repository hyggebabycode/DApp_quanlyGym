#!/usr/bin/env node

/**
 * scripts/setup.js
 * Setup script để kiểm tra environment và kết nối blockchain
 * Chạy bằng: node scripts/setup.js
 */

const { ethers } = require("ethers");
const config = require("../config");
const logger = require("../utils/logger");

async function checkEnvironment() {
  console.log("🔍 Kiểm tra environment...\n");

  // Check required env vars
  const required = ["RPC_URL", "PRIVATE_KEY", "CONTRACT_ADDRESS"];
  let allGood = true;

  for (const key of required) {
    if (process.env[key]) {
      console.log(`✅ ${key}: ${key === "PRIVATE_KEY" ? "[HIDDEN]" : process.env[key]}`);
    } else {
      console.log(`❌ ${key}: Thiếu`);
      allGood = false;
    }
  }

  if (!allGood) {
    console.log("\n❌ Thiếu các biến môi trường bắt buộc. Vui lòng kiểm tra file .env");
    process.exit(1);
  }

  console.log("\n✅ Environment OK\n");
}

async function checkBlockchainConnection() {
  console.log("🔗 Kiểm tra kết nối blockchain...\n");

  try {
    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

    // Check connection
    const network = await provider.getNetwork();
    console.log(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Check block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block: ${blockNumber}`);

    // Check wallet
    const wallet = new ethers.Wallet(config.blockchain.privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`✅ Wallet: ${wallet.address}`);
    console.log(`✅ Balance: ${ethers.formatEther(balance)} ETH`);

    // Check contract
    const contractAbi = require("../abi/GymManager.json");
    const contract = new ethers.Contract(config.blockchain.contractAddress, contractAbi, provider);

    const owner = await contract.owner();
    console.log(`✅ Contract owner: ${owner}`);

    const fee = await contract.membershipFee();
    console.log(`✅ Membership fee: ${ethers.formatEther(fee)} ETH`);

    console.log("\n✅ Blockchain connection OK\n");

  } catch (error) {
    console.log(`❌ Lỗi kết nối blockchain: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Gym DApp Backend Setup\n");

  try {
    await checkEnvironment();
    await checkBlockchainConnection();

    console.log("🎉 Setup hoàn thành! Backend sẵn sàng chạy.\n");
    console.log("Chạy lệnh sau để start server:");
    console.log("  npm start");
    console.log("  # hoặc");
    console.log("  npm run dev  # development mode\n");

  } catch (error) {
    console.log(`❌ Setup thất bại: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironment, checkBlockchainConnection };