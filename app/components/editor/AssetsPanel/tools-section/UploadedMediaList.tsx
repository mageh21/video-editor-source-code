"use client";

import { useAppSelector, getFile } from '@/app/store';
import { setMediaFiles, setFilesID } from '@/app/store/slices/projectSlice';
import { deleteFile } from '@/app/store';
import { useAppDispatch } from '@/app/store';
import { useEffect, useState } from 'react';
import { UploadedFile } from '@/app/types';
import MediaItemWithThumbnail from '../MediaItemWithThumbnail';
import toast from 'react-hot-toast';

export default function UploadedMediaList() {
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

        return () => {
            mounted = false;
        };
    }, [filesID]);

    const onDeleteFile = async (id: string) => {
        // Remove from filesID
        dispatch(setFilesID(filesID?.filter(f => f !== id) || []));
        
        // Remove from timeline if exists
        const onUpdateMedia = mediaFiles.filter(f => f.fileId !== id);
        dispatch(setMediaFiles(onUpdateMedia));
        
        // Delete from storage
        await deleteFile(id);
        toast.success('File deleted');
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            {files.map((mediaFile) => (
                <MediaItemWithThumbnail
                    key={mediaFile.id}
                    uploadedFile={mediaFile}
                    onDelete={onDeleteFile}
                />
            ))}
        </div>
    );
}