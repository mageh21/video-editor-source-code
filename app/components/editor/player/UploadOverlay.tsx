"use client"

import { useAppSelector, useAppDispatch } from "@/app/store";
import { setFilesID } from "@/app/store/slices/projectSlice";
import { storeFile } from "@/app/store";
import { useState } from "react";
import { Upload } from "lucide-react";

interface UploadOverlayProps {
  onUpload?: () => void;
}

export default function UploadOverlay({ onUpload }: UploadOverlayProps) {
  const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const updatedFiles = [...filesID || []];
    
    for (const file of newFiles) {
      const fileId = crypto.randomUUID();
      await storeFile(file, fileId);
      updatedFiles.push(fileId);
    }
    
    dispatch(setFilesID(updatedFiles));
    onUpload?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Don't show overlay if there are media files
  if (mediaFiles && mediaFiles.length > 0) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 rounded-xl ${
        isDragOver 
          ? 'bg-blue-500/20 border-2 border-blue-400 border-dashed' 
          : 'bg-gray-900/80 backdrop-blur-sm'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="text-center p-8">
        <label
          htmlFor="player-file-upload"
          className={`cursor-pointer group block transition-all duration-300 ${
            isDragOver ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
            isDragOver 
              ? 'bg-blue-600 text-white shadow-blue-500/25' 
              : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300 group-hover:shadow-xl'
          }`}>
            <Upload className="w-10 h-10" />
          </div>
          <p className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDragOver ? 'text-blue-400' : 'text-gray-200 group-hover:text-white'
          }`}>
            {isDragOver ? 'Drop to upload' : 'Click to upload'}
          </p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
            Or drag media from the sidebar to get started
          </p>
          <div className="mt-6 text-xs text-gray-500">
            Supports MP4, WebM, MP3, WAV, JPG, PNG
          </div>
        </label>
        
        <input
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="player-file-upload"
        />
      </div>
    </div>
  );
}