import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProductsList from './components/ProductsList';
import ProductForm from './components/ProductForm';
import Profile from './components/Profile';
import UsersList from './components/UsersList'; // Импортируем новый компонент
import Header from './components/Header'; // Импортируем шапку

// Компонент защиты маршрутов с проверкой роли
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');

  // Если нет токена - редирект на логин
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Если указаны разрешенные роли и текущая роль не входит в них
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />; // Или можно сделать страницу "Доступ запрещен"
  }

  return children;
}

function App() {
  return (
    <Router>
      <Header /> {/* Шапка с именем, ролью и кнопками */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Маршруты товаров */}
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <PrivateRoute allowedRoles={['seller', 'admin']}>
              <ProductForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <PrivateRoute allowedRoles={['seller', 'admin']}>
              <ProductForm />
            </PrivateRoute>
          }
        />
        
        {/* Маршрут профиля */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* НОВЫЙ МАРШРУТ: Управление пользователями (только админ) */}
        <Route
          path="/users"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <UsersList />
            </PrivateRoute>
          }
        />

        {/* Редирект с главной страницы на товары */}
        <Route path="/" element={<Navigate to="/products" />} />
      </Routes>
    </Router>
  );
}

export default App;