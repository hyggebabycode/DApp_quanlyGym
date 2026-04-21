import { ethers } from "ethers";

export const SAPPHIRE_CHAIN_ID = "0x5aff";
export const SAPPHIRE_CHAIN_PARAMS = {
  chainId: SAPPHIRE_CHAIN_ID,
  chainName: "Oasis Sapphire Testnet",
  rpcUrls: [
    import.meta.env.VITE_SAPPHIRE_RPC_URL ||
      "https://testnet.sapphire.oasis.dev",
  ],
  nativeCurrency: {
    name: "TEST",
    symbol: "TEST",
    decimals: 18,
  },
  blockExplorerUrls: ["https://explorer.oasis.io/testnet/sapphire"],
};

export const ADMIN_WALLET_ADDRESS =
  import.meta.env.VITE_ADMIN_WALLET_ADDRESS ||
  "0xC91DD3d721f7146e4DC759716b158546F2a4E551";

export const GYM_CONTRACT_ADDRESS =
  import.meta.env.VITE_GYM_MEMBERSHIP_CONTRACT_ADDRESS ||
  "0x48a9Df6e8360432C205a25F37248e4cd09A83997";

export const gymPaymentAbi = [
  "function owner() view returns (address)",
  "function treasuryWallet() view returns (address)",
  "function getMembershipPlan(uint8 _type) view returns (tuple(uint256 price, uint256 durationDays))",
  "function registerMember(string _name, uint8 _type) payable",
  "function isMember(address _memberAddress) view returns (bool)",
  "function isMembershipValid(address _memberAddress) view returns (bool)",
  "function getMemberInfo(address _memberAddress) view returns (tuple(address memberAddress, string name, uint8 membershipType, uint256 registrationDate, uint256 expiryDate, uint256 totalAttendance, bool isActive))",
  "function getTotalMembers() view returns (uint256)",
  "function getTotalRevenue() view returns (uint256)",
  "event MemberRegistered(address indexed memberAddress, string name, uint8 indexed membershipType)",
  "event MembershipRenewed(address indexed memberAddress, uint8 indexed membershipType, uint256 newExpiryDate)",
  "event PaymentReceived(address indexed memberAddress, uint256 amount, uint8 membershipType)",
];

const membershipTypeByPackageSlug = {
  basic: 0,
  pro: 1,
  vip: 1,
};

const membershipLabelByType = {
  0: "STANDARD",
  1: "VIP",
};

const resolveMembershipType = (packageSlug) =>
  membershipTypeByPackageSlug[String(packageSlug || "").toLowerCase()] ?? 0;

export const getMembershipTypeLabel = (packageSlug) =>
  membershipLabelByType[resolveMembershipType(packageSlug)] || "STANDARD";

export const isGymPaymentConfigured = () =>
  ethers.isAddress(GYM_CONTRACT_ADDRESS);

export const getBrowserProvider = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask chua duoc cai tren trinh duyet.");
  }

  return new ethers.BrowserProvider(window.ethereum);
};

export const ensureSapphireNetwork = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask chua duoc cai tren trinh duyet.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SAPPHIRE_CHAIN_ID }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [SAPPHIRE_CHAIN_PARAMS],
      });
      return;
    }

    if (error?.code === 4001) {
      throw new Error("Ban da tu choi chuyen sang mang Sapphire.");
    }

    throw new Error(
      error?.message || "Khong the chuyen sang Oasis Sapphire Testnet.",
    );
  }
};

export const connectMetaMaskWallet = async () => {
  await ensureSapphireNetwork();
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
};

export const signWalletMessage = async (message) => {
  const { signer, address } = await connectMetaMaskWallet();
  const signature = await signer.signMessage(message);

  return { address, signature };
};

export const getGymContract = async ({ withSigner = false } = {}) => {
  if (!isGymPaymentConfigured()) {
    throw new Error("Contract payment chua duoc cau hinh.");
  }

  await ensureSapphireNetwork();
  const provider = getBrowserProvider();

  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(GYM_CONTRACT_ADDRESS, gymPaymentAbi, signer);
  }

  return new ethers.Contract(GYM_CONTRACT_ADDRESS, gymPaymentAbi, provider);
};

export const getPackagePriceEth = async (packageSlug) => {
  const contract = await getGymContract();
  const membershipType = resolveMembershipType(packageSlug);
  const plan = await contract.getMembershipPlan(membershipType);

  return {
    wei: plan.price,
    eth: ethers.formatEther(plan.price),
    durationDays: Number(plan.durationDays),
    membershipType,
    membershipLabel: membershipLabelByType[membershipType],
  };
};

export const payPackageWithMetaMask = async (packageSlug, memberName) => {
  const { address } = await connectMetaMaskWallet();
  const contract = await getGymContract({ withSigner: true });
  const membershipType = resolveMembershipType(packageSlug);
  const plan = await contract.getMembershipPlan(membershipType);
  const normalizedMemberName =
    String(memberName || "").trim() || `member-${address.slice(2, 8)}`;

  const tx = await contract.registerMember(normalizedMemberName, membershipType, {
    value: plan.price,
  });
  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    walletAddress: address,
    membershipType,
    membershipLabel: membershipLabelByType[membershipType],
    amountEth: ethers.formatEther(plan.price),
    blockNumber: receipt?.blockNumber || null,
  };
};

export const getOnChainMemberProfile = async (walletAddress) => {
  const normalizedWallet = ethers.isAddress(walletAddress)
    ? ethers.getAddress(walletAddress)
    : "";

  if (!normalizedWallet) {
    return null;
  }

  const contract = await getGymContract();
  const isMember = await contract.isMember(normalizedWallet);
  if (!isMember) {
    return null;
  }

  const [memberInfo, membershipValid] = await Promise.all([
    contract.getMemberInfo(normalizedWallet),
    contract.isMembershipValid(normalizedWallet),
  ]);

  return {
    name: memberInfo.name,
    membershipType: Number(memberInfo.membershipType),
    registrationDate: Number(memberInfo.registrationDate),
    expiryDate: Number(memberInfo.expiryDate),
    totalAttendance: Number(memberInfo.totalAttendance),
    isActive: Boolean(memberInfo.isActive),
    membershipValid: Boolean(membershipValid),
  };
};

export const getContractSummary = async () => {
  const contract = await getGymContract();
  const [owner, treasuryWallet, totalMembers, totalRevenue] = await Promise.all([
    contract.owner(),
    contract.treasuryWallet(),
    contract.getTotalMembers(),
    contract.getTotalRevenue(),
  ]);

  return {
    owner,
    treasuryWallet,
    totalMembers: Number(totalMembers),
    totalRevenue: ethers.formatEther(totalRevenue),
  };
};

export const shortAddress = (value = "") =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";
