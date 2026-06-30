import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    visible: false,
    type: "info",
    message: "",
    duration: undefined,
};

const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        showNotification: (state, action) => {
            state.visible = true;
            state.type = action.payload.type; 
            state.message = action.payload.message;
            state.duration = action.payload.duration;
        },

        hideNotification: (state) => {
            state.visible = false;
            state.type = "info";
            state.message = "";
            state.duration = undefined;
        },

        clearNotification: () => initialState,
    },
});

export const {
    showNotification,
    hideNotification,
    clearNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;