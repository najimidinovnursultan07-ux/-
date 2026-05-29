/**
 * Модуль Аутентификации и сессий пользователей
 */
const AuthModule = {
    register(email, password, name) {
        const users = AppStorage.getUsers();
        if (users.find(u => u.email === email)) {
            SoundEngine.play("error");
            return { success: false, message: "Пользователь с таким Email уже существует!" };
        }
        
        // Первый зарегистрированный пользователь получает роль admin
        const role = users.length === 0 ? "admin" : "user";
        const newUser = { id: Date.now(), email, password, name, role };
        users.push(newUser);
        AppStorage.saveUsers(users);
        SoundEngine.play("success");
        return { success: true, message: "Регистрация успешна!" };
    },

    login(email, password) {
        const users = AppStorage.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            SoundEngine.play("error");
            return { success: false, message: "Неверный логин или пароль!" };
        }
        AppStorage.setCurrentUser(user);
        SoundEngine.play("success");
        return { success: true, user };
    },

    logout() {
        AppStorage.setCurrentUser(null);
        SoundEngine.play("delete");
        window.location.reload();
    }
};