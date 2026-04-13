import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await apiClient.get(`/products/${id}`);
      const p = res.data;
      setTitle(p.title);
      setCategory(p.category);
      setDescription(p.description || '');
      setPrice(p.price);
    } catch (err) {
      setError('Не удалось загрузить товар');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await apiClient.put(`/products/${id}`, {
          title,
          category,
          description,
          price: Number(price),
        });
      } else {
        await apiClient.post('/products', {
          title,
          category,
          description,
          price: Number(price),
        });
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isEdit ? 'Редактировать товар' : 'Новый товар'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ marginBottom: '10px', display: 'block', width: '300px' }}
        />
        <input
          type="text"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{ marginBottom: '10px', display: 'block', width: '300px' }}
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ marginBottom: '10px', display: 'block', width: '300px', height: '100px' }}
        />
        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={{ marginBottom: '10px', display: 'block', width: '300px' }}
        />
        <button type="submit">{isEdit ? 'Сохранить' : 'Создать'}</button>
      </form>
    </div>
  );
}

export default ProductForm;