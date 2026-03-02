import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Товары
  getProducts: async () => {
    const res = await apiClient.get('/products');
    return res.data;
  },
  
  getProductById: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },
  
  createProduct: async (product) => {
    const res = await apiClient.post('/products', product);
    return res.data;
  },
  
  updateProduct: async (id, product) => {
    const res = await apiClient.put(`/products/${id}`, product);
    return res.data;
  },
  
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },

  // Авторизация
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  }
};