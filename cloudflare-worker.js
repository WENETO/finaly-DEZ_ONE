/**
 * Cloudflare Worker proxy для приёма заявок с сайта DEZ-ONE
 * и пересылки их в Telegram.
 *
 * Деплой: https://dash.cloudflare.com/ → Workers & Pages → Create Worker.
 * Подробнее см. SECURITY_SETUP.md.
 *
 * Переменные окружения (Settings → Variables):
 *   TELEGRAM_TOKEN  — токен бота (тип Encrypted)
 *   TELEGRAM_CHAT_ID — ID чата
 *   ALLOWED_ORIGIN  — например, https://dez-one.ru
 */

export default {
    async fetch(request, env) {
        // ALLOWED_ORIGIN может быть списком через запятую:
        //   https://dez-one.ru,http://localhost:8766,null
        const allowed = String(env.ALLOWED_ORIGIN || '*')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const reqOrigin = request.headers.get('Origin') || '';
        const referer = request.headers.get('Referer') || '';

        const isAllowed = allowed.includes('*')
            || allowed.includes(reqOrigin)
            || allowed.some(a => a !== '*' && a !== 'null' && referer.startsWith(a));

        // CORS: если origin разрешён — отвечаем им, иначе — первым из списка
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

        const url = new URL(request.url);
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

        const tgRes = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            }
        );
        const tgJson = await tgRes.json().catch(() => ({ ok: false }));
        return json({ ok: !!tgJson.ok }, tgJson.ok ? 200 : 502, corsHeaders);
    }
};

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

