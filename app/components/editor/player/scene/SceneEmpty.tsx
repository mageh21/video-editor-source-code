"use client";

import { Upload } from "lucide-react";

export default function SceneEmpty() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
          <Upload className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          No media added yet
        </h3>
        <p className="text-gray-400 max-w-sm mx-auto">
          Drag and drop media files here or use the upload button in the sidebar
        </p>
      </div>
    </div>
  );
}