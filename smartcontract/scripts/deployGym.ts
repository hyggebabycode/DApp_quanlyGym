import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GymMembership contract...\n");

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  if (!deployer) {
    throw new Error("No deployer account found. Check PRIVATE_KEY in .env");
  }

  const configuredOwner = (process.env.OWNER_WALLET || deployer.address).trim();
  const configuredTreasury = (
    process.env.TREASURY_WALLET ||
    configuredOwner
  ).trim();

  const envAdmins = (process.env.INITIAL_ADMINS || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const signerAdmins = signers.slice(1, 4).map((signer) => signer.address);
  const initialAdminSet = new Set(
    (envAdmins.length > 0 ? envAdmins : signerAdmins).filter(Boolean),
  );
  initialAdminSet.add(configuredOwner);
  const initialAdmins = [...initialAdminSet];

  console.log(" Deployer:", deployer.address);
  console.log(" Owner:", configuredOwner);
  console.log(" Treasury:", configuredTreasury);
  initialAdmins.forEach((admin, index) => {
    console.log(` Admin ${index + 1}:`, admin);
  });

  const GymMembership = await ethers.getContractFactory("GymMembership");
  const gym = await GymMembership.deploy(
    configuredOwner,
    configuredTreasury,
    initialAdmins,
  );

  await gym.waitForDeployment();

  const contractAddress = await gym.getAddress();
  const ownerWallet = await gym.owner();
  const treasuryWallet = await gym.treasuryWallet();
  const standardPlan = await gym.getMembershipPlan(0);
  const vipPlan = await gym.getMembershipPlan(1);

  console.log("\nContract deployed:", contractAddress);
  console.log("\nMembership Plans:");
  console.log(
    "  STANDARD:",
    ethers.formatEther(standardPlan.price),
    "TEST /",
    standardPlan.durationDays.toString(),
    "days",
  );
  console.log(
    "  VIP:     ",
    ethers.formatEther(vipPlan.price),
    "TEST /",
    vipPlan.durationDays.toString(),
    "days",
  );

  const fs = require("fs");
  const deploymentInfo = {
    contractAddress,
    owner: ownerWallet,
    treasuryWallet,
    deployer: deployer.address,
    admins: initialAdmins,
    membershipPlans: {
      STANDARD: {
        price: `${ethers.formatEther(standardPlan.price)} TEST`,
        durationDays: standardPlan.durationDays.toString(),
      },
      VIP: {
        price: `${ethers.formatEther(vipPlan.price)} TEST`,
        durationDays: vipPlan.durationDays.toString(),
      },
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
