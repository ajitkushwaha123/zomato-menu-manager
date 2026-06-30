const STORAGE_KEY = "zomato_cookie";

class CookieStorage {
    static get() {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(STORAGE_KEY);
    }

    static set(cookie) {
        if (typeof window === "undefined") return;
        localStorage.setItem(STORAGE_KEY, cookie.trim());
    }

    static remove() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(STORAGE_KEY);
    }

    static has() {
        return !!this.get();
    }

    static clear() {
        this.remove();
    }
}

export default CookieStorage;