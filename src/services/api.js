const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // File operations
  async getFiles() {
    return this.request('/files');
  }

  async createFile(fileData) {
    return this.request('/files', {
      method: 'POST',
      body: fileData,
    });
  }

  async updateFile(id, fileData) {
    return this.request(`/files/${id}`, {
      method: 'PUT',
      body: fileData,
    });
  }

  async deleteFile(id) {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoice operations
  async getInvoices() {
    return this.request('/invoices');
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: invoiceData,
    });
  }

  async updateInvoice(id, invoiceData) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: invoiceData,
    });
  }

  async deleteInvoice(id) {
    return this.request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();