/**
 * Функциональный модуль корзины, избранного и сравнения товаров
 */
const CartModule = {
    addToCart(productId) {
        const products = AppStorage.getProducts();
        const product = products.find(p => p.id === productId);
        if (!product || product.stock <= 0) {
            SoundEngine.play("error");
            alert("Товара нет в наличии!");
            return;
        }

        let cart = AppStorage.getCart();
        const existing = cart.find(item => item.id === productId);

        if (existing) {
            if (existing.quantity >= product.stock) {
                SoundEngine.play("error");
                alert("Достигнуто максимальное количество товара на складе!");
                return;
            }
            existing.quantity++;
        } else {
            cart.push({ id: product.id, quantity: 1 });
        }

        AppStorage.saveCart(cart);
        SoundEngine.play("cart");
        this.updateBadges();
    },

    changeQuantity(productId, delta) {
        let cart = AppStorage.getCart();
        const item = cart.find(i => i.id === productId);
        if (!item) return;

        const products = AppStorage.getProducts();
        const prod = products.find(p => p.id === productId);

        item.quantity += delta;

        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
            SoundEngine.play("delete");
        } else if (item.quantity > prod.stock) {
            SoundEngine.play("error");
            item.quantity = prod.stock;
            alert("Превышено доступное количество!");
        } else {
            SoundEngine.play("click");
        }

        AppStorage.saveCart(cart);
        this.updateBadges();
        // Триггер перерендера страницы корзины, если мы на ней
        if (typeof router !== 'undefined' && router.currentView === 'cart') router.render('cart');
    },

    toggleFavorite(productId) {
        let favs = AppStorage.getFavorites();
        if (favs.includes(productId)) {
            favs = favs.filter(id => id !== productId);
            SoundEngine.play("delete");
        } else {
            favs.push(productId);
            SoundEngine.play("click");
        }
        AppStorage.saveFavorites(favs);
        this.updateBadges();
    },

    toggleCompare(productId) {
        let comp = AppStorage.getCompare();
        if (comp.includes(productId)) {
            comp = comp.filter(id => id !== productId);
            SoundEngine.play("delete");
        } else {
            if (comp.length >= 4) {
                SoundEngine.play("error");
                alert("Можно сравнивать не более 4 товаров одновременно!");
                return;
            }
            comp.push(productId);
            SoundEngine.play("click");
        }
        AppStorage.saveCompare(comp);
        this.updateBadges();
    },

    updateBadges() {
        const cart = this.getCartData();
        const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
        
        document.getElementById("cart-count").innerText = totalItems;
        document.getElementById("bottom-cart-count").innerText = totalItems;
        document.getElementById("fav-count").innerText = AppStorage.getFavorites().length;
        document.getElementById("compare-count").innerText = AppStorage.getCompare().length;
    },

    getCartData() {
        return AppStorage.getCart();
    }
};