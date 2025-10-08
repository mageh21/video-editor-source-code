"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Film, Music, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { MediaFile, UploadedFile } from '@/app/types';
import { useAppDispatch, useAppSelector, getFile } from '@/app/store';
import { setMediaFiles } from '@/app/store/slices/projectSlice';
import { categorizeFile } from '@/app/utils/utils';
import { useTimelinePositioning } from '@/app/hooks/useTimelinePositioning';
import { calculateVideoPosition, shouldUseCustomPositioning } from '@/app/utils/videoPositioning';
import toast from 'react-hot-toast';

interface MediaItemProps {
    uploadedFile: UploadedFile;
    onDelete: (id: string) => void;
}

export default function MediaItemWithThumbnail({ uploadedFile, onDelete }: MediaItemProps) {
    const dispatch = useAppDispatch();
    const { mediaFiles, resolution } = useAppSelector((state) => state.projectState);
    const { findNextAvailablePosition } = useTimelinePositioning();
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(30);
    const [isDragging, setIsDragging] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Generate thumbnail for the media
    useEffect(() => {
        const generateThumbnail = async () => {
            try {
                const file = await getFile(uploadedFile.id);
                const url = URL.createObjectURL(file);
                const type = categorizeFile(file.type);

                if (type === 'video') {
                    // Generate video thumbnail
                    const video = document.createElement('video');
                    video.src = url;
                    video.crossOrigin = 'anonymous';
                    
                    video.addEventListener('loadedmetadata', () => {
                        video.currentTime = Math.min(1, video.duration / 2);
                        setDuration(video.duration);
                    });

                    video.addEventListener('seeked', () => {
                        const canvas = document.createElement('canvas');
                        // Use higher resolution for better quality
                        const maxSize = 320;
                        const aspectRatio = video.videoWidth / video.videoHeight;
                        
                        if (aspectRatio > 1) {
                            // Landscape
                            canvas.width = maxSize;
                            canvas.height = maxSize / aspectRatio;
                        } else {
                            // Portrait or square
                            canvas.height = maxSize;
                            canvas.width = maxSize * aspectRatio;
                        }
                        
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            // Better quality settings
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
                        }
                        URL.revokeObjectURL(url);
                    });

                    video.load();
                } else if (type === 'image') {
                    // Use image directly as thumbnail
                    setThumbnail(url);
                    setDuration(10); // Default 10 seconds for images
                } else if (type === 'audio') {
                    // For audio, just get duration
                    const audio = new Audio(url);
                    audio.addEventListener('loadedmetadata', () => {
                        setDuration(audio.duration);
                        URL.revokeObjectURL(url);
                    });
                }
            } catch (error) {
                console.error('Error generating thumbnail:', error);
            }
        };

        generateThumbnail();
    }, [uploadedFile.id]);

    const handleAddToTimeline = async () => {
        const file = await getFile(uploadedFile.id);
        const mediaId = crypto.randomUUID();
        const position = findNextAvailablePosition(duration);
        const mediaType = categorizeFile(file.type);

        // Calculate positioning for videos to prevent overlap
        let videoPosition = {};
        if (mediaType === 'video' && shouldUseCustomPositioning(
            position.row,
            mediaFiles,
            position.from,
            position.from + duration
        )) {
            videoPosition = calculateVideoPosition(
                position.row,
                mediaFiles,
                position.from,
                position.from + duration,
                resolution.width,
                resolution.height
            );
        }

        const newMedia: MediaFile = {
            id: mediaId,
            fileName: file.name,
            fileId: uploadedFile.id,
            startTime: 0,
            endTime: duration,
            // For new media, original bounds are the same as current bounds
            originalStartTime: 0,
            originalEndTime: duration,
            src: URL.createObjectURL(file),
            positionStart: position.from,
            positionEnd: position.from + duration,
            includeInMerge: true,
            row: position.row,
            rotation: 0,
            opacity: 100,
            playbackSpeed: 1,
            volume: 100,
            type: mediaType,
            zIndex: mediaFiles.filter((m: any) => m.row === position.row).length,
            // Set default position and size for selection system
            x: 0,
            y: 0,
            width: resolution.width,
            height: resolution.height,
            ...videoPosition // Apply calculated position if needed
        };

        dispatch(setMediaFiles([...mediaFiles, newMedia]));
        toast.success('Media added to timeline');
    };

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('mediaFileId', uploadedFile.id);
        e.dataTransfer.setData('duration', duration.toString());
        e.dataTransfer.setData('fileName', uploadedFile.file.name);
        e.dataTransfer.setData('fileType', uploadedFile.file.type);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const getMediaIcon = () => {
        const type = categorizeFile(uploadedFile.file.type);
        switch (type) {
            case 'video':
                return <Film className="w-8 h-8 text-blue-400" />;
            case 'audio':
                return <Music className="w-8 h-8 text-orange-400" />;
            case 'image':
                return <ImageIcon className="w-8 h-8 text-emerald-400" />;
            default:
                return <Film className="w-8 h-8 text-gray-400" />;
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const mediaType = categorizeFile(uploadedFile.file.type);

    return (
        <div
            className={`group relative rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-700 transition-all cursor-move ${
                isDragging ? 'opacity-50 scale-95' : ''
            }`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {/* Thumbnail */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800" style={{ paddingBottom: '56.25%' }}>
                {/* Subtle pattern background */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)`,
                    }} />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center p-2">
                    {thumbnail ? (
                        <img 
                            src={thumbnail} 
                            alt={uploadedFile.file.name}
                            className="max-w-full max-h-full object-contain rounded shadow-lg"
                        />
                    ) : (
                        <div className="flex items-center justify-center">
                            {getMediaIcon()}
                        </div>
                    )}
                </div>
                
                {/* Duration badge */}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(duration)}
                </div>

                {/* Type badge */}
                <div className="absolute top-1 left-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded capitalize">
                    {mediaType}
                </div>
            </div>

            {/* Info */}
            <div className="p-2">
                <p className="text-xs text-white truncate font-medium" title={uploadedFile.file.name}>
                    {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                    onClick={handleAddToTimeline}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded shadow-lg transition-colors"
                    title="Add to timeline"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(uploadedFile.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded shadow-lg transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}