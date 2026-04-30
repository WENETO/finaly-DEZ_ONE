// ===== УЛУЧШЕННЫЙ ЗАГРУЗЧИК ДАННЫХ ДЛЯ САЙТА =====
// Использует data-атрибуты для точного обновления всех элементов
// Версия 2.0 - полная переработка с гарантированным обновлением всех контактов

const JSONBIN_CONFIG = {
    apiKey: '$2a$10$h8DblZvcx7MsVZnnr7IgyeF.UvrOIcN8Hf3Qm8QKYSWkaPCjG5nue',
    binId: '69a719b5d0ea881f40eb3c20'
};

// Загрузка данных из JSONBin
async function loadData() {
    try {
        const timestamp = localStorage.getItem('dezone_last_update') || Date.now();
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest?t=${timestamp}`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            console.warn('Ошибка загрузки данных, статус:', response.status);
            return null;
        }
        
        const result = await response.json();
        return result.record;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return null;
    }
}

// Обновление всех контактов на странице
function updateContacts(contacts) {
    if (!contacts) {
        console.warn('Нет данных контактов для обновления');
        return;
    }
    
    console.log('🔄 Обновление контактов:', contacts);
    let updateCount = 0;

    // ===== 1. ТЕЛЕФОНЫ (ОСНОВНЫЕ) =====
    // Все элементы с data-dez-phone="phone"
    document.querySelectorAll('[data-dez-phone="phone"]').forEach(el => {
        const phoneValue = contacts.phone_display || contacts.phone || '8-913-857-22-71';
        updateCount++;
        
        if (el.tagName === 'A' || el.tagName === 'a') {
            // Обновляем href для ссылок
            const telValue = contacts.phone || '89138572271';
            el.href = `tel:${telValue.replace(/[^0-9]/g, '')}`;
        }
        
        // Обновляем текст, сохраняя иконку
        const icon = el.querySelector('i');
        if (icon) {
            const iconHtml = icon.outerHTML;
            el.innerHTML = iconHtml + ' ' + phoneValue;
        } else {
            el.textContent = phoneValue;
        }
    });

    // ===== 2. ТЕЛЕФОНЫ В ПАМЯТКЕ КЛИЕНТУ =====
    document.querySelectorAll('[data-dez-phone-memo]').forEach(el => {
        const phoneValue = contacts.phone_display || contacts.phone || '8-913-857-22-71';
        updateCount++;
        
        const icon = el.querySelector('i');
        if (icon) {
            const iconHtml = icon.outerHTML;
            // В памятке указан конкретный специалист, сохраняем его
            el.innerHTML = iconHtml + ' ' + phoneValue + ' Сергей Александрович';
        } else {
            el.innerHTML = phoneValue + ' Сергей Александрович';
        }
    });

    // ===== 3. ЧАСЫ РАБОТЫ =====
    document.querySelectorAll('[data-dez-work-hours]').forEach(el => {
        const hoursValue = contacts.work_hours || 'Круглосуточно';
        updateCount++;
        
        const icon = el.querySelector('i');
        if (icon) {
            const iconHtml = icon.outerHTML;
            el.innerHTML = iconHtml + ' ' + hoursValue;
        } else {
            el.textContent = hoursValue;
        }
    });

    // ===== 4. EMAIL =====
    document.querySelectorAll('[data-dez-email]').forEach(el => {
        const emailValue = contacts.email || 'prokudinvladislav9@gmail.com';
        updateCount++;
        
        if (el.tagName === 'A' || el.tagName === 'a') {
            el.href = `mailto:${emailValue}`;
        }
        
        const icon = el.querySelector('i');
        if (icon) {
            const iconHtml = icon.outerHTML;
            el.innerHTML = iconHtml + ' ' + emailValue;
        } else {
            el.textContent = emailValue;
        }
    });

    // ===== 5. АДРЕС =====
    document.querySelectorAll('[data-dez-address]').forEach(el => {
        const addressValue = contacts.address || 'г. Алтайская, ул. Алтайская, д. 10';
        updateCount++;
        
        const icon = el.querySelector('i');
        if (icon) {
            const iconHtml = icon.outerHTML;
            el.innerHTML = iconHtml + ' ' + addressValue;
        } else {
            el.textContent = addressValue;
        }
    });

    // ===== 6. WHATSAPP =====
    document.querySelectorAll('[data-dez-social="whatsapp"]').forEach(el => {
        if (contacts.whatsapp) {
            updateCount++;
            el.href = contacts.whatsapp;
            el.target = '_blank';
            el.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    // ===== 7. TELEGRAM =====
    document.querySelectorAll('[data-dez-social="telegram"]').forEach(el => {
        if (contacts.telegram) {
            updateCount++;
            el.href = contacts.telegram;
            el.target = '_blank';
            el.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    // ===== 8. MAX =====
    document.querySelectorAll('[data-dez-social="max"]').forEach(el => {
        if (contacts.max) {
            updateCount++;
            el.href = contacts.max;
            el.target = '_blank';
            el.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // ===== 9. VK =====
    document.querySelectorAll('[data-dez-social="vk"]').forEach(el => {
        if (contacts.vk) {
            updateCount++;
            el.href = contacts.vk;
            el.target = '_blank';
            el.setAttribute('rel', 'noopener noreferrer');
        }
    });

    console.log(`✅ Контакты обновлены: обновлено ${updateCount} элементов`);
}

// Обновление модальных окон соглашений
function updateAgreements(agreements) {
    if (!agreements) {
        console.warn('Нет данных соглашений для обновления');
        return;
    }
    
    console.log('🔄 Обновление соглашений');
    let updateCount = 0;
    
    // Политика конфиденциальности
    const privacyModal = document.getElementById('privacyPolicyModal');
    if (privacyModal && agreements.privacy_policy) {
        const titleEl = privacyModal.querySelector('[data-dez-agreement-title="privacy"]');
        const contentDiv = privacyModal.querySelector('[data-dez-agreement-content="privacy"]');
        
        if (titleEl && agreements.privacy_policy.title) {
            titleEl.textContent = agreements.privacy_policy.title;
            updateCount++;
        }
        
        if (contentDiv && agreements.privacy_policy.content) {
            contentDiv.innerHTML = agreements.privacy_policy.content;
            updateCount++;
        }
    }
    
    // Клиентское соглашение
    const clientModal = document.getElementById('clientAgreementModal');
    if (clientModal && agreements.client_agreement) {
        const titleEl = clientModal.querySelector('[data-dez-agreement-title="client"]');
        const contentDiv = clientModal.querySelector('[data-dez-agreement-content="client"]');
        
        if (titleEl && agreements.client_agreement.title) {
            titleEl.textContent = agreements.client_agreement.title;
            updateCount++;
        }
        
        if (contentDiv && agreements.client_agreement.content) {
            contentDiv.innerHTML = agreements.client_agreement.content;
            updateCount++;
        }
    }
    
    // Пользовательское соглашение
    const userModal = document.getElementById('userAgreementModal');
    if (userModal && agreements.user_agreement) {
        const titleEl = userModal.querySelector('[data-dez-agreement-title="user"]');
        const contentDiv = userModal.querySelector('[data-dez-agreement-content="user"]');
        
        if (titleEl && agreements.user_agreement.title) {
            titleEl.textContent = agreements.user_agreement.title;
            updateCount++;
        }
        
        if (contentDiv && agreements.user_agreement.content) {
            contentDiv.innerHTML = agreements.user_agreement.content;
            updateCount++;
        }
    }
    
    console.log(`✅ Соглашения обновлены: обновлено ${updateCount} элементов`);
}

// Принудительное обновление всех модальных окон (на случай если они еще не созданы)
function ensureModalsExist() {
    // Проверяем наличие всех необходимых модальных окон
    const requiredModals = ['privacyPolicyModal', 'clientAgreementModal', 'userAgreementModal', 'consentModal'];
    
    requiredModals.forEach(modalId => {
        if (!document.getElementById(modalId)) {
            console.warn(`Модальное окно ${modalId} не найдено на странице`);
        }
    });
}

// Главная функция
async function applyData() {
    console.log('📡 Загрузка данных из JSONBin...');
    
    const data = await loadData();
    if (!data) {
        console.warn('⚠️ Данные не загружены, используются значения по умолчанию');
        return;
    }
    
    // Обновляем всё
    if (data.contacts) {
        updateContacts(data.contacts);
    }
    
    if (data.agreements) {
        updateAgreements(data.agreements);
    }
    
    // Проверяем наличие модальных окон
    ensureModalsExist();
    
    // Сохраняем timestamp последнего обновления
    localStorage.setItem('dezone_last_update', Date.now().toString());
    
    console.log('✅ Данные успешно применены');
}

// Функция принудительного обновления (для тестирования)
window.forceRefreshContacts = function() {
    console.log('🔄 Принудительное обновление контактов...');
    applyData();
};

// Загружаем при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyData);
} else {
    // DOM уже загружен
    applyData();
}

// Обновляем при возвращении на вкладку
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('🔄 Возврат на вкладку, обновление данных...');
        applyData();
    }
});

// Обновляем каждые 30 секунд
setInterval(applyData, 30000);

// Ручное обновление
window.refreshData = applyData;

// Экспорт функций для глобального доступа
window.DEZDataLoader = {
    loadData,
    updateContacts,
    updateAgreements,
    applyData,
    forceRefreshContacts
};


console.log('✅ admin-loader.js загружен и готов к работе');
