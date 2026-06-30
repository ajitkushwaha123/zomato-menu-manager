export function buildCategoryPayload(categoryWrapper) {
    console.log("categoryWrapper", categoryWrapper)
    const categoryId = categoryWrapper?.category?.categoryId;
    const catTempRef = categoryWrapper?.category?.tempReferenceId;

    return {
        category: {
            ...(categoryWrapper?.category || {}),
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

    let entities = [...(newZomatoSub.subCategoryEntities || [])];
    entities = entities.filter(entity => {
        const dbItem = dbSub.items?.find(item => String(item.id) === String(entity.entityId) || String(item.id) === `temp-${entity.tempReferenceId}`);
        if (!dbItem) return false;
        if (dbItem.status === 'delete' || dbItem.status === 'deleted') return false;
        return true;
    });

    const newItems = (dbSub.items || []).filter(item => String(item.id).startsWith("temp-") && item.status !== 'delete' && item.status !== 'deleted');
    for (const newItem of newItems) {
        entities.push({
            id: "",
            subCategoryId: String(zomatoSub?.subCategory?.subCategoryId || ""),
            entityType: "catalogue",
            entityId: "",
            order: entities.length + 1,
            tempReferenceId: String(newItem.id).replace("temp-", "")
        });
    }
    newZomatoSub.subCategoryEntities = entities;

    return newZomatoSub;
}

export function buildNewSubCategory(newDbSub, categoryId, startingOrder) {
    let entities = [];
    const newItems = (newDbSub.items || []).filter(item => item.status !== 'delete' && item.status !== 'deleted');
    for (const newItem of newItems) {
        entities.push({
            id: "",
            subCategoryId: "",
            entityType: "catalogue",
            entityId: "",
            order: entities.length + 1,
            tempReferenceId: String(newItem.id).replace("temp-", "")
        });
    }

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

export function buildNewCategory(newDbCat, resId, startingOrder) {
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
                return dbSub ? updateExistingSubCategory(zomatoSub, dbSub) : zomatoSub;
            }).filter(Boolean);

            // Add new subcategories to existing category
            const newDbSubs = (dbCat.sub_category || []).filter(s => String(s.id).startsWith("temp-") && s.status !== 'delete' && s.status !== 'deleted');
            for (const newDbSub of newDbSubs) {
                updatedSubCats.push(
                    buildNewSubCategory(newDbSub, catId, updatedSubCats.length + 1)
                );
            }

            updatedCat.subCategoryWrappers = updatedSubCats;
            newCategoryWrappers.push(buildCategoryPayload(updatedCat));
        } else {
            newCategoryWrappers.push(buildCategoryPayload(zomatoCat));
        }
    }

    // Add completely new categories
    const newDbCats = dbMenu.filter(c => String(c.id).startsWith("temp-") && c.status !== 'delete' && c.status !== 'deleted');
    for (const newDbCat of newDbCats) {
        newCategoryWrappers.push(
            buildNewCategory(newDbCat, resId, newCategoryWrappers.length + 1)
        );
    }

    return newCategoryWrappers;
}