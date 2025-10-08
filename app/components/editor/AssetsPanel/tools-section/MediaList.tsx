"use client";

import { listFiles, deleteFile, useAppSelector, storeFile, getFile } from '@/app/store';
import { setMediaFiles, setFilesID } from '@/app/store/slices/projectSlice';
import { MediaFile, UploadedFile } from '@/app/types';
import { useAppDispatch } from '@/app/store';
import MediaItemWithThumbnail from '../MediaItemWithThumbnail';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
export default function MediaList() {
    const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [files, setFiles] = useState<UploadedFile[]>([]);

    useEffect(() => {
        let mounted = true;

        const fetchFiles = async () => {
            try {
                const storedFilesArray: UploadedFile[] = [];

                for (const fileId of filesID || []) {
                    const file = await getFile(fileId);
                    if (file && mounted) {
                        storedFilesArray.push({
                            file: file,
                            id: fileId,
                        });
                    }
                }

                if (mounted) {
                    setFiles(storedFilesArray);
                }
            } catch (error) {
                toast.error("Error fetching files");
                console.error("Error fetching files:", error);
            }
        };

        fetchFiles();

        // Cleanup
        return () => {
            mounted = false;
        };
    }, [filesID]);

    const onDeleteMedia = async (id: string) => {
        const onUpdateMedia = mediaFiles.filter((mediaFile: MediaFile) => mediaFile.fileId !== id);
        dispatch(setMediaFiles(onUpdateMedia));
        dispatch(setFilesID(filesID?.filter((fileId: string) => fileId !== id) || []));
        await deleteFile(id);
    };

    return (
        <>
            {files.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-gray-300 text-sm font-medium mb-1">No media uploaded yet</p>
                    <p className="text-gray-400 text-xs">Click upload to add files</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {files.map((mediaFile) => (
                        <MediaItemWithThumbnail
                            key={mediaFile.id}
                            uploadedFile={mediaFile}
                            onDelete={onDeleteMedia}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
