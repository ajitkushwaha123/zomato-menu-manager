"use client";

import * as React from "react";
import {
    Save,
    Loader2,
    History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMenu } from "@/store/hooks/useMenu";
import useNotification from "@/store/hooks/useNotification";
import { useState } from "react";
import api from "@/lib/api/axios";
export function MenuEditorHeader({
    onSave,
    isSaving,
}) {
    const { menuData, isLoading, error, syncZomatoMenu, isSyncing, activeResId: resId } = useMenu();
    const notification = useNotification();

    const menuArray = Array.isArray(menuData) ? menuData : [];
    const totalCategories = menuArray.length;

    const totalItems = React.useMemo(() => {
        return menuArray.reduce((acc, cat) => {
            return (
                acc +
                (cat.sub_category?.reduce(
                    (sum, sub) => sum + (sub.items?.length ?? 0),
                    0
                ) ?? 0)
            );
        }, 0);
    }, [menuArray]);

    const handleSync = async () => {
        try {
            await syncZomatoMenu();
            notification.success("Menu synced with Zomato successfully!", { duration: 3000 });
        } catch (err) {
            console.error("Failed to sync Zomato menu:", err);
            notification.error("Failed to sync menu: " + (err.message || "Unknown error"), { duration: 5000 });
        }
    };

    const [isTriggering, setIsTriggering] = useState(false);
    const notify = useNotification()

    const handleTriggerMenu = async () => {
        if (!resId) {
            notify.error("Restaurant ID is missing");
            return;
        }
        try {
            setIsTriggering(true);
            const res = await api.post(`/api/menu/${resId}/zomato/update-menu`, {});
            notify.success("Menu saved to Zomato successfully!");
        } catch (error) {
            console.error(error);
            notify.error(error?.response?.data?.message || error.message || "Failed to trigger menu");
        } finally {
            setIsTriggering(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex flex-col gap-5 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4">

                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Menu Editor
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage categories, dishes and pricing for your restaurant.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing || isLoading}
                        className="h-10 rounded-lg px-5 bg-[#e23744] hover:bg-[#cb202d] text-white border-transparent hover:text-white transition-colors"
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <History className="h-4 w-4" />
                        )}
                        Sync Menu
                    </Button>

                    <Button
                        onClick={onSave}
                        disabled={isSaving || isLoading}
                        className="h-11 rounded-xl px-6 shadow-md"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleTriggerMenu}
                        disabled={isTriggering}
                        className="h-10 rounded-lg px-5 bg-green-600 hover:bg-green-700 text-white shadow-md transition-colors"
                    >
                        {isTriggering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isTriggering ? "Triggering..." : "Trigger Menu"}
                    </Button>

                </div>
            </div>
        </header>
    );
}