import { useCallback } from "react";
import { useDispatch } from "react-redux";

import {
    hideNotification,
    showNotification,
} from "@/store/slice/notificationSlice";

export default function useNotification() {
    const dispatch = useDispatch();

    const notify = useCallback(
        (
            type,
            message,
            options
        ) => {
            dispatch(
                showNotification({
                    type,
                    message,
                    duration: options?.duration,
                })
            );
        },
        [dispatch]
    );

    return {
        success: (message, options) =>
            notify("success", message, options),

        error: (message, options) =>
            notify("error", message, options),

        info: (message, options) =>
            notify("info", message, options),

        warning: (message, options) =>
            notify("warning", message, options),

        hide: () => dispatch(hideNotification()),
    };
}