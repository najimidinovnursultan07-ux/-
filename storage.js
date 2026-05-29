/**
 * БАЗА ДАННЫХ И ХРАНИЛИЩЕ (БИРИКТИРИЛГЕН ВАРИАНТ)
 */

// Сиздин даяр товарлар массивиңиз ушул жерге келди:
const initialProducts = [
    {
        id: 1,
        title: "iPhone 15 Pro Premium",
        price: 1200,
        category: "Электроника",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80",
        discount: 10,
        stock: 14,
        description: "Флагманский смартфон в титановом корпусе. Мощнейший чип A17 Pro, передовая система камер.",
        isTop: true,
        isAction: true,
        date: "2026-01-10"
    },
    {
        id: 2,
        title: "Кроссовки HyperNova Air",
        price: 180,
        category: "Одежда",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
        discount: 0,
        stock: 25,
        description: "Ультралегкие беговые кроссовки с адаптивной амортизацией и дышащей сеткой.",
        isTop: true,
        isAction: false,
        date: "2026-03-15"
    },
    {
        id: 3,
        title: "Наушники Quantum Sound Studio",
        price: 350,
        category: "Электроника",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        discount: 15,
        stock: 8,
        description: "Беспроводные полноразмерные наушники с активным гибридным шумоподавлением.",
        isTop: false,
        isAction: true,
        date: "2026-04-01"
    },
    {
        id: 4,
        title: "Механические Часы Chrono V",
        price: 600,
        category: "Аксессуары",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        discount: 5,
        stock: 5,
        description: "Премиальные механические часы с автоподзаводом и сапфировым стеклом.",
        isTop: false,
        isAction: false,
        date: "2026-02-20"
    },
    {
        id: 5,
        title: "Рюкзак Urban Nomad 25L",
        price: 95,
        category: "Аксессуары",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
        discount: 0,
        stock: 40,
        description: "Влагозащищенный рюкзак с отделением для ноутбука 16 дюймов и USB-портом.",
        isTop: true,
        isAction: false,
        date: "2026-05-02"
    }
];

// Авто-инициализация
if (!localStorage.getItem("aura_products")) {
    localStorage.setItem("aura_products", JSON.stringify(initialProducts));
}

// Хранилище башкаруу логикасы
const AppStorage = {
    getProducts: () => {
        const data = localStorage.getItem("aura_products");
        return data ? JSON.parse(data) : [];
    },
    
    saveProducts: (products) => localStorage.setItem("aura_products", JSON.stringify(products)),
    
    getCart: () => JSON.parse(localStorage.getItem("aura_cart")) || [],
    saveCart: (cart) => localStorage.setItem("aura_cart", JSON.stringify(cart)),
    
    getFavorites: () => JSON.parse(localStorage.getItem("aura_favorites")) || [],
    saveFavorites: (favs) => localStorage.setItem("aura_favorites", JSON.stringify(favs)),
    
    getCompare: () => JSON.parse(localStorage.getItem("aura_compare")) || [],
    saveCompare: (comp) => localStorage.setItem("aura_compare", JSON.stringify(comp)),
    
    getOrders: () => JSON.parse(localStorage.getItem("aura_orders")) || [],
    saveOrders: (orders) => localStorage.setItem("aura_orders", JSON.stringify(orders)),
    
    getUsers: () => JSON.parse(localStorage.getItem("aura_users")) || [],
    saveUsers: (users) => localStorage.setItem("aura_users", JSON.stringify(users)),
    
    getCurrentUser: () => JSON.parse(localStorage.getItem("aura_current_user")) || null,
    setCurrentUser: (user) => localStorage.setItem("aura_current_user", JSON.stringify(user))
};