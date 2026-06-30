"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({ onChange, clearTrigger }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    const updated = [...files, ...newFiles];
    setFiles(updated);
    onChange && onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange && onChange(updated);
  };

  const handleClick = () => fileInputRef.current?.click();

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (err) => console.log(err),
  });

  // ✅ Clear files when parent triggers clear
  useEffect(() => {
    if (clearTrigger) {
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChange && onChange([]);
    }
  }, [clearTrigger]);

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-4 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-white"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.3] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>

        <div className="flex flex-col items-center justify-center text-center relative z-10">
          <p className="font-medium text-gray-700 text-sm">Upload files</p>
          <p className="text-xs text-gray-400 mt-1">
            Click or drag files here (Max 25MB)
          </p>

          <div className="w-full mt-4 space-y-2">
            {files.map((file, idx) => (
              <motion.div
                key={idx}
                layout
                className={cn(
                  "relative z-40 bg-gray-50 border border-gray-200 flex flex-col items-start justify-start p-2.5 w-full mx-auto rounded-md shadow-sm hover:shadow-md transition"
                )}
              >
                <div className="flex justify-between w-full items-center gap-3">
                  <p className="text-sm text-gray-800 truncate max-w-[9rem]">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <IconX
                      size={14}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                      onClick={() => handleRemove(idx)}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 w-full mt-1">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                    {file.type || "Unknown"}
                  </span>
                  <span>
                    {new Date(file.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}

            {!files.length && (
              <motion.div
                layoutId="file-upload"
                transition={{ type: "spring", stiffness: 250, damping: 18 }}
                className={cn(
                  "relative flex items-center justify-center h-24 w-full mx-auto rounded-md border border-dashed border-gray-300 hover:border-blue-400 bg-gray-50"
                )}
              >
                {isDragActive ? (
                  <p className="text-gray-500 flex flex-col items-center text-xs">
                    Drop files
                    <IconUpload
                      className="h-4 w-4 mt-1 text-gray-400"
                      strokeWidth={1.5}
                    />
                  </p>
                ) : (
                  <IconUpload
                    className="h-5 w-5 text-gray-400"
                    strokeWidth={1.5}
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 30;
  const rows = 6;
  return (
    <div className="flex bg-gray-100 shrink-0 flex-wrap justify-center items-center gap-px scale-110">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-6 h-6 rounded-[2px] ${
                index % 2 === 0 ? "bg-gray-50" : "bg-gray-100 shadow-inner"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
