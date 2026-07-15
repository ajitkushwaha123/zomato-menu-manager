import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImageIcon, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { openImageSidebar } from "@/store/slice/menuSlice";
import ZomatoImageDropzone from "../../shared/ZomatoImageDropzone";
import useNotification from "@/store/hooks/useNotification";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/axios";
import { uploadZomatoImage } from "@/services/zomatoImageService";

const ImageCard = ({ item, onClick, onDrop, isActive }) => {
    const imgUrl = item?.media?.[0]?.thumbUrl || item?.media?.[0]?.url || item.image_url || (typeof item.image === 'string' ? item.image : item.image?.url);
    const isNewMedia = item?.media?.[0]?.id?.toString().startsWith("temp-") || item?.media?.[0]?.tempReferenceId?.toString().startsWith("temp-") || item?.media?.[0]?.isNewlyUploaded;

    return (
        <ZomatoImageDropzone
            itemId={item?.id}
            onClick={() => onClick(item)}
            onUploadSuccess={(mediaArray) => onDrop(item.id, mediaArray)}
            overlayText="Drop Image"
            className={`group relative rounded-xl overflow-hidden border bg-card transition-all duration-200 cursor-pointer select-none
                ${isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : isNewMedia
                        ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-sm hover:border-yellow-500 hover:-translate-y-[1px]'
                        : 'border-border/60 hover:border-border hover:shadow-md hover:-translate-y-[1px]'
                } 
            `}
        >
            {/* Image Container */}
            <div className="aspect-square w-full bg-muted relative overflow-hidden border-b border-border/40">
                {item?.media?.[0]?.mediaTags?.some?.(t => t.tagSlug === "rejected") ? (
                    <div className="absolute inset-x-0 bottom-0 bg-red-500 text-white text-[10px] font-bold text-center py-1 z-10">
                        REJECTED
                    </div>
                ) : item?.media?.[0]?.onHoldStatus === 2 ? (
                    <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-white text-[10px] font-bold text-center py-1 z-10">
                        ON HOLD
                    </div>
                ) : null}
                
                {imgUrl && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDrop(item.id, []);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-md transition-colors z-30 opacity-0 group-hover:opacity-100"
                        title="Delete Image"
                    >
                        <XCircle size={16} />
                    </button>
                )}

                {imgUrl ? (
                    <img
                        src={imgUrl}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 bg-zinc-50/50">
                        <ImageIcon size={20} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium tracking-wide uppercase">No Image</span>
                    </div>
                )}
                {/* Temporary Loading State for Auto Apply */}
                {item?.media?.[0]?.isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] z-20">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                        <span className="text-white text-[10px] font-medium px-2 py-1 bg-black/50 rounded-md">
                            {item.media[0].uploadText || 'Applying...'}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-2.5 space-y-1 bg-white">
                <p className="text-xs font-semibold truncate text-neutral-800 leading-tight" title={item.name}>
                    {item.name || "Unnamed Item"}
                </p>

                {item._parentCategoryName && (
                    <p className="text-[10px] text-muted-foreground font-medium truncate flex items-center gap-1" title={`${item._parentCategoryName} → ${item._parentSubCategoryName}`}>
                        <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                            {item._parentCategoryName}
                        </span>
                        {item._parentSubCategoryName && (
                            <>
                                <span className="text-neutral-300">/</span>
                                <span className="truncate">{item._parentSubCategoryName}</span>
                            </>
                        )}
                    </p>
                )}
            </div>
        </ZomatoImageDropzone>
    );
};

export default function ImageEditor({ allItems, updateItem }) {
    const dispatch = useDispatch();
    const notification = useNotification();
    const { isImageSidebarOpen, activeItem, activeResId } = useSelector((state) => state.menu);
    const notify = useNotification();

    const [isAutoApplying, setIsAutoApplying] = useState(false);
    const [autoApplyProgress, setAutoApplyProgress] = useState({ total: 0, completed: 0 });

    const handleAutoApplyImages = async () => {
        const itemsWithoutMedia = allItems.filter(item => {
            const hasMedia = item.media && item.media.length > 0;
            return !hasMedia;
        });

        if (itemsWithoutMedia.length === 0) {
            notify.success("All items already have images!");
            return;
        }

        // Inject temporary placeholders
        itemsWithoutMedia.forEach(item => {
            updateItem({
                itemId: item.id,
                updates: {
                    media: [{
                        tempReferenceId: `temp-auto-${crypto.randomUUID()}`,
                        url: '',
                        isUploading: true
                    }]
                }
            });
        });

        setIsAutoApplying(true);
        setAutoApplyProgress({ total: itemsWithoutMedia.length, completed: 0 });

        // Maintain a set of used image URLs to prevent duplicates
        const usedImages = new Set();
        allItems.forEach(item => {
            if (item.media && item.media.length > 0) {
                item.media.forEach(m => {
                    if (m.url) usedImages.add(m.url);
                    if (m.thumbUrl) usedImages.add(m.thumbUrl);
                });
            } else if (item.image_url) {
                usedImages.add(item.image_url);
            }
        });

        try {
            const chunkSize = 3;
            let completedCount = 0;
            
            for (let i = 0; i < itemsWithoutMedia.length; i += chunkSize) {
                const chunk = itemsWithoutMedia.slice(i, i + chunkSize);
                
                const fetchPromises = chunk.map(async (item) => {
                    try {
                        const cleanName = item.name.split("[")[0].split("(")[0].trim();
                        // Increase limit to 6 to give more fallback options if top results are already used
                        const res = await api.get(`/api/image/search?q=${encodeURIComponent(cleanName)}&page=1&limit=6&latest=true`);
                        const photos = res.data?.data || [];
                        
                        let finalMedia = [];
                        
                        for (let j = 0; j < Math.min(6, photos.length); j++) {
                            const photo = photos[j];
                            const imageUrl = photo.image_url || photo.image || photo.url;
                            if (!imageUrl) continue;
                            
                            // Prevent duplicate images
                            if (usedImages.has(imageUrl)) continue;
                            
                            // Optimistically mark as used
                            usedImages.add(imageUrl);
                            
                            updateItem({
                                itemId: item.id,
                                updates: {
                                    media: [{
                                        tempReferenceId: `temp-auto-${crypto.randomUUID()}`,
                                        url: '',
                                        isUploading: true,
                                        uploadText: `Trying ${j+1}/${Math.min(6, photos.length)}`
                                    }]
                                }
                            });
                            
                            const uploadRes = await uploadZomatoImage(activeResId, imageUrl);
                            
                            if (uploadRes.success && uploadRes.mediaArray) {
                                finalMedia = uploadRes.mediaArray;
                                break;
                            }
                        }
                        
                        return { itemId: item.id, media: finalMedia };
                    } catch (e) {
                        console.error(`Failed to fetch/upload image for ${item.name}`, e);
                        return { itemId: item.id, media: [] };
                    }
                });
                
                const results = await Promise.all(fetchPromises);
                
                results.forEach(result => {
                    const { itemId, media } = result;
                    if (media && media.length > 0) {
                        updateItem({ itemId, updates: { media } });
                    } else {
                        updateItem({
                            itemId,
                            updates: {
                                media: [{
                                    tempReferenceId: `temp-auto-fail-${crypto.randomUUID()}`,
                                    url: "https://placehold.co/200x200?text=Rejected",
                                    isUploading: false,
                                    mediaTags: [{ tagSlug: "rejected" }]
                                }]
                            }
                        });
                    }
                });
                
                completedCount += chunk.length;
                setAutoApplyProgress({ total: itemsWithoutMedia.length, completed: completedCount });
            }
            
            setIsAutoApplying(false);
            notify.success(`Successfully applied images for ${itemsWithoutMedia.length} items!`);
            
        } catch (err) {
            console.error(err);
            notify.error("Failed during auto apply images.");
            setIsAutoApplying(false);
        }
    };

    if (!allItems || allItems.length === 0) {
        return (
            <div className="flex-1 flex flex-col gap-2 items-center justify-center text-muted-foreground min-h-[300px]">
                <ImageIcon size={32} className="stroke-1 text-muted-foreground/60" />
                <p className="text-sm font-medium">No items available to edit.</p>
            </div>
        );
    }

    const handleDropImage = (itemId, mediaArray) => {
        updateItem({ itemId, updates: { media: mediaArray } });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-neutral-50/40">
            {/* Main Content Pane */}
            <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out ${isImageSidebarOpen ? 'w-1/2 pr-4 mr-[50%]' : 'w-full'}`}>
                <div className="mx-auto space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200/60 pb-4 gap-4 relative">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Image Editor</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select an item to refine search options or instantly update assets via drag & drop.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                            <Button
                                variant="secondary"
                                onClick={handleAutoApplyImages}
                                disabled={isAutoApplying}
                                className="h-9 rounded-lg px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors relative overflow-hidden"
                            >
                                {isAutoApplying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
                                        <span>Applying ({autoApplyProgress.completed}/{autoApplyProgress.total})</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
                                        <span>Auto Apply Images</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {/* Progress Bar under the header */}
                        {isAutoApplying && (
                            <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-indigo-100 overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                                    style={{ width: `${Math.min(100, (autoApplyProgress.completed / Math.max(1, autoApplyProgress.total)) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className={`grid gap-4 transition-all duration-300 ${isImageSidebarOpen
                            ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                            : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                        }`}>
                        {allItems.map(item => (
                            <ImageCard
                                key={item.id}
                                item={item}
                                isActive={activeItem?.id === item.id}
                                onClick={(item) => dispatch(openImageSidebar(item))}
                                onDrop={handleDropImage}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}