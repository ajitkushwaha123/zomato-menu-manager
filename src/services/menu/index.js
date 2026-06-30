import api from "@/lib/api/axios";
import { API_ENDPOINTS } from "../api-endpoints";

export const MenuService = {
    async getZomatoMenu(resId) {
        try {
            const { data } = await api.get(API_ENDPOINTS.MENU.ZOMATO_MENU_IMPORT(resId));
            return data?.data;
        } catch (err) {
            throw new Error(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong."
            );
        }
    },

    async getMenu(resId) {
        try {
            const { data } = await api.get(API_ENDPOINTS.MENU.GET_MENU(resId));
            return data?.data;
        } catch (err) {
            throw new Error(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong."
            );
        }
    },

    async saveMenu(resId, menuData) {
        try {
            const { data } = await api.put(API_ENDPOINTS.MENU.UPDATE_MENU(resId), { menu: menuData });
            return data;
        } catch (err) {
            throw new Error(
                err.response?.data?.message ||
                err.message ||
                "Failed to save menu."
            );
        }
    }
};