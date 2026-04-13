import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id) => {
    if (!window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    try {
      await apiClient.delete(`/users/${id}`);
      alert('Пользователь успешно заблокирован');
      fetchUsers(); // Перезагружаем список
    } catch (err) {
      console.error('Ошибка при блокировке:', err);
      alert('Ошибка при блокировке пользователя');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Управление пользователями (Админ панель)</h2>
      {users.length === 0 ? (
        <p>Нет зарегистрированных пользователей.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', borderColor: '#444' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: '#fff' }}>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.role}</td>
                <td>
                  <button 
                    onClick={() => handleBlock(user.id)}
                    style={{ 
                      padding: '5px 10px', 
                      cursor: 'pointer',
                      backgroundColor: '#d9534f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Заблокировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersList;