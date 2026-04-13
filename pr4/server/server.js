const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

// Товары (минимум 10)
let products = [
  { id: nanoid(6), name: 'Ноутбук', category: 'Электроника', description: 'Мощный игровой ноутбук', price: 1200, stock: 5 },
  { id: nanoid(6), name: 'Смартфон', category: 'Электроника', description: 'Последняя модель', price: 800, stock: 10 },
  { id: nanoid(6), name: 'Наушники', category: 'Аксессуары', description: 'Беспроводные', price: 150, stock: 20 },
  { id: nanoid(6), name: 'Клавиатура', category: 'Аксессуары', description: 'Механическая', price: 100, stock: 15 },
  { id: nanoid(6), name: 'Монитор', category: 'Электроника', description: '4K 27 дюймов', price: 400, stock: 7 },
  { id: nanoid(6), name: 'Мышь', category: 'Аксессуары', description: 'Игровая', price: 50, stock: 30 },
  { id: nanoid(6), name: 'Планшет', category: 'Электроника', description: 'Для рисования', price: 600, stock: 4 },
  { id: nanoid(6), name: 'Фотоаппарат', category: 'Фото', description: 'Зеркальный', price: 900, stock: 3 },
  { id: nanoid(6), name: 'Штатив', category: 'Фото', description: 'Алюминиевый', price: 70, stock: 12 },
  { id: nanoid(6), name: 'Внешний диск', category: 'Хранение', description: '2TB', price: 90, stock: 8 }
];

// Логирование
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.path}`);
  });
  next();
});

// Получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Получить товар по ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Создать товар
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;
  const newProduct = {
    id: nanoid(6),
    name,
    category,
    description,
    price: Number(price),
    stock: Number(stock)
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Обновить товар
app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { name, category, description, price, stock } = req.body;
  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });

  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Запуск
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});