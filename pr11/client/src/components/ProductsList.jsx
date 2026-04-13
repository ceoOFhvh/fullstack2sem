import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchProducts(); // Перезагружаем список
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert('Ошибка при удалении товара');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Товары</h2>
      
      {/* Кнопка добавления товара видна только продавцу и админу */}
      {(userRole === 'seller' || userRole === 'admin') && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link 
            to="/products/new" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: '#fff', 
              textDecoration: 'none', 
              borderRadius: '4px' 
            }}
          >
            + Добавить товар
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Нет доступных товаров.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => (
            <li 
              key={product.id} 
              style={{ 
                padding: '15px', 
                borderBottom: '1px solid #eee', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div>
                <strong style={{ fontSize: '1.2em' }}>{product.title}</strong> — {product.price} руб.
                <Link to={`/products/${product.id}`} style={{ marginLeft: '10px', color: '#007bff' }}>
                  Подробнее
                </Link>
              </div>
              
              {/* Кнопка удаления видна только админу */}
              {userRole === 'admin' && (
                <button 
                  onClick={() => handleDelete(product.id)}
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#d9534f', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Удалить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductsList;