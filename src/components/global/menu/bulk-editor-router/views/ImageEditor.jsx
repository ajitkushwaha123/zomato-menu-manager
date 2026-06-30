import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImageIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { openImageSidebar } from "@/store/slice/menuSlice";
import ZomatoImageDropzone from "../../shared/ZomatoImageDropzone";
import useNotification from "@/store/hooks/useNotification";

const ImageCard = ({ item, onClick, onDrop, isActive }) => {
    const imgUrl = item?.media?.[0]?.thumbUrl || item?.media?.[0]?.url || item.image_url || (typeof item.image === 'string' ? item.image : item.image?.url);

    return (
        <ZomatoImageDropzone
            itemId={item?.id}
            onClick={() => onClick(item)}
            onUploadSuccess={(mediaArray) => onDrop(item.id, mediaArray)}
            overlayText="Drop Image"
            className={`group relative rounded-xl overflow-hidden border bg-card transition-all duration-200 cursor-pointer select-none
                ${isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'border-border/60 hover:border-border hover:shadow-md hover:-translate-y-[1px]'
                } 
            `}
        >
            {/* Image Container */}
            <div className="aspect-square w-full bg-muted relative overflow-hidden border-b border-border/40">
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
        <div className="flex-1 flex overflow-hidden relative bg-neutral-50/40">
            {/* Main Content Pane */}
            <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out ${isImageSidebarOpen ? 'w-1/2 pr-4 mr-[50%]' : 'w-full'}`}>
                <div className="mx-auto space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200/60 pb-4 gap-2">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Image Editor</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select an item to refine search options or instantly update assets via drag & drop.
                            </p>
                        </div>
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