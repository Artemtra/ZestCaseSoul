# ZestCaseSoul

Онлайн-конструктор персональных чехлов на Node.js, Express, MariaDB, HTML, CSS и JavaScript.

Сохраненный дизайн и реальный заказ разделены: `user_case_designs` хранит работы пользователя, а покупки оформляются через `orders` и `order_items`.

## Требования

- Node.js 18+
- MariaDB 10.6+
- npm
- SMTP или Resend для писем
- YooKassa для production-оплаты

## Установка

```bash
npm install
cp .env.example .env
npm run migrate
npm run check
npm test
npm start
```

Сайт по умолчанию доступен на `http://localhost:3000`.

## Команды

```bash
npm start          # production-запуск
npm run dev        # локальный запуск
npm run migrate    # применить миграции MariaDB
npm run check      # синтаксическая проверка JS
npm test           # node:test
npm run make-admin -- user@example.com
```

## MariaDB

Миграции лежат в `migrations/` и применяются через `scripts/migrate.js`. Скрипт сам создает базу, если ее нет, и ведет таблицу `schema_migrations`.

Перед обновлением production сделайте дамп базы и копию `uploads`.

## Категории моделей и макетов

Миграция `017_categories_and_template_data.sql` добавляет:

- `phone_model_categories`
- `design_template_categories`
- `phone_models.category_id`
- `case_templates.category_id`
- `case_templates.template_data`
- `case_templates.preview_url`

Публичные API:

```text
GET /api/phone-model-categories
GET /api/template-categories
GET /api/models?category_id=...
GET /api/models?category_slug=...
GET /api/phone-models?category_slug=...
GET /api/templates?category_id=...
GET /api/templates?category_slug=...
```

Админские API:

```text
GET /api/admin/models
GET /api/admin/phone-model-categories
POST /api/admin/phone-model-categories
PUT /api/admin/phone-model-categories/:id
DELETE /api/admin/phone-model-categories/:id
GET /api/admin/template-categories
POST /api/admin/template-categories
PUT /api/admin/template-categories/:id
DELETE /api/admin/template-categories/:id
GET /api/admin/templates/:id
```

Публичные категории содержат только активные непустые разделы. Полный список, включая пустые и скрытые категории, доступен только администратору через защищённые `GET /api/admin/*-categories`.

В админке макет можно сохранить из текущего конструктора: структура слоев пишется в `template_data`, а превью в `preview_url`.

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните реальные значения. Секреты не должны попадать в код.

Основные переменные:

```env
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret
APP_URL=https://zestcasesoul.ru
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=case_user
DB_PASSWORD=
DB_NAME=case_editor

PAYMENT_PROVIDER=yookassa
PAYMENT_TEST_MODE=false
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
DEFAULT_DELIVERY_AMOUNT=0

CDEK_CLIENT_ID=
CDEK_CLIENT_SECRET=
CDEK_TEST_MODE=true

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## YooKassa

Webhook URL:

```text
https://your-domain.example/api/payments/yookassa/webhook
```

Заказ получает `payment_status='paid'` только после успешного webhook. Return URL сам по себе оплату не подтверждает. Повторные webhook-события блокируются уникальным ключом в `payment_events`.

Для локальной проверки без ключей включите:

```env
PAYMENT_TEST_MODE=true
```

В этом режиме создается тестовая ссылка возврата, но production-оплату он не имитирует.

## CDEK

Переменные `CDEK_CLIENT_ID`, `CDEK_CLIENT_SECRET`, `CDEK_TEST_MODE` подготовлены для интеграции доставки. Сейчас checkout сохраняет ручные данные доставки в заказе.

## SMTP

Если SMTP/Resend не настроены, письма выводятся в лог разработки. Для production заполните SMTP или `RESEND_API_KEY`.

## Безопасное обновление на сервере

```bash
npm install
npm run migrate
npm run check
npm test
sudo systemctl restart zestcasesoul
sudo systemctl status zestcasesoul
```

Не удаляйте рабочую базу вручную при обновлении.
