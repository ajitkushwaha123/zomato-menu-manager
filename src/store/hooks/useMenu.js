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
} from '../slice/menuSlice';

export const useMenu = () => {
    const dispatch = useDispatch();

    const {
        menuData,
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
        addItem: useCallback((payload) => dispatch(dispatchAddItem(payload)), [dispatch]),
        updateItem: useCallback((payload) => dispatch(dispatchUpdateItem(payload)), [dispatch]),
        deleteItem: useCallback((payload) => dispatch(dispatchDeleteItem(payload)), [dispatch]),
        moveItem: useCallback((payload) => dispatch(dispatchMoveItem(payload)), [dispatch]),

        getMenuByResId,
        saveMenuByResId: useCallback(() => dispatch(dispatchSaveMenuByResId()).unwrap(), [dispatch]),
        syncZomatoMenu: useCallback(() => dispatch(dispatchSyncZomatoMenu(activeResId)).unwrap(), [dispatch, activeResId])
    };
};