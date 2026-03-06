# hono-admin

Легковесный бэкенд на Hono + SQLite для лендингов с админкой.

## Установка и запуск

```bash
cd hono-admin
npm install
npm run dev        # dev с hot reload (tsx watch)
npm run build      # компиляция в dist/
npm start          # production (node dist/index.js)
```

Порт: 3111

## .env

```
JWT_SECRET=ваш_секрет_для_jwt
TELEGRAM_BOT_TOKEN=токен_от_BotFather
TELEGRAM_CHAT_ID=id_чата_для_уведомлений
```

## Структура

```
src/
  index.ts              — точка входа, Hono app, порт 3111
  db.ts                 — SQLite (better-sqlite3), таблицы users + leads, seed admin
  telegram.ts           — отправка уведомлений через Telegram Bot API (https модуль)
  middleware/
    auth.ts             — JWT verify (hono/jwt, HS256) + role check (admin/user)
  routes/
    auth.ts             — POST /auth/register, POST /auth/login
    users.ts            — CRUD /users (только admin)
    leads.ts            — POST /leads (публичный), GET/PATCH /leads (admin)
```

## API

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | /auth/register | публичный | Регистрация, возвращает JWT |
| POST | /auth/login | публичный | Логин, возвращает JWT |
| GET | /users | admin | Список пользователей |
| GET | /users/:id | admin | Один пользователь |
| POST | /users | admin | Создать пользователя |
| PATCH | /users/:id | admin | Обновить поля |
| DELETE | /users/:id | admin | Удалить |
| POST | /leads | публичный | Создать заявку → SQLite + Telegram |
| GET | /leads | admin | Список заявок |
| PATCH | /leads/:id | admin | Сменить статус (new/processed/rejected) |

## Стек

- **Hono** — веб-фреймворк (~14KB)
- **better-sqlite3** — SQLite, файловая БД (admin.db), без Docker
- **bcryptjs** — хеширование паролей
- **hono/jwt** — sign/verify JWT (HS256, exp 24h)
- **dotenv** — переменные окружения
- **tsx** — dev-сервер с hot reload

## Ключевые решения

- JWT secret из `process.env.JWT_SECRET` (fallback: 'hono-admin-secret')
- Seed admin: `admin@admin.com` / `admin123` — создаётся автоматически при старте
- SQLite WAL mode + foreign keys ON
- Telegram через `https` модуль (не fetch) — обход системного прокси
- env читается лениво (внутри функции) — dotenv грузится в index.ts после импортов
- Роли: admin и user. CRUD /users и GET/PATCH /leads — только admin
- POST /leads — публичный, для форм с лендинга

## БД (admin.db)

```sql
users:  id, email (unique), password (bcrypt), name, role (admin|user), created_at
leads:  id, name, phone, message, status (new|processed|rejected), created_at
```

## Деплой

VPS (TimeWeb, Reg.ru, Beget) — Node.js + pm2. SQLite — один файл, бэкап через cp.
