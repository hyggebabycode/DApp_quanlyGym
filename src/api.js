const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const SESSION_TOKEN_KEY = "powergym_token";
const SESSION_USER_KEY = "powergym_user";

const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await readJson(response);

  if (!response.ok) {
    return {
      error: data.error || `API error (${response.status})`,
    };
  }

  return data;
};

export const session = {
  get token() {
    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  },
  get user() {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setAuth(nextToken, nextUser) {
    localStorage.setItem(SESSION_TOKEN_KEY, nextToken);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(nextUser));
  },
  clear() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
  },
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
});

export const api = {
  register: async ({ username, password, fullName }) =>
    request("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, fullName }),
    }),

  login: async ({ username, password }) =>
    request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  getWalletChallenge: async (walletAddress) =>
    request("/auth/wallet/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    }),

  verifyWalletLogin: async ({ walletAddress, signature }) =>
    request("/auth/wallet/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, signature }),
    }),

  getLinkWalletChallenge: async (walletAddress) =>
    request("/member/link-wallet/challenge", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ walletAddress }),
    }),

  verifyLinkWallet: async ({ walletAddress, signature }) =>
    request("/member/link-wallet/verify", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ walletAddress, signature }),
    }),

  getCurrentMember: async () =>
    request("/member", {
      headers: authHeaders(),
    }),

  getMemberPayments: async () =>
    request("/member/payments", {
      headers: authHeaders(),
    }),

  createPackageRequest: async (packageSlug) =>
    request("/member/package-request", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ packageSlug }),
    }),

  confirmPayment: async ({ txHash, packageSlug, walletAddress }) =>
    request("/member/payments/confirm", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ txHash, packageSlug, walletAddress }),
    }),

  getPackages: async () => request("/packages"),

  getTrainers: async () => request("/trainers"),

  submitContact: async (payload) =>
    request("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getAdminDashboard: async () =>
    request("/admin/dashboard", {
      headers: authHeaders(),
    }),

  getAllMembers: async () =>
    request("/admin/members", {
      headers: authHeaders(),
    }),

  updateMember: async (memberId, updates) =>
    request(`/admin/members/${memberId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    }),

  deleteMember: async (memberId) =>
    request(`/admin/members/${memberId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),

  getPackageRequests: async () =>
    request("/admin/package-requests", {
      headers: authHeaders(),
    }),

  updatePackageRequest: async (requestId, status) =>
    request(`/admin/package-requests/${requestId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  getAdminPayments: async () =>
    request("/admin/payments", {
      headers: authHeaders(),
    }),

  getAdminContacts: async () =>
    request("/admin/contacts", {
      headers: authHeaders(),
    }),

  getAdminPackages: async () =>
    request("/admin/packages", {
      headers: authHeaders(),
    }),

  createPackage: async (payload) =>
    request("/admin/packages", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  updatePackage: async (packageId, payload) =>
    request(`/admin/packages/${packageId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  deletePackage: async (packageId) =>
    request(`/admin/packages/${packageId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),

  getAdminTrainers: async () =>
    request("/admin/trainers", {
      headers: authHeaders(),
    }),

  createTrainer: async (payload) =>
    request("/admin/trainers", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  updateTrainer: async (trainerId, payload) =>
    request(`/admin/trainers/${trainerId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  deleteTrainer: async (trainerId) =>
    request(`/admin/trainers/${trainerId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
};
