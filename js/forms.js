// ===== ОБРАБОТКА ФОРМ С ОТПРАВКОЙ В TELEGRAM =====
// Все формы сайта (заказ, консультация, обратный звонок, отзыв,
// юр.лица, подписка) шлют данные в Telegram через единый канал.
//
// БЕЗОПАСНОСТЬ
// ------------
// 1. Данные пользователя экранируются перед вставкой в HTML-сообщение
//    Telegram (parse_mode: HTML), чтобы пользователь не мог сломать
//    разметку или внедрить ссылки.
// 2. Honeypot-поле (hp_field) добавляется в каждую форму невидимо.
//    Боты заполняют все поля и форма их отсеивает.
// 3. Валидация длины и формата (телефон, email).
// 4. Защита от двойной отправки (блокировка кнопки на время запроса).
// 5. Endpoint можно перенаправить на собственный прокси
//    (Cloudflare Worker / Vercel) — см. SECURITY_SETUP.md.
//    Тогда токен бота вообще не попадёт в браузер.
//
// КОНФИГУРАЦИЯ
// ------------
// Если хотите задать прокси — определите перед загрузкой forms.js:
//   <script>window.DEZ_PROXY_URL = 'https://your-worker.workers.dev/lead';</script>
// Тогда forms.js будет слать на прокси, а не напрямую в Telegram.

(function () {
    'use strict';

    // ====== КОНФИГ ======
    // Все заявки идут через защищённый прокси (Cloudflare Worker),
    // токен бота живёт ТОЛЬКО на сервере и в браузер не попадает.
    // URL прокси задаётся через window.DEZ_PROXY_URL в HTML до подключения этого файла.
    const PROXY_URL = (typeof window !== 'undefined' && window.DEZ_PROXY_URL) || null;

    // ====== ЛИМИТЫ ======
    const FIELD_LIMITS = {
        name: 100, phone: 30, email: 120, message: 2000,
        address: 300, service: 500, review: 3000, city: 80,
        organization: 200
    };

    // ====== УТИЛИТЫ ======
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function clamp(s, max) {
        s = String(s == null ? '' : s).trim();
        return s.length > max ? s.slice(0, max) + '…' : s;
    }

    // Российский формат: допускаем +7, 8, 7, скобки, пробелы, дефисы.
    // Минимум 10 цифр.
    function isValidPhone(phone) {
        const digits = String(phone || '').replace(/\D+/g, '');
        return digits.length >= 10 && digits.length <= 15;
    }

    function isValidEmail(email) {
        if (!email) return true; // email опциональный почти везде
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    }

    // Добавляет невидимое honeypot-поле в форму
    function attachHoneypot(form) {
        if (form.querySelector('input[name="hp_field"]')) return;
        const hp = document.createElement('input');
        hp.type = 'text';
        hp.name = 'hp_field';
        hp.tabIndex = -1;
        hp.autocomplete = 'off';
        hp.setAttribute('aria-hidden', 'true');
        hp.style.cssText = 'position:absolute!important;left:-9999px!important;top:-9999px!important;opacity:0!important;height:0!important;width:0!important;pointer-events:none!important;';
        form.appendChild(hp);
    }

    // Защита от двойной отправки: блокируем submit-кнопку
    function lockForm(form) {
        const btn = form.querySelector('button[type="submit"], [type="submit"]');
        if (btn) {
            btn.dataset._origText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        }
    }
    function unlockForm(form) {
        const btn = form.querySelector('button[type="submit"], [type="submit"]');
        if (btn) {
            btn.disabled = false;
            if (btn.dataset._origText) {
                btn.innerHTML = btn.dataset._origText;
                delete btn.dataset._origText;
            }
        }
    }

    // ====== ОТПРАВКА ======
    async function sendData(data) {
        if (!PROXY_URL) {
            console.error('❌ DEZ_PROXY_URL не задан. Заявки не отправляются.');
            return false;
        }
        try {
            const r = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!r.ok) console.error('❌ Прокси вернул статус:', r.status);
            return r.ok;
        } catch (e) {
            console.error('❌ Ошибка прокси:', e);
            return false;
        }
    }

    // Локальное форматирование больше не нужно — Telegram-сообщение
    // формируется на стороне Cloudflare Worker (cloudflare-worker.js).
    // Оставлено как заглушка, чтобы не сломать window.Forms.sendToTelegram,
    // если где-то использовалось.
    function formatTelegramMessage(data) {
        let message = `<b>🔔 НОВАЯ ЗАЯВКА С САЙТА DEZ-ONE</b>\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `<b>📋 Форма:</b> ${escapeHtml(data.formType)}\n`;
        message += `<b>📅 Дата:</b> ${escapeHtml(data.timestamp)}\n`;
        message += `<b>🌐 Страница:</b> ${escapeHtml(data.pageUrl)}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `<b>📝 ДАННЫЕ КЛИЕНТА:</b>\n`;

        if (data.name)         message += `<b>Имя:</b> ${escapeHtml(data.name)}\n`;
        if (data.phone)        message += `<b>Телефон:</b> ${escapeHtml(data.phone)}\n`;
        if (data.email)        message += `<b>Email:</b> ${escapeHtml(data.email)}\n`;
        if (data.organization) message += `<b>Организация:</b> ${escapeHtml(data.organization)}\n`;
        if (data.service)      message += `<b>Услуга:</b> ${escapeHtml(data.service)}\n`;
        if (data.address)      message += `<b>Адрес:</b> ${escapeHtml(data.address)}\n`;
        if (data.message)      message += `<b>Сообщение:</b> ${escapeHtml(data.message)}\n`;
        if (data.city)         message += `<b>Город:</b> ${escapeHtml(data.city)}\n`;

        if (data.rating) {
            const r = Math.max(0, Math.min(5, parseInt(data.rating, 10) || 0));
            const stars = '★'.repeat(r) + '☆'.repeat(5 - r);
            message += `<b>Оценка:</b> ${stars} (${r}/5)\n`;
        }
        if (data.review) message += `<b>Отзыв:</b> ${escapeHtml(data.review)}\n`;

        if (data.calculator) {
            message += `\n<b>📊 ДЕТАЛИ КАЛЬКУЛЯТОРА:</b>\n`;
            message += `<b>Услуга:</b> ${escapeHtml(data.calculator.service)}\n`;
            message += `<b>Объект:</b> ${escapeHtml(data.calculator.property)}\n`;
            message += `<b>Площадь:</b> ${escapeHtml(data.calculator.area)} м²\n`;
            if (Array.isArray(data.calculator.options) && data.calculator.options.length > 0) {
                message += `<b>Опции:</b> ${escapeHtml(data.calculator.options.join(', '))}\n`;
            }
            message += `<b>Цена:</b> ${escapeHtml(data.calculator.price)}\n`;
        }

        if (data.formType === 'Заказ услуги') {
            message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `✅ Клиент ознакомлен с Памяткой клиенту\n`;
        }

        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📱 <b>DEZ-ONE</b> | Профессиональная дезинсекция`;
        return message;
    }

    // ====== ОБЩИЙ ПРОЦЕСС ОТПРАВКИ ФОРМЫ ======
    // opts: { form, build(formData) -> {data, errors[]}, onSuccess(form) }
    async function handleSubmit(opts) {
        const { form, build, onSuccess, requireConsentName } = opts;
        const formData = new FormData(form);

        // Honeypot — если заполнено, тихо «принимаем» (не сообщаем боту)
        if ((formData.get('hp_field') || '').toString().trim() !== '') {
            console.warn('🛑 Honeypot triggered, request silently dropped');
            form.reset();
            showNotification('✓ Заявка отправлена', 'success');
            return;
        }

        // Согласие с памяткой / персональными данными (если требуется)
        if (requireConsentName && !formData.get(requireConsentName)) {
            showNotification('Необходимо подтвердить согласие', 'error');
            return;
        }

        // Сборка/валидация
        const built = build(formData);
        if (built.errors && built.errors.length) {
            showNotification(built.errors[0], 'error');
            return;
        }
        const data = built.data;
        data.timestamp = new Date().toLocaleString('ru-RU');
        data.pageUrl = window.location.href;

        lockForm(form);
        const success = await sendData(data);
        unlockForm(form);

        if (success) {
            showNotification('✓ Заявка успешно отправлена!', 'success');
            form.reset();
            const modal = form.closest('.modal') || document.getElementById('orderModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            if (typeof onSuccess === 'function') onSuccess(form);
        } else {
            showNotification('❌ Ошибка отправки. Позвоните 8-913-860-06-60.', 'error');
        }
    }

    // ====== ИНИЦИАЛИЗАЦИЯ ФОРМ ======
    document.addEventListener('DOMContentLoaded', function () {
        console.log('✅ Forms.js загружен' + (PROXY_URL ? ' (через прокси)' : ''));

        // ФОРМА ЗАКАЗА
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            attachHoneypot(orderForm);

            const memoCheckbox = document.getElementById('clientMemoAgreement');
            const submitBtn = document.getElementById('orderSubmitBtn');
            if (memoCheckbox && submitBtn) {
                submitBtn.disabled = !memoCheckbox.checked;
                memoCheckbox.addEventListener('change', function () {
                    submitBtn.disabled = !this.checked;
                });
            }

            orderForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleSubmit({
                    form: this,
                    requireConsentName: 'clientMemoAgreement',
                    build: (fd) => {
                        const errors = [];
                        const name = clamp(fd.get('name'), FIELD_LIMITS.name);
                        const phone = clamp(fd.get('phone'), FIELD_LIMITS.phone);
                        const service = clamp(fd.get('service'), FIELD_LIMITS.service);
                        const address = clamp(fd.get('address'), FIELD_LIMITS.address);
                        if (!name) errors.push('Введите имя');
                        if (!isValidPhone(phone)) errors.push('Укажите корректный номер телефона');
                        if (!address) errors.push('Укажите адрес');
                        const data = {
                            name, phone, service: service || 'Не указана',
                            address, formType: 'Заказ услуги'
                        };
                        try {
                            const calc = sessionStorage.getItem('calculatorData');
                            if (calc) {
                                data.calculator = JSON.parse(calc);
                                sessionStorage.removeItem('calculatorData');
                            }
                        } catch (err) {}
                        return { data, errors };
                    },
                    onSuccess: (form) => {
                        if (memoCheckbox && submitBtn) {
                            memoCheckbox.checked = false;
                            submitBtn.disabled = true;
                        }
                    }
                });
            });
        }

        // ФОРМА КОНСУЛЬТАЦИИ
        const consultForm = document.getElementById('consultForm');
        if (consultForm) {
            attachHoneypot(consultForm);
            consultForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleSubmit({
                    form: this,
                    build: (fd) => {
                        const errors = [];
                        const name = clamp(fd.get('name'), FIELD_LIMITS.name);
                        const phone = clamp(fd.get('phone'), FIELD_LIMITS.phone);
                        const message = clamp(fd.get('message'), FIELD_LIMITS.message);
                        if (!name) errors.push('Введите имя');
                        if (!isValidPhone(phone)) errors.push('Укажите корректный номер телефона');
                        return {
                            data: { name, phone, message, formType: 'Бесплатная консультация' },
                            errors
                        };
                    }
                });
            });
        }

        // ФОРМА ОБРАТНОГО ЗВОНКА (футер)
        const footerForm = document.getElementById('footerForm');
        if (footerForm) {
            attachHoneypot(footerForm);
            footerForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleSubmit({
                    form: this,
                    build: (fd) => {
                        const errors = [];
                        const name = clamp(fd.get('name'), FIELD_LIMITS.name);
                        const phone = clamp(fd.get('phone'), FIELD_LIMITS.phone);
                        if (!name) errors.push('Введите имя');
                        if (!isValidPhone(phone)) errors.push('Укажите корректный номер телефона');
                        return {
                            data: { name, phone, formType: 'Обратный звонок' },
                            errors
                        };
                    }
                });
            });
        }

        // ФОРМА ОТЗЫВА
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            attachHoneypot(reviewForm);
            reviewForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleSubmit({
                    form: this,
                    build: (fd) => {
                        const errors = [];
                        const name = clamp(fd.get('name'), FIELD_LIMITS.name);
                        const city = clamp(fd.get('city'), FIELD_LIMITS.city);
                        const service = clamp(fd.get('service'), FIELD_LIMITS.service);
                        const review = clamp(fd.get('review'), FIELD_LIMITS.review);
                        const rating = String(fd.get('rating') || '5');
                        if (!name) errors.push('Введите имя');
                        if (!review) errors.push('Напишите текст отзыва');
                        if (review && review.length < 10) errors.push('Отзыв слишком короткий');
                        return {
                            data: {
                                name, city: city || 'Не указан',
                                service: service || 'Не указана',
                                rating, review, formType: 'Отзыв клиента'
                            },
                            errors
                        };
                    },
                    onSuccess: () => {
                        const stars = document.querySelectorAll('.star');
                        stars.forEach(s => { s.style.color = '#ddd'; });
                        const def5 = document.querySelector('.star[data-value="5"]');
                        if (def5) def5.style.color = '#ff9800';
                        const ratingValue = document.getElementById('ratingValue');
                        if (ratingValue) ratingValue.value = '5';
                    }
                });
            });
        }

        // ФОРМА ДЛЯ ЮРИДИЧЕСКИХ ЛИЦ
        const orgConsultForm = document.getElementById('orgConsultForm');
        if (orgConsultForm) {
            attachHoneypot(orgConsultForm);
            orgConsultForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleSubmit({
                    form: this,
                    build: (fd) => {
                        const errors = [];
                        const organization = clamp(fd.get('organization'), FIELD_LIMITS.organization);
                        const name = clamp(fd.get('name'), FIELD_LIMITS.name);
                        const phone = clamp(fd.get('phone'), FIELD_LIMITS.phone);
                        const email = clamp(fd.get('email'), FIELD_LIMITS.email);
                        const message = clamp(fd.get('message'), FIELD_LIMITS.message);
                        if (!organization) errors.push('Укажите организацию');
                        if (!name) errors.push('Введите имя');
                        if (!isValidPhone(phone)) errors.push('Укажите корректный телефон');
                        if (!isValidEmail(email)) errors.push('Укажите корректный email');
                        return {
                            data: {
                                organization, name, phone, email, message,
                                formType: 'Консультация для юр.лиц'
                            },
                            errors
                        };
                    }
                });
            });
        }

        // ФОРМА ПОДПИСКИ
        const subscribeForm = document.querySelector('.subscribe-form');
        if (subscribeForm) {
            attachHoneypot(subscribeForm);
            subscribeForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const formEl = this;
                handleSubmit({
                    form: formEl,
                    build: (fd) => {
                        const errors = [];
                        const emailInput = formEl.querySelector('input[type="email"]');
                        const email = clamp(emailInput ? emailInput.value : '', FIELD_LIMITS.email);
                        if (!isValidEmail(email) || !email) errors.push('Укажите корректный email');
                        return {
                            data: { email, formType: 'Подписка на рассылку' },
                            errors
                        };
                    }
                });
            });
        }

        // Маска для всех полей телефона: оставляем только +, цифры, скобки, пробелы и -
        document.querySelectorAll('input[type="tel"], input[name="phone"]').forEach(input => {
            input.addEventListener('input', function () {
                this.value = this.value.replace(/[^\d+\-\s()]/g, '').slice(0, FIELD_LIMITS.phone);
            });
        });
    });

    // ====== УВЕДОМЛЕНИЯ ======
    function showNotification(message, type = 'info') {
        const old = document.querySelector('.notification');
        if (old) old.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');

        let bgColor = '#2196f3';
        if (type === 'success') bgColor = '#2a6b3f';
        if (type === 'error') bgColor = '#dc3545';

        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${bgColor}; color: white;
            padding: 15px 25px; border-radius: 5px;
            z-index: 9999;
            font-family: 'Open Sans', sans-serif; font-size: 14px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
        }, 3500);
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    }

    // ====== АНИМАЦИИ ======
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // ====== ЭКСПОРТ ======
    window.Forms = { sendData, showNotification, closeAllModals };
    window.DEZ = window.DEZ || {};
    window.DEZ.showNotification = showNotification;
    window.DEZ.closeAllModals = closeAllModals;
})();
