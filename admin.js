/**
 * Панель управления Администратора (Админка / CRUD / Статистика)
 */
const AdminModule = {
    addProduct(productData) {
        const products = AppStorage.getProducts();
        const newProduct = {
            id: Date.now(),
            title: productData.title,
            price: parseFloat(productData.price) || 0,
            category: productData.category,
            rating: 5.0,
            image: productData.image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80",
            discount: parseInt(productData.discount) || 0,
            stock: parseInt(productData.stock) || 0,
            description: productData.description || "",
            isTop: productData.isTop || false,
            isAction: productData.isAction || false,
            date: new Date().toISOString().split('T')[0]
        };
        products.push(newProduct);
        AppStorage.saveProducts(products);
        SoundEngine.play("success");
    },

    deleteProduct(id) {
        let products = AppStorage.getProducts();
        products = products.filter(p => p.id !== id);
        AppStorage.saveProducts(products);
        SoundEngine.play("delete");
    },

    updateProduct(id, updatedFields) {
        const products = AppStorage.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedFields };
            AppStorage.saveProducts(products);
            SoundEngine.play("success");
        }
    },

    getStats() {
        const products = AppStorage.getProducts();
        const orders = AppStorage.getOrders();
        
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

        return {
            revenue: totalRevenue,
            ordersCount: orders.length,
            productsCount: products.length,
            totalStock: totalStock
        };
    }
};