import api from "@/lib/api/axios";

export const uploadZomatoImage = async (activeResId, fileOrUrl) => {
    try {
        let processedFileOrUrl = fileOrUrl;

        // Resize images exceeding 1800x1200 and convert AVIF/WEBP to JPEG
        if (processedFileOrUrl instanceof File && processedFileOrUrl.type.includes("image/")) {
            try {
                processedFileOrUrl = await new Promise((resolve) => {
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(processedFileOrUrl);
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;
                        const MAX_WIDTH = 1800;
                        const MAX_HEIGHT = 1200;

                        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                            const widthRatio = MAX_WIDTH / width;
                            const heightRatio = MAX_HEIGHT / height;
                            const ratio = Math.min(widthRatio, heightRatio);
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }

                        const needsConversion = processedFileOrUrl.type.includes("avif") || processedFileOrUrl.type.includes("webp") || processedFileOrUrl.name.match(/\.(avif|webp)$/i);
                        const needsResize = width !== img.width || height !== img.height;

                        if (!needsConversion && !needsResize) {
                            URL.revokeObjectURL(objectUrl);
                            return resolve(processedFileOrUrl);
                        }

                        const canvas = document.createElement("canvas");
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob((blob) => {
                            URL.revokeObjectURL(objectUrl);
                            if (blob) {
                                const newName = processedFileOrUrl.name.replace(/\.[^/.]+$/, "") + ".jpg";
                                const convertedFile = new File([blob], newName, {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                });
                                resolve(convertedFile);
                            } else {
                                resolve(processedFileOrUrl);
                            }
                        }, "image/jpeg", 0.9);
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(processedFileOrUrl);
                    };
                    img.src = objectUrl;
                });
            } catch (err) {
                console.error("Frontend image processing failed:", err);
            }
        }

        const formData = new FormData();

        if (typeof processedFileOrUrl === "string") {
            // Let the Next.js backend handle fetching to completely bypass browser CORS limits
            formData.append("imageUrl", processedFileOrUrl);
        } else {
            formData.append("file", processedFileOrUrl);
        }

        const res = await api.post(`/api/menu/${activeResId}/zomato/upload-image`, formData, {
            headers: {
                "Content-Type": undefined
            }
        });

        const result = res.data;

        // if (result.success && result.upload_status === "approved") {
        const data = result.data || result;

        const urlStr = result.imageUrl || data.url || data.image_url;
        let fileName = "new-image.jpg";
        let fileDirectory = "";
        if (urlStr) {
            try {
                const urlObj = new URL(urlStr);
                const pathParts = urlObj.pathname.split('/');
                fileName = pathParts.pop() || "new-image.jpg";
                const fullDir = pathParts.join('/') + '/';
                fileDirectory = fullDir.startsWith('/') ? fullDir.slice(1) : fullDir;
            } catch (e) {
                console.error("Failed to parse image URL", e);
            }
        }

        const mediaObj1 = {
            tempReferenceId: `temp-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`,
            mediaType: "PHOTO",
            mediaId: data.image_id || data.mediaId || fileName,
            order: 1,
            usageType: "FOODSHOT",
            entityType: "CATALOGUE",
            url: urlStr,
            thumbUrl: data.thumb_url || data.thumbUrl || `${urlStr}?fit=around%7C200%3A200&crop=200%3A200%3B%2A%2C%2A`,
            fileDirectory: fileDirectory,
            source: "MS_MENU_TOOL",
            fileName: fileName,
            mediaTags: [{ tagSlug: "uid_media" }],
            usageTypeEnum: "USAGE_TYPE_FOODSHOT",
            isNewlyUploaded: true,
            metadata: {
                dimensions: {
                    width: data.width || 1800,
                    height: data.height || 1200,
                },
            },
            isStockPhoto: false,
            isZoomed: false,
            isLowScore: false,
            isUploading: false,
        }

        return { success: true, mediaArray: [mediaObj1] };
        // } else {
        //     return {
        //         success: false,
        //         message: result.message || "Image rejected by Zomato.",
        //     };
        // }
    } catch (error) {
        console.error("Image Service Error:", error);
        const errorMessage = error.response?.data?.message || error.message || "Failed to upload image.";
        return { success: false, message: errorMessage };
    }
};
