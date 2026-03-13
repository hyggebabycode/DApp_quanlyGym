import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GymManagerModule = buildModule("GymManagerModule", (m) => {
  const membershipPrice = m.getParameter("membershipPrice", 1000000000000000n);
  const membershipDuration = m.getParameter("membershipDuration", 30 * 24 * 60 * 60);

  const gymManager = m.contract("GymManager", [membershipPrice, membershipDuration]);

  return { gymManager };
});

export default GymManagerModule;
