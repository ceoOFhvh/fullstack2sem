const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// ==================== КОНФИГУРАЦИЯ JWT ====================
const ACCESS_SECRET = 'access_secret_key_pr11'; 
const REFRESH_SECRET = 'refresh_secret_key_pr11'; 

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // Порт вашего фронтенда

// Хранилища данных
let users = [];
let products = [
  { id: nanoid(6), title: 'Ноутбук', category: 'Электроника', description: 'Мощный игровой ноутбук', price: 1200 },
  { id: nanoid(6), title: 'Смартфон', category: 'Электроника', description: 'Последняя модель', price: 800 },
];

const refreshTokens = new Set();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

// ==================== ГЕНЕРАЦИЯ ТОКЕНОВ ====================

function generateAccessToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role // ВАЖНО: роль включена в токен
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      role: user.role // ВАЖНО: роль включена в токен
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// ==================== MIDDLEWARE ====================

// 1. Проверка аутентификации (наличие валидного Access Token)
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; // Сохраняем данные пользователя (включая роль) в запрос
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

// 2. Проверка ролей (RBAC)
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    // Если пользователь не аутентифицирован или его роли нет в списке разрешенных
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
}

// ==================== МАРШРУТЫ АВТОРИЗАЦИИ ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *                 default: user
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (findUserByEmail(email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);
  
  const newUser = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    hashedPassword,
    role: role || 'user' // По умолчанию роль 'user'
  };

  users.push(newUser);
  
  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  // Возвращаем токены и роль сразу, чтобы фронтенд знал, кто вошел
  res.json({ 
    accessToken, 
    refreshToken,
    role: user.role 
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 */
app.post("/api/auth/refresh", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Refresh token is missing in headers" });
  }

  const refreshToken = authHeader.split(" ")[1];

  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: "Invalid or revoked refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Ротация токенов
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken,
      role: user.role
    });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить инфо о себе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ==================== МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ (ТОЛЬКО ADMIN) ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список всех пользователей (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users", authMiddleware, roleMiddleware('admin'), (req, res) => {
  const usersWithoutPasswords = users.map(({ hashedPassword, ...rest }) => rest);
  res.json(usersWithoutPasswords);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware('admin'), (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) return res.status(404).json({ error: "User not found" });

  const { email, first_name, last_name, role } = req.body;
  
  if (email) users[userIndex].email = email;
  if (first_name) users[userIndex].first_name = first_name;
  if (last_name) users[userIndex].last_name = last_name;
  if (role) users[userIndex].role = role;

  const { hashedPassword: _, ...userWithoutPassword } = users[userIndex];
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить/Заблокировать пользователя (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware('admin'), (req, res) => {
  const initialLength = users.length;
  users = users.filter(u => u.id !== req.params.id);
  
  if (users.length === initialLength) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.status(204).send();
});


// ==================== МАРШРУТЫ ТОВАРОВ ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (Доступно всем, включая гостей)
 *     tags: [Products]
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (Seller, Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.post("/api/products", authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const { title, category, description, price } = req.body;
  
  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newProduct = {
    id: nanoid(6),
    title: title.trim(),
    category: category.trim(),
    description: description ? description.trim() : '',
    price: Number(price)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (Доступно всем)
 *     tags: [Products]
 */
app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (Seller, Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware('seller', 'admin'), (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) return res.status(404).json({ error: "Product not found" });

  const { title, category, description, price } = req.body;

  if (title) products[productIndex].title = title.trim();
  if (category) products[productIndex].category = category.trim();
  if (description !== undefined) products[productIndex].description = description.trim();
  if (price !== undefined) products[productIndex].price = Number(price);

  res.json(products[productIndex]);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (Admin ONLY)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware('admin'), (req, res) => {
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);
  
  if (products.length === initialLength) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  res.status(204).send();
});

// ==================== SWAGGER SETUP ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API PR11: RBAC System',
      version: '1.0.0',
      description: 'API with Role-Based Access Control (User, Seller, Admin)',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Local Server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ЗАПУСК СЕРВЕРА ====================
app.listen(port, () => {
  console.log(`Server PR11 running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});