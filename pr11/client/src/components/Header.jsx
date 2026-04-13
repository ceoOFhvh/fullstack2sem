import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Гость';
  const userRole = localStorage.getItem('userRole') || 'guest';
  const token = localStorage.getItem('accessToken');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <header style={{ 
      padding: '10px 20px', 
      borderBottom: '1px solid #444', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      <div>
        <strong>{userName}</strong> — <em style={{ color: '#aaa' }}>{userRole}</em>
      </div>
      <div>
        {token && (
          <>
            {userRole === 'admin' && (
              <button 
                onClick={() => navigate('/users')} 
                style={{ 
                  marginRight: '10px', 
                  padding: '5px 10px', 
                  cursor: 'pointer',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Пользователи
              </button>
            )}
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '5px 10px', 
                cursor: 'pointer',
                backgroundColor: '#d9534f',
                color: '#fff',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Выйти
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;