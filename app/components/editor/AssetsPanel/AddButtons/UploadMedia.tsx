"use client";

import { useAppDispatch, useAppSelector } from "../../../../store";
import { setFilesID } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddMedia() {
    const { filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;

        try {
            const updatedFilesID = [...filesID || []];

            for (const file of newFiles) {
                // Store the file only - don't add to timeline
                const fileId = crypto.randomUUID();
                await storeFile(file, fileId);
                updatedFilesID.push(fileId);
            }

            // Update only filesID, not mediaFiles
            dispatch(setFilesID(updatedFilesID));
            
            toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload files');
        }

        e.target.value = "";
    };

    return (
        <div className="w-full">
            <label
                htmlFor="file-upload"
                className="cursor-pointer w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors flex flex-row gap-2 items-center justify-center text-gray-300 font-medium text-sm rounded-lg py-2.5 px-4"
            >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
            </label>
            <input
                type="file"
                accept="video/*,audio/*,image/*,.gif,.webp,.apng"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
        </div>
    );
}