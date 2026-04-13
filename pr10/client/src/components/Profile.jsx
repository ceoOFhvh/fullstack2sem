import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      setError('Не удалось загрузить профиль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Профиль</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Имя:</strong> {user.first_name} {user.last_name}</p>
      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
}

export default Profile;