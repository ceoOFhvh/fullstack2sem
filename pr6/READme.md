Интернет-магазин

Что сделано:
- Создан сервер на Express с API для товаров
- Написаны методы: GET, POST, PATCH, DELETE
- Данные хранятся в массиве (10 товаров)
- Добавлен Swagger для документации API
- Сделан клиент на React с формой для товаров
- Клиент получает данные с сервера через axios

Технологии:
- Node.js, Express, nanoid, cors
- Swagger (swagger-jsdoc, swagger-ui-express)
- React, axios, SCSS

Как запустить:

Сервер:
cd pr5/server
npm install
node server.js
http://localhost:3000/api-docs - документация
http://localhost:3000/api/products - список товаров

Клиент:
cd pr5/client
npm install
npm start
http://localhost:3001 - сам магазин

Структура:
pr4/ - базовая версия (клиент + сервер)
pr5/ - версия со Swagger
README.md - этот файл

Ссылка на репозиторий:
https://github.com/ceoOFhvh/fullstack2sem