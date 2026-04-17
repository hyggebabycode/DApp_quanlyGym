const API_BASE_URL = 'http://localhost:3001/api';

const parseApiResponse = async (response) => {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {};
    }
  }

  if (!response.ok) {
    return {
      error: data.error || `Không thể kết nối API (${response.status})`
    };
  }

  return data;
};

// Helper function để lấy token từ localStorage
const getAuthToken = () => localStorage.getItem('token');

// Helper function để tạo headers với authorization
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
});

// API functions
export const api = {
  // Auth
  register: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  loginWithMetamask: async (metamaskAddress) => {
    const response = await fetch(`${API_BASE_URL}/login-metamask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metamaskAddress })
    });
    return response.json();
  },

  // Member
  getCurrentMember: async () => {
    const response = await fetch(`${API_BASE_URL}/member`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  linkMetamask: async (metamaskAddress) => {
    const response = await fetch(`${API_BASE_URL}/link-metamask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ metamaskAddress })
    });
    return response.json();
  },

  // Admin
  getAllMembers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/members`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateMember: async (memberId, updates) => {
    const response = await fetch(`${API_BASE_URL}/admin/members/${memberId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  deleteMember: async (memberId) => {
    const response = await fetch(`${API_BASE_URL}/admin/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Setup
  setupAdmin: async () => {
    const response = await fetch(`${API_BASE_URL}/setup-admin`, {
      method: 'POST'
    });
    return response.json();
  },

  // Package Requests
  createPackageRequest: async (packageData) => {
    const response = await fetch(`${API_BASE_URL}/member/package-request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(packageData)
    });
    return response.json();
  },

  getPackageRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/package-requests`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getRevenueSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/revenue-summary`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updatePackageRequest: async (requestId, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/package-requests/${requestId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Packages
  getPackages: async () => {
    const response = await fetch(`${API_BASE_URL}/packages`);
    return response.json();
  },

  // Trainers
  getTrainers: async () => {
    const response = await fetch(`${API_BASE_URL}/trainers`);
    return parseApiResponse(response);
  },

  getAdminTrainers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/trainers`, {
      headers: getAuthHeaders()
    });
    return parseApiResponse(response);
  },

  createTrainer: async (trainerData) => {
    const response = await fetch(`${API_BASE_URL}/admin/trainers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(trainerData)
    });
    return parseApiResponse(response);
  },

  updateTrainer: async (trainerId, trainerData) => {
    const response = await fetch(`${API_BASE_URL}/admin/trainers/${trainerId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(trainerData)
    });
    return parseApiResponse(response);
  },

  deleteTrainer: async (trainerId) => {
    const response = await fetch(`${API_BASE_URL}/admin/trainers/${trainerId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return parseApiResponse(response);
  },

  getAdminPackages: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/packages`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createPackage: async (packageData) => {
    const response = await fetch(`${API_BASE_URL}/admin/packages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(packageData)
    });
    return response.json();
  },

  updatePackage: async (packageId, packageData) => {
    const response = await fetch(`${API_BASE_URL}/admin/packages/${packageId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(packageData)
    });
    return response.json();
  },

  deletePackage: async (packageId) => {
    const response = await fetch(`${API_BASE_URL}/admin/packages/${packageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};