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
// Используем разные секреты для разных типов токенов
const ACCESS_SECRET = 'access_secret_key_pr9'; 
const REFRESH_SECRET = 'refresh_secret_key_pr9'; 

const ACCESS_EXPIRES_IN = '15m'; // Access токен живет 15 минут
const REFRESH_EXPIRES_IN = '7d';  // Refresh токен живет 7 дней

// Middleware
app.use(express.json());
// Разрешаем запросы с фронтенда (если он на порту 3001)
app.use(cors({ origin: 'http://localhost:3001' }));

// Хранилища данных
let users = [];
let products = [
  { id: nanoid(6), title: 'Ноутбук', category: 'Электроника', description: 'Мощный игровой ноутбук', price: 1200 },
  { id: nanoid(6), title: 'Смартфон', category: 'Электроника', description: 'Последняя модель', price: 800 },
  { id: nanoid(6), title: 'Наушники', category: 'Аксессуары', description: 'Беспроводные', price: 150 },
  { id: nanoid(6), title: 'Клавиатура', category: 'Аксессуары', description: 'Механическая', price: 100 },
  { id: nanoid(6), title: 'Монитор', category: 'Электроника', description: '4K 27 дюймов', price: 400 }
];

// Хранилище выданных refresh-токенов (в памяти)
const refreshTokens = new Set();

// Функции для bcrypt
async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Функция поиска пользователя
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

// Функция поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// ==================== ГЕНЕРАЦИЯ ТОКЕНОВ ====================

function generateAccessToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email 
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// ==================== JWT MIDDLEWARE ====================
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";

  // Ожидаем формат: Bearer <token>
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    // Проверяем Access токен с помощью ACCESS_SECRET
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

// ==================== SWAGGER ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина (PR9: Refresh Tokens)',
      version: '1.0.0',
      description: 'API с регистрацией, логином и механизмом Refresh/Access токенов',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== СХЕМЫ SWAGGER ====================
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

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
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);
  
  const newUser = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    hashedPassword
  };

  users.push(newUser);
  
  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (получение пары токенов)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает Access и Refresh токены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
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

  const isValid = await verifyPassword(password, user.hashedPassword);
  
  if (isValid) {
    // Генерируем оба токена
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Сохраняем refresh-токен в хранилище
    refreshTokens.add(refreshToken);

    res.status(200).json({ 
      accessToken, 
      refreshToken 
    });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов через Refresh Token (из заголовков)
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer <refresh_token>"
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Токен отсутствует или невалиден
 *       403:
 *         description: Токен отозван или истек
 */
app.post("/api/auth/refresh", (req, res) => {
  // 1. Получаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Refresh token is missing in headers" });
  }

  const refreshToken = authHeader.split(" ")[1];

  // 2. Проверяем, есть ли токен в нашем хранилище
  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: "Invalid or revoked refresh token" });
  }

  try {
    // 3. Верифицируем токен с помощью REFRESH_SECRET
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    // Находим пользователя по ID из токена
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 4. Ротация токенов:
    // Удаляем старый refresh-токен из хранилища
    refreshTokens.delete(refreshToken);

    // Генерируем новую пару
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Добавляем новый refresh-токен в хранилище
    refreshTokens.add(newRefreshToken);

    // 5. Возвращаем новую пару
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    // Если токен просрочен или подделан
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ==================== МАРШРУТЫ ДЛЯ ТОВАРОВ (ЗАЩИЩЕННЫЕ) ====================

app.post("/api/products", authMiddleware, (req, res) => {
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

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { title, category, description, price } = req.body;

  if (title) product.title = title.trim();
  if (category) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  
  if (!exists) {
    return res.status(404).json({ error: "Product not found" });
  }

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер PR9 запущен на http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});