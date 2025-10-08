"use client";

import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import { categorizeFile } from "../../../../utils/utils";
import { useTimelinePositioning } from "../../../../hooks/useTimelinePositioning";
import { getMediaDuration } from "../../../../utils/mediaUtils";
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function AddMedia({ fileId }: { fileId: string }) {
    const { mediaFiles, resolution } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const { findNextAvailablePosition } = useTimelinePositioning();

    const handleFileChange = async () => {
        const updatedMedia = [...mediaFiles];

        const file = await getFile(fileId);
        const mediaId = crypto.randomUUID();

        if (fileId) {
            // Get the actual duration of the media file
            const actualDuration = await getMediaDuration(file);
            
            // Use the smart positioning system to find the best position
            const position = findNextAvailablePosition(actualDuration);

            updatedMedia.push({
                id: mediaId,
                fileName: file.name,
                fileId: fileId,
                startTime: 0,
                endTime: actualDuration,
                // For new media, original bounds are the same as current bounds
                originalStartTime: 0,
                originalEndTime: actualDuration,
                src: URL.createObjectURL(file),
                positionStart: position.from,
                positionEnd: position.from + actualDuration,
                includeInMerge: true,
                row: position.row, // Add to the determined row
                // Set default position and size for selection system
                x: 0,
                y: 0,
                width: resolution.width,
                height: resolution.height,
                rotation: 0,
                opacity: 100,
                playbackSpeed: 1,
                volume: 100,
                type: categorizeFile(file.type),
                zIndex: 0,
            });
        }
        dispatch(setMediaFiles(updatedMedia));
        toast.success('Media added successfully.');
    };

    return (
        <button
            onClick={handleFileChange}
            className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center text-white flex-shrink-0"
            title="Add to timeline"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
        </button>
    );
}
