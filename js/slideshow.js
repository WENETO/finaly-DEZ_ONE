// ===== УПРАВЛЕНИЕ СЛАЙД-ШОУ =====

// Инициализация всех слайд-шоу
document.addEventListener('DOMContentLoaded', function() {
    initFeaturesSlideshow();
    initServicesPageSlideshow();
});

// Слайд-шоу для раздела "Почему выбирают нас"
function initFeaturesSlideshow() {
    const slideshow = document.querySelector('.features-slideshow');
    if (!slideshow) return;
    
    const slides = slideshow.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Автоматическое переключение каждые 5 секунд
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);
    
    // Инициализация первого слайда
    showSlide(0);
}

// Слайд-шоу для страницы услуг
function initServicesPageSlideshow() {
    // Слайд-шоу в заголовке страницы услуг
    const headerSlideshow = document.querySelector('.page-header-slideshow');
    if (headerSlideshow) {
        const headerSlides = headerSlideshow.querySelectorAll('.page-header-slide');
        if (headerSlides.length > 0) {
            let currentHeaderSlide = 0;
            
            function showHeaderSlide(index) {
                headerSlides.forEach(slide => slide.classList.remove('active'));
                currentHeaderSlide = (index + headerSlides.length) % headerSlides.length;
                headerSlides[currentHeaderSlide].classList.add('active');
            }
            
            setInterval(() => {
                showHeaderSlide(currentHeaderSlide + 1);
            }, 5000);
            
            showHeaderSlide(0);
        }
    }
    
    // Слайд-шоу в разделе прайсинга
    const pricingSlideshow = document.querySelector('.pricing-slideshow');
    if (pricingSlideshow) {
        const pricingSlides = pricingSlideshow.querySelectorAll('.pricing-slide');
        if (pricingSlides.length > 0) {
            let currentPricingSlide = 0;
            
            function showPricingSlide(index) {
                pricingSlides.forEach(slide => slide.classList.remove('active'));
                currentPricingSlide = (index + pricingSlides.length) % pricingSlides.length;
                pricingSlides[currentPricingSlide].classList.add('active');
            }
            
            setInterval(() => {
                showPricingSlide(currentPricingSlide + 1);
            }, 5000);
            
            showPricingSlide(0);
        }
    }
}

// Управление слайд-шоу
function pauseSlideshow(slideshowElement) {
    const slides = slideshowElement.querySelectorAll('.slide');
    slides.forEach(slide => {
        slide.style.transition = 'none';
    });
}

function resumeSlideshow(slideshowElement) {
    const slides = slideshowElement.querySelectorAll('.slide');
    slides.forEach(slide => {
        slide.style.transition = 'opacity 1s ease-in-out';
    });
}

// Обработка видимости страницы
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Страница скрыта - пауза слайд-шоу
        const slideshows = document.querySelectorAll('.features-slideshow, .page-header-slideshow, .pricing-slideshow');
        slideshows.forEach(pauseSlideshow);
    } else {
        // Страница видима - возобновление слайд-шоу
        const slideshows = document.querySelectorAll('.features-slideshow, .page-header-slideshow, .pricing-slideshow');
        slideshows.forEach(resumeSlideshow);
    }
});

// Экспорт функций
window.Slideshow = {
    initFeaturesSlideshow,
    initServicesPageSlideshow,
    pauseSlideshow,
    resumeSlideshow
};