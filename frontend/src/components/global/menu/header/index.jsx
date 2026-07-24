"use client";

import * as React from "react";
import {
    Save,
    Loader2,
    History,
    Sparkles,
    Image as ImageIcon,
    Search,
    ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMenu } from "@/store/hooks/useMenu";
import useNotification from "@/store/hooks/useNotification";
import { useState } from "react";
import api from "@/lib/api/axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadZomatoImage } from "@/services/zomatoImageService";
export function MenuEditorHeader({
    onSave,
    isSaving,
}) {
    const { menuData, isLoading, error, syncZomatoMenu, isSyncing, activeResId: resId, updateItem, setActiveCategory, setActiveSubCategory, setActiveView, globalSearchQuery, setGlobalSearchQuery } = useMenu();
    const notification = useNotification();

    const menuArray = Array.isArray(menuData) ? menuData : [];
    const totalCategories = menuArray.length;

    const stats = React.useMemo(() => {
        let total = 0;
        let withMedia = 0;
        let onHold = 0;
        let onHoldWithMedia = 0;

        menuArray.forEach(cat => {
            if (cat.status === 'delete' || cat.status === 'deleted') return;
            (cat.sub_category || []).forEach(sub => {
                if (sub.status === 'delete' || sub.status === 'deleted') return;
                (sub.items || []).forEach(item => {
                    if (item.status === 'delete' || item.status === 'deleted') return;
                    total++;
                    const hasMedia = item.media && item.media.length > 0;
                    if (hasMedia) withMedia++;
                    if (item.onHold) {
                        onHold++;
                        if (hasMedia) onHoldWithMedia++;
                    }
                });
            });
        });

        return {
            total,
            withMedia,
            withoutMedia: total - withMedia,
            onHold,
            onHoldWithMedia
        };
    }, [menuArray]);

    const hasUnsavedChanges = React.useMemo(() => {
        let unsaved = false;
        
        const isTemp = (id) => typeof id === 'string' && id.startsWith('temp-');

        menuArray.forEach(cat => {
            if (cat.temp_id || isTemp(cat.id)) unsaved = true;
            (cat.sub_category || []).forEach(sub => {
                if (sub.temp_id || isTemp(sub.id)) unsaved = true;
                (sub.items || []).forEach(item => {
                    if (item.temp_id || isTemp(item.id)) unsaved = true;
                    (item.variants || []).forEach(v => {
                        if (v.temp_id || isTemp(v.id)) unsaved = true;
                    });
                    (item.media || []).forEach(m => {
                        if (m.tempReferenceId || isTemp(m.id)) unsaved = true;
                    });
                });
            });
        });
        return unsaved;
    }, [menuArray]);

    const [isSyncModalOpen, setSyncModalOpen] = useState(false);

    const handleSync = async () => {
        try {
            await syncZomatoMenu(resId);
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
        
        let hasZeroPrice = false;
        menuArray.forEach(cat => {
            if (cat.status === 'delete' || cat.status === 'deleted') return;
            (cat.sub_category || []).forEach(sub => {
                if (sub.status === 'delete' || sub.status === 'deleted') return;
                (sub.items || []).forEach(item => {
                    if (item.status === 'delete' || item.status === 'deleted') return;
                    if (item.base_price === 0 || item.price === 0) {
                        hasZeroPrice = true;
                    }
                });
            });
        });

        if (hasZeroPrice) {
            notify.error("Cannot trigger menu: Some items have a price of ₹0. Please update them before triggering.");
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
        <>
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md flex flex-col shrink-0 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 w-full gap-4 overflow-x-auto hide-scrollbar">
                    {/* Left Side: Stats Pill Row */}
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 text-[11px] font-medium">
                            <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1.5 rounded-md border border-border/40 transition-colors hover:bg-muted/80 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                <span className="text-muted-foreground">Total:</span>
                                <span className="text-foreground font-bold">{stats.total}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50/50 px-2 py-1.5 rounded-md border border-emerald-100 transition-colors hover:bg-emerald-50 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                <span className="text-emerald-700/70">Media:</span>
                                <span className="text-emerald-950 font-bold">{stats.withMedia}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-orange-50/50 px-2 py-1.5 rounded-md border border-orange-100 transition-colors hover:bg-orange-50 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                <span className="text-orange-700/70">No Media:</span>
                                <span className="text-orange-950 font-bold">{stats.withoutMedia}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-50/50 px-2 py-1.5 rounded-md border border-red-100 transition-colors hover:bg-red-50 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                <span className="text-red-700/70">Hold:</span>
                                <span className="text-red-950 font-bold">{stats.onHold}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-purple-50/50 px-2 py-1.5 rounded-md border border-purple-100 transition-colors hover:bg-purple-50 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                                <span className="text-purple-700/70">Hold+Media:</span>
                                <span className="text-purple-950 font-bold">{stats.onHoldWithMedia}</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 max-w-sm mx-4 relative hidden md:block" style={{ zIndex: 100 }}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input 
                                type="text"
                                placeholder="Search all items..."
                                value={globalSearchQuery}
                                onChange={(e) => {
                                    setGlobalSearchQuery(e.target.value);
                                    if (e.target.value.trim() !== "") {
                                        setActiveView("MENU");
                                    }
                                }}
                                className="w-full pl-9 pr-4 py-1.5 bg-gray-100 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (hasUnsavedChanges) {
                                    setSyncModalOpen(true);
                                } else {
                                    handleSync();
                                }
                            }}
                            disabled={isSyncing || isLoading}
                            className="h-10 rounded-lg px-5 bg-[#e23744] hover:bg-[#cb202d] text-white border-transparent hover:text-white transition-colors"
                        >
                            {isSyncing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <History className="mr-2 h-4 w-4" />
                            )}
                            Sync Menu
                        </Button>

                        <Button
                            id="global-save-btn"
                            onClick={onSave}
                            disabled={isSaving || isLoading}
                            className="h-10 rounded-lg px-6 shadow-md"
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

            <AlertDialog open={isSyncModalOpen} onOpenChange={setSyncModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes Detected</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Your progress will be lost if you sync now. Please trigger and save your changes to Zomato first, or proceed to discard your local edits.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSyncModalOpen(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => {
                                setSyncModalOpen(false);
                                handleSync();
                            }}>
                            Discard & Sync
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}