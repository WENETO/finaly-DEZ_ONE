// ===== УПРАВЛЕНИЕ АНИМАЦИЯМИ =====

// Инициализация анимаций при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация нового прелоадера
    initNewPreloader();
    
    // Инициализация параллакс эффекта
    initParallax();
    
    // Инициализация анимаций при скролле
    initScrollAnimations();
    
    // Инициализация счетчиков
    initCounters();
    
    // Инициализация слайдеров
    initSliders();
    
    // Инициализация кнопки наверх
    initScrollTop();
    
    // Инициализация галереи
    initGallery();
    
    // Инициализация 3D карточек
    init3DCards();
    
    // Инициализация CTA формы
    initCTAForm();
    
    // Инициализация FAQ
    initFAQ();
    
    // Инициализация виджетов услуг
    initServiceWidgets();
    
    // Исправление контраста в калькуляторе
    fixCalculatorContrast();
});

// Новый прелоадер с анимацией логотипа
function initNewPreloader() {
    const preloader = document.querySelector('.preloader');
    
    if (!preloader) return;
    
    const logo = preloader.querySelector('.preloader-logo');
    const slogan = preloader.querySelector('.preloader-slogan');
    const preloaderText = preloader.querySelector('.preloader-text');
    
    // Обновляем текст прелоадера
    if (slogan) {
        slogan.textContent = 'Защита и уют вашего дома';
    }
    
    if (preloaderText) {
        preloaderText.textContent = 'Защита и уют вашего дома';
    }
    
    // Сначала вращение на 360 градусов
    setTimeout(() => {
        logo.classList.add('pulse');
    }, 2000);
    
    // Затем пульсация
    setTimeout(() => {
        logo.classList.remove('pulse');
        logo.classList.add('separate');
    }, 3000);
    
    // Затем разделение DEZ и ON
    setTimeout(() => {
        logo.classList.add('highlight');
    }, 3800);
    
    // Затем подсветка ON
    setTimeout(() => {
        if (slogan) {
            slogan.style.display = 'block';
        }
    }, 5000);
    
    // Медленная загрузка (6 секунд для всех анимаций)
    setTimeout(() => {
        preloader.classList.add('hidden');
        
        // Удаляем прелоадер из DOM после анимации
        setTimeout(() => {
            preloader.style.display = 'none';
            
            // Показываем уведомление о загрузке
            if (window.DEZ && window.DEZ.showNotification) {
                window.DEZ.showNotification('Добро пожаловать в DEZ-ONE! Защита и уют вашего дома.', 'success');
            }
        }, 500);
    }, 6000);
}

// Параллакс эффект
function initParallax() {
    const heroBg = document.querySelector('.hero-bg');
    
    if (!heroBg) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const layers = document.querySelectorAll('.hero-bg-layer');
        
        layers.forEach(layer => {
            const speed = layer.getAttribute('data-speed');
            const yPos = -(scrolled * speed);
            layer.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Анимации при скролле
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animateElements.length === 0) return;
    
    function checkScroll() {
        animateElements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                const animation = element.getAttribute('data-animation');
                const delay = element.getAttribute('data-delay') || 0;
                
                setTimeout(() => {
                    element.classList.add('animated');
                    
                    // Запуск счетчиков для статистики
                    if (element.classList.contains('stats-counter')) {
                        initCounters();
                    }
                }, delay);
            }
        });
    }
    
    // Проверяем при загрузке и при скролле
    checkScroll();
    window.addEventListener('scroll', checkScroll);
}

// Анимированные счетчики (ИСПРАВЛЕННАЯ ВЕРСИЯ - без анимации для статических значений)
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    if (counters.length === 0) return;
    
    counters.forEach(counter => {
        // Проверяем, был ли уже запущен счетчик
        if (counter.classList.contains('animated')) return;
        
        // Получаем целевое значение из data-count
        const targetValue = counter.getAttribute('data-count');
        if (!targetValue) return;
        
        // Получаем текущее значение из innerHTML
        const currentValue = counter.innerHTML;
        
        // Если текущее значение уже содержит символы (%, /7 и т.д.), 
        // значит это уже готовое значение, не требующее анимации
        if (currentValue.includes('%') || currentValue.includes('/')) {
            counter.classList.add('animated');
            return;
        }
        
        // Извлекаем только цифры из targetValue
        const targetNumber = parseInt(targetValue.replace(/[^0-9]/g, ''));
        if (isNaN(targetNumber)) return;
        
        // Сохраняем суффикс из data-count, если есть
        let suffix = '';
        const match = targetValue.match(/[^0-9]+/g);
        if (match) {
            suffix = match.join('');
        }
        
        const increment = targetNumber / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < targetNumber) {
                current += increment;
                counter.innerHTML = Math.ceil(current) + suffix;
                setTimeout(updateCounter, 20);
            } else {
                counter.innerHTML = targetNumber + suffix;
                counter.classList.add('animated');
            }
        };
        
        // Запускаем счетчик только если он видим
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });
        
        observer.observe(counter);
    });
}

// Слайдер услуг
function initSliders() {
    // Слайдер услуг
    const serviceSlides = document.querySelectorAll('.service-slide');
    const serviceDots = document.querySelectorAll('.slider-dots .dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    if (serviceSlides.length > 0) {
        let currentSlide = 0;
        
        function showSlide(n) {
            serviceSlides.forEach(slide => slide.classList.remove('active'));
            serviceDots.forEach(dot => dot.classList.remove('active'));
            
            currentSlide = (n + serviceSlides.length) % serviceSlides.length;
            
            serviceSlides[currentSlide].classList.add('active');
            serviceDots[currentSlide].classList.add('active');
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                showSlide(currentSlide - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                showSlide(currentSlide + 1);
            });
        }
        
        serviceDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
            });
        });
        
        // Автопереключение слайдов
        let slideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
        
        // Останавливаем автопереключение при наведении
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                clearInterval(slideInterval);
            });
            
            sliderContainer.addEventListener('mouseleave', () => {
                slideInterval = setInterval(() => {
                    showSlide(currentSlide + 1);
                }, 5000);
            });
        }
    }
    
    // Карусель отзывов
    const reviewSlides = document.querySelectorAll('.review-slide');
    const reviewDots = document.querySelectorAll('.carousel-dots .dot');
    const carouselPrev = document.querySelector('.carousel-prev');
    const carouselNext = document.querySelector('.carousel-next');
    
    if (reviewSlides.length > 0) {
        let currentReview = 0;
        
        function showReview(n) {
            reviewSlides.forEach(slide => slide.classList.remove('active'));
            reviewDots.forEach(dot => dot.classList.remove('active'));
            
            currentReview = (n + reviewSlides.length) % reviewSlides.length;
            
            reviewSlides[currentReview].classList.add('active');
            reviewDots[currentReview].classList.add('active');
        }
        
        if (carouselPrev) {
            carouselPrev.addEventListener('click', () => {
                showReview(currentReview - 1);
            });
        }
        
        if (carouselNext) {
            carouselNext.addEventListener('click', () => {
                showReview(currentReview + 1);
            });
        }
        
        reviewDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showReview(index);
            });
        });
        
        // Автопереключение отзывов
        let reviewInterval = setInterval(() => {
            showReview(currentReview + 1);
        }, 7000);
        
        // Останавливаем автопереключение при наведении
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', () => {
                clearInterval(reviewInterval);
            });
            
            carouselContainer.addEventListener('mouseleave', () => {
                reviewInterval = setInterval(() => {
                    showReview(currentReview + 1);
                }, 7000);
            });
        }
    }
}

// Кнопка наверх
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

// Галерея
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            // В реальном проекте здесь можно открыть лайтбокс
            this.classList.toggle('zoomed');
        });
    });
}

// 3D карточки
function init3DCards() {
    const cards3D = document.querySelectorAll('.service-card-3d');
    
    cards3D.forEach(card => {
        // Убираем 3D эффект на мобильных устройствах
        if (window.innerWidth <= 768) {
            card.style.transformStyle = 'flat';
            card.style.transition = 'none';
            
            card.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Вместо переворота показываем модальное окно на мобильных
                const service = this.querySelector('.service-title').textContent;
                const serviceInput = document.getElementById('serviceInput');
                
                if (serviceInput) {
                    serviceInput.value = service;
                }
                
                if (window.DEZ && window.DEZ.closeAllModals) {
                    window.DEZ.closeAllModals();
                }
                
                const orderModal = document.getElementById('orderModal');
                if (orderModal) {
                    orderModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    });
}

// CTA форма
function initCTAForm() {
    const ctaForm = document.querySelector('.cta-form');
    
    if (!ctaForm) return;
    
    const ctaBtn = ctaForm.querySelector('.cta-btn');
    
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const nameInput = ctaForm.querySelector('input[type="text"]');
            const phoneInput = ctaForm.querySelector('input[type="tel"]');
            
            if (!nameInput.value.trim() || !phoneInput.value.trim()) {
                if (window.DEZ && window.DEZ.showNotification) {
                    window.DEZ.showNotification('Пожалуйста, заполните все поля', 'error');
                } else {
                    alert('Пожалуйста, заполните все поля');
                }
                return;
            }
            
            // Сохраняем данные
            const formData = {
                name: nameInput.value,
                phone: phoneInput.value,
                source: 'CTA форма на главной',
                timestamp: new Date().toISOString()
            };
            
            console.log('Данные CTA формы:', formData);
            
            if (window.DEZ && window.DEZ.showNotification) {
                window.DEZ.showNotification('Спасибо! Мы перезвоним вам в течение 15 минут', 'success');
            } else {
                alert('Спасибо! Мы перезвоним вам в течение 15 минут');
            }
            
            // Очищаем форму
            nameInput.value = '';
            phoneInput.value = '';
        });
    }
}

// FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) return;
    
    faqItems.forEach(item => {
        item.addEventListener('toggle', function() {
            if (this.open) {
                // Анимация открытия
                const answer = this.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                
                // Закрываем все остальные FAQ
                faqItems.forEach(otherItem => {
                    if (otherItem !== this && otherItem.open) {
                        otherItem.open = false;
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        otherAnswer.style.maxHeight = null;
                    }
                });
            } else {
                // Анимация закрытия
                const answer = this.querySelector('.faq-answer');
                answer.style.maxHeight = null;
            }
        });
        
        // Инициализируем высоту для открытых элементов
        if (item.open) {
            const answer = item.querySelector('.faq-answer');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
}

// Инициализация виджетов услуг
function initServiceWidgets() {
    const serviceWidgets = document.querySelectorAll('.service-widget');
    
    if (serviceWidgets.length === 0) return;
    
    serviceWidgets.forEach(widget => {
        // Анимация при наведении
        widget.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.service-widget__icon');
            if (icon) {
                icon.style.animation = 'floatIcon 2s ease-in-out infinite';
            }
            
            // Анимация кнопки
            const button = this.querySelector('.btn');
            if (button) {
                button.style.transform = 'translateY(-5px)';
            }
        });
        
        widget.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.service-widget__icon');
            if (icon) {
                icon.style.animation = 'floatIcon 4s ease-in-out infinite';
            }
            
            // Возврат кнопки
            const button = this.querySelector('.btn');
            if (button) {
                button.style.transform = '';
            }
        });
        
        // Клик по виджету
        widget.addEventListener('click', function(e) {
            // Если клик не по кнопке, открываем модальное окно
            if (!e.target.closest('.btn')) {
                const serviceTitle = this.querySelector('.service-widget__title').textContent;
                const serviceInput = document.getElementById('serviceInput');
                
                if (serviceInput) {
                    serviceInput.value = serviceTitle;
                }
                
                if (window.DEZ && window.DEZ.closeAllModals) {
                    window.DEZ.closeAllModals();
                }
                
                const orderModal = document.getElementById('orderModal');
                if (orderModal) {
                    orderModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });
    
    console.log(`Инициализировано ${serviceWidgets.length} виджетов услуг`);
}

// Исправление контраста в калькуляторе
function fixCalculatorContrast() {
    const calculator = document.getElementById('calculator');
    if (!calculator) return;
    
    // Убедимся, что все текстовые элементы имеют правильный цвет
    const textElements = calculator.querySelectorAll('.form-group label, .checkbox-text, .range-value, .result-label, .result-note, .info-tip, .info-list li');
    
    textElements.forEach(element => {
        element.style.color = element.style.color || 'var(--text-dark)';
    });
}

// Обновление калькулятора с анимациями
function updateCalculatorAnimations() {
    const rangeSlider = document.querySelector('.range-slider');
    const areaValue = document.getElementById('areaValue');
    
    if (rangeSlider && areaValue) {
        rangeSlider.addEventListener('input', function() {
            // Анимация изменения значения
            areaValue.style.transform = 'scale(1.2)';
            areaValue.style.color = 'var(--primary)';
            setTimeout(() => {
                areaValue.style.transform = 'scale(1)';
                areaValue.style.color = '';
            }, 300);
        });
    }
    
    // Анимация чекбоксов
    const checkboxes = document.querySelectorAll('.checkbox-modern input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkmark = this.nextElementSibling;
            if (checkmark) {
                checkmark.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    checkmark.style.transform = 'scale(1)';
                }, 300);
            }
        });
    });
}

// Запуск анимаций калькулятора после загрузки
document.addEventListener('DOMContentLoaded', updateCalculatorAnimations);

// Экспорт функций
window.Animations = {
    initNewPreloader,
    initParallax,
    initScrollAnimations,
    initCounters,
    initSliders,
    initScrollTop,
    initGallery,
    init3DCards,
    initCTAForm,
    initFAQ,
    initServiceWidgets,
    fixCalculatorContrast,
    updateCalculatorAnimations
};