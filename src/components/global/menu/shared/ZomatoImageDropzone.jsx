import { useState } from "react";
import { useSelector } from "react-redux";
import useNotification from "@/store/hooks/useNotification";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { uploadZomatoImage } from "@/services/zomatoImageService";

export default function ZomatoImageDropzone({ itemId, children, onUploadSuccess, className, onClick, overlayText = "Drop Image" }) {
    const { activeResId, imageUploadStatuses } = useSelector((state) => state.menu);
    const notification = useNotification();

    const [isDragOver, setIsDragOver] = useState(false);
    const [localIsUploading, setLocalIsUploading] = useState(false);
    const [localUploadStatus, setLocalUploadStatus] = useState(null);

    const globalStatus = itemId ? imageUploadStatuses?.[itemId] : null;
    const isUploading = localIsUploading || globalStatus === 'uploading';
    const uploadStatus = localUploadStatus || globalStatus;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
        const files = e.dataTransfer.files;

        let fileToUpload = null;
        if (files && files.length > 0) {
            fileToUpload = files[0];
        } else if (url) {
            fileToUpload = url;
        }

        if (!fileToUpload) return;

        setLocalIsUploading(true);
        setLocalUploadStatus(null);
        
        const result = await uploadZomatoImage(activeResId, fileToUpload);

        setLocalIsUploading(false);

        if (result.success) {
            setLocalUploadStatus("approved");
            onUploadSuccess(result.mediaArray);
            notification.success("Image approved & applied!");
            setTimeout(() => setLocalUploadStatus(null), 3000);
        } else {
            setLocalUploadStatus("rejected");
            notification.error(result.message);
            setTimeout(() => setLocalUploadStatus(null), 4000);
        }
    };

    return (
        <div
            className={`relative ${className} ${isDragOver ? "ring-2 ring-primary opacity-70" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onClick}
        >
            {children}
            {isDragOver && !isUploading && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[2px] transition-all z-10">
                    <span className="text-white text-xs font-semibold px-3 py-1 bg-primary rounded-full shadow-md animate-in zoom-in-95 duration-150">
                        {overlayText}
                    </span>
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <Loader2 className="animate-spin text-primary mb-2" size={24} />
                    <span className="text-xs font-semibold text-neutral-700 tracking-wide uppercase">Validating...</span>
                </div>
            )}
            
            {uploadStatus === "approved" && !isUploading && (
                <div className="absolute top-2 right-2 z-30 bg-green-500/95 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm animate-in zoom-in duration-300">
                    <CheckCircle2 size={12} /> Approved
                </div>
            )}
            
            {uploadStatus === "rejected" && !isUploading && (
                <div className="absolute top-2 right-2 z-30 bg-red-500/95 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm animate-in zoom-in duration-300">
                    <XCircle size={12} /> Rejected
                </div>
            )}
        </div>
    );
}
