import { ethers } from 'ethers'

export const gymPaymentAbi = [
  'function getPackagePrice(string packageSlug) view returns (uint256)',
  'function payForPackage(string packageSlug) payable',
  'event PackagePaid(address indexed payer, string packageSlug, uint256 amount, uint256 timestamp)'
]

const contractAddress = import.meta.env.VITE_GYM_PAYMENT_CONTRACT_ADDRESS || ''

export const isGymPaymentConfigured = () => ethers.isAddress(contractAddress)

const getBrowserProvider = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask chưa được cài trên trình duyệt.')
  }

  return new ethers.BrowserProvider(window.ethereum)
}

export const connectMetaMaskWallet = async () => {
  const provider = getBrowserProvider()
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  return { provider, signer, address }
}

const getContract = async (withSigner = false) => {
  if (!isGymPaymentConfigured()) {
    throw new Error('Chưa cấu hình địa chỉ smart contract. Hãy set VITE_GYM_PAYMENT_CONTRACT_ADDRESS trong file .env')
  }

  const provider = getBrowserProvider()
  if (withSigner) {
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, gymPaymentAbi, signer)
  }

  return new ethers.Contract(contractAddress, gymPaymentAbi, provider)
}

export const getPackagePriceEth = async (packageSlug) => {
  const contract = await getContract(false)
  const weiValue = await contract.getPackagePrice(packageSlug)
  return {
    wei: weiValue,
    eth: ethers.formatEther(weiValue)
  }
}

export const payPackageWithMetaMask = async (packageSlug) => {
  await connectMetaMaskWallet()
  const contract = await getContract(true)
  const priceWei = await contract.getPackagePrice(packageSlug)

  if (priceWei <= 0n) {
    throw new Error('Gói tập chưa được cấu hình giá thanh toán trên smart contract.')
  }

  const tx = await contract.payForPackage(packageSlug, { value: priceWei })
  const receipt = await tx.wait()

  return {
    txHash: receipt?.hash || tx.hash,
    blockNumber: receipt?.blockNumber
  }
}
