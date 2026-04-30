# Настройка безопасности DEZ-ONE

Этот документ описывает шаги, чтобы привести продакшн-сайт `dez-one.ru`
в безопасное состояние.

---

## 1. Защита Telegram bot-токена через прокси (КРИТИЧНО)

Сейчас токен `8791864673:AAFJN…` лежит в `js/forms.js`, и любой может его
извлечь из исходников браузера. С таким токеном злоумышленник может:

- спамить вашему боту от вашего имени;
- сменить webhook и забирать ваши сообщения себе;
- удалить бота через `deleteWebhook` + `logOut`.

Решение — поставить между сайтом и Telegram **бесплатный Cloudflare Worker**.
Сайт шлёт данные на Worker, Worker уже шлёт в Telegram. Токен живёт
только на сервере и в браузер не попадает.

### Шаги

1. Зайдите в https://dash.cloudflare.com → раздел **Workers & Pages** → **Create**.
2. Назовите worker, например, `dezone-leads`.
3. После создания нажмите **Edit code** и вставьте содержимое файла
   [`cloudflare-worker.js`](cloudflare-worker.js) из этого репозитория.
4. Перейдите в **Settings → Variables → Environment Variables**, добавьте:
   - `TELEGRAM_TOKEN` = `8791864673:AAFJNXdyJ3HmJ_kKyhw-bfLuB6JoicpxTng`
     (тип — **Encrypted**)
   - `TELEGRAM_CHAT_ID` = `2068108259`
   - `ALLOWED_ORIGIN` = `https://dez-one.ru`
5. Нажмите **Deploy**. Получите URL вида
   `https://dezone-leads.<your-account>.workers.dev`.
6. На сайте, **до подключения** `js/forms.js`, добавьте в `<head>`:
   ```html
   <script>window.DEZ_PROXY_URL = 'https://dezone-leads.<your-account>.workers.dev/lead';</script>
   ```
   (один раз во всех HTML или в `js/main.js`).
7. Удалите токен из `js/forms.js` (замените на пустую строку — он больше не нужен).

После этого фронтенд знает только URL прокси, токен — только Worker.

---

## 2. Что уже сделано в коде сайта

`js/forms.js` теперь содержит:

| Защита | Описание |
|---|---|
| HTML-экранирование | Пользовательские данные экранируются перед вставкой в Telegram-сообщение, чтобы нельзя было сломать `parse_mode: HTML` или внедрить кликабельные ссылки. |
| Honeypot | Невидимое поле `hp_field` отсеивает большинство спам-ботов. |
| Rate-limit (клиент) | Не чаще 1 отправки / 30 сек, не более 5 / час с одного браузера. |
| Валидация | Длина полей, формат телефона (≥10 цифр), формат email. |
| Защита от двойной отправки | Кнопка submit блокируется на время запроса. |
| Маска телефона | Поле `tel` принимает только цифры, +, скобки, пробелы, дефисы. |
| Обфускация токена | Токен собирается из частей в рантайме (слабая защита; основная — прокси). |

`js/main.js` и `js/reviews.js` очищены от дублирующих обработчиков формы
отзыва — теперь форма обрабатывается ровно одним обработчиком в `forms.js`.

---

## 3. Заголовки безопасности

GitHub Pages не позволяет настраивать HTTP-заголовки напрямую. Если у вас
домен `dez-one.ru` проксирован через Cloudflare (рекомендуется), включите:

**Cloudflare Dashboard → SSL/TLS → Edge Certificates:**
- HSTS: **On**, max-age 6 месяцев, includeSubdomains
- Always Use HTTPS: **On**
- Minimum TLS: **1.2**

**Cloudflare Dashboard → Rules → Transform Rules → HTTP Response Header Modification:**

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=15552000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `Content-Security-Policy` | см. ниже |

**CSP** (вставьте одной строкой):
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https://mc.yandex.ru; connect-src 'self' https://api.telegram.org https://mc.yandex.ru https://*.workers.dev; frame-src https://mc.yandex.ru; object-src 'none'; base-uri 'self'; form-action 'self';
```

Когда включите прокси через Worker — уберите `https://api.telegram.org` из
`connect-src` и оставьте только домен Worker.

---

## 4. Cloudflare защита от ботов и DDoS

В Cloudflare Dashboard → **Security**:

- **WAF → Managed Rules** → включите Cloudflare Managed Ruleset.
- **Bots → Bot Fight Mode** → On (бесплатно).
- **DDoS → HTTP DDoS attack protection** → Sensitivity: High.
- **Rate Limiting Rules** (один бесплатный):
  - URL: `https://dez-one.ru/*`
  - Action: Block
  - Threshold: 100 requests / 10 seconds / IP

---

## 5. Админка

Файл `admin.html` сейчас, скорее всего, защищён только клиентским паролем —
это не защита (любой может посмотреть JS). Варианты:

1. **Cloudflare Access** (бесплатно до 50 пользователей): включите
   Zero Trust → Applications → Self-hosted → `dez-one.ru/admin.html` →
   политика «email matches `your@email`». Cloudflare сам выдаст вам
   одноразовый код на email при заходе.
2. Перенесите админку в Telegram-бот (просматривайте отзывы прямо там).

---

## 6. Чек-лист продакшен-готовности

- [ ] Развёрнут Cloudflare Worker, токен в `forms.js` удалён
- [ ] Включены security headers в Cloudflare
- [ ] Включена защита админки через Cloudflare Access
- [ ] HSTS preload (через https://hstspreload.org)
- [ ] sitemap.xml и robots.txt
- [ ] Open Graph + favicon проверены
- [ ] PageSpeed Insights ≥ 80
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Тест отправки с мобильного и десктопа
- [ ] Тест с включённым AdBlock — должна работать (через прокси Worker)
