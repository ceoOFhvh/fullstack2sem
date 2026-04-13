import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const api = {
  // Получить все товары
  getProducts: async () => {
    try {
      const response = await apiClient.get('/products');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении товаров:', error);
      throw error;
    }
  },

  // Получить товар по ID
  getProductById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении товара с ID ${id}:`, error);
      throw error;
    }
  },

  // Создать новый товар
  createProduct: async (product) => {
    try {
      const response = await apiClient.post('/products', product);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании товара:', error);
      throw error;
    }
  },

  // Обновить товар
  updateProduct: async (id, product) => {
    try {
      const response = await apiClient.patch(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при обновлении товара с ID ${id}:`, error);
      throw error;
    }
  },

  // Удалить товар
  deleteProduct: async (id) => {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при удалении товара с ID ${id}:`, error);
      throw error;
    }
  }
};