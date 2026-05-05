// ===== КАЛЬКУЛЯТОР СТОИМОСТИ =====

// Базывые цены для расчета
const basePrices = {
    // Существующие услуги
    cockroach: { flat: 1800, house: 2500, office: 2200, cafe: 3000, warehouse: 3500 },
    bedbug: { flat: 2500, house: 3200, office: 2800, cafe: 3800, warehouse: 4200 },
    rodent: { flat: 2200, house: 3500, office: 3000, cafe: 4000, warehouse: 4500 },
    disinfection: { flat: 2000, house: 2800, office: 2500, cafe: 3500, warehouse: 4000 },
    complex: { flat: 3500, house: 5000, office: 4200, cafe: 5500, warehouse: 6000 },
    
    // НОВЫЕ УСЛУГИ
    disinsection: { flat: 1800, house: 2500, office: 2200, cafe: 3000, warehouse: 3500 },
    deratization: { flat: 2200, house: 3500, office: 3000, cafe: 4000, warehouse: 4500 },
    acaricidal: { flat: 0, house: 0, office: 0, cafe: 0, warehouse: 0 }, // Для участка, расчёт по соткам
    demercurization: { flat: 4000, house: 5500, office: 8000, cafe: 10000, warehouse: 15000 },
    odor_removal: { flat: 3000, house: 5000, office: 4000, cafe: 6000, warehouse: 8000 },
    cleaning: { flat: 5000, house: 8000, office: 6000, cafe: 10000, warehouse: 15000 }
};

const propertyTypeMap = { flat: 'flat', house: 'house', office: 'office', cafe: 'cafe', warehouse: 'warehouse' };

// Человеческие названия для услуг (все)
const serviceNames = {
    // Существующие
    cockroach: 'Уничтожение тараканов',
    bedbug: 'Уничтожение клопов',
    rodent: 'Уничтожение грызунов',
    disinfection: 'Дезинфекция помещений',
    complex: 'Комплексная обработка',
    
    // НОВЫЕ
    disinsection: 'Дезинсекция',
    deratization: 'Дератизация',
    acaricidal: 'Акарицидная обработка',
    demercurization: 'Демиркуризация',
    odor_removal: 'Уничтожение запахов',
    cleaning: 'Клининговые услуги'
};

// Человеческие названия для объектов
const propertyNames = {
    flat: 'Квартира',
    house: 'Частный дом',
    office: 'Офис',
    cafe: 'Кафе/ресторан',
    warehouse: 'Склад/производство'
};

// Человеческие названия для опций
const optionNames = {
    urgent: 'Срочный выезд (+20%)',
    strengthened: 'Усиленная защита (+15%)',
    barrier: 'Барьерная защита (+20%)',
    odorless: 'Препараты без запаха (+20%)',
    sticker: 'Наклейка сеточки от тараканов (+5%)'
};

const optionMultipliers = {
    urgent: 1.2, 
    strengthened: 1.15, 
    barrier: 1.2, 
    odorless: 1.2, 
    sticker: 1.05
};

// Инициализация калькулятора
function initCalculator() {
    const calculatorForm = document.getElementById('calculatorForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    const propertyTypeSelect = document.getElementById('propertyType');
    const areaRange = document.getElementById('area');
    const areaValue = document.getElementById('areaValue');
    const areaInput = document.getElementById('areaInput');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkboxes = document.querySelectorAll('input[name="options"]');

    if (!calculatorForm) {
        console.log('Калькулятор не найден на странице');
        return;
    }

    console.log('Калькулятор инициализирован');

    // Двусторонняя синхронизация ползунка и поля ручного ввода
    const AREA_MIN = areaRange ? parseInt(areaRange.min, 10) || 10 : 10;
    const AREA_MAX = areaRange ? parseInt(areaRange.max, 10) || 5000 : 5000;

    function clampArea(v) {
        let n = parseInt(v, 10);
        if (isNaN(n)) n = AREA_MIN;
        if (n < AREA_MIN) n = AREA_MIN;
        if (n > AREA_MAX) n = AREA_MAX;
        return n;
    }

    function setArea(value, source) {
        const n = clampArea(value);
        if (areaRange) areaRange.value = n;
        // Поле ввода всегда нормализуем: если пользователь ввёл вне диапазона,
        // отображаемое значение должно стать корректным после blur / change.
        if (areaInput && String(areaInput.value) !== String(n)) areaInput.value = n;
        if (areaValue) areaValue.textContent = 'м²';
        calculatePrice();
    }

    if (areaRange) {
        areaRange.addEventListener('input', function() {
            setArea(this.value, 'range');
        });
    }

    if (areaInput) {
        // Пока пользователь печатает — обновляем только если значение валидное и в диапазоне
        areaInput.addEventListener('input', function() {
            const raw = this.value;
            if (raw === '') return; // не дёргаем, пока поле пустое
            const n = parseInt(raw, 10);
            if (!isNaN(n) && n >= AREA_MIN && n <= AREA_MAX) {
                if (areaRange) areaRange.value = n;
                calculatePrice();
            }
        });
        // На blur / Enter — нормализуем в допустимый диапазон
        areaInput.addEventListener('change', function() {
            setArea(this.value, 'input');
        });
        areaInput.addEventListener('blur', function() {
            setArea(this.value, 'input');
        });
    }

    // Стартовое отображение
    if (areaValue) areaValue.textContent = 'м²';
    
    // Пересчет при любом изменении
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', calculatePrice);
    }
    if (propertyTypeSelect) {
        propertyTypeSelect.addEventListener('change', calculatePrice);
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', calculatePrice);
    });
    
    // Анимация для чекбоксов
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
    
    // Анимация для ползунка
    if (areaRange && areaValue) {
        areaRange.addEventListener('input', function() {
            areaValue.style.transform = 'scale(1.2)';
            areaValue.style.color = '#ff9800';
            setTimeout(() => {
                areaValue.style.transform = 'scale(1)';
                areaValue.style.color = '#ffffff';
            }, 300);
        });
    }
    
    // Обработка отправки формы калькулятора
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCalculatorSubmit();
    });
    
    // Первоначальный расчет
    calculatePrice();
}

// Расчет стоимости
function calculatePrice() {
    const serviceTypeSelect = document.getElementById('serviceType');
    const propertyTypeSelect = document.getElementById('propertyType');
    const areaRange = document.getElementById('area');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkboxes = document.querySelectorAll('input[name="options"]:checked');
    const savingsAmount = document.querySelector('.savings-amount');
    
    if (!serviceTypeSelect || !propertyTypeSelect || !areaRange || !totalPriceElement) {
        return;
    }
    
    const serviceType = serviceTypeSelect.value;
    const propertyType = propertyTypeSelect.value;
    const area = parseInt(areaRange.value);
    const propertyKey = propertyTypeMap[propertyType];
    
    if (!serviceType || !propertyType || !propertyKey) {
        totalPriceElement.textContent = '0 ₽';
        if (savingsAmount) savingsAmount.textContent = '0 ₽';
        return;
    }
    
    // Базовая цена
    let basePrice = 0;
    
    // Особый расчёт для акарицидной обработки (по соткам)
    if (serviceType === 'acaricidal') {
        // Для участка цена за сотку, умножаем на площадь (в сотках)
        const sotki = Math.ceil(area / 100); // переводим м² в сотки (примерно)
        const effectiveSotki = Math.max(sotki, 6); // минимум 6 соток
        // Тариф зависит от площади (соотв. виджету «Услуги и цены»)
        let pricePerSotka = 500;
        if (effectiveSotki > 12) pricePerSotka = 400;
        else if (effectiveSotki > 6) pricePerSotka = 450;
        basePrice = pricePerSotka * effectiveSotki;
    } 
    // Для остальных услуг
    else {
        basePrice = basePrices[serviceType] ? basePrices[serviceType][propertyKey] : 2000;
    }
    
    // Модификатор площади (не применяем к акарицидной — там цена уже пропорциональна площади)
    let areaMultiplier = 1;
    if (serviceType !== 'acaricidal') {
        if (area > 100) areaMultiplier = 1.2;
        if (area > 200) areaMultiplier = 1.5;
        if (area > 300) areaMultiplier = 1.8;
        if (area > 400) areaMultiplier = 2.0;
    }

    let total = basePrice * areaMultiplier;
    
    // Добавка за опции
    checkboxes.forEach(checkbox => {
        if (optionMultipliers[checkbox.value]) {
            total *= optionMultipliers[checkbox.value];
        }
    });
    
    const formattedPrice = Math.round(total).toLocaleString('ru-RU');
    totalPriceElement.textContent = formattedPrice + ' ₽';
    
    // Анимация изменения цены
    totalPriceElement.style.transform = 'scale(1.1)';
    totalPriceElement.style.color = '#ff9800';
    setTimeout(() => {
        totalPriceElement.style.transform = 'scale(1)';
        totalPriceElement.style.color = '#ff9800';
    }, 300);
    
    if (savingsAmount) {
        const savings = Math.round(total * 0.1);
        savingsAmount.textContent = savings.toLocaleString('ru-RU') + ' ₽';
    }
}

// Обработка отправки формы калькулятора
function handleCalculatorSubmit() {
    const serviceTypeSelect = document.getElementById('serviceType');
    const propertyTypeSelect = document.getElementById('propertyType');
    const areaRange = document.getElementById('area');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (!serviceTypeSelect || !propertyTypeSelect || !areaRange || !totalPriceElement) {
        alert('Пожалуйста, заполните все поля калькулятора');
        return;
    }
    
    const serviceTypeValue = serviceTypeSelect.value;
    const propertyTypeValue = propertyTypeSelect.value;
    
    if (!serviceTypeValue || !propertyTypeValue) {
        alert('Пожалуйста, выберите услугу и тип объекта');
        return;
    }
    
    const serviceTypeText = serviceNames[serviceTypeValue] || serviceTypeSelect.options[serviceTypeSelect.selectedIndex]?.text || 'Не выбрано';
    const propertyTypeText = propertyNames[propertyTypeValue] || propertyTypeSelect.options[propertyTypeSelect.selectedIndex]?.text || 'Не выбрано';
    const area = areaRange.value;
    const price = totalPriceElement.textContent;
    
    const selectedOptions = [];
    const checkboxes = document.querySelectorAll('input[name="options"]:checked');
    checkboxes.forEach(checkbox => {
        selectedOptions.push(optionNames[checkbox.value] || checkbox.value);
    });
    
    let serviceText = `${serviceTypeText} для ${propertyTypeText} (${area} м²)`;
    if (selectedOptions.length > 0) {
        serviceText += ` + ${selectedOptions.join(', ')}`;
    }
    serviceText += ` - ${price}`;
    
    const serviceInput = document.getElementById('serviceInput');
    if (serviceInput) {
        serviceInput.value = serviceText;
    }
    
    const calculatorData = {
        service: serviceTypeText,
        property: propertyTypeText,
        area: area,
        options: selectedOptions,
        price: price
    };
    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        if (window.DEZ && window.DEZ.closeAllModals) {
            window.DEZ.closeAllModals();
        }
        orderModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const submitBtn = orderModal.querySelector('button[type="submit"]');
        const memoCheckbox = orderModal.querySelector('#clientMemoAgreement');
        if (submitBtn && memoCheckbox) {
            submitBtn.disabled = true;
            memoCheckbox.checked = false;
        }
    }
}

// ===== ДОПОЛНЕНИЕ ДЛЯ РАБОТЫ С АДМИНКОЙ =====

// Функция для обновления цен из админки
function updatePricesFromAdmin(newPrices) {
    if (!newPrices) return;
    
    console.log('Обновление цен калькулятора из админки');
    
    // Обновляем basePrices
    if (newPrices.base_prices) {
        Object.keys(newPrices.base_prices).forEach(service => {
            if (basePrices[service]) {
                Object.keys(newPrices.base_prices[service]).forEach(prop => {
                    if (basePrices[service][prop] !== undefined) {
                        basePrices[service][prop] = newPrices.base_prices[service][prop];
                    }
                });
            }
        });
    }
    
    // Обновляем коэффициенты опций
    if (newPrices.option_multipliers) {
        Object.keys(newPrices.option_multipliers).forEach(opt => {
            if (optionMultipliers[opt] !== undefined) {
                optionMultipliers[opt] = newPrices.option_multipliers[opt];
            }
        });
    }
    
    // Обновляем названия опций
    if (newPrices.option_names) {
        Object.keys(newPrices.option_names).forEach(opt => {
            if (optionNames[opt] !== undefined) {
                optionNames[opt] = newPrices.option_names[opt];
            }
        });
    }
    
    // Пересчитываем текущую цену
    calculatePrice();
}

// Добавляем функцию в глобальный объект Calculator
if (window.Calculator) {
    window.Calculator.updatePrices = updatePricesFromAdmin;
    window.Calculator.basePrices = basePrices;
    window.Calculator.optionMultipliers = optionMultipliers;
    window.Calculator.optionNames = optionNames;
    window.Calculator.calculatePrice = calculatePrice;
} else {
    window.Calculator = {
        updatePrices: updatePricesFromAdmin,
        basePrices: basePrices,
        optionMultipliers: optionMultipliers,
        optionNames: optionNames,
        calculatePrice: calculatePrice,
        initCalculator: initCalculator,
        handleCalculatorSubmit: handleCalculatorSubmit
    };
}

// Слушаем событие загрузки данных
window.addEventListener('dezoneDataLoaded', function(e) {
    if (e.detail && e.detail.calculator) {
        updatePricesFromAdmin(e.detail.calculator);
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initCalculator();
});

// Экспорт функций
window.Calculator = { 
    initCalculator, 
    calculatePrice, 
    handleCalculatorSubmit,
    updatePrices: updatePricesFromAdmin,
    basePrices: basePrices,
    optionMultipliers: optionMultipliers,
    optionNames: optionNames
};