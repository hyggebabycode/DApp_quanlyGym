const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletStatus = document.getElementById("walletStatus");
let connectedAccount = null;

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setConnectionState(account, label = "Da dang nhap") {
  connectedAccount = account;
  connectBtn.disabled = !!account;
  disconnectBtn.disabled = !account;

  if (account) {
    walletStatus.textContent = `${label}: ${shortAddress(account)}`;
    return;
  }

  walletStatus.textContent = "Da ngat ket noi tren ung dung.";
}

function buildLoginMessage(account) {
  const nonce = Date.now();
  return `Dang nhap DApp Quan ly Gym\nVi: ${account}\nNonce: ${nonce}`;
}

async function signLoginMessage(account) {
  const message = buildLoginMessage(account);
  await window.ethereum.request({
    method: "personal_sign",
    params: [message, account],
  });
}

async function connectWallet() {
  if (!window.ethereum) {
    walletStatus.textContent =
      "Khong tim thay vi Web3. Hay cai MetaMask de tiep tuc.";
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      walletStatus.textContent = "Khong co tai khoan nao duoc cap quyen.";
      return;
    }

    walletStatus.textContent = "Dang xac thuc dang nhap...";
    await signLoginMessage(accounts[0]);
    setConnectionState(accounts[0], "Da dang nhap");
  } catch (error) {
    if (error && error.code === 4001) {
      walletStatus.textContent = "Ban da huy xac thuc. Vui long thu lai.";
      return;
    }

    walletStatus.textContent = "Ket noi vi that bai. Vui long thu lai.";
    console.error(error);
  }
}

function disconnectWallet() {
  if (!connectedAccount) {
    walletStatus.textContent = "Vi hien tai chua duoc ket noi.";
    return;
  }

  setConnectionState(null);
  walletStatus.textContent = "Da ngat ket noi. Lan sau can dang nhap lai.";
}

async function checkExistingConnection() {
  if (!window.ethereum) return;

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      walletStatus.textContent =
        `Vi da san sang: ${shortAddress(accounts[0])}. Bam Ket noi de dang nhap.`;
    }
  } catch (error) {
    console.error(error);
  }
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length > 0) {
      connectedAccount = null;
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      walletStatus.textContent =
        `Da doi tai khoan: ${shortAddress(accounts[0])}. Bam Ket noi de dang nhap lai.`;
      return;
    }

    connectedAccount = null;
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    walletStatus.textContent = "Chua ket noi vi.";
  });
}

connectBtn.addEventListener("click", connectWallet);
disconnectBtn.addEventListener("click", disconnectWallet);
checkExistingConnection();
