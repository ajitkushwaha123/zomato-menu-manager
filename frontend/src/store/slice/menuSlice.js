import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MenuService } from '@/services/menu';

export const fetchMenuByResId = createAsyncThunk(
    'menu/fetchMenuByResId',
    async (resId, { rejectWithValue }) => {
        try {
            const data = await MenuService.getMenu(resId);
            // Returns the menu payload array and the restaurant configuration information
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
        }
    }
);

export const syncZomatoMenu = createAsyncThunk(
    'menu/syncZomatoMenu',
    async (resId, { rejectWithValue }) => {
        try {
            const data = await MenuService.getZomatoMenu(resId);
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to sync Zomato menu');
        }
    }
);

export const saveMenuByResId = createAsyncThunk(
    'menu/saveMenuByResId',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { menu } = getState();
            if (!menu.activeResId || !menu.menuData) {
                throw new Error("No active restaurant or menu data to save.");
            }
            const payload = {
                menu: menu.menuData,
                addons: menu.addonsData
            };
            const data = await MenuService.saveMenu(menu.activeResId, payload);
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to save menu');
        }
    }
);

const initialState = {
    menuData: null,         // Array of categories
    addonsData: [],         // Array of addons/modifier groups
    restaurantName: '',
    activeResId: null,
    activeView: 'MENU',     // 'MENU' or 'BULK'
    activeBulkMode: 'FULL', // 'FULL', 'PRICE', 'DESCRIPTION', 'IMAGE'
    activeCategory: null,   // Category ID
    activeSubCategory: null,// Subcategory ID
    isImageSidebarOpen: false,
    activeImageSearchItem: null,
    loading: false,
    isSaving: false,
    isSyncing: false,
    imageUploadStatuses: {}, // { [itemId]: 'uploading' | 'approved' | 'rejected' }
    error: null,
};

const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        setActiveResId: (state, action) => {
            state.activeResId = action.payload;
        },
        setActiveView: (state, action) => {
            state.activeView = action.payload;
        },
        setActiveBulkMode: (state, action) => {
            state.activeBulkMode = action.payload;
        },
        setActiveCategory: (state, action) => {
            state.activeCategory = action.payload;
            state.activeSubCategory = null;
        },
        setActiveSubCategory: (state, action) => {
            state.activeSubCategory = action.payload;
        },
        openImageSidebar: (state, action) => {
            state.isImageSidebarOpen = true;
            state.activeImageSearchItem = action.payload;
        },
        closeImageSidebar: (state) => {
            state.isImageSidebarOpen = false;
            state.activeImageSearchItem = null;
        },
        setImageUploadStatus: (state, action) => {
            const { itemId, status } = action.payload;
            if (!itemId) return;
            if (status === null) {
                delete state.imageUploadStatuses[itemId];
            } else {
                state.imageUploadStatuses[itemId] = status;
            }
        },
        
        clearMenuState: () => initialState,

        // --- Category CRUD Reducers ---
        addCategory: (state, action) => {
            if (!Array.isArray(state.menuData)) state.menuData = [];
            const newCategory = {
                id: 'temp-' + crypto.randomUUID(), // Generates fallback unique strings
                name: action.payload,
                sub_category: [],
                items: []
            };
            state.menuData.push(newCategory);
        },
        updateCategory: (state, action) => {
            const { categoryId, data } = action.payload;
            const category = state.menuData?.find(cat => cat.id === categoryId);
            if (category) {
                Object.assign(category, data);
            }
        },
        deleteCategory: (state, action) => {
            const categoryId = action.payload;
            if (String(categoryId).startsWith('temp-')) {
                state.menuData = state.menuData?.filter(cat => cat.id !== categoryId) || [];
            } else {
                const category = state.menuData?.find(cat => cat.id === categoryId);
                if (category) {
                    category.status = 'delete';
                    category.sub_category?.forEach(sub => {
                        sub.status = 'delete';
                        sub.items?.forEach(item => {
                            item.status = 'delete';
                            item.variants?.forEach(variant => variant.status = 'delete');
                        });
                    });
                }
            }
            if (state.activeCategory === categoryId) {
                state.activeCategory = null;
                state.activeSubCategory = null;
            }
        },

        // --- Subcategory CRUD Reducers ---
        addSubCategory: (state, action) => {
            const { categoryId, name } = action.payload;
            const category = state.menuData?.find(cat => cat.id === categoryId);
            if (category) {
                if (!category.sub_category) category.sub_category = [];
                category.sub_category.push({
                    id: 'temp-' + crypto.randomUUID(),
                    name: name,
                    items: []
                });
            }
        },
        updateSubCategory: (state, action) => {
            const { subCategoryId, data } = action.payload;
            state.menuData?.forEach(cat => {
                const sub = cat.sub_category?.find(s => s.id === subCategoryId);
                if (sub) {
                    Object.assign(sub, data);
                }
            });
        },
        deleteSubCategory: (state, action) => {
            const subCategoryId = action.payload;
            state.menuData?.forEach(cat => {
                if (cat.sub_category) {
                    if (String(subCategoryId).startsWith('temp-')) {
                        cat.sub_category = cat.sub_category.filter(s => s.id !== subCategoryId);
                    } else {
                        const sub = cat.sub_category.find(s => s.id === subCategoryId);
                        if (sub) {
                            sub.status = 'delete';
                            sub.items?.forEach(item => {
                                item.status = 'delete';
                                item.variants?.forEach(variant => variant.status = 'delete');
                            });
                        }
                    }
                }
            });
            if (state.activeSubCategory === subCategoryId) {
                state.activeSubCategory = null;
            }
        },
        // --- Item CRUD Reducers ---
        addItem: (state, action) => {
            const { subCategoryId, item } = action.payload;
            state.menuData?.forEach(cat => {
                const sub = cat.sub_category?.find(s => s.id === subCategoryId);
                if (sub) {
                    if (!sub.items) sub.items = [];
                    sub.items.push({
                        ...item,
                        id: item.id || ('temp-' + crypto.randomUUID())
                    });
                }
            });
        },
        updateItem: (state, action) => {
            const { itemId, updates } = action.payload;
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    const itemIndex = sub.items?.findIndex(i => i.id === itemId);
                    if (itemIndex !== undefined && itemIndex !== -1) {
                        sub.items[itemIndex] = { ...sub.items[itemIndex], ...updates };
                    }
                });
            });
        },
        addImage: (state, action) => {
            const { itemId, media } = action.payload;
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    const itemIndex = sub.items?.findIndex(i => i.id === itemId);
                    if (itemIndex !== undefined && itemIndex !== -1) {
                        sub.items[itemIndex].media = media;
                    }
                });
            });
        },
        deleteItem: (state, action) => {
            const { itemId } = action.payload;
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    if (sub.items) {
                        if (String(itemId).startsWith('temp-')) {
                            sub.items = sub.items.filter(i => i.id !== itemId);
                        } else {
                            const item = sub.items.find(i => i.id === itemId);
                            if (item) {
                                item.status = 'delete';
                                item.variants?.forEach(variant => variant.status = 'delete');
                            }
                        }
                    }
                });
            });
        },
        moveItem: (state, action) => {
            const { itemId, sourceSubCategoryId, targetSubCategoryId } = action.payload;
            if (sourceSubCategoryId === targetSubCategoryId) return;

            let itemToMove = null;
            // 1. Find and remove from source
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    if (sub.id === sourceSubCategoryId && sub.items) {
                        const index = sub.items.findIndex(i => i.id === itemId);
                        if (index !== -1) {
                            itemToMove = sub.items[index];
                            sub.items.splice(index, 1);
                        }
                    }
                });
            });

            // 2. Add to target
            if (itemToMove) {
                state.menuData?.forEach(cat => {
                    cat.sub_category?.forEach(sub => {
                        if (sub.id === targetSubCategoryId) {
                            if (!sub.items) sub.items = [];
                            sub.items.push(itemToMove);
                        }
                    });
                });
            }
        },
        moveSubCategory: (state, action) => {
            const { subCategoryId, sourceCategoryId, targetCategoryId } = action.payload;
            if (sourceCategoryId === targetCategoryId) return;

            let subToMove = null;
            // 1. Remove from source
            const sourceCat = state.menuData?.find(c => c.id === sourceCategoryId);
            if (sourceCat && sourceCat.sub_category) {
                const index = sourceCat.sub_category.findIndex(s => s.id === subCategoryId);
                if (index !== -1) {
                    subToMove = sourceCat.sub_category[index];
                    sourceCat.sub_category.splice(index, 1);
                }
            }

            // 2. Add to target
            if (subToMove) {
                const targetCat = state.menuData?.find(c => c.id === targetCategoryId);
                if (targetCat) {
                    if (!targetCat.sub_category) targetCat.sub_category = [];
                    targetCat.sub_category.push(subToMove);
                }
            }
        },
        bulkMergeCategories: (state, action) => {
            const { categoryIds, targetCategoryId } = action.payload;
            if (!categoryIds?.length || !targetCategoryId) return;

            const targetCat = state.menuData?.find(c => c.id === targetCategoryId);
            if (!targetCat) return;

            state.menuData?.forEach(cat => {
                if (categoryIds.includes(cat.id) && cat.id !== targetCategoryId) {
                    if (cat.sub_category && cat.sub_category.length > 0) {
                        if (!targetCat.sub_category) targetCat.sub_category = [];
                        targetCat.sub_category.push(...cat.sub_category);
                    }
                    if (String(cat.id).startsWith('temp-')) {
                        state.menuData = state.menuData.filter(c => c.id !== cat.id);
                    } else {
                        cat.status = 'delete';
                    }
                }
            });
        },
        bulkMergeSubCategories: (state, action) => {
            const { subCategoryIds, targetSubCategoryId } = action.payload;
            if (!subCategoryIds?.length || !targetSubCategoryId) return;

            let targetSub = null;
            state.menuData?.forEach(cat => {
                const found = cat.sub_category?.find(s => s.id === targetSubCategoryId);
                if (found) targetSub = found;
            });
            if (!targetSub) return;

            state.menuData?.forEach(cat => {
                if (cat.sub_category) {
                    for (let i = cat.sub_category.length - 1; i >= 0; i--) {
                        const sub = cat.sub_category[i];
                        if (subCategoryIds.includes(sub.id) && sub.id !== targetSubCategoryId) {
                            if (sub.items && sub.items.length > 0) {
                                if (!targetSub.items) targetSub.items = [];
                                targetSub.items.push(...sub.items);
                            }
                            if (String(sub.id).startsWith('temp-')) {
                                cat.sub_category.splice(i, 1);
                            } else {
                                sub.status = 'delete';
                            }
                        }
                    }
                }
            });
        },
        bulkMergeCategoriesIntoNewName: (state, action) => {
            const { categoryIds, newName } = action.payload;
            if (!categoryIds?.length || categoryIds.length < 2 || !newName?.trim()) return;

            // Pick the first one as the target
            const targetId = categoryIds[0];
            const targetCat = state.menuData?.find(c => c.id === targetId);
            if (!targetCat) return;

            // Rename target
            targetCat.name = newName.trim();

            // Merge the rest into target
            state.menuData?.forEach(cat => {
                if (categoryIds.includes(cat.id) && cat.id !== targetId) {
                    if (cat.sub_category && cat.sub_category.length > 0) {
                        if (!targetCat.sub_category) targetCat.sub_category = [];
                        targetCat.sub_category.push(...cat.sub_category);
                    }
                    if (String(cat.id).startsWith('temp-')) {
                        state.menuData = state.menuData.filter(c => c.id !== cat.id);
                    } else {
                        cat.status = 'delete';
                    }
                }
            });
        },
        bulkMergeSubCategoriesIntoNewName: (state, action) => {
            const { subCategoryIds, newName } = action.payload;
            if (!subCategoryIds?.length || subCategoryIds.length < 2 || !newName?.trim()) return;

            // Pick the first one as the target
            const targetId = subCategoryIds[0];
            let targetSub = null;
            state.menuData?.forEach(cat => {
                const found = cat.sub_category?.find(s => s.id === targetId);
                if (found) targetSub = found;
            });
            if (!targetSub) return;

            // Rename target
            targetSub.name = newName.trim();

            // Merge the rest into target
            state.menuData?.forEach(cat => {
                if (cat.sub_category) {
                    for (let i = cat.sub_category.length - 1; i >= 0; i--) {
                        const sub = cat.sub_category[i];
                        if (subCategoryIds.includes(sub.id) && sub.id !== targetId) {
                            if (sub.items && sub.items.length > 0) {
                                if (!targetSub.items) targetSub.items = [];
                                targetSub.items.push(...sub.items);
                            }
                            if (String(sub.id).startsWith('temp-')) {
                                cat.sub_category.splice(i, 1);
                            } else {
                                sub.status = 'delete';
                            }
                        }
                    }
                }
            });
        },
        bulkMoveItems: (state, action) => {
            const { itemIds, targetSubCategoryId } = action.payload;
            if (!itemIds?.length || !targetSubCategoryId) return;

            const itemsToMove = [];
            
            // 1. Remove from all sources
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    if (sub.items) {
                        for (let i = sub.items.length - 1; i >= 0; i--) {
                            if (itemIds.includes(sub.items[i].id)) {
                                itemsToMove.push(sub.items[i]);
                                sub.items.splice(i, 1);
                            }
                        }
                    }
                });
            });

            // 2. Add to target
            if (itemsToMove.length > 0) {
                state.menuData?.forEach(cat => {
                    cat.sub_category?.forEach(sub => {
                        if (sub.id === targetSubCategoryId) {
                            if (!sub.items) sub.items = [];
                            sub.items.push(...itemsToMove);
                        }
                    });
                });
            }
        },
        bulkMoveSubCategories: (state, action) => {
            const { subCategoryIds, targetCategoryId } = action.payload;
            if (!subCategoryIds?.length || !targetCategoryId) return;

            const subsToMove = [];

            // 1. Remove from all sources
            state.menuData?.forEach(cat => {
                if (cat.sub_category) {
                    for (let i = cat.sub_category.length - 1; i >= 0; i--) {
                        if (subCategoryIds.includes(cat.sub_category[i].id)) {
                            subsToMove.push(cat.sub_category[i]);
                            cat.sub_category.splice(i, 1);
                        }
                    }
                }
            });

            // 2. Add to target
            if (subsToMove.length > 0) {
                const targetCat = state.menuData?.find(c => c.id === targetCategoryId);
                if (targetCat) {
                    if (!targetCat.sub_category) targetCat.sub_category = [];
                    targetCat.sub_category.push(...subsToMove);
                }
            }
        },
        bulkMakeSubCategoriesAsCategories: (state, action) => {
            const { subCategoryIds } = action.payload;
            if (!subCategoryIds?.length) return;

            state.menuData?.forEach(cat => {
                if (cat.sub_category) {
                    for (let i = cat.sub_category.length - 1; i >= 0; i--) {
                        const sub = cat.sub_category[i];
                        if (subCategoryIds.includes(sub.id)) {
                            // Create new Category with a subcategory of the same name
                            const newCategory = {
                                id: 'temp-' + crypto.randomUUID(),
                                name: sub.name,
                                sub_category: [{
                                    id: 'temp-' + crypto.randomUUID(),
                                    name: sub.name,
                                    items: sub.items || []
                                }],
                                items: []
                            };
                            
                            state.menuData.push(newCategory);
                            
                            // Remove the old subcategory
                            if (String(sub.id).startsWith('temp-')) {
                                cat.sub_category.splice(i, 1);
                            } else {
                                sub.status = 'delete';
                            }
                        }
                    }
                }
            });
        },
        // --- Addon CRUD Reducers ---
        addAddonGroup: (state, action) => {
            if (!Array.isArray(state.addonsData)) state.addonsData = [];
            const newAddon = {
                id: action.payload.id || 'temp-' + crypto.randomUUID(),
                name: action.payload.name || 'New Addon',
                is_compulsory: false,
                min: action.payload.min || 0,
                max: action.payload.max || 1,
                allow_multiple: false,
                max_per_item: 1,
                options: []
            };
            state.addonsData.push(newAddon);
        },
        updateAddonGroup: (state, action) => {
            const { addonId, data } = action.payload;
            const addon = state.addonsData?.find(a => a.id === addonId);
            if (addon) {
                Object.assign(addon, data);
            }
        },
        deleteAddonGroup: (state, action) => {
            const addonId = action.payload;
            state.addonsData = state.addonsData?.filter(a => a.id !== addonId) || [];
        },
        addAddonOption: (state, action) => {
            const { addonId, option } = action.payload;
            const addon = state.addonsData?.find(a => a.id === addonId);
            if (addon) {
                if (!addon.options) addon.options = [];
                addon.options.push({
                    id: 'temp-' + crypto.randomUUID(),
                    name: option.name || '',
                    price: option.price || 0,
                    is_default: option.is_default || false,
                    is_veg: option.is_veg || 'VEG'
                });
            }
        },
        updateAddonOption: (state, action) => {
            const { addonId, optionId, data } = action.payload;
            const addon = state.addonsData?.find(a => a.id === addonId);
            if (addon && addon.options) {
                const opt = addon.options.find(o => o.id === optionId);
                if (opt) {
                    Object.assign(opt, data);
                }
            }
        },
        deleteAddonOption: (state, action) => {
            const { addonId, optionId } = action.payload;
            const addon = state.addonsData?.find(a => a.id === addonId);
            if (addon && addon.options) {
                addon.options = addon.options.filter(o => o.id !== optionId);
            }
        },
        toggleItemAddon: (state, action) => {
            const { itemId, addonId } = action.payload;
            let itemToUpdate = null;
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    const found = sub.items?.find(item => item.id === itemId);
                    if (found) itemToUpdate = found;
                });
            });

            if (itemToUpdate) {
                if (!itemToUpdate.addons) itemToUpdate.addons = [];
                const idx = itemToUpdate.addons.indexOf(addonId);
                if (idx > -1) {
                    itemToUpdate.addons.splice(idx, 1);
                } else {
                    itemToUpdate.addons.push(addonId);
                }
            }
        },
        bulkToggleAddon: (state, action) => {
            const { addonId, itemIds, isAttaching } = action.payload;
            state.menuData?.forEach(cat => {
                cat.sub_category?.forEach(sub => {
                    sub.items?.forEach(item => {
                        if (itemIds.includes(item.id)) {
                            if (!item.addons) item.addons = [];
                            if (isAttaching) {
                                if (!item.addons.includes(addonId)) {
                                    item.addons.push(addonId);
                                }
                            } else {
                                item.addons = item.addons.filter(id => id !== addonId);
                            }
                        }
                    });
                });
            });
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenuByResId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenuByResId.fulfilled, (state, action) => {
                state.loading = false;

                // Properly parse data whether it's wrapped in an object or just an array
                const payloadData = action.payload;
                const newMenuData = Array.isArray(payloadData)
                    ? payloadData
                    : (payloadData?.menu || payloadData?.data || []);

                state.menuData = newMenuData;
                state.addonsData = Array.isArray(payloadData?.addons) ? payloadData.addons : [];
                state.restaurantName = payloadData?.restaurantName || payloadData?.name || '';

                if (!state.activeResId && payloadData?.resId) {
                    state.activeResId = payloadData.resId;
                }

                // Default selection targets on layout initialize
                if (state.menuData.length > 0) {
                    // Only overwrite activeCategory if it's null or doesn't exist in new data
                    const categoryExists = state.activeCategory && state.menuData.find(c => c.id === state.activeCategory);
                    if (!categoryExists) {
                        state.activeCategory = state.menuData[0].id;
                        if (state.menuData[0].sub_category?.length > 0) {
                            state.activeSubCategory = state.menuData[0].sub_category[0].id;
                        } else {
                            state.activeSubCategory = null;
                        }
                    }
                } else {
                    state.activeCategory = null;
                    state.activeSubCategory = null;
                }
            })
            .addCase(fetchMenuByResId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(saveMenuByResId.pending, (state) => {
                state.isSaving = true;
                state.error = null;
            })
            .addCase(saveMenuByResId.fulfilled, (state) => {
                state.isSaving = false;
            })
            .addCase(saveMenuByResId.rejected, (state, action) => {
                state.isSaving = false;
                state.error = action.payload;
            })
            .addCase(syncZomatoMenu.pending, (state) => {
                state.isSyncing = true;
                state.error = null;
            })
            .addCase(syncZomatoMenu.fulfilled, (state, action) => {
                state.isSyncing = false;

                const dbDoc = action.payload;
                const fetchedMenu = dbDoc?.menu || [];
                const fetchedAddons = dbDoc?.addons || [];
                
                state.menuData = Array.isArray(fetchedMenu) ? fetchedMenu : [];
                state.addonsData = Array.isArray(fetchedAddons) ? fetchedAddons : [];

                if (state.menuData.length > 0) {
                    const categoryExists = state.activeCategory && state.menuData.find(c => c.id === state.activeCategory);
                    if (!categoryExists) {
                        state.activeCategory = state.menuData[0].id;
                        if (state.menuData[0].sub_category?.length > 0) {
                            state.activeSubCategory = state.menuData[0].sub_category[0].id;
                        } else {
                            state.activeSubCategory = null;
                        }
                    }
                } else {
                    state.activeCategory = null;
                    state.activeSubCategory = null;
                }
            })
            .addCase(syncZomatoMenu.rejected, (state, action) => {
                state.isSyncing = false;
                state.error = action.payload;
            });
    },
});

export const {
    setActiveResId,
    setActiveView,
    setActiveBulkMode,
    setActiveCategory,
    setActiveSubCategory,
    openImageSidebar,
    closeImageSidebar,
    clearMenuState,
    setImageUploadStatus,
    
    // Category actions
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addItem,
    updateItem,
    addImage,
    deleteItem,
    moveItem,
    moveSubCategory,
    mergeCategories,
    mergeSubCategories,
    bulkMergeCategories,
    bulkMergeSubCategories,
    bulkMergeCategoriesIntoNewName,
    bulkMergeSubCategoriesIntoNewName,
    bulkMoveItems,
    bulkMoveSubCategories,
    bulkMakeSubCategoriesAsCategories,
    
    // Addon actions
    addAddonGroup,
    updateAddonGroup,
    deleteAddonGroup,
    addAddonOption,
    updateAddonOption,
    deleteAddonOption,
    toggleItemAddon,
    bulkToggleAddon
} = menuSlice.actions;

export default menuSlice.reducer;