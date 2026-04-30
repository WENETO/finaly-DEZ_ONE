// ===== ГЛАВНЫЙ ФАЙЛ JAVASCRIPT =====

// Глобальные переменные
let DEZ = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DEZ-ONE: сайт загружен');

    initMobileMenu();
    initModals();
    initScrollAnimations();
    initSmoothScroll();
    highlightActiveNav();
    initPrivacyPolicyModal();
    initStarRating();
    initReviewButton();

    // Инициализация виджетов услуг
    if (window.Animations && window.Animations.initServiceWidgets) {
        window.Animations.initServiceWidgets();
    }

    // Исправление контраста в калькуляторе
    if (window.Animations && window.Animations.fixCalculatorContrast) {
        window.Animations.fixCalculatorContrast();
    }
});

// ===== МОБИЛЬНОЕ МЕНЮ =====
function initMobileMenu() {
    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
    
    if (!navToggle || !navList) return;
    
    navToggle.addEventListener('click', function() {
        navList.classList.toggle('active');
        this.classList.toggle('active');
        document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : '';
        
        // Анимация иконки гамбургера
        const spans = this.querySelectorAll('span');
        if (navList.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
    
    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav__list a').forEach(link => {
        link.addEventListener('click', function() {
            navList.classList.remove('active');
            
            if (navToggle) {
                navToggle.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
            
            document.body.style.overflow = '';
            
            // Подсветка активной ссылки
            document.querySelectorAll('.nav__list a').forEach(a => {
                a.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav') && !event.target.closest('.nav__toggle') && navList.classList.contains('active')) {
            navList.classList.remove('active');
            if (navToggle) {
                navToggle.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
            document.body.style.overflow = '';
        }
    });
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const closeButtons = document.querySelectorAll('.modal__close');
    
    // Открытие модальных окон
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId + 'Modal');
            
            if (modal) {
                closeAllModals();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Если у кнопки есть data-service, заполняем поле услуги
                const service = this.getAttribute('data-service');
                if (service) {
                    const serviceInput = document.getElementById('serviceInput');
                    if (serviceInput) {
                        serviceInput.value = service;
                    }
                }
            }
        });
    });
    
    // Закрытие по кнопке
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Закрытие по клику вне окна
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// ===== МОДАЛЬНОЕ ОКНО ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ =====
function initPrivacyPolicyModal() {
    const privacyPolicyLink = document.getElementById('privacyPolicyLink');
    if (!privacyPolicyLink) return;
    
    // Создаем модальное окно, если его нет
    if (!document.getElementById('privacyPolicyModal')) {
        const modalHTML = `
            <div class="modal" id="privacyPolicyModal">
                <div class="modal__content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                    <button class="modal__close" aria-label="Закрыть">&times;</button>
                    <h3 class="modal__title" style="color: var(--primary); margin-bottom: 25px;">Политика конфиденциальности</h3>
                    
                    <div style="text-align: left; color: #000000;">
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">1. Общие положения</h4>
                        <p>Настоящая Политика конфиденциальности (далее — Политика) действует в отношении всей информации, которую Индивидуальный предприниматель Иванов И.И. (ОГРНИП 123456789012345), далее — «Оператор», может получить о пользователе во время использования им сайта https://dezon.ru (далее — Сайт).</p>
                        <p>Использование Сайта означает безоговорочное согласие пользователя с настоящей Политикой и указанными в ней условиями обработки его персональной информации. В случае несогласия с этими условиями пользователь должен воздержаться от использования Сайта.</p>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">2. Персональная информация пользователей</h4>
                        <p>2.1. Под персональной информацией в настоящей Политике понимается:</p>
                        <ul style="list-style-type: disc; padding-left: 30px; margin-bottom: 15px;">
                            <li>Информация, которую пользователь предоставляет о себе самостоятельно при заполнении форм обратной связи, включая: имя, номер телефона, адрес электронной почты, адрес объекта, город.</li>
                            <li>Данные, которые автоматически передаются Сайтом в процессе его использования с помощью установленного на устройстве пользователя программного обеспечения, в том числе IP-адрес, информация из cookie, информация о браузере, время доступа, реферер (адрес предыдущей страницы).</li>
                        </ul>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">3. Цели сбора и обработки персональной информации</h4>
                        <p>3.1. Оператор собирает и хранит только ту персональную информацию, которая необходима для оказания услуг и взаимодействия с пользователем.</p>
                        <p>3.2. Персональная информация пользователя используется в следующих целях:</p>
                        <ul style="list-style-type: disc; padding-left: 30px; margin-bottom: 15px;">
                            <li>Идентификация стороны в рамках договоров оказания услуг;</li>
                            <li>Связь с пользователем, включая направление уведомлений, запросов и информации, касающихся использования Сайта, оказания услуг;</li>
                            <li>Обработка заявок и запросов пользователя;</li>
                            <li>Улучшение качества работы Сайта, удобства его использования;</li>
                            <li>Проведение статистических и иных исследований на основе обезличенных данных.</li>
                        </ul>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">4. Условия обработки персональной информации</h4>
                        <p>4.1. Обработка персональной информации пользователя осуществляется без ограничения срока, любым законным способом, в том числе в информационных системах персональных данных с использованием средств автоматизации или без использования таких средств.</p>
                        <p>4.2. Оператор не передает персональную информацию пользователя третьим лицам, за исключением случаев, когда это необходимо для исполнения договора (например, для передачи курьерской службе), либо когда пользователь выразил свое согласие на такие действия.</p>
                        <p>4.3. При утрате или разглашении персональных данных Оператор информирует пользователя об утрате или разглашении персональных данных.</p>
                        <p>4.4. Оператор принимает необходимые организационные и технические меры для защиты персональной информации пользователя от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий третьих лиц.</p>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">5. Права и обязанности пользователей</h4>
                        <p>5.1. Пользователь вправе:</p>
                        <ul style="list-style-type: disc; padding-left: 30px; margin-bottom: 15px;">
                            <li>Получать информацию, касающуюся обработки его персональных данных;</li>
                            <li>Требовать уточнения своих персональных данных, их блокирования или уничтожения в случае, если персональные данные являются неполными, устаревшими, неточными, незаконно полученными или не являются необходимыми для заявленной цели обработки;</li>
                            <li>Отозвать согласие на обработку персональных данных путем направления письменного заявления Оператору;</li>
                            <li>Обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных или в судебном порядке.</li>
                        </ul>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">6. Изменение Политики конфиденциальности</h4>
                        <p>6.1. Оператор имеет право вносить изменения в настоящую Политику конфиденциальности. При внесении изменений в актуальной редакции указывается дата последнего обновления. Новая редакция Политики вступает в силу с момента ее размещения на Сайте, если иное не предусмотрено новой редакцией Политики.</p>
                        <p>Действующая редакция Политики конфиденциальности находится на Сайте в открытом доступе.</p>
                        
                        <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">7. Контактная информация</h4>
                        <p>По всем вопросам, связанным с обработкой персональных данных, пользователь может обратиться:</p>
                        <p>Email: prokudinvladislav9@gmail.com</p>
                        <p>Телефон: 8-913-857-22-71</p>
                        <p>ИП Иванов И.И., ОГРНИП 123456789012345</p>
                        
                        <p style="margin-top: 30px; font-style: italic; color: #666;">Дата последнего обновления: 01 января 2024 г.</p>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <button class="btn btn--primary" onclick="document.getElementById('privacyPolicyModal').classList.remove('active'); document.body.style.overflow = '';">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    privacyPolicyLink.addEventListener('click', function(e) {
        e.preventDefault();
        const privacyModal = document.getElementById('privacyPolicyModal');
        if (privacyModal) {
            closeAllModals();
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

// ===== ПЛАВНАЯ ПРОКРУТКА =====
function initSmoothScroll() {
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Пропускаем якоря, которые не ведут на странице
            if (href === '#') return;
            
            // Если это якорь на другой странице, пропускаем
            if (href.includes('.html')) return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                
                // Закрываем мобильное меню если открыто
                const navList = document.querySelector('.nav__list');
                const navToggle = document.querySelector('.nav__toggle');
                if (navList && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    if (navToggle) {
                        navToggle.classList.remove('active');
                        const spans = navToggle.querySelectorAll('span');
                        spans[0].style.transform = 'none';
                        spans[1].style.opacity = '1';
                        spans[2].style.transform = 'none';
                    }
                    document.body.style.overflow = '';
                }
                
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Обновляем URL без перезагрузки страницы
                history.pushState(null, null, href);
            }
        });
    });
}

// ===== АНИМАЦИИ ПРИ ПРОКРУТКЕ =====
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.service-card, .process-step, .review-card');
    
    if (!fadeElements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Инициализация анимаций при скролле из animations.js
    if (window.Animations && window.Animations.initScrollAnimations) {
        window.Animations.initScrollAnimations();
    }
}

// ===== ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ В НАВИГАЦИИ =====
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav__list a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (currentPage === 'index.html' && link.getAttribute('href') === 'index.html') {
            link.classList.add('active');
        } else if (currentPage === 'services.html' && link.getAttribute('href') === 'services.html') {
            link.classList.add('active');
        } else if (currentPage === 'blog.html' && link.getAttribute('href') === 'blog.html') {
            link.classList.add('active');
        } else if (currentPage === 'client-memo.html' && link.getAttribute('href') === 'client-memo.html') {
            link.classList.add('active');
        }
        
        // Подсветка якорных ссылок на главной
        if (currentPage === 'index.html' && window.location.hash) {
            const hash = window.location.hash;
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        }
    });
}

// ===== КНОПКА «ОСТАВИТЬ ОТЗЫВ» =====
// Открывает существующую модалку #reviewModal из HTML.
// Сама форма обрабатывается в forms.js (отправка в Telegram).
function initReviewButton() {
    const addReviewBtn = document.getElementById('addReviewBtn');
    if (!addReviewBtn) return;

    addReviewBtn.addEventListener('click', function() {
        closeAllModals();
        const reviewModal = document.getElementById('reviewModal');
        if (reviewModal) {
            reviewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

// ===== РЕЙТИНГ-ЗВЁЗДЫ =====
// Только UI: запись выбранного значения в скрытое поле #ratingValue.
// Отправку формы делает forms.js.
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    if (!stars.length || !ratingValue) return;

    const paint = (selectedValue) => {
        stars.forEach(s => {
            const v = parseInt(s.getAttribute('data-value'), 10);
            const active = v <= parseInt(selectedValue, 10);
            s.style.color = active ? '#ff9800' : '#ddd';
            s.classList.toggle('selected', active);
        });
    };

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingValue.value = value;
            paint(value);
        });
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.getAttribute('data-value'), 10);
            stars.forEach(s => {
                s.style.transform = parseInt(s.getAttribute('data-value'), 10) <= value
                    ? 'scale(1.2)' : 'scale(1)';
            });
        });
        star.addEventListener('mouseleave', function() {
            stars.forEach(s => { s.style.transform = 'scale(1)'; });
        });
    });

    paint(ratingValue.value || '5');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showNotification(message, type = 'info') {
    // Проверяем, есть ли уже уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">${message}</div>
        <button class="notification__close">&times;</button>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2a6b3f' : type === 'error' ? '#dc3545' : '#f9a826'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease;
        font-family: 'Open Sans', sans-serif;
    `;
    
    // Стиль для контента
    notification.querySelector('.notification__content').style.cssText = `
        flex: 1;
        margin-right: 10px;
    `;
    
    // Стиль для кнопки закрытия
    notification.querySelector('.notification__close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    `;
    
    // Анимация появления
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
    
    // Кнопка закрытия
    notification.querySelector('.notification__close').addEventListener('click', function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Инициализация кнопки наверх
function initScrollTop() {
    const scrollBtn = document.querySelector('.scroll-top');
    
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Экспорт функций для использования в других файлах
DEZ = {
    showNotification,
    closeAllModals,
    initScrollTop,
    initPrivacyPolicyModal
};

// Глобальный экспорт
window.DEZ = DEZ;

// Инициализация кнопки наверх при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (window.DEZ && window.DEZ.initScrollTop) {
        window.DEZ.initScrollTop();
    }
});

// Секретный вход в админку (5 кликов на логотип)
let clickCount = 0;
document.querySelector('.logo')?.addEventListener('click', function(e) {
    clickCount++;
    if (clickCount >= 5) {
        window.location.href = 'admin.html';
        clickCount = 0;
    }
    setTimeout(() => clickCount = 0, 3000);
});