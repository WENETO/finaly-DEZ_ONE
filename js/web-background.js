// ===== УПРАВЛЕНИЕ ФОНОМ С ПАУТИНКОЙ =====

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initWebBackground();
});

function initWebBackground() {
    const webBackground = document.querySelector('.web-background');
    
    if (!webBackground) {
        console.log('Фон с паутинкой не найден');
        return;
    }
    
    console.log('Фон с паутинкой инициализирован');
    
    // Создаем динамические паутинки
    createDynamicWebs();
    
    // Управление интенсивностью фона при скролле
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const opacity = 0.1 + (scrolled * 0.0001);
        webBackground.style.opacity = Math.min(opacity, 0.15);
    });
    
    // Управление паучками при наведении
    const spiders = document.querySelectorAll('.spider');
    spiders.forEach(spider => {
        spider.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
            this.style.transform = 'scale(1.5)';
        });
        
        spider.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
            this.style.transform = 'scale(1)';
        });
    });
}

// Создание динамических паутинок
function createDynamicWebs() {
    const webBackground = document.querySelector('.web-background');
    
    if (!webBackground) return;
    
    // Создаем дополнительные паутинки
    for (let i = 0; i < 5; i++) {
        const webLine = document.createElement('div');
        webLine.className = `web-line dynamic-web-${i + 1}`;
        
        // Случайные параметры
        const width = Math.random() * 60 + 20;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const rotation = Math.random() * 180 - 90;
        const duration = Math.random() * 40 + 20;
        const delay = Math.random() * 10;
        
        webLine.style.cssText = `
            width: ${width}%;
            height: 1px;
            top: ${top}%;
            left: ${left}%;
            transform: rotate(${rotation}deg);
            animation: moveDynamicWeb ${duration}s infinite linear ${delay}s;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(12, 131, 70, ${0.1 + Math.random() * 0.1}) 50%, 
                transparent 100%);
        `;
        
        webBackground.appendChild(webLine);
    }
    
    // Добавляем стили для динамических паутинок
    const style = document.createElement('style');
    style.textContent = `
        @keyframes moveDynamicWeb {
            0%, 100% { 
                transform: rotate(var(--initial-rotation)) translateX(0) scale(1); 
                opacity: 0.1; 
            }
            25% { 
                transform: rotate(calc(var(--initial-rotation) + 5deg)) translateX(20px) scale(1.1); 
                opacity: 0.2; 
            }
            50% { 
                transform: rotate(var(--initial-rotation)) translateX(0) scale(1); 
                opacity: 0.1; 
            }
            75% { 
                transform: rotate(calc(var(--initial-rotation) - 5deg)) translateX(-20px) scale(0.9); 
                opacity: 0.15; 
            }
        }
    `;
    document.head.appendChild(style);
}

// Управление паутинками
function toggleWebBackground(show = true) {
    const webBackground = document.querySelector('.web-background');
    if (webBackground) {
        webBackground.style.display = show ? 'block' : 'none';
    }
}

function changeWebColor(color) {
    const webLines = document.querySelectorAll('.web-line');
    const spiders = document.querySelectorAll('.spider');
    const webDrops = document.querySelectorAll('.web-drop');
    
    webLines.forEach(line => {
        line.style.background = line.style.background.replace(/rgba\([^)]+\)/g, color);
    });
    
    spiders.forEach(spider => {
        spider.style.backgroundColor = color;
        spider.querySelectorAll(':before, :after').forEach(pseudo => {
            pseudo.style.backgroundColor = color;
        });
    });
}

// Экспорт функций
window.WebBackground = {
    initWebBackground,
    toggleWebBackground,
    changeWebColor,
    createDynamicWebs
};