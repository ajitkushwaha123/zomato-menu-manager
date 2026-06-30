import axios from "axios";
import CookieStorage from "@/services/cookie";

const api = axios.create({
    baseURL: "/",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const cookie = CookieStorage.get();
        console.log("➡️ Request:", config.method?.toUpperCase(), config.url);

        if (cookie) {
            config.headers["X-Zomato-Cookie"] = cookie;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;