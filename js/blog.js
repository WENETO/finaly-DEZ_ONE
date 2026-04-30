// ===== СКРИПТЫ ДЛЯ СТРАНИЦЫ БЛОГА =====

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница блога DEZON загружена');
    
    // Инициализация FAQ
    initFAQ();
    
    // Инициализация подписки
    initSubscribeForm();
    
    // Инициализация анимаций для статей
    initBlogAnimations();
});

// Инициализация FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) return;
    
    console.log(`Найдено ${faqItems.length} FAQ-элементов`);
    
    // Устанавливаем начальную высоту для открытых элементов
    faqItems.forEach(item => {
        if (item.open) {
            const answer = item.querySelector('.faq-answer');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
    
    // Обработчик открытия/закрытия
    faqItems.forEach(item => {
        item.addEventListener('toggle', function() {
            const answer = this.querySelector('.faq-answer');
            const question = this.querySelector('.faq-question');
            
            if (this.open) {
                // Анимация открытия
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.style.backgroundColor = 'var(--primary-light)';
                
                // Закрываем все остальные FAQ
                faqItems.forEach(otherItem => {
                    if (otherItem !== this && otherItem.open) {
                        otherItem.open = false;
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherQuestion = otherItem.querySelector('.faq-question');
                        otherAnswer.style.maxHeight = null;
                        otherQuestion.style.backgroundColor = '';
                    }
                });
            } else {
                // Анимация закрытия
                answer.style.maxHeight = null;
                question.style.backgroundColor = '';
            }
        });
    });
}

// Инициализация формы подписки
function initSubscribeForm() {
    const subscribeForm = document.querySelector('.subscribe-form');
    
    if (!subscribeForm) return;
    
    subscribeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!email) {
            if (window.DEZ && window.DEZ.showNotification) {
                window.DEZ.showNotification('Пожалуйста, введите email', 'error');
            } else {
                alert('Пожалуйста, введите email');
            }
            return;
        }
        
        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (window.DEZ && window.DEZ.showNotification) {
                window.DEZ.showNotification('Пожалуйста, введите корректный email', 'error');
            } else {
                alert('Пожалуйста, введите корректный email');
            }
            return;
        }
        
        // Сохраняем email в localStorage
        saveSubscriberEmail(email);
        
        // Показываем сообщение
        if (window.DEZ && window.DEZ.showNotification) {
            window.DEZ.showNotification('Спасибо за подписку! Вы будете получать полезные статьи на почту.', 'success');
        } else {
            alert('Спасибо за подписку! Вы будете получать полезные статьи на почту.');
        }
        
        // Анимация успешной подписки
        emailInput.style.borderColor = 'var(--primary)';
        emailInput.style.boxShadow = '0 0 0 3px rgba(42, 107, 63, 0.2)';
        
        setTimeout(() => {
            emailInput.style.borderColor = '';
            emailInput.style.boxShadow = '';
        }, 2000);
        
        // Очищаем форму
        this.reset();
    });
}

// Анимации для блога
function initBlogAnimations() {
    // Анимация карточек статей при наведении
    const blogPosts = document.querySelectorAll('.blog-post');
    
    blogPosts.forEach(post => {
        post.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            
            // Анимация иконки
            const icon = this.querySelector('.image-placeholder');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        post.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            
            // Возвращаем иконку
            const icon = this.querySelector('.image-placeholder');
            if (icon) {
                icon.style.transform = '';
            }
        });
    });
    
    // Анимация ссылок "Читать статью"
    const readLinks = document.querySelectorAll('.blog-post__link');
    
    readLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.paddingRight = '20px';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.paddingRight = '';
        });
    });
}

// Сохранение email подписчика
function saveSubscriberEmail(email) {
    try {
        // Создаем массив подписчиков или загружаем существующий
        let subscribers = [];
        const storedSubscribers = localStorage.getItem('blogSubscribers');
        
        if (storedSubscribers) {
            subscribers = JSON.parse(storedSubscribers);
        }
        
        // Проверяем, есть ли уже такой email
        if (!subscribers.includes(email)) {
            subscribers.push({
                email: email,
                date: new Date().toISOString(),
                source: 'Блог DEZON'
            });
            
            localStorage.setItem('blogSubscribers', JSON.stringify(subscribers));
            console.log('Подписчик сохранен. Всего подписчиков:', subscribers.length);
            
            // Логируем в консоль (в реальном проекте здесь была бы отправка на сервер)
            console.log('Новый подписчик:', email);
        } else {
            console.log('Этот email уже подписан');
        }
    } catch (e) {
        console.warn('Не удалось сохранить подписчика:', e);
        
        // Резервное сохранение в sessionStorage
        try {
            sessionStorage.setItem('lastSubscriber', email);
            console.log('Подписчик временно сохранен в sessionStorage');
        } catch (e2) {
            console.warn('Не удалось сохранить даже в sessionStorage:', e2);
        }
    }
}

// Получение списка подписчиков
function getSubscribers() {
    try {
        const storedSubscribers = localStorage.getItem('blogSubscribers');
        if (storedSubscribers) {
            return JSON.parse(storedSubscribers);
        }
        return [];
    } catch (e) {
        console.warn('Не удалось загрузить список подписчиков:', e);
        return [];
    }
}

// Очистка списка подписчиков (для тестирования)
function clearSubscribers() {
    try {
        localStorage.removeItem('blogSubscribers');
        sessionStorage.removeItem('lastSubscriber');
        console.log('Список подписчиков очищен');
        
        if (window.DEZ && window.DEZ.showNotification) {
            window.DEZ.showNotification('Список подписчиков очищен', 'success');
        }
    } catch (e) {
        console.warn('Не удалось очистить список подписчиков:', e);
    }
}

// Статистика подписчиков
function getSubscriberStats() {
    const subscribers = getSubscribers();
    
    return {
        total: subscribers.length,
        lastWeek: subscribers.filter(sub => {
            const subDate = new Date(sub.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return subDate > weekAgo;
        }).length,
        lastMonth: subscribers.filter(sub => {
            const subDate = new Date(sub.date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return subDate > monthAgo;
        }).length
    };
}

// Экспорт функций
window.Blog = {
    initFAQ,
    initSubscribeForm,
    initBlogAnimations,
    getSubscribers,
    getSubscriberStats,
    clearSubscribers,
    saveSubscriberEmail
};