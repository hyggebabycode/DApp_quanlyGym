const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const CONTRACT_ABI = require("../abi/GymManager.json");

const REQUIRED_ENV = ["RPC_URL", "PRIVATE_KEY", "CONTRACT_ADDRESS"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Thiếu biến môi trường: ${key}`);
  }
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const gymContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet,
);

module.exports = { gymContract, ethers, provider, wallet };
