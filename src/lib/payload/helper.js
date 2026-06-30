export const validateRequiredFields = (data, requiredFields) => {
    const missing = requiredFields.filter(
        (field) =>
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
    );

    if (missing.length) {
        throw new Error(
            `Missing required fields: ${missing.join(", ")}`
        );
    }
}