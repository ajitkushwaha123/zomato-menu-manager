"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import useNotification from "@/store/hooks/useNotification";

const variants = {
    success: {
        icon: CheckCircle2,
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-900",
        iconClass: "text-emerald-600",
        progress: "bg-emerald-500",
    },

    error: {
        icon: CircleAlert,
        className:
            "border-red-200 bg-red-50 text-red-900",
        iconClass: "text-red-600",
        progress: "bg-red-500",
    },

    warning: {
        icon: TriangleAlert,
        className:
            "border-yellow-200 bg-yellow-50 text-yellow-900",
        iconClass: "text-yellow-600",
        progress: "bg-yellow-500",
    },

    info: {
        icon: Info,
        className:
            "border-sky-200 bg-sky-50 text-sky-900",
        iconClass: "text-sky-600",
        progress: "bg-sky-500",
    },
};

export default function NotificationBanner() {
    const notification = useSelector(
        (state) => state.notification
    );

    const notify = useNotification();

    useEffect(() => {
        if (!notification.visible) return;

        if (notification.duration == null) return;

        const timer = setTimeout(() => {
            notify.hide();
        }, notification.duration);

        return () => clearTimeout(timer);
    }, [
        notification.visible,
        notification.duration,
        notify,
    ]);

    if (!notification.visible) return null;

    const config = variants[notification.type];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                transition={{
                    duration: 0.3,
                    ease: "easeOut",
                }}
                className={`fixed inset-x-0 top-0 z-[9999]
border-b
backdrop-blur-sm
shadow-lg
${config.className}`}
            >
                <div className="relative mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-6">
                    <Icon className={`h-6 w-6 shrink-0 ${config.iconClass}`} />

                    <div className="min-w-0 flex-1">
                        {notification.title && (
                            <p className="font-semibold leading-none">
                                {notification.title}
                            </p>
                        )}

                        <p className="truncate text-sm font-medium leading-5">
                            {notification.message}
                        </p>
                    </div>

                    <button
                        onClick={notify.hide}
                        className="
    rounded-lg
    p-2
    transition
    hover:bg-black/5
    dark:hover:bg-white/10
  "
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {notification.duration != null && (
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: 0 }}
                            transition={{
                                duration: notification.duration / 1000,
                                ease: "linear",
                            }}
                            className={`absolute bottom-0 left-0 h-[2px] ${config.progress}`}
                        />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}