/**
 * Главное ядро приложения, Роутер SPA и Реактивный Рендеринг Компонентов
 */

// Глобальное состояние фильтров каталога
const catalogFilters = {
    search: "",
    category: "all",
    maxPrice: 2000,
    minRating: 0,
    sortBy: "popular"
};

// Сайт толук жүктөлгөндө иштеүүчү функция
document.addEventListener("DOMContentLoaded", () => {
    // Эгер кокустан өчүп калса, базаны мажбурлап кайра текшерүү
    if (!localStorage.getItem("aura_products") && typeof initialProducts !== 'undefined') {
        localStorage.setItem("aura_products", JSON.stringify(initialProducts));
    }

    ThemeManager.init();
    CartModule.updateBadges();
    initGlobalEvents();
    
    // Роутерди бир аз кечиктирип иштетүү (Баарын окуп жетиши үчүн)
    setTimeout(() => {
        router.init();
    }, 50);
});

// Инициализация глобальных элементов (Шапка, Поиск, Кнопки)
function initGlobalEvents() {
    document.getElementById("theme-toggle").addEventListener("click", () => {
        SoundEngine.play("click");
        ThemeManager.toggle();
    });

    const soundBtn = document.getElementById("sound-toggle");
    soundBtn.addEventListener("click", () => {
        const enabled = SoundEngine.toggle();
        soundBtn.innerHTML = enabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        SoundEngine.play("click");
    });

    // Бургер меню анимация
    const burger = document.getElementById("burger-toggle");
    const drawer = document.getElementById("mobile-drawer");
    burger.addEventListener("click", () => {
        SoundEngine.play("menu");
        burger.classList.toggle("active");
        drawer.classList.toggle("active");
    });

    // Живой глобальный поиск
    document.getElementById("global-search").addEventListener("input", (e) => {
        catalogFilters.search = e.target.value.trim();
        if (router.currentView !== "catalog") {
            router.navigate("catalog");
        } else {
            renderCatalogGrid();
        }
    });

    // Навешивание дата-линков для SPA переходов
    document.body.addEventListener("click", (e) => {
        const link = e.target.closest("[data-link]");
        if (link) {
            e.preventDefault();
            const view = link.getAttribute("data-link");
            
            // Если кликнули в мобильном меню — закрываем его
            burger.classList.remove("active");
            drawer.classList.remove("active");
            
            router.navigate(view);
        }
    });
}

// Роутер архитектуры SPA
const router = {
    currentView: "home",
    selectedProductId: null, // Хранилище для детального просмотра карточки

    init() {
        this.navigate("home");
    },

    navigate(view, id = null) {
        SoundEngine.play("click");
        this.currentView = view;
        if (id) this.selectedProductId = id;
        this.render(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    render(view) {
        const container = document.getElementById("app-container");
        const user = AppStorage.getCurrentUser();
        
        // Динамическое обновление иконки профиля в навбаре
        const profileBtn = document.getElementById("profile-nav-btn");
        if(user) {
            profileBtn.innerHTML = `<span style="font-size:0.85rem; font-weight:bold; color:var(--accent)">${user.name[0].toUpperCase()}</span>`;
        } else {
            profileBtn.innerHTML = '<i class="fa-solid fa-user"></i>';
        }

        switch (view) {
            case "home":
                container.innerHTML = renderHome();
                break;
            case "catalog":
                container.innerHTML = renderCatalog();
                renderCatalogGrid();
                break;
            case "product":
                container.innerHTML = renderProductDetails(this.selectedProductId);
                break;
            case "cart":
                container.innerHTML = renderCart();
                break;
            case "favorites":
                container.innerHTML = renderFavorites();
                break;
            case "compare":
                container.innerHTML = renderCompare();
                break;
            case "checkout":
                container.innerHTML = renderCheckout();
                break;
            case "auth":
                container.innerHTML = user ? renderProfile(user) : renderAuth();
                break;
            case "admin":
                if (user && user.role === "admin") {
                    container.innerHTML = renderAdmin();
                } else {
                    container.innerHTML = `<h2>Доступ ограничен</h2><p>Необходимы права Администратора.</p>`;
                }
                break;
            case "contacts":
                container.innerHTML = renderContacts();
                break;
            default:
                container.innerHTML = render404();
        }
    }
};

/* ==========================================
   КОМПОНЕНТЫ СТРАНИЦ И ШАБЛОНЫ (VIEWS)
========================================== */

function renderHome() {
    const products = AppStorage.getProducts();
    const topSales = products.filter(p => p.isTop).slice(0, 3);
    const actions = products.filter(p => p.isAction).slice(0, 3);

    return `
        <section class="hero glass">
            <h1>Будущее Коммерции Уже Здесь</h1>
            <p>Эксклюзивные товары, передовой интерфейс и молниеносная реакция экосистемы.</p>
            <button class="btn-primary" data-link="catalog">Открыть Каталог</button>
        </section>

            <h2 style="margin-bottom:1.5rem">🔥 Топ Продаж</h2>
        <div class="products-grid" style="margin-bottom:3rem">
            ${topSales.map(p => generateProductCardHtml(p)).join("")}
        </div>

            <h2 style="margin-bottom:1.5rem">⚡ Горячие Акции</h2>
        <div class="products-grid">
            ${actions.map(p => generateProductCardHtml(p)).join("")}
        </div>
    `;
}

// 1. КАТАЛОГ СЕЛЕКТТЕРИНИН СТИЛИН ОҢДОО (Окулбай калган ак тексттер оңдолду)
function renderCatalog() {
    const products = AppStorage.getProducts();
    const categories = ["all", ...new Set(products.map(p => p.category))];

    return `
        <div class="catalog-layout">
            <aside class="sidebar-filters glass" style="padding: 1.5rem; border-radius: 16px;">
                <div class="filter-group" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #fff;">Категория</h3>
                    <select id="filter-cat" onchange="updateCatalogFilter('category', this.value)"
                            style="background: #111622; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; outline: none; cursor: pointer; width: 100%; font-size: 0.95rem;">
                        ${categories.map(c => `
                            <option value="${c}" style="background: #111622; color: #fff; padding: 10px;">
                                ${c === 'all' ? 'Все категории' : c}
                            </option>
                        `).join("")}
                    </select>
                </div>
                <div class="filter-group" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #fff;">Цена до ($)</h3>
                    <input type="range" min="0" max="2500" value="${catalogFilters.maxPrice}" step="50" 
                        oninput="document.getElementById('price-val').innerText = this.value; updateCatalogFilter('maxPrice', this.value)" style="width:100%;">
                    <span id="price-val" style="font-weight:bold; color:var(--accent);">${catalogFilters.maxPrice}</span> $
                </div>
                <div class="filter-group">
                    <h3 style="margin-bottom: 0.5rem; color: #fff;">Сортировка</h3>
                    <select onchange="updateCatalogFilter('sortBy', this.value)"
                            style="background: #111622; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; outline: none; cursor: pointer; width: 100%; font-size: 0.95rem;">
                        <option value="popular" style="background: #111622; color: #fff;">По популярности</option>
                        <option value="cheap" style="background: #111622; color: #fff;">Сначала дешевле</option>
                        <option value="expensive" style="background: #111622; color: #fff;">Сначала дороже</option>
                        <option value="new" style="background: #111622; color: #fff;">Новинки</option>
                    </select>
                </div>
            </aside>
            <div class="products-grid" id="catalog-products-container"></div>
        </div>
    `;
}
function updateCatalogFilter(key, value) {
    catalogFilters[key] = value;
    renderCatalogGrid();
}

// Применение функциональных методов массивов map, filter, sort
function renderCatalogGrid() {
    const container = document.getElementById("catalog-products-container");
    if (!container) return;

    // Включение эффекта скелетонной загрузки перед выводом данных
    container.innerHTML = Array(4).fill(0).map(() => `
        <div class="product-card glass skeleton">
            <div class="skeleton-img"></div>
            <div style="margin-top:10px" class="skeleton-text"></div>
            <div class="skeleton-text" style="width:60%"></div>
        </div>
    `).join("");

    setTimeout(() => {
        let items = AppStorage.getProducts();

        // 1. Фильтр по поисковому запросу
        if (catalogFilters.search) {
            items = items.filter(p => p.title.toLowerCase().includes(catalogFilters.search.toLowerCase()) || p.category.toLowerCase().includes(catalogFilters.search.toLowerCase()));
        }

        // 2. Фильтр по категориям
        if (catalogFilters.category !== "all") {
            items = items.filter(p => p.category === catalogFilters.category);
        }

        // 3. Фильтр по цене
        items = items.filter(p => (p.price - (p.price * (p.discount/100))) <= parseFloat(catalogFilters.maxPrice));

        // 4. Сортировка данных (sort)
        if (catalogFilters.sortBy === "cheap") {
            items.sort((a,b) => (a.price - (a.price * (a.discount/100))) - (b.price - (b.price * (b.discount/100))));
        } else if (catalogFilters.sortBy === "expensive") {
            items.sort((a,b) => (b.price - (b.price * (b.discount/100))) - (a.price - (a.price * (a.discount/100))));
        } else if (catalogFilters.sortBy === "new") {
            items.sort((a,b) => new Date(b.date) - new Date(a.date));
        } else {
            items.sort((a,b) => b.rating - a.rating); // Популярные (по рейтингу)
        }

        if(items.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted)">Товары не найдены.</div>`;
            return;
        }

        container.innerHTML = items.map(p => generateProductCardHtml(p)).join("");
    }, 300); // Симуляция оптимизации рендеринга
}

function generateProductCardHtml(product) {
    const isFav = AppStorage.getFavorites().includes(product.id) ? "active" : "";
    const hasDiscount = product.discount > 0;
    const finalPrice = product.price - (product.price * (product.discount / 100));

    return `
        <div class="product-card glass">
            ${hasDiscount ? `<div class="card-badge">-${product.discount}%</div>` : ""}
            <button class="card-fav-btn ${isFav}" onclick="CartModule.toggleFavorite(${product.id}); this.classList.toggle('active')">
                <i class="fa-solid fa-heart"></i>
            </button>
            <img src="${product.image}" alt="${product.title}" class="product-image" onclick="router.navigate('product', ${product.id})">
            <div class="product-info">
                <h4 onclick="router.navigate('product', ${product.id})">${product.title}</h4>
                <div class="product-meta">
                    <span class="rating"><i class="fa-solid fa-star"></i> ${product.rating}</span>
                    <span>${product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет на складе'}</span>
                </div>
            </div>
            <div class="product-footer">
                <div class="price-block">
                    ${hasDiscount ? `<span class="old-price">$${product.price}</span>` : ""}
                    <span class="current-price">$${finalPrice.toFixed(2)}</span>
                </div>
                <button class="nav-btn" style="background:var(--primary); color:white; border-radius:8px;" 
                    onclick="CartModule.addToCart(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
            <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem; margin-top:10px; background:rgba(255,255,255,0.05); box-shadow:none;"
                onclick="CartModule.toggleCompare(${product.id})">⚖ Сравнить
            </button>
        </div>
    `;
}

// 3. ТОЛУК СҮРӨТҮ КООЗДОЛГОН ИЧКИ БЕТ (Сүрөт туура өлчөмдө турушу үчүн оңдолду)
function renderProductDetails(id) {
    const products = AppStorage.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return render404();

    const finalPrice = product.price - (product.price * (product.discount / 100));

    return `
        <div class="product-details-container glass" style="padding: 2rem; border-radius: 16px; max-width: 1000px; margin: 0 auto;">
            <button class="btn-secondary back-btn" onclick="router.navigate('catalog')" style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                <i class="fa-solid fa-arrow-left"></i> Назад в каталог
            </button>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:3rem; align-items: center;">
                <div style="width: 100%; height: 400px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #0b0f19; display: flex; align-items: center; justify-content: center;">
                    <img src="${product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}" alt="${product.title}" style="width:100%; height:100%; object-fit: cover;">
                </div>
                <div>
                    <span style="background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; color:var(--accent); font-size:0.85rem; border: 1px solid rgba(255,255,255,0.05);">${product.category}</span>
                    <h1 style="margin:1rem 0 1rem 0; color: #fff; font-size: 2.2rem;">${product.title}</h1>
                    <p style="margin-bottom:2rem; line-height:1.6; color: #a0aec0;">${product.description || 'Описание товара отсутствует.'}</p>
                    <div style="font-size:2.4rem; font-weight:700; margin-bottom:2rem; color: #fff;">
                        $${finalPrice.toFixed(2)}
                        ${product.discount > 0 ? `<span style="font-size:1.4rem; text-decoration:line-through; color:var(--text-muted); margin-left:15px">$${product.price}</span>` : ""}
                    </div>
                    <button class="btn-primary" style="padding: 14px 28px; font-size: 1.05rem; border-radius: 10px; font-weight: bold;" onclick="CartModule.addToCart(${product.id})">Добавить в корзину</button>
                </div>
            </div>
            <hr style="border-color:var(--border-glass); margin:3rem 0">
            <h3 style="color: #fff;">Отзывы покупателей</h3>
            <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                <div class="glass" style="padding:1.2rem; border-radius: 10px;">
                    <strong>Алексей К.</strong> <span style="color:#f59e0b; margin-left: 10px;">★★★★★</span>
                    <p style="margin-top:8px; font-size:0.95rem; color: #cbd5e0;">Великолепное качество товара! Доставили вовремя, полностью соответствует премиум-уровню.</p>
                </div>
            </div>
        </div>
    `;
}
function renderCart() {
    const cart = AppStorage.getCart();
    const products = AppStorage.getProducts();
    
    let total = 0;
    const cartItemsHtml = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        if (!prod) return "";
        const price = prod.price - (prod.price * (prod.discount / 100));
        total += price * item.quantity;

        return `
            <div class="cart-item glass">
                <img src="${prod.image}" alt="${prod.title}">
                <div style="flex:1">
                    <h4>${prod.title}</h4>
                    <span style="color:var(--text-muted)">$${price.toFixed(2)}</span>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="CartModule.changeQuantity(${prod.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="CartModule.changeQuantity(${prod.id}, 1)">+</button>
                </div>
                <div style="font-weight:bold; width:80px; text-align:right;">$${(price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join("");

    if (cart.length === 0) {
        return `<div class="glass" style="padding:3rem; text-align:center">Ваша корзина пуста. Начните покупки в <a href="#" data-link="catalog" style="color:var(--primary)">Каталоге</a>.</div>`;
    }

    return `
        <div class="cart-layout">
            <h2>Ваша Корзина</h2>
            <div style="margin-top:1.5rem">${cartItemsHtml}</div>
            <div class="glass" style="margin-top:1.5rem; padding:1.5rem; text-align:right;">
                <h3 style="margin-bottom:1rem">Итого: $${total.toFixed(2)}</h3>
                <button class="btn-primary" data-link="checkout">Перейти к оформлению</button>
            </div>
        </div>
    `;
}

function renderFavorites() {
    const favs = AppStorage.getFavorites();
    const products = AppStorage.getProducts().filter(p => favs.includes(p.id));

    return `
        <h2>Избранные Товары</h2>
        <div class="products-grid" style="margin-top:1.5rem">
            ${products.length > 0 ? products.map(p => generateProductCardHtml(p)).join("") : '<p style="color:var(--text-muted)">Список избранного пуст.</p>'}
        </div>
    `;
}

function renderCompare() {
    const compIds = AppStorage.getCompare();
    const products = AppStorage.getProducts().filter(p => compIds.includes(p.id));

    if(products.length === 0) return `<h2>Сравнение товаров</h2><p style="margin-top:1rem; color:var(--text-muted)">Добавьте товары для сравнения характеристик.</p>`;

    return `
        <h2>Сравнение товаров</h2>
        <div style="overflow-x:auto">
            <table class="compare-table glass">
                <thead>
                    <tr>
                        <th>Характеристика</th>
                        ${products.map(p => `<th>${p.title}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Цена</strong></td>
                        ${products.map(p => `<td>$${(p.price - (p.price*(p.discount/100))).toFixed(2)}</td>`).join("")}
                    </tr>
                    <tr>
                        <td><strong>Категория</strong></td>
                        ${products.map(p => `<td>${p.category}</td>`).join("")}
                    </tr>
                    <tr>
                        <td><strong>Рейтинг</strong></td>
                        ${products.map(p => `<td>⭐ ${p.rating}</td>`).join("")}
                    </tr>
                    <tr>
                        <td><strong>Наличие</strong></td>
                        ${products.map(p => `<td>${p.stock} шт.</td>`).join("")}
                    </tr>
                    <tr>
                        <td><strong>Действие</strong></td>
                        ${products.map(p => `<td><button class="btn-primary" style="padding:4px 8px; font-size:0.8rem" onclick="CartModule.toggleCompare(${p.id}); router.render('compare')">Удалить</button></td>`).join("")}
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderCheckout() {
    return `
        <div class="auth-container glass">
            <h2>Оформление заказа</h2>
            <form id="checkout-form" onsubmit="processOrder(event)" style="margin-top:1.5rem">
                <input type="text" class="input-field" placeholder="ФИО получателя" required>
                <input type="tel" class="input-field" placeholder="Номер телефона" required>
                <input type="text" class="input-field" placeholder="Адрес доставки" required>
                <button type="submit" class="btn-primary" style="width:100%">Подтвердить и оплатить</button>
            </form>
        </div>
    `;
}

function processOrder(e) {
    e.preventDefault();
    const cart = AppStorage.getCart();
    const products = AppStorage.getProducts();
    
    // Списание остатков на складе (Метод Map)
    let total = 0;
    const updatedProducts = products.map(p => {
        const cItem = cart.find(i => i.id === p.id);
        if(cItem) {
            p.stock -= cItem.quantity;
            total += (p.price - (p.price*(p.discount/100))) * cItem.quantity;
        }
        return p;
    });

    AppStorage.saveProducts(updatedProducts);
    
    const orders = AppStorage.getOrders();
    orders.push({ id: Date.now(), total: total, date: new Date().toISOString() });
    AppStorage.saveOrders(orders);

    AppStorage.saveCart([]); // Очистка корзины
    CartModule.updateBadges();
    
    SoundEngine.play("success");
    alert("Заказ успешно оформлен!");
    router.navigate("home");
}

// 4. АВТОРИЗАЦИЯ БЕТИНИН КӨЗ ИКОНКАСЫН ОҢДОО
function renderAuth() {
    return `
        <div class="auth-container glass" style="position: relative; padding: 2.5rem; border-radius: 16px; max-width: 450px; margin: 2rem auto;">
            <button class="auth-close-btn" onclick="SoundEngine.play('delete'); router.navigate('home')" aria-label="Закрыть" style="position: absolute; right: 15px; top: 15px; background: transparent; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <div class="auth-tabs" style="display:flex; justify-content:space-around; margin-bottom:2rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem;">
                <button class="btn-primary" style="background:transparent; color:white; box-shadow:none; font-weight:600; font-size: 1.1rem;" onclick="document.getElementById('login-form').style.display='block'; document.getElementById('register-form').style.display='none'">Вход</button>
                <button class="btn-primary" style="background:transparent; color:white; box-shadow:none; font-weight:600; font-size: 1.1rem;" onclick="document.getElementById('login-form').style.display='none'; document.getElementById('register-form').style.display='block'">Регистрация</button>
            </div>
            
            <form id="login-form" onsubmit="handleLogin(event)">
                <h3 style="color: #fff;">Вход в систему</h3><br>
                <input type="email" id="login-email" class="input-field" placeholder="Email" required>
                
                <div class="password-wrapper" style="position: relative; width: 100%; margin-bottom: 1rem;">
                    <input type="password" id="login-pass" class="input-field" placeholder="Пароль" style="width: 100%; padding-right: 45px; margin-bottom: 0;" required>
                    <button type="button" onclick="togglePasswordVisibility('login-pass', this)" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #a0aec0; cursor: pointer; font-size: 1.2rem; padding: 0; display: flex; align-items: center;">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                
                <button type="submit" class="btn-primary" style="width:100%; padding: 12px; font-weight: bold; margin-top: 10px;">Войти</button>
            </form>

            <form id="register-form" onsubmit="handleRegister(event)" style="display:none">
                <h3 style="color: #fff;">Регистрация</h3><br>
                <input type="text" id="reg-name" class="input-field" placeholder="Имя" required>
                <input type="email" id="reg-email" class="input-field" placeholder="Email" required>
                
                <div class="password-wrapper" style="position: relative; width: 100%; margin-bottom: 1rem;">
                    <input type="password" id="reg-pass" class="input-field" placeholder="Пароль" style="width: 100%; padding-right: 45px; margin-bottom: 0;" required>
                    <button type="button" onclick="togglePasswordVisibility('reg-pass', this)" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #a0aec0; cursor: pointer; font-size: 1.2rem; padding: 0; display: flex; align-items: center;">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                
                <button type="submit" class="btn-primary" style="width:100%; padding: 12px; font-weight: bold; margin-top: 10px;">Создать аккаунт</button>
            </form>
        </div>
    `;
}
// ПАРОЛДУ КӨРСӨТҮҮ ЖАНА ЖАШЫРУУ ФУНКЦИЯСЫ
function togglePasswordVisibility(inputId, buttonElement) {
    SoundEngine.play('click'); // Сиздин кооз үн эффектиңизди кошуп койдум
    const passwordInput = document.getElementById(inputId);
    const icon = buttonElement.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash'); // Көздүн сызылган иконкасы
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye'); // Кадимки көз иконкасы
    }
}

function handleLogin(e) {
    e.preventDefault();
    const res = AuthModule.login(document.getElementById("login-email").value, document.getElementById("login-pass").value);
    if(res.success) router.navigate("auth");
    else alert(res.message);
}

function handleRegister(e) {
    e.preventDefault();
    const res = AuthModule.register(document.getElementById("reg-email").value, document.getElementById("reg-pass").value, document.getElementById("reg-name").value);
    alert(res.message);
    if(res.success) {
        document.getElementById('login-form').style.display='block';
        document.getElementById('register-form').style.display='none';
    }
}

function renderProfile(user) {
    return `
        <div class="auth-container glass text-center">
            <h2>Личный Кабинет</h2><br>
            <p><strong>Привет, ${user.name}!</strong></p>
            <p>Ваш Email: ${user.email}</p>
            <p>Статус аккаунта: <span style="color:var(--accent)">${user.role.toUpperCase()}</span></p><br>
            ${user.role === 'admin' ? `<button class="btn-primary" data-link="admin" style="margin-right:10px; background:var(--accent)">Админ Панель</button>` : ''}
            <button class="btn-primary" style="background:var(--accent-red); box-shadow:none;" onclick="AuthModule.logout()">Выйти</button>
        </div>
    `;
}

// Глобальная переменная для отслеживания редактируемого товара
let currentEditingProductId = null;

// 2. АДМИН ПАНЕЛ БӨЛҮМҮ (Сүрөттөр көрүнө турган жана Отмена баскычы премиум стилге келтирилди)
function renderAdmin() {
    const stats = AdminModule.getStats();
    const products = AppStorage.getProducts();
    // Муну админка иштеп жаткан негизги скриптке кошуп койсоңуз болот
document.getElementById("cancel-edit-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    resetAdminForm();
    if (typeof SoundEngine !== 'undefined') SoundEngine.play("click"); // Кааласаңыз үн эффектиси менен
});

    return `
        <div class="admin-container glass" style="padding: 2rem; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem;">
                <h2 style="color: #fff;">Управление Маркетплейсом (CMS)</h2>
                <button class="btn-secondary back-btn" onclick="router.navigate('home')" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fa-solid fa-arrow-left"></i> Назад на главную
                </button>
            </div>

            <div class="stats-cards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="stat-card glass" style="padding: 1.5rem; border-radius: 12px; text-align: center;"><h4>Выручка</h4><p style="font-size:1.6rem; font-weight: bold; color:var(--accent); margin-top: 5px;">$${stats.revenue.toFixed(2)}</p></div>
                <div class="stat-card glass" style="padding: 1.5rem; border-radius: 12px; text-align: center;"><h4>Заказы</h4><p style="font-size:1.6rem; font-weight: bold; margin-top: 5px;">${stats.ordersCount}</p></div>
                <div class="stat-card glass" style="padding: 1.5rem; border-radius: 12px; text-align: center;"><h4>Товары</h4><p style="font-size:1.6rem; font-weight: bold; margin-top: 5px;">${stats.productsCount}</p></div>
            </div>

            <div class="admin-grid" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem;">
                <form class="glass" style="padding:1.5rem; border-radius: 12px;" id="admin-product-form" onsubmit="handleAdminSaveProduct(event)">
                    <h3 id="form-action-title" style="color: #fff;">Добавить новый товар</h3><br>
                    <input type="text" id="prod-title" class="input-field" placeholder="Название" required>
                    <input type="number" id="prod-price" class="input-field" placeholder="Цена ($)" required>
                    <input type="text" id="prod-cat" class="input-field" placeholder="Категория" required>
                    <input type="text" id="prod-img" class="input-field" placeholder="Ссылка на фото (URL)">
                    <input type="number" id="prod-discount" class="input-field" placeholder="Скидка (%)" value="0">
                    <input type="number" id="prod-stock" class="input-field" placeholder="Количество на складе" required>
                    <textarea id="prod-desc" class="input-field" placeholder="Описание" style="min-height: 80px; resize: vertical;"></textarea>
                    
                    <div style="display: flex; gap: 12px; margin-top: 15px;">
                        <button type="submit" id="submit-form-btn" class="btn-primary" style="flex: 1; padding: 12px; border-radius: 8px; font-weight: bold;">Добавить товар</button>
                        <button type="button" id="cancel-edit-btn" class="btn-primary" style="display: none; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); box-shadow: none;" onclick="resetAdminForm()">Отмена</button>
                    </div>
                </form>

                <div class="glass" style="padding:1.5rem; border-radius: 12px; max-height:550px; overflow-y:auto;">
                    <h3 style="color: #fff; margin-bottom: 1rem;">Список товаров</h3>
                    ${products.map(p => `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; padding:10px; border-bottom:1px solid var(--border-glass); background: rgba(255,255,255,0.02); border-radius: 8px;">
                            <img src="${p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}" style="width: 45px; height: 45px; border-radius: 6px; object-fit: cover; margin-right: 12px; border: 1px solid rgba(255,255,255,0.1);">
                            
                            <span style="flex:1; font-size:0.9rem; color: #e2e8f0; cursor:pointer;" onclick="prepareEditProduct(${p.id})">
                                <strong>${p.title}</strong> <br>
                                <span style="color: var(--accent); font-size: 0.85rem;">$${p.price}</span> 
                                <span style="color: #a0aec0; font-size: 0.8rem; margin-left: 10px;">• ${p.category}</span>
                            </span>
                            <div style="display: flex; gap: 8px;">
                                <button class="qty-btn" style="color:var(--accent); border-color:var(--accent); background: transparent;" onclick="prepareEditProduct(${p.id})" title="Редактировать">
                                    <i class="fa-solid fa-pen" style="font-size: 0.85rem;"></i>
                                </button>
                                <button class="qty-btn" style="color:var(--accent-red); border-color:var(--accent-red); background: transparent; font-size: 1.1rem;" onclick="AdminModule.deleteProduct(${p.id}); router.render('admin')" title="Удалить">
                                    ×
                                </button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}

// Функция подстановки данных товара в форму для изменения
function prepareEditProduct(productId) {
    SoundEngine.play('click');
    const products = AppStorage.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    currentEditingProductId = productId;

    // Меняем визуальные заголовки и кнопки формы
    document.getElementById("form-action-title").innerText = "Редактировать товар";
    document.getElementById("submit-form-btn").innerText = "Сохранить изменения";
    document.getElementById("cancel-edit-btn").style.display = "block";

    // Заполняем поля формы текущими данными товара
    document.getElementById("prod-title").value = product.title;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-cat").value = product.category;
    document.getElementById("prod-img").value = product.image || "";
    document.getElementById("prod-discount").value = product.discount || 0;
    document.getElementById("prod-stock").value = product.stock;
    document.getElementById("prod-desc").value = product.description || "";
    
    // Скроллим к форме, чтобы пользователю было удобно
    document.getElementById("admin-product-form").scrollIntoView({ behavior: 'smooth' });
}

// Универсальный обработчик сохранения (добавление или обновление)
function handleAdminSaveProduct(e) {
    e.preventDefault();
    
    const products = AppStorage.getProducts();
    const data = {
        title: document.getElementById("prod-title").value,
        price: parseFloat(document.getElementById("prod-price").value),
        category: document.getElementById("prod-cat").value,
        image: document.getElementById("prod-img").value || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        discount: parseInt(document.getElementById("prod-discount").value) || 0,
        stock: parseInt(document.getElementById("prod-stock").value),
        description: document.getElementById("prod-desc").value,
        rating: 4.5, // По умолчанию для сохранения структуры рендеринга
        date: new Date().toISOString()
    };

    if (currentEditingProductId !== null) {
        // РЕЖИМ РЕДАКТИРОВАНИЯ: обновляем существующий товар
        const updatedProducts = products.map(p => {
            if (p.id === currentEditingProductId) {
                return { ...p, ...data }; // Сохраняем старый id, перезаписываем новые данные
            }
            return p;
        });
        AppStorage.saveProducts(updatedProducts);
        SoundEngine.play("success");
        currentEditingProductId = null; // Сбрасываем режим редактирования
    } else {
        // РЕЖИМ ДОБАВЛЕНИЯ: создаём новый товар через твой модуль
        data.id = Date.now(); // Генерируем уникальный ID
        AdminModule.addProduct(data);
    }

    // Перерисовываем интерфейс админки
    router.render("admin");
}

// Сброс формы в исходное состояние (режим добавления)
function resetAdminForm() {
    currentEditingProductId = null;
    document.getElementById("admin-product-form").reset();
    document.getElementById("form-action-title").innerText = "Добавить новый товар";
    document.getElementById("submit-form-btn").innerText = "Добавить товар";
    document.getElementById("cancel-edit-btn").style.display = "none";
}

function handleAdminAddProduct(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById("prod-title").value,
        price: document.getElementById("prod-price").value,
        category: document.getElementById("prod-cat").value,
        image: document.getElementById("prod-img").value,
        discount: document.getElementById("prod-discount").value,
        stock: document.getElementById("prod-stock").value,
        description: document.getElementById("prod-desc").value
    };
    AdminModule.addProduct(data);
    router.render("admin");
}

function renderContacts() {
    return `
        <div class="auth-container glass">
            <h2>Контакты | AURA DEVELOPMENT</h2><br>
            <p style="color:var(--text-muted)">Свяжитесь с нами по любым вопросам поддержки функционирования платформы.</p><br>
            <p><i class="fa-solid fa-envelope"></i> support@auramarket.io</p>
            <p><i class="fa-solid fa-phone"></i> +996 (555) 01-02-03</p>
        </div>
    `;
}

function render404() {
    return `
        <div style="text-align:center; padding:5rem 0;">
            <h1 style="font-size:6rem; color:var(--primary)">404</h1>
            <p style="color:var(--text-muted); margin-bottom:1.5rem">Упс! Страница, которую вы ищете, не существует.</p>
            <button class="btn-primary" data-link="home">Вернуться На Главную</button>
        </div>
    `;
}

// Ички товардын бетине дагы артка кайтуучу кооз баскыч кошулду:
function renderProductDetail(productId) {
    const product = AppStorage.getProducts().find(p => p.id === productId);
    
    return `
        <div class="product-detail-container">
            <button class="btn-secondary back-btn" onclick="router.navigate('catalog')" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 1px solid var(--border-glass); color: white; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                <i class="fa-solid fa-arrow-left"></i> Назад в каталог
            </button>

            <div class="product-main-card glass">
                </div>
        </div>
    `;
}

