import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setFilesID, setMediaFiles } from '@/app/store/slices/projectSlice';
import { storeFile } from '@/app/store';
import { categorizeFile } from '@/app/utils/utils';
import { getMediaDuration } from '@/app/utils/mediaUtils';
import { useTimelinePositioning } from '@/app/hooks/useTimelinePositioning';
import PlayerCanvas from './player/PlayerCanvas';
import toast from 'react-hot-toast';

const PreviewArea: React.FC = () => {
    const { mediaFiles, textElements, instagramConversations, whatsappConversations, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const { findNextAvailablePosition } = useTimelinePositioning();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasContent = mediaFiles.length > 0 || textElements.length > 0 || instagramConversations.length > 0 || whatsappConversations.length > 0;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!hasContent) {
        return (
            <div className="flex-1 bg-black flex items-center justify-center">
                <div className="text-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*,audio/*,image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-4 mx-auto hover:bg-gray-700 transition-colors"
                    >
                        <Plus className="w-8 h-8 text-gray-400" />
                    </button>
                    <p className="text-gray-400 text-sm">Click to upload</p>
                    <p className="text-gray-500 text-xs mt-1">Or drag media from the sidebar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-black">
            <PlayerCanvas />
        </div>
    );
};

export default PreviewArea;