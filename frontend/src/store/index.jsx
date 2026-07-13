import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "./slice/notificationSlice";
import menuReducer from "./slice/menuSlice";

export const store = configureStore({
  reducer: {
    notification: notificationReducer,
    menu: menuReducer,
  },
});