"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import InlineInput from "@/components/ui/inline-input";
import { ChevronDown, ChevronRight, FolderKanban, Plus } from "lucide-react";
import ActionMenu from "../action-menu";
import SubCategoryList from "../sub-category-list";

export default function CategoryCard({
    category,
    index,
    isExpanded,
    onToggleExpand,
    activeCategory,
    setActiveCategory,
    activeSubCategory,
    setActiveSubCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
}) {
    // Local transient UI states
    const [isEditing, setIsEditing] = useState(false);
    const [addingSubCategory, setAddingSubCategory] = useState(false);

    if (!category) return null;

    const isCategoryActive = activeCategory === category.id;

    const handleCategorySelect = () => {
        setActiveCategory?.(category.id);
        if (!isExpanded) onToggleExpand();

        const firstSubCategory = category.subcategories?.[0];
        if (firstSubCategory) {
            setActiveSubCategory?.(firstSubCategory.id);
        }
    };

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in",
                isCategoryActive
                    ? "border-primary/30 bg-primary/[0.02] shadow-sm"
                    : "border-border/50 bg-white/80 hover:border-border"
            )}
            style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: "both",
            }}
        >
            <div className={cn("group flex items-center gap-1.5 p-2 transition-colors", isCategoryActive && "bg-gradient-to-r from-primary/10 to-transparent")}>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 rounded-lg hover:bg-black/5"
                    onClick={onToggleExpand}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </Button>

                {isEditing ? (
                    <div className="flex-1 pr-1 text-sm">
                        <InlineInput
                            autoFocus
                            defaultValue={category.name}
                            onSubmit={(name) => {
                                const trimmed = name.trim();
                                if (trimmed && updateCategory) {
                                    updateCategory(category.id, { name: trimmed });
                                }
                                setIsEditing(false);
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleCategorySelect}
                            className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden text-left"
                        >
                            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isCategoryActive ? "bg-primary shadow-sm" : "bg-primary/10")}>
                                <FolderKanban className={cn("h-4 w-4", isCategoryActive ? "text-primary-foreground" : "text-primary")} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className={cn("truncate text-sm font-semibold flex items-center gap-2", isCategoryActive ? "text-primary" : "text-foreground")}>
                                    <span className="truncate">{category.name}</span>
                                    {category.id?.toString().startsWith("temp-") && (
                                        <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider shrink-0">NEW</span>
                                    )}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {category.subcategories?.length ?? 0} subcategories
                                </p>
                            </div>
                        </button>

                        <ActionMenu
                            triggerClassName="h-7 w-7 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                            onRename={() => setIsEditing(true)}
                            onDelete={() => deleteCategory?.(category.id)}
                        />
                    </>
                )}
            </div>

            <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                    <div className="border-t border-border/50 bg-white/40 px-2.5 py-2.5">
                        <SubCategoryList
                            category={category}
                            activeSubCategory={activeSubCategory}
                            setActiveSubCategory={setActiveSubCategory}
                            setActiveCategory={setActiveCategory}
                            updateSubCategory={updateSubCategory}
                            deleteSubCategory={deleteSubCategory}
                        />

                        {addingSubCategory ? (
                            <div className="mt-1.5 px-1 text-sm">
                                <InlineInput
                                    autoFocus
                                    placeholder="Subcategory name"
                                    onSubmit={(name) => {
                                        const trimmed = name.trim();
                                        if (trimmed && addSubCategory) {
                                            addSubCategory(category.id, trimmed);
                                        }
                                        setAddingSubCategory(false);
                                    }}
                                    onCancel={() => setAddingSubCategory(false)}
                                />
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-2 w-full justify-start rounded-lg text-muted-foreground hover:text-foreground"
                                onClick={() => setAddingSubCategory(true)}
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Subcategory
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}