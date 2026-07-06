export function buildCategoryPayload(categoryWrapper) {
    console.log("categoryWrapper", categoryWrapper)
    const categoryId = categoryWrapper?.category?.categoryId;
    const catTempRef = categoryWrapper?.category?.tempReferenceId;

    return {
        category: {
            ...(categoryWrapper?.category || {}),
            hasTiming: categoryWrapper?.category?.hasTiming ?? false,
            tempReferenceId: categoryId ? "" : (catTempRef || ""),
        },
        timings: categoryWrapper?.timings || [],
        timingsV2: categoryWrapper?.timingsV2 || [],
        subCategoryWrappers: (categoryWrapper?.subCategoryWrappers || []).map(
            (wrapper) => {
                const subCategoryId = wrapper?.subCategory?.subCategoryId;
                const subTempRef = wrapper?.subCategory?.tempReferenceId;

                return {
                    subCategory: {
                        ...(wrapper?.subCategory || {}),
                        tempReferenceId: subCategoryId ? "" : (subTempRef || ""),
                    },
                    subCategoryEntities: wrapper?.subCategoryEntities || [],
                };
            }
        ),
        categoryServices: categoryWrapper?.categoryServices || [],
    };
}

export function updateExistingSubCategory(zomatoSub, dbSub) {
    let newZomatoSub = {
        ...zomatoSub,
        subCategory: {
            ...zomatoSub.subCategory,
            name: dbSub.name || zomatoSub.subCategory.name
        }
    };

    const existingEntities = zomatoSub.subCategoryEntities || [];
    let entities = [];

    const activeItems = (dbSub.items || []).filter(item => item.status !== 'delete' && item.status !== 'deleted');
    
    activeItems.forEach((item, index) => {
        const isTemp = String(item.id).startsWith("temp-");
        const realId = String(item.id).replace("temp-", "");

        const existing = existingEntities.find(e => 
            String(e.entityId) === String(item.id) || 
            String(e.tempReferenceId) === realId
        );

        if (existing) {
            entities.push({
                ...existing,
                order: index + 1
            });
        } else {
            entities.push({
                id: "",
                subCategoryId: String(zomatoSub?.subCategory?.subCategoryId || ""),
                entityType: "catalogue",
                entityId: isTemp ? "" : realId,
                order: index + 1,
                ...(isTemp ? { tempReferenceId: realId } : {})
            });
        }
    });

    newZomatoSub.subCategoryEntities = entities;

    return newZomatoSub;
}

export function buildNewSubCategory(newDbSub, categoryId, startingOrder) {
    let entities = [];
    const activeItems = (newDbSub.items || []).filter(item => item.status !== 'delete' && item.status !== 'deleted');
    
    activeItems.forEach((item, index) => {
        const isTemp = String(item.id).startsWith("temp-");
        const realId = String(item.id).replace("temp-", "");

        entities.push({
            id: "",
            subCategoryId: "",
            entityType: "catalogue",
            entityId: isTemp ? "" : realId,
            order: index + 1,
            ...(isTemp ? { tempReferenceId: realId } : {})
        });
    });

    return {
        subCategory: {
            subCategoryId: "",
            categoryId: categoryId,
            tempReferenceId: String(newDbSub.id).replace("temp-", ""),
            name: newDbSub.name,
            order: startingOrder
        },
        subCategoryEntities: entities
    };
}

export function buildNewCategory(newDbCat, resId, startingOrder, allZomatoSubWrappers = []) {
    let newCatWrapper = {
        category: {
            categoryId: "",
            tempReferenceId: String(newDbCat.id).replace("temp-", ""),
            resId: resId,
            name: newDbCat.name,
            order: startingOrder,
            hasTiming: false
        },
        timings: [],
        timingsV2: [],
        subCategoryWrappers: [],
        categoryServices: [
            {
                categoryId: "",
                service: "DELIVERY",
                status: "ENABLED"
            }
        ]
    };

    const newDbSubs = newDbCat.sub_category || [];
    for (const newDbSub of newDbSubs) {
        if (!String(newDbSub.id).startsWith("temp-")) {
            const oldZomatoSub = allZomatoSubWrappers.find(z => String(z.subCategory?.subCategoryId) === String(newDbSub.id));
            if (oldZomatoSub) {
                const movedSub = updateExistingSubCategory(oldZomatoSub, newDbSub);
                movedSub.subCategory.categoryId = "";
                movedSub.subCategory.order = newCatWrapper.subCategoryWrappers.length + 1;
                newCatWrapper.subCategoryWrappers.push(movedSub);
                continue;
            }
        }
        newCatWrapper.subCategoryWrappers.push(
            buildNewSubCategory(newDbSub, "", newCatWrapper.subCategoryWrappers.length + 1)
        );
    }

    return buildCategoryPayload(newCatWrapper);
}

export function getUpdatedCategoryData(categoryWrappers, dbMenu = [], globalResId = "") {
    if (!Array.isArray(categoryWrappers)) return [];

    let newCategoryWrappers = [];
    const resId = categoryWrappers[0]?.category?.resId || globalResId;
    const allZomatoSubWrappers = categoryWrappers.flatMap(c => c.subCategoryWrappers || []);

    for (const zomatoCat of categoryWrappers) {
        const catId = String(zomatoCat?.category?.categoryId || "");
        const dbCat = dbMenu.find(c => String(c.id) === catId);

        if (dbCat && (dbCat.status === 'delete' || dbCat.status === 'deleted')) {
            continue;
        }

        if (dbCat) {
            let updatedCat = { ...zomatoCat };
            updatedCat.category = {
                ...updatedCat.category,
                name: dbCat.name || updatedCat.category.name
            };

            let updatedSubCats = [...(updatedCat.subCategoryWrappers || [])];

            // Update existing subcategories
            updatedSubCats = updatedSubCats.map(zomatoSub => {
                const subId = String(zomatoSub?.subCategory?.subCategoryId || "");
                const dbSub = (dbCat.sub_category || []).find(s => String(s.id) === subId);
                
                if (dbSub && (dbSub.status === 'delete' || dbSub.status === 'deleted')) return null;
                if (!dbSub) return null; // Subcategory was moved out
                
                return updateExistingSubCategory(zomatoSub, dbSub);
            }).filter(Boolean);

            const existingSubCatIds = updatedSubCats.map(z => String(z.subCategory?.subCategoryId || ""));

            // Add new subcategories and moved subcategories
            const subsToAdd = (dbCat.sub_category || []).filter(s => {
                if (s.status === 'delete' || s.status === 'deleted') return false;
                if (existingSubCatIds.includes(String(s.id))) return false;
                return true;
            });

            for (const subToAdd of subsToAdd) {
                if (!String(subToAdd.id).startsWith("temp-")) {
                    const oldZomatoSub = allZomatoSubWrappers.find(z => String(z.subCategory?.subCategoryId) === String(subToAdd.id));
                    if (oldZomatoSub) {
                         const movedSub = updateExistingSubCategory(oldZomatoSub, subToAdd);
                         movedSub.subCategory.categoryId = catId;
                         movedSub.subCategory.order = updatedSubCats.length + 1;
                         updatedSubCats.push(movedSub);
                         continue;
                    }
                }
                
                updatedSubCats.push(
                    buildNewSubCategory(subToAdd, catId, updatedSubCats.length + 1)
                );
            }

            updatedCat.subCategoryWrappers = updatedSubCats;
            newCategoryWrappers.push(buildCategoryPayload(updatedCat));
        } else {
            let fallbackCat = { ...zomatoCat };
            let fallbackSubs = [...(fallbackCat.subCategoryWrappers || [])];
            fallbackSubs = fallbackSubs.map(zomatoSub => {
                const subId = String(zomatoSub?.subCategory?.subCategoryId || "");
                const claimedBySomeoneElse = dbMenu.some(c => 
                    c.id !== catId && 
                    (c.sub_category || []).some(s => String(s.id) === subId && s.status !== 'delete' && s.status !== 'deleted')
                );
                if (claimedBySomeoneElse) return null;
                return zomatoSub;
            }).filter(Boolean);
            
            fallbackCat.subCategoryWrappers = fallbackSubs;
            newCategoryWrappers.push(buildCategoryPayload(fallbackCat));
        }
    }

    // Add completely new categories
    const newDbCats = dbMenu.filter(c => String(c.id).startsWith("temp-") && c.status !== 'delete' && c.status !== 'deleted');
    for (const newDbCat of newDbCats) {
        newCategoryWrappers.push(
            buildNewCategory(newDbCat, resId, newCategoryWrappers.length + 1, allZomatoSubWrappers)
        );
    }

    return newCategoryWrappers;
}