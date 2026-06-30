import api from "@/lib/api/axios";

export const uploadZomatoImage = async (activeResId, fileOrUrl) => {
    try {
        const formData = new FormData();

        if (typeof fileOrUrl === "string") {
            // Let the Next.js backend handle fetching to completely bypass browser CORS limits
            formData.append("imageUrl", fileOrUrl);
        } else {
            formData.append("file", fileOrUrl);
        }

        const res = await api.post(`/api/menu/${activeResId}/zomato/upload-image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        const result = res.data;

        if (result.success && result.upload_status === "approved") {
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
        } else {
            return {
                success: false,
                message: result.message || "Image rejected by Zomato.",
            };
        }
    } catch (error) {
        console.error("Image Service Error:", error);
        return { success: false, message: "Failed to upload image." };
    }
};
