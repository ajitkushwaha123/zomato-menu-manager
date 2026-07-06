import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMenuByResId,
    setActiveResId as setGlobalResId,
    setActiveView as setGlobalView,
    setActiveBulkMode as setGlobalBulkMode,
    setActiveCategory as setGlobalCategory,
    setActiveSubCategory as setGlobalSubCategory,
    addCategory as dispatchAddCategory,
    updateCategory as dispatchUpdateCategory,
    deleteCategory as dispatchDeleteCategory,
    addSubCategory as dispatchAddSubCategory,
    updateSubCategory as dispatchUpdateSubCategory,
    deleteSubCategory as dispatchDeleteSubCategory,
    addItem as dispatchAddItem,
    updateItem as dispatchUpdateItem,
    deleteItem as dispatchDeleteItem,
    moveItem as dispatchMoveItem,
    saveMenuByResId as dispatchSaveMenuByResId,
    syncZomatoMenu as dispatchSyncZomatoMenu,
    addAddonGroup as dispatchAddAddonGroup,
    updateAddonGroup as dispatchUpdateAddonGroup,
    deleteAddonGroup as dispatchDeleteAddonGroup,
    addAddonOption as dispatchAddAddonOption,
    updateAddonOption as dispatchUpdateAddonOption,
    deleteAddonOption as dispatchDeleteAddonOption,
    toggleItemAddon as dispatchToggleItemAddon,
    bulkToggleAddon as dispatchBulkToggleAddon,
} from '../slice/menuSlice';

export const useMenu = () => {
    const dispatch = useDispatch();

    const {
        menuData,
        addonsData,
        restaurantName,
        activeResId,
        activeView,
        activeBulkMode,
        activeCategory,
        activeSubCategory,
        loading,
        isSaving,
        isSyncing,
        error
    } = useSelector((state) => state.menu);

    const getMenuByResId = useCallback((resId) => {
        dispatch(fetchMenuByResId(resId));
    }, [dispatch]);

    const setActiveResId = useCallback((id) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('activeResId', id);
        }
        dispatch(setGlobalResId(id));
    }, [dispatch]);
    const setActiveView = useCallback((view) => dispatch(setGlobalView(view)), [dispatch]);
    const setActiveBulkMode = useCallback((mode) => dispatch(setGlobalBulkMode(mode)), [dispatch]);
    const setActiveCategory = useCallback((catId) => dispatch(setGlobalCategory(catId)), [dispatch]);
    const setActiveSubCategory = useCallback((subCatId) => dispatch(setGlobalSubCategory(subCatId)), [dispatch]);

    const addCategory = useCallback((name) => {
        dispatch(dispatchAddCategory(name));
    }, [dispatch]);

    const updateCategory = useCallback((categoryId, data) => {
        dispatch(dispatchUpdateCategory({ categoryId, data }));
    }, [dispatch]);

    const deleteCategory = useCallback((categoryId) => {
        dispatch(dispatchDeleteCategory(categoryId));
    }, [dispatch]);

    const addSubCategory = useCallback((categoryId, name) => {
        dispatch(dispatchAddSubCategory({ categoryId, name }));
    }, [dispatch]);

    const updateSubCategory = useCallback((subCategoryId, data) => {
        dispatch(dispatchUpdateSubCategory({ subCategoryId, data }));
    }, [dispatch]);

    const deleteSubCategory = useCallback((subCategoryId) => {
        dispatch(dispatchDeleteSubCategory(subCategoryId));
    }, [dispatch]);

    return {
        // Data States
        menuData,
        addonsData,
        restaurantName,
        activeResId,
        activeView,
        activeBulkMode,
        activeCategory,
        activeSubCategory,
        isLoading: loading,
        isSaving,
        isSyncing,
        error,

        // Core Layout Setters
        setActiveResId,
        setActiveView,
        setActiveBulkMode,
        setActiveCategory,
        setActiveSubCategory,

        // Menu Modifiers (CRUD)
        addCategory,
        updateCategory,
        deleteCategory,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,

        // Item Modifiers
        addItem: (payload) => {
            if (payload && payload.subCategoryId && payload.item) {
                return dispatch(dispatchAddItem(payload));
            }
            // fallback for legacy calls
            return dispatch(dispatchAddItem({ subCategoryId: arguments[0], item: { name: arguments[1], price: arguments[2] } }));
        },
        updateItem: (itemIdOrPayload, data) => {
            if (typeof itemIdOrPayload === 'object' && itemIdOrPayload !== null && 'itemId' in itemIdOrPayload) {
                return dispatch(dispatchUpdateItem({
                    itemId: itemIdOrPayload.itemId,
                    updates: itemIdOrPayload.updates || itemIdOrPayload.data
                }));
            }
            return dispatch(dispatchUpdateItem({ itemId: itemIdOrPayload, updates: data }));
        },
        deleteItem: (itemId) => {
            if (typeof itemId === 'object' && itemId !== null && 'itemId' in itemId) {
                return dispatch(dispatchDeleteItem(itemId));
            }
            return dispatch(dispatchDeleteItem({ itemId }));
        },
        moveItem: (itemId, targetSubCategoryId) => dispatch(dispatchMoveItem({ itemId, targetSubCategoryId })),
        
        // Addon Modifiers
        addAddonGroup: (id, name, min, max) => dispatch(dispatchAddAddonGroup({ id, name, min, max })),
        updateAddonGroup: (addonId, data) => dispatch(dispatchUpdateAddonGroup({ addonId, data })),
        deleteAddonGroup: (addonId) => dispatch(dispatchDeleteAddonGroup(addonId)),
        addAddonOption: (addonId, option) => dispatch(dispatchAddAddonOption({ addonId, option })),
        updateAddonOption: (addonId, optionId, data) => dispatch(dispatchUpdateAddonOption({ addonId, optionId, data })),
        deleteAddonOption: (addonId, optionId) => dispatch(dispatchDeleteAddonOption({ addonId, optionId })),
        toggleItemAddon: (itemId, addonId) => dispatch(dispatchToggleItemAddon({ itemId, addonId })),
        bulkToggleAddon: (addonId, itemIds, isAttaching) => dispatch(dispatchBulkToggleAddon({ addonId, itemIds, isAttaching })),

        // Data operations
        getMenuByResId,
        saveMenuByResId: () => dispatch(dispatchSaveMenuByResId()),
        syncZomatoMenu: (resId) => dispatch(dispatchSyncZomatoMenu(resId))
    };
};