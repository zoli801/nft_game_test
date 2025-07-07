document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const slotsTrack = document.getElementById('slotsTrack');
    const spinBtn = document.getElementById('spinBtn');
    const particlesContainer = document.getElementById('particles');
    const winModal = document.getElementById('winModal');
    const winPrize = document.getElementById('winPrize');
    const winTitle = document.getElementById('winTitle');
    const nftImage = document.getElementById('nftImage');
    const coinsCount = document.getElementById('coinsCount');

    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    const username = urlParams.get('username');
    const initialBalance = urlParams.get('balance');

    // Текущий баланс
    let coins = parseInt(initialBalance) || 0;
    let isSpinning = false;
    let isModalOpen = false;
    let lastUsedNFTs = [];
    let winSlotElement = null;
    let animationFrameId = null;
    let winModalTimeout = null;
    let idleAnimationId = null;

    // Обновляем отображение баланса
    coinsCount.textContent = coins;

    // NFT изображения
    const nftImages = [
        "https://picsum.photos/id/10/200/200",
        "https://picsum.photos/id/11/200/200",
        "https://picsum.photos/id/12/200/200",
        "https://picsum.photos/id/13/200/200",
        "https://picsum.photos/id/14/200/200",
        "https://picsum.photos/id/15/200/200",
        "https://picsum.photos/id/16/200/200",
        "https://picsum.photos/id/17/200/200"
    ];

    // Секторы рулетки
    const sectors = [
        { value: "15", type: "coins" },
        { value: "25", type: "coins" },
        { value: "50", type: "coins" },
        { value: "100", type: "coins" },
        { value: "NFT", type: "nft" },
        { value: "NFT", type: "nft" },
        { value: "NFT", type: "n极" }
    ];

    // Создать рулетку
    function createSlots() {
        slotsTrack.innerHTML = '';

        // Создаем копию секторов и перемешиваем их
        const shuffledSectors = [...sectors].sort(() => Math.random() - 0.5);
        const slotSets = 40;

        for (let i = 0; i < slotSets; i++) {
            shuffledSectors.forEach((sector, sectorIndex) => {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.dataset.value = sector.value;
                slot.dataset.type = sector.type;

                if (sector.type === "nft") {
                    slot.classList.add('nft');
                    const img = document.createElement('img');
                    img.className = 'nft-image-slot';

                    // Выбор уникальной картинки
                    let randomImage;
                    let attempts = 0;

                    do {
                        randomImage = nftImages[Math.floor(Math.random() * nftImages.length)];
                        attempts++;

                        if (attempts > 50) {
                            lastUsedNFTs = [];
                            break;
                        }
                    } while (lastUsedNFTs.includes(randomImage));

                    lastUsedNFTs.push(randomImage);
                    if (lastUsedNFTs.length > 10) {
                        lastUsedNFTs.shift();
                    }

                    img.src = randomImage;
                    slot.appendChild(img);
                } else {
                    slot.textContent = sector.value;
                }

                slotsTrack.appendChild(slot);
            });
        }

        // Сброс позиции трека
        slotsTrack.style.transform = `translateX(0)`;
    }

    // Запустить фоновое вращение
    function startIdleAnimation() {
        let start = null;
        const duration = 60000; // 60 секунд
        const distance = slotsTrack.scrollWidth / 2;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percent = Math.min(progress / duration, 1);
            const newPosition = percent * distance;

            slotsTrack.style.transform = `translateX(-${newPosition}px)`;

            if (percent < 1) {
                idleAnimationId = requestAnimationFrame(step);
            } else {
                // Перезапускаем анимацию
                startIdleAnimation();
            }
        }

        idleAnimationId = requestAnimationFrame(step);
    }

    // Остановить фоновое вращение
    function stopIdleAnimation() {
        if (idleAnimationId) {
            cancelAnimationFrame(idleAnimationId);
            idleAnimationId = null;
        }
    }

    // Сбросить стили всех слотов
    function resetAllSlots() {
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => {
            slot.style.transform = '';
            slot.style.filter = '';
            slot.style.transition = '';
            slot.classList.remove('win-animation');
        });

        if (winSlotElement) {
            winSlotElement.style.transform = '';
            winSlotElement.style.filter = '';
            winSlotElement = null;
        }
    }

    // Создать эффект частиц
    function createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.background = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            particlesContainer.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // Показать окно победы
    function showWinModal(winSector, winSlot) {
        isModalOpen = true;

        if (winSector.type === "nft") {
            const img = winSlot.querySelector('img');
            if (img) {
                nftImage.style.backgroundImage = `url(${img.src})`;
                nftImage.style.display = 'block';
            }
            winPrize.textContent = "Редкий NFT!";
            winTitle.textContent = "NFT НАЙДЕН!";
        } else {
            nftImage.style.display = 'none';
            winPrize.textContent = `Вы выиграли ${winSector.value} звёзд!`;
            winTitle.textContent = "ПОБЕДА!";
        }

        winModal.style.display = 'flex';

        // Установка таймера для закрытия окна выигрыша
        winModalTimeout = setTimeout(closeWinModal, 3000);
    }

    // Закрыть окно победы
    function closeWinModal() {
        if (winModalTimeout) {
            clearTimeout(winModalTimeout);
            winModalTimeout = null;
        }

        winModal.style.display = 'none';
        resetAllSlots();

        // Пересоздаем слоты для сброса позиции
        createSlots();
        startIdleAnimation();

        // Разблокировать кнопки после закрытия модального окна
        isModalOpen = false;
        spinBtn.disabled = false;
    }

    // Обработчик закрытия модального окна по клику
    winModal.addEventListener('click', closeWinModal);

    // Плавная функция замедления
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Функция для вращения слотов
    function spinSlots() {
        if (isSpinning || isModalOpen) return;

        if (coins < 100) {
            alert("Недостаточно звёзд!");
            return;
        }

        isSpinning = true;
        spinBtn.disabled = true;

        // Сбросить предыдущие стили
        resetAllSlots();

        // Обновляем баланс
        coins -= 100;
        coinsCount.textContent = coins;

        stopIdleAnimation();

        const containerRect = document.querySelector('.slots-container').getBoundingClientRect();
        const slotElement = document.querySelector('.slot');
        const slotStyle = getComputedStyle(slotElement);
        const marginLeft = parseFloat(slotStyle.marginLeft);
        const marginRight = parseFloat(slotStyle.marginRight);
        const totalSlotWidth = slotElement.offsetWidth + marginLeft + marginRight;
        const containerWidth = containerRect.width;

        // Расчет конечной позиции
        const cycles = 15 + Math.floor(Math.random() * 5);
        const sectorCount = sectors.length;
        const winIndex = Math.floor(Math.random() * sectorCount);
        const targetPosition = (cycles * sectorCount + winIndex) * totalSlotWidth - (containerWidth / 2 - totalSlotWidth / 2);

        // Анимация вращения
        let startTime = null;
        const duration = 6000;

        // Сохраняем начальную позицию
        const startPosition = 0;

        slotsTrack.style.filter = "blur(3px)";

        createParticles(
            containerRect.left + containerWidth / 2,
            containerRect.top + containerRect.height / 2,
            50,
            '#ffd700'
        );

        // Отменяем предыдущий requestAnimationFrame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Функция анимации
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Используем плавное замедление
            const easedProgress = easeOutCubic(progress);
            const newPosition = startPosition + (targetPosition - startPosition) * easedProgress;

            // Обновляем позицию трека
            slotsTrack.style.transform = `translateX(-${newPosition}px)`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Финализация позиции
                slotsTrack.style.transform = `translateX(-${targetPosition}px)`;

                // Точное вычисление выигрышного слота
                const slotIndex = Math.floor((targetPosition + containerWidth / 2) / totalSlotWidth) % slotsTrack.children.length;
                const centerSlot = slotsTrack.children[slotIndex];

                const actualWinSector = {
                    value: centerSlot.dataset.value,
                    type: centerSlot.dataset.type
                };

                // Сохраняем элемент выигравшего слота
                winSlotElement = centerSlot;

                // Применяем стили к выигравшему слоту
                centerSlot.style.transform = "scale(1.15)";
                centerSlot.style.filter = "drop-shadow(0 0 25px gold) brightness(1.3)";
                centerSlot.style.transition = "all 0.5s ease";

                slotsTrack.style.filter = "none";

                createParticles(
                    containerRect.left + containerWidth / 2,
                    containerRect.top + containerRect.height / 2,
                    100,
                    '#ffd700'
                );

                setTimeout(() => {
                    showWinModal(actualWinSector, centerSlot);

                    // Отправляем результат в Telegram бот
                    Telegram.WebApp.sendData(JSON.stringify({
                        user_id: userId,
                        username: username,
                        result: actualWinSector.value,
                        type: actualWinSector.type
                    }));

                    isSpinning = false;
                }, 1500);
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // Инициализация приложения
    function initApp() {
        createSlots();

        // Скрыть загрузчик и запустить анимацию
        setTimeout(() => {
            loader.style.display = 'none';
            startIdleAnimation();
        }, 800);

        spinBtn.addEventListener('click', spinSlots);

        // Инициализация Telegram Web App
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }

    initApp();
});