import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchProducts(); // Перезагружаем список
    } catch (err) {
      alert('Не удалось удалить товар');
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Товары</h2>
      <Link to="/products/new">+ Добавить товар</Link>
      <ul>
        {products.map((product) => (
          <li key={product.id} style={{ marginBottom: '10px' }}>
            <strong>{product.title}</strong> — {product.price} руб.
            <Link to={`/products/${product.id}`}> | Подробнее</Link>
            <button onClick={() => handleDelete(product.id)} style={{ marginLeft: '10px' }}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsList;