/**
 * Cloudflare Worker для DEZ-ONE.
 *
 *  • POST /lead              — приём заявок с сайта и рассылка ВСЕМ подписчикам бота
 *  • POST /tg/<WEBHOOK_PATH> — приёмник Telegram webhook (/start, /stop, /id)
 *
 * Любой человек, который нажмёт «Start» в боте, автоматически попадает
 * в список подписчиков (хранится в Cloudflare KV) и получает все новые заявки.
 *
 * --- НАСТРОЙКА (один раз, см. README в SECURITY_SETUP.md) ---
 * 1. Settings → Variables and Secrets:
 *      TELEGRAM_TOKEN          (Secret)  — токен бота
 *      ALLOWED_ORIGIN          (Text)    — https://dez-one.ru,https://www.dez-one.ru
 *      TELEGRAM_WEBHOOK_PATH   (Text)    — любая случайная строка, напр. "abc123xyz"
 *      TELEGRAM_WEBHOOK_SECRET (Secret)  — любая случайная строка для X-Telegram-Bot-Api-Secret-Token
 *      TELEGRAM_CHAT_ID        (Text, опционально) — fallback-чат, если в KV пусто (можно оставить ваш)
 * 2. Settings → Bindings → KV Namespace Bindings:
 *      Variable name: SUBSCRIBERS
 *      KV namespace : DEZONE_SUBSCRIBERS  (создайте на вкладке Storage → KV)
 * 3. Зарегистрируйте webhook в Telegram (один раз, через браузер):
 *      https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://<ваш-воркер>/tg/<TELEGRAM_WEBHOOK_PATH>&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ---------- Telegram webhook ----------
        if (url.pathname.startsWith('/tg/')) {
            return handleTelegramWebhook(request, env, url);
        }

        // ---------- /lead (заявки с сайта) ----------
        const allowed = String(env.ALLOWED_ORIGIN || '*')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const reqOrigin = request.headers.get('Origin') || '';
        const referer = request.headers.get('Referer') || '';

        const isAllowed = allowed.includes('*')
            || allowed.includes(reqOrigin)
            || allowed.some(a => a !== '*' && a !== 'null' && referer.startsWith(a));

        const corsOrigin = isAllowed && reqOrigin && allowed.includes(reqOrigin)
            ? reqOrigin
            : (allowed[0] === '*' ? '*' : allowed[0] || '*');

        const corsHeaders = {
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        if (url.pathname !== '/lead') {
            return new Response('Not found', { status: 404, headers: corsHeaders });
        }

        if (!isAllowed) {
            return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }

        let data;
        try {
            data = await request.json();
        } catch (e) {
            return json({ ok: false, error: 'bad_json' }, 400, corsHeaders);
        }

        // Honeypot — если бот заполнил, тихо «принимаем»
        if (data && typeof data.hp_field === 'string' && data.hp_field.trim() !== '') {
            return json({ ok: true }, 200, corsHeaders);
        }

        // Размер payload
        const size = JSON.stringify(data).length;
        if (size > 8000) {
            return json({ ok: false, error: 'too_large' }, 413, corsHeaders);
        }

        const message = formatMessage(data);

        // Собираем список получателей: все подписчики из KV + fallback из env
        const recipients = await collectRecipients(env);

        if (recipients.length === 0) {
            console.error('Нет получателей: KV пустой и TELEGRAM_CHAT_ID не задан');
            return json({ ok: false, error: 'no_recipients' }, 502, corsHeaders);
        }

        // Отправляем всем параллельно
        const results = await Promise.allSettled(
            recipients.map(chatId => sendTelegram(env.TELEGRAM_TOKEN, chatId, message))
        );

        // Чистим KV от чатов, в которые бот заблокирован (403) или которых не существует
        await cleanupStaleSubscribers(env, recipients, results);

        const okCount = results.filter(r => r.status === 'fulfilled' && r.value && r.value.ok).length;
        return json({ ok: okCount > 0, sent: okCount, total: recipients.length }, okCount > 0 ? 200 : 502, corsHeaders);
    }
};

// --------------------------------------------------------------------
// Telegram webhook: регистрирует chat_id при /start, удаляет при /stop
// --------------------------------------------------------------------
async function handleTelegramWebhook(request, env, url) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // Проверка секретного пути
    const expectedPath = `/tg/${env.TELEGRAM_WEBHOOK_PATH || ''}`;
    if (!env.TELEGRAM_WEBHOOK_PATH || url.pathname !== expectedPath) {
        return new Response('Not found', { status: 404 });
    }

    // Проверка секретного заголовка от Telegram
    const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';
    if (env.TELEGRAM_WEBHOOK_SECRET && headerSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('Forbidden', { status: 403 });
    }

    let update;
    try {
        update = await request.json();
    } catch (e) {
        return new Response('Bad JSON', { status: 400 });
    }

    const msg = update.message || update.edited_message || update.channel_post;
    if (!msg || !msg.chat || !msg.chat.id) {
        return new Response('OK', { status: 200 });
    }

    const chatId = String(msg.chat.id);
    const text = (msg.text || '').trim();
    const cmd = text.split(/\s+/)[0].toLowerCase();

    if (!env.SUBSCRIBERS) {
        console.error('KV binding SUBSCRIBERS не привязан');
        return new Response('OK', { status: 200 });
    }

    if (cmd === '/start') {
        await env.SUBSCRIBERS.put(chatId, JSON.stringify({
            chatId,
            username: msg.from && msg.from.username || null,
            firstName: msg.from && msg.from.first_name || null,
            addedAt: new Date().toISOString()
        }));
        await sendTelegram(
            env.TELEGRAM_TOKEN,
            chatId,
            '✅ <b>Подписка активирована</b>\n\n' +
            'Теперь все заявки с сайта <b>dez-one.ru</b> будут приходить в этот чат.\n\n' +
            'Команды:\n' +
            '/stop — отписаться\n' +
            '/id — показать ваш chat_id'
        );
    } else if (cmd === '/stop') {
        await env.SUBSCRIBERS.delete(chatId);
        await sendTelegram(
            env.TELEGRAM_TOKEN,
            chatId,
            '🛑 Вы отписались от уведомлений. Чтобы снова подписаться — отправьте /start.'
        );
    } else if (cmd === '/id') {
        await sendTelegram(
            env.TELEGRAM_TOKEN,
            chatId,
            `Ваш chat_id: <code>${escapeHtml(chatId)}</code>`
        );
    } else {
        // Любое другое сообщение — короткая подсказка
        await sendTelegram(
            env.TELEGRAM_TOKEN,
            chatId,
            'Команды: /start (подписаться на заявки), /stop (отписаться), /id'
        );
    }

    return new Response('OK', { status: 200 });
}

// --------------------------------------------------------------------
// Список получателей: все из KV + fallback env.TELEGRAM_CHAT_ID (если есть)
// --------------------------------------------------------------------
async function collectRecipients(env) {
    const set = new Set();

    if (env.SUBSCRIBERS) {
        let cursor;
        do {
            const list = await env.SUBSCRIBERS.list({ cursor });
            for (const k of list.keys) set.add(k.name);
            cursor = list.list_complete ? undefined : list.cursor;
        } while (cursor);
    }

    if (env.TELEGRAM_CHAT_ID) {
        // Можно указать несколько через запятую, на всякий случай
        String(env.TELEGRAM_CHAT_ID)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(id => set.add(id));
    }

    return Array.from(set);
}

async function sendTelegram(token, chatId, text) {
    if (!token || !chatId) return { ok: false, status: 0 };
    try {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        const body = await r.json().catch(() => ({}));
        return { ok: !!body.ok, status: r.status, code: body.error_code, desc: body.description };
    } catch (e) {
        return { ok: false, status: 0, desc: String(e) };
    }
}

// Удаляем из KV чаты, которые заблокировали бота или удалены
async function cleanupStaleSubscribers(env, recipients, results) {
    if (!env.SUBSCRIBERS) return;
    const tasks = [];
    for (let i = 0; i < recipients.length; i++) {
        const chatId = recipients[i];
        const r = results[i];
        if (r.status !== 'fulfilled') continue;
        const v = r.value || {};
        // 403: bot was blocked by the user / kicked
        // 400: chat not found
        if (v.code === 403 || (v.code === 400 && /chat not found/i.test(v.desc || ''))) {
            // Не удаляем fallback из env.TELEGRAM_CHAT_ID — он не в KV, всё равно будет добавлен заново
            tasks.push(env.SUBSCRIBERS.delete(chatId));
        }
    }
    if (tasks.length) await Promise.allSettled(tasks);
}

// --------------------------------------------------------------------
function json(body, status, extra) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...extra }
    });
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMessage(d) {
    let m = `<b>🔔 НОВАЯ ЗАЯВКА С САЙТА DEZ-ONE</b>\n`;
    m += `━━━━━━━━━━━━━━━━━━━━━\n`;
    m += `<b>📋 Форма:</b> ${escapeHtml(d.formType)}\n`;
    m += `<b>📅 Дата:</b> ${escapeHtml(d.timestamp)}\n`;
    m += `<b>🌐 Страница:</b> ${escapeHtml(d.pageUrl)}\n`;
    m += `━━━━━━━━━━━━━━━━━━━━━\n\n<b>📝 ДАННЫЕ КЛИЕНТА:</b>\n`;
    if (d.name)         m += `<b>Имя:</b> ${escapeHtml(d.name)}\n`;
    if (d.phone)        m += `<b>Телефон:</b> ${escapeHtml(d.phone)}\n`;
    if (d.email)        m += `<b>Email:</b> ${escapeHtml(d.email)}\n`;
    if (d.organization) m += `<b>Организация:</b> ${escapeHtml(d.organization)}\n`;
    if (d.service)      m += `<b>Услуга:</b> ${escapeHtml(d.service)}\n`;
    if (d.address)      m += `<b>Адрес:</b> ${escapeHtml(d.address)}\n`;
    if (d.message)      m += `<b>Сообщение:</b> ${escapeHtml(d.message)}\n`;
    if (d.city)         m += `<b>Город:</b> ${escapeHtml(d.city)}\n`;
    if (d.rating) {
        const r = Math.max(0, Math.min(5, parseInt(d.rating, 10) || 0));
        m += `<b>Оценка:</b> ${'★'.repeat(r)}${'☆'.repeat(5 - r)} (${r}/5)\n`;
    }
    if (d.review) m += `<b>Отзыв:</b> ${escapeHtml(d.review)}\n`;
    if (d.calculator) {
        m += `\n<b>📊 ДЕТАЛИ КАЛЬКУЛЯТОРА:</b>\n`;
        m += `<b>Услуга:</b> ${escapeHtml(d.calculator.service)}\n`;
        m += `<b>Объект:</b> ${escapeHtml(d.calculator.property)}\n`;
        m += `<b>Площадь:</b> ${escapeHtml(d.calculator.area)} м²\n`;
        if (Array.isArray(d.calculator.options) && d.calculator.options.length) {
            m += `<b>Опции:</b> ${escapeHtml(d.calculator.options.join(', '))}\n`;
        }
        m += `<b>Цена:</b> ${escapeHtml(d.calculator.price)}\n`;
    }
    if (d.formType === 'Заказ услуги') {
        m += `\n━━━━━━━━━━━━━━━━━━━━━\n✅ Клиент ознакомлен с Памяткой клиенту\n`;
    }
    m += `━━━━━━━━━━━━━━━━━━━━━\n📱 <b>DEZ-ONE</b> | Профессиональная дезинсекция`;
    return m;
}
