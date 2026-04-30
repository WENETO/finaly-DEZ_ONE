// ===== ОБНОВЛЕНИЕ КАЛЬКУЛЯТОРА ИЗ JSONBIN =====
// Этот файл нужно подключить после calculator.js

// Функция обновления цен в калькуляторе
function updateCalculatorFromData(calculatorData) {
    if (!calculatorData || !calculatorData.base_prices) return;
    
    console.log('Обновляем калькулятор из загруженных данных');
    
    // Обновляем объект basePrices в calculator.js
    if (window.Calculator && window.Calculator.basePrices) {
        // Для каждой услуги обновляем цены
        const services = [
            'cockroach', 'bedbug', 'rodent', 'disinsection', 'deratization',
            'disinfection', 'complex', 'demercurization', 'odor_removal', 'cleaning'
        ];
        
        services.forEach(service => {
            if (calculatorData.base_prices[service] && window.Calculator.basePrices[service]) {
                Object.keys(calculatorData.base_prices[service]).forEach(key => {
                    if (window.Calculator.basePrices[service][key] !== undefined) {
                        window.Calculator.basePrices[service][key] = calculatorData.base_prices[service][key];
                    }
                });
            }
        });
        
        // Обновляем коэффициенты опций
        if (calculatorData.option_multipliers) {
            Object.keys(calculatorData.option_multipliers).forEach(key => {
                if (window.Calculator.optionMultipliers[key] !== undefined) {
                    window.Calculator.optionMultipliers[key] = calculatorData.option_multipliers[key];
                }
            });
        }
        
        // Обновляем названия опций
        if (calculatorData.option_names && window.Calculator.optionNames) {
            Object.keys(calculatorData.option_names).forEach(key => {
                if (window.Calculator.optionNames[key] !== undefined) {
                    window.Calculator.optionNames[key] = calculatorData.option_names[key];
                }
            });
        }
        
        // Пересчитываем цену, если калькулятор уже инициализирован
        if (window.Calculator.calculatePrice) {
            window.Calculator.calculatePrice();
        }
        
        console.log('Калькулятор обновлён');
    }
}

// Слушаем событие загрузки данных
window.addEventListener('dezoneDataLoaded', function(e) {
    if (e.detail && e.detail.calculator) {
        updateCalculatorFromData(e.detail.calculator);
    }
});

// Если данные уже загружены, пробуем обновить
setTimeout(() => {
    if (window.lastLoadedData && window.lastLoadedData.calculator) {
        updateCalculatorFromData(window.lastLoadedData.calculator);
    }
}, 1000);

// Сохраняем ссылку на данные при их загрузке
window.addEventListener('dezoneDataLoaded', function(e) {
    window.lastLoadedData = e.detail;
});

// Экспорт функции
window.updateCalculator = updateCalculatorFromData;