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
            const data = await MenuService.saveMenu(menu.activeResId, menu.menuData);
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to save menu');
        }
    }
);

const initialState = {
    menuData: null,         // Array of categories
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

                const payloadData = action.payload;
                const newMenuData = Array.isArray(payloadData)
                    ? payloadData
                    : (payloadData?.menu || payloadData?.data || []);

                state.menuData = newMenuData;

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
    moveItem
} = menuSlice.actions;

export default menuSlice.reducer;