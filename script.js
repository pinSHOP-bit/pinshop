// ВАШ TELEGRAM ID
const ADMIN_TELEGRAM_ID = 8560869637;

// Инициализация Telegram
let tg = null;
let currentUser = null;

if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Получаем данные пользователя
    currentUser = tg.initDataUnsafe?.user;
}

// Проверка - администратор ли это (по Telegram ID)
function isAdmin() {
    if (!currentUser) return false;
    return currentUser.id === ADMIN_TELEGRAM_ID;
}

// Инициализация товаров (начальные предметы MM2)
let products = JSON.parse(localStorage.getItem('mm2Products')) || [
    {
        id: 1,
        name: "Chroma Darkbringer",
        category: "godly",
        price: 1500,
        image: "https://via.placeholder.com/200x200/8B0000/FFFFFF?text=Darkbringer"
    },
    {
        id: 2,
        name: "Icebreaker",
        category: "godly",
        price: 1800,
        image: "https://via.placeholder.com/200x200/00FFFF/000000?text=Icebreaker"
    },
    {
        id: 3,
        name: "Corrupt",
        category: "rare",
        price: 3000,
        image: "https://via.placeholder.com/200x200/8B008B/FFFFFF?text=Corrupt"
    },
    {
        id: 4,
        name: "Default Knife",
        category: "knife",
        price: 50,
        image: "https://via.placeholder.com/200x200/808080/FFFFFF?text=Knife"
    },
    {
        id: 5,
        name: "Default Gun",
        category: "gun",
        price: 50,
        image: "https://via.placeholder.com/200x200/808080/FFFFFF?text=Gun"
    },
    {
        id: 6,
        name: "Lightbringer",
        category: "godly",
        price: 1200,
        image: "https://via.placeholder.com/200x200/FFD700/000000?text=Lightbringer"
    }
];

// Функция для отображения товаров
function displayProducts(filter = 'all') {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(p => p.category === filter);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const categoryLabels = {
            'knife': '🔪 Нож',
            'gun': '🔫 Пистолет',
            'rare': '💎 Редкий',
            'godly': '✨ Годли'
        };
        
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-category">${categoryLabels[product.category]}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price} ₽</div>
        `;
        
        productsContainer.appendChild(productCard);
    });
}

// Функция для фильтрации товаров
function filterProducts(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    displayProducts(category);
}

// Функция для открытия админ-панели (без пароля, по Telegram ID)
function openAdminPanel() {
    document.getElementById('shop').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    displayAdminProducts();
}

// Функция для отображения магазина
function showShop() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('shop').style.display = 'block';
    displayProducts();
}

// Функция для добавления товара
function addProduct() {
    if (!isAdmin()) {
        alert('⛔ Нет прав администратора!');
        return;
    }
    
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const price = parseInt(document.getElementById('itemPrice').value);
    const imageFile = document.getElementById('itemImage').files[0];
    
    if (!name || !price) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }
    
    let imageUrl = 'https://via.placeholder.com/200x200/8B008B/FFFFFF?text=New+Item';
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageUrl = e.target.result;
            createProduct(name, category, price, imageUrl);
        };
        reader.readAsDataURL(imageFile);
    } else {
        createProduct(name, category, price, imageUrl);
    }
}

// Функция для создания товара
function createProduct(name, category, price, image) {
    const newProduct = {
        id: Date.now(),
        name: name,
        category: category,
        price: price,
        image: image
    };
    
    products.push(newProduct);
    localStorage.setItem('mm2Products', JSON.stringify(products));
    
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemImage').value = '';
    
    displayAdminProducts();
    alert('✅ Товар успешно добавлен!');
}

// Функция для отображения товаров в админ-панели
function displayAdminProducts() {
    const adminList = document.getElementById('adminProductList');
    adminList.innerHTML = '';
    
    products.forEach(product => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-product-item';
        
        adminItem.innerHTML = `
            <div class="admin-product-info">
                <img src="${product.image}" alt="${product.name}" class="admin-product-image">
                <div>
                    <strong>${product.name}</strong>
                    <br>
                    <small>Категория: ${product.category}</small>
                    <br>
                    <small style="color: #ba68c8; font-weight: bold;">${product.price} ₽</small>
                </div>
            </div>
            <div class="admin-product-actions">
                <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Изменить</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Удалить</button>
            </div>
        `;
        
        adminList.appendChild(adminItem);
    });
}

// Функция для редактирования товара
function editProduct(id) {
    if (!isAdmin()) {
        alert('⛔ Нет прав администратора!');
        return;
    }
    
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newName = prompt('Введите новое название:', product.name);
    if (newName === null) return;
    
    const newPrice = prompt('Введите новую цену (₽):', product.price);
    if (newPrice === null) return;
    
    const newCategory = prompt('Введите категорию (knife/gun/rare/godly):', product.category);
    if (newCategory === null) return;
    
    product.name = newName;
    product.price = parseInt(newPrice);
    product.category = newCategory;
    
    localStorage.setItem('mm2Products', JSON.stringify(products));
    displayAdminProducts();
    displayProducts();
    
    alert('✅ Товар обновлен!');
}

// Функция для удаления товара
function deleteProduct(id) {
    if (!isAdmin()) {
        alert('⛔ Нет прав администратора!');
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('mm2Products', JSON.stringify(products));
        displayAdminProducts();
        displayProducts();
    }
}

// Функция для автоматического изменения цен на годли
function updateGodlyPrices() {
    const godlyItems = products.filter(p => p.category === 'godly');
    
    godlyItems.forEach(item => {
        const changePercent = (Math.random() * 40 - 20) / 100;
        let newPrice = Math.round(item.price * (1 + changePercent));
        
        if (newPrice < 100) newPrice = 100;
        
        item.price = newPrice;
    });
    
    localStorage.setItem('mm2Products', JSON.stringify(products));
    displayProducts();
    
    console.log('✅ Цены на годли обновлены!', new Date().toLocaleTimeString());
}

// Запускаем обновление цен каждые 5 минут
setInterval(updateGodlyPrices, 300000);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Показываем кнопку админа только вам
    if (isAdmin()) {
        console.log('👑 Добро пожаловать, администратор!');
        document.getElementById('adminBtn').style.display = 'block';
    } else {
        console.log('👤 Обычный пользователь');
        document.getElementById('adminBtn').style.display = 'none';
    }
    
    // Скрываем админ-панель
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('shop').style.display = 'block';
    
    // Первое обновление цен через 30 секунд
    setTimeout(updateGodlyPrices, 30000);
    
    // Выводим информацию
    if (tg) {
        console.log('✅ Telegram Mini App запущен');
        if (currentUser) {
            console.log('👤 Пользователь:', currentUser.username || currentUser.first_name);
            console.log('🆔 ID:', currentUser.id);
        }
    } else {
        console.log('⚠️ Не в Telegram. Запущено в браузере');
    }
});

// Инициализация при загрузке страницы
displayProducts();