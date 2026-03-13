import { expect } from "chai";
import { ethers } from "hardhat";

describe("GymManager", function () {
  it("allows user to buy membership", async function () {
    const [owner, user] = await ethers.getSigners();
    const GymManager = await ethers.getContractFactory("GymManager");
    const membershipPrice = ethers.parseEther("0.001");
    const duration = 30 * 24 * 60 * 60;

    const gym = await GymManager.deploy(membershipPrice, duration);
    await gym.waitForDeployment();

    await gym
      .connect(user)
      .buyMembership("Nguyen Van A", { value: membershipPrice });

    const member = await gym.connect(user).getMyMembership();
    expect(member.fullName).to.equal("Nguyen Van A");
    expect(member.active).to.equal(true);
    expect(member.expiresAt).to.be.gt(0);
    expect(await ethers.provider.getBalance(await gym.getAddress())).to.equal(membershipPrice);

    await gym.connect(owner).withdraw();
    expect(await ethers.provider.getBalance(await gym.getAddress())).to.equal(0);
  });
});
