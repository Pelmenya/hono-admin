# hono-admin

Легковесный бэкенд для лендингов: форма заявки, Telegram-уведомления, админка. Один процесс, один файл БД, минимум ресурсов.

## Преимущества

- **Минимальный размер** — ~14KB фреймворк, 51 зависимость, ~150 строк кода
- **Без Docker** — SQLite файл вместо PostgreSQL/MySQL, не нужен отдельный сервер БД
- **Без фреймворков на фронте** — чистый HTML + vanilla JS, мгновенная загрузка
- **Telegram-уведомления** — заявка с формы моментально приходит в чат
- **JWT авторизация** — регистрация, логин, роли (admin/user)
- **~20MB RAM** — работает на самом дешёвом VPS
- **Бэкап в одну команду** — `cp admin.db admin.db.bak`
- **Один процесс** — API + статика + админка в одном Node.js процессе
- **TypeScript** — типизация из коробки

---

## Деплой: бесплатные платформы

### Render (проще всего — 2 минуты)

Как бывший Heroku. Закинул код — само собрало и запустило.

1. Пушишь код на GitHub
2. Заходишь на [render.com](https://render.com) → **New** → **Web Service**
3. Подключаешь GitHub репо
4. Указываешь:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/index.js`
5. Идёшь в **Environment** → добавляешь:
   - `TELEGRAM_BOT_TOKEN` = токен от BotFather
   - `TELEGRAM_CHAT_ID` = id чата
6. Жмёшь **Deploy**

Даёт URL типа `hono-admin-xxxx.onrender.com`.

**Плюсы:** максимально просто, Git push = автодеплой.
**Минусы:** засыпает через 15 мин без трафика (первый запрос после сна ~30 сек). SQLite файл теряется при редеплое — для постоянных данных нужен Render Disk ($7/мес).

---

### Fly.io (лучший бесплатный продакшн)

Настоящие микро-VM. Как VPS, но управляемый. Диск персистентный — SQLite не потеряется.

```bash
# 1. Установить CLI
curl -L https://fly.io/install.sh | sh
# Windows: powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. Регистрация / логин
fly auth signup
fly auth login

# 3. Из папки проекта
cd hono-admin
fly launch
# выбираешь регион (ams = Амстердам, ближайший к РФ)
# говоришь "нет" на PostgreSQL

# 4. Создаём том для SQLite (персистентный диск)
fly volumes create data --size 1

# 5. Секреты (.env переменные)
fly secrets set TELEGRAM_BOT_TOKEN=твой_токен
fly secrets set TELEGRAM_CHAT_ID=твой_id

# 6. Деплой
fly deploy
```

Даёт URL типа `hono-admin.fly.dev`.

**Плюсы:** не засыпает, диск персистентный, 256MB RAM бесплатно.
**Минусы:** нужна банковская карта (не списывает).

---

### Railway (самый быстрый старт)

1. Заходишь на [railway.app](https://railway.app)
2. **Login** через GitHub
3. **New Project** → **Deploy from GitHub repo** → выбираешь репо
4. Railway автоматически определит Node.js, соберёт, запустит
5. Идёшь в **Variables** → добавляешь:
   - `TELEGRAM_BOT_TOKEN` = токен
   - `TELEGRAM_CHAT_ID` = id

Всё. Деплой за 2 минуты.

**Плюсы:** самый быстрый старт, автодеплой из GitHub.
**Минусы:** $5 кредит/мес бесплатно (~500 часов), потом платно.

---

### Oracle Cloud (бесплатный VPS навсегда)

Полноценный сервер — как TimeWeb, но бесплатно навсегда.

1. Регистрация на [cloud.oracle.com](https://cloud.oracle.com) (нужна карта, не списывает)
2. **Compute** → **Create Instance**
3. Выбрать **Always Free** → **Ampere (ARM)** → 1GB RAM, 50GB диск
4. Скачать SSH ключ при создании
5. Подключиться и настроить как обычный VDS (см. раздел ниже)

```bash
ssh ubuntu@ip_адрес
# дальше все шаги из "Установка на VDS"
```

**Плюсы:** 1GB RAM, 50GB диск, бесплатно навсегда, хватит на 20 таких проектов.
**Минусы:** долгая регистрация, иногда нет свободных инстансов в регионе, ARM (но Node.js работает нативно).

---

### Cloudflare Workers (Edge — самый быстрый ответ)

Код запускается на 300+ серверах Cloudflare по всему миру. Пользователь получает ответ с ближайшего.

```bash
# 1. Установить CLI
npm install -g wrangler

# 2. Логин
wrangler login              # откроется браузер

# 3. Создать проект
wrangler init hono-admin

# 4. Создать БД (D1 = облачный SQLite)
wrangler d1 create hono-db

# 5. Деплой
wrangler deploy
```

**Плюсы:** 100K запросов/день бесплатно, D1 — 5GB, молниеносная скорость.
**Минусы:** нет Node.js модулей (fs, https, better-sqlite3). Нужно переписать `db.ts` на D1 API и `telegram.ts` на `fetch`. Отдельная адаптация кода.

---

## Деплой: Россия (VPS)

| Хостинг | Цена | Конфигурация |
|---------|------|--------------|
| [TimeWeb](https://timeweb.cloud) | от 199₽/мес | 1 vCPU, 512MB, 10GB SSD |
| [Beget](https://beget.com) | от 200₽/мес | 1 vCPU, 512MB, 10GB |
| [Reg.ru](https://reg.ru) | от 199₽/мес | 1 vCPU, 512MB, 10GB |
| [Selectel](https://selectel.ru) | от 300₽/мес | Надёжнее, дата-центры в РФ |

---

## Установка на VDS (пошагово)

### 1. Подключение к серверу

```bash
ssh root@ваш_ip
```

### 2. Установка Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v  # v22.x.x
```

### 3. Установка pm2 (менеджер процессов)

```bash
npm install -g pm2
```

### 4. Создание пользователя (не работаем от root)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 5. Клонирование проекта

```bash
cd ~
git clone https://ваш-репозиторий.git hono-admin
cd hono-admin
npm install
```

### 6. Настройка .env

```bash
cp .env.example .env
nano .env
```

```
TELEGRAM_BOT_TOKEN=токен_от_BotFather
TELEGRAM_CHAT_ID=id_чата
```

**Как получить Telegram токен и chat_id:**
1. Написать `@BotFather` в Telegram → `/newbot` → скопировать токен
2. Написать своему боту любое сообщение
3. Открыть `https://api.telegram.org/bot<TOKEN>/getUpdates` → найти `chat_id`

### 7. Сборка и запуск

```bash
npm run build
pm2 start dist/index.js --name hono-admin
pm2 save
pm2 startup  # автозапуск после перезагрузки сервера
```

### 8. Проверка

```bash
curl http://localhost:3111/
```

### 9. Настройка Nginx (проксирование + домен)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/hono-admin
```

```nginx
server {
    listen 80;
    server_name ваш-домен.ru;

    location / {
        proxy_pass http://127.0.0.1:3111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hono-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. SSL (бесплатный HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ваш-домен.ru
```

Certbot автоматически обновит конфиг Nginx и настроит автопродление сертификата.

---

## Что выбрать — итог

| Задача | Лучший выбор | Почему |
|--------|-------------|--------|
| Быстро показать клиенту | **Railway** | 2 минуты, автодеплой |
| Бесплатный продакшн | **Fly.io** | Не засыпает, диск не теряется |
| Полный контроль бесплатно | **Oracle Cloud** | Свой VPS навсегда |
| Россия, без проблем | **TimeWeb** (199₽) | Простая панель, рублёвая оплата |
| Максимальная скорость | **Cloudflare** | Edge CDN, но нужна адаптация кода |

---

## После установки

- **Лендинг:** `https://ваш-домен.ru`
- **Админка:** `https://ваш-домен.ru/admin.html`
- **Логин:** `admin@admin.com` / `admin123` (сменить после первого входа!)

## Полезные команды

```bash
pm2 logs hono-admin      # логи
pm2 restart hono-admin    # перезапуск
pm2 monit                 # мониторинг CPU/RAM
cp admin.db admin.db.bak  # бэкап БД
```

## API

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | /auth/register | публичный | Регистрация → JWT |
| POST | /auth/login | публичный | Логин → JWT |
| GET | /users | admin | Список пользователей |
| GET | /users/:id | admin | Один пользователь |
| POST | /users | admin | Создать пользователя |
| PATCH | /users/:id | admin | Обновить |
| DELETE | /users/:id | admin | Удалить |
| POST | /leads | публичный | Заявка → SQLite + Telegram |
| GET | /leads | admin | Список заявок |
| PATCH | /leads/:id | admin | Статус: new / processed / rejected |
