// ===== СИСТЕМА ОТОБРАЖЕНИЯ ОТЗЫВОВ =====
// Отзывы клиентов отправляются в Telegram через forms.js.
// После модерации администратор может вручную добавить одобренные
// отзывы в localStorage через admin.html — этот файл их подгружает
// и отображает в карусели на главной.

document.addEventListener('DOMContentLoaded', function() {
    addReviewButtonOnce();
    loadReviewsFromStorage();
});

// Добавляет кнопку «Оставить отзыв» в секцию отзывов, если её ещё нет.
// Сам клик-обработчик навешивается в main.js (initReviewButton).
function addReviewButtonOnce() {
    const reviewsSection = document.getElementById('reviews');
    if (!reviewsSection) return;
    const container = reviewsSection.querySelector('.container');
    if (!container) return;
    if (container.querySelector('#addReviewBtn')) return;

    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.id = 'addReviewBtn';
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-pen"></i> Оставить отзыв';
    btn.style.cssText = 'display:block;margin:30px auto;padding:15px 30px;font-size:1.1rem;max-width:300px;';
    container.appendChild(btn);

    // Если main.js уже загрузился до нас — навесим обработчик сами.
    btn.addEventListener('click', function() {
        const reviewModal = document.getElementById('reviewModal');
        if (!reviewModal) return;
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        reviewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

function loadReviewsFromStorage() {
    try {
        const reviews = JSON.parse(localStorage.getItem('dezReviews') || '[]');
        const approvedReviews = reviews.filter(r => r && r.approved);
        if (approvedReviews.length > 0) {
            updateReviewsCarousel(approvedReviews);
        }
        return approvedReviews;
    } catch (e) {
        console.warn('Не удалось загрузить отзывы:', e);
        return [];
    }
}

// Безопасное экранирование текста перед вставкой в HTML
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateReviewsCarousel(reviews) {
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselDots = document.querySelector('.carousel-dots');
    if (!carouselContainer || !carouselDots) return;

    // Удаляем только динамически добавленные слайды/точки
    carouselContainer.querySelectorAll('.review-slide').forEach(slide => {
        if (!slide.hasAttribute('data-original')) slide.remove();
    });
    carouselDots.querySelectorAll('.dot').forEach(dot => {
        if (!dot.hasAttribute('data-original')) dot.remove();
    });

    const originalDots = carouselDots.querySelectorAll('.dot');

    reviews.slice(0, 10).forEach((review, index) => {
        carouselContainer.insertAdjacentHTML('beforeend', createReviewSlideHTML(review));
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.setAttribute('data-index', originalDots.length + index);
        carouselDots.appendChild(dot);
    });

    initUpdatedCarousel();
}

function createReviewSlideHTML(review) {
    const rating = Math.max(0, Math.min(5, parseInt(review.rating, 10) || 0));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return `
        <div class="review-slide" data-review-id="${escapeHtml(review.id)}">
            <div class="review-card" style="background-color:#ffffff;color:#000000;">
                <div class="review-card__header">
                    <div class="review-card__avatar"><i class="fas fa-user"></i></div>
                    <div>
                        <div class="review-card__author" style="color:#000000;">${escapeHtml(review.name)}</div>
                        <div class="review-card__date" style="color:#5a6268;">${escapeHtml(review.date)}</div>
                        <div class="review-rating" style="color:#ff9800;">${stars}</div>
                    </div>
                </div>
                <div class="review-card__text" style="color:#000000;">"${escapeHtml(review.text || review.review || '')}"</div>
                <div class="review-service"><i class="fas fa-tag"></i> ${escapeHtml(review.service)}</div>
            </div>
        </div>
    `;
}

function initUpdatedCarousel() {
    const reviewSlides = document.querySelectorAll('.review-slide');
    const reviewDots = document.querySelectorAll('.carousel-dots .dot');
    const carouselPrev = document.querySelector('.carousel-prev');
    const carouselNext = document.querySelector('.carousel-next');
    if (reviewSlides.length === 0) return;

    let currentReview = 0;
    function showReview(n) {
        reviewSlides.forEach(slide => slide.classList.remove('active'));
        reviewDots.forEach(dot => dot.classList.remove('active'));
        currentReview = (n + reviewSlides.length) % reviewSlides.length;
        reviewSlides[currentReview].classList.add('active');
        if (reviewDots[currentReview]) reviewDots[currentReview].classList.add('active');
    }

    if (carouselPrev) carouselPrev.addEventListener('click', () => showReview(currentReview - 1));
    if (carouselNext) carouselNext.addEventListener('click', () => showReview(currentReview + 1));
    reviewDots.forEach((dot, index) => dot.addEventListener('click', () => showReview(index)));

    let reviewInterval = setInterval(() => showReview(currentReview + 1), 7000);
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => clearInterval(reviewInterval));
        carouselContainer.addEventListener('mouseleave', () => {
            reviewInterval = setInterval(() => showReview(currentReview + 1), 7000);
        });
    }
    showReview(0);
}

// === Функции для admin.html ===
function getAllReviews() {
    try { return JSON.parse(localStorage.getItem('dezReviews') || '[]'); }
    catch (e) { return []; }
}

function approveReview(reviewId) {
    try {
        let reviews = JSON.parse(localStorage.getItem('dezReviews') || '[]');
        reviews = reviews.map(r => r && r.id === reviewId ? { ...r, approved: true } : r);
        localStorage.setItem('dezReviews', JSON.stringify(reviews));
        loadReviewsFromStorage();
        if (window.DEZ?.showNotification) window.DEZ.showNotification('Отзыв одобрен', 'success');
        return true;
    } catch (e) { return false; }
}

function deleteReview(reviewId) {
    try {
        let reviews = JSON.parse(localStorage.getItem('dezReviews') || '[]');
        reviews = reviews.filter(r => r && r.id !== reviewId);
        localStorage.setItem('dezReviews', JSON.stringify(reviews));
        loadReviewsFromStorage();
        if (window.DEZ?.showNotification) window.DEZ.showNotification('Отзыв удалён', 'success');
        return true;
    } catch (e) { return false; }
}

// Сохранение отзыва (используется админкой, если нужно вручную добавить).
function saveReviewToStorage(review) {
    try {
        const reviews = JSON.parse(localStorage.getItem('dezReviews') || '[]');
        reviews.unshift(review);
        if (reviews.length > 200) reviews.length = 200;
        localStorage.setItem('dezReviews', JSON.stringify(reviews));
        return true;
    } catch (e) { return false; }
}

window.Reviews = {
    getAllReviews,
    approveReview,
    deleteReview,
    loadReviewsFromStorage,
    saveReviewToStorage
};
