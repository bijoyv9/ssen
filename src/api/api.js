const API_BASE_URL = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getCurrentUser: () => apiRequest('/auth/me'),

  updateProfile: (profileData) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// Files API
export const filesAPI = {
  getFiles: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/files?${searchParams}`);
  },

  getFile: (id) => apiRequest(`/files/${id}`),

  createFile: (fileData) =>
    apiRequest('/files', {
      method: 'POST',
      body: JSON.stringify(fileData),
    }),

  updateFile: (id, fileData) =>
    apiRequest(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fileData),
    }),

  deleteFile: (id) =>
    apiRequest(`/files/${id}`, {
      method: 'DELETE',
    }),

  getFileStats: () => apiRequest('/files/stats/overview'),
};

// Users API
export const usersAPI = {
  getUsers: () => apiRequest('/users'),

  getUser: (id) => apiRequest(`/users/${id}`),

  updateUser: (id, userData) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  changeUserPassword: (id, password) =>
    apiRequest(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),

  deactivateUser: (id) =>
    apiRequest(`/users/${id}/deactivate`, {
      method: 'PUT',
    }),

  activateUser: (id) =>
    apiRequest(`/users/${id}/activate`, {
      method: 'PUT',
    }),

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),

  getUserStats: () => apiRequest('/users/stats/overview'),
};

// Invoices API
export const invoicesAPI = {
  getInvoices: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/invoices?${searchParams}`);
  },

  getInvoice: (id) => apiRequest(`/invoices/${id}`),

  createInvoice: (invoiceData) =>
    apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    }),

  updateInvoice: (id, invoiceData) =>
    apiRequest(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    }),

  deleteInvoice: (id) =>
    apiRequest(`/invoices/${id}`, {
      method: 'DELETE',
    }),

  getInvoiceStats: () => apiRequest('/invoices/stats/overview'),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
};