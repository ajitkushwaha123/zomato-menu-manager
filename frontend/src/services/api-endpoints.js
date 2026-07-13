export const API_ENDPOINTS = {
    AUTH: {
        PROFILE: "/api/profile",
        RESTAURANTS: "/api/restaurants"
    },
    MENU: {
        ZOMATO_MENU_IMPORT: (resId) => `/api/menu/${resId}/zomato/import`,
        GET_MENU: (resId) => `/api/menu/${resId}`,
        UPDATE_MENU: (resId) => `/api/menu/${resId}`,
    },
};