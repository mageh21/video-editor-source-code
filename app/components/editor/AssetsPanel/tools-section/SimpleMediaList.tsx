"use client";

import { useAppSelector } from '@/app/store';
import { setMediaFiles } from '@/app/store/slices/projectSlice';
import { useAppDispatch } from '@/app/store';
import { Trash2, Film, Music, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SimpleMediaList() {
    const { mediaFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const onDeleteMedia = async (id: string) => {
        const updatedMedia = mediaFiles.filter(f => f.id !== id);
        dispatch(setMediaFiles(updatedMedia));
        toast.success('Media removed from timeline');
    };

    const getMediaIcon = (type: string) => {
        switch(type) {
            case 'video':
                return <Film className="w-4 h-4" />;
            case 'audio':
                return <Music className="w-4 h-4" />;
            case 'image':
                return <ImageIcon className="w-4 h-4" />;
            default:
                return <Film className="w-4 h-4" />;
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-2">
            {mediaFiles.map((media) => (
                <div 
                    key={media.id} 
                    className="group relative p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                    <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                            {getMediaIcon(media.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate" title={media.fileName}>
                                {media.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatDuration(media.positionEnd - media.positionStart)} • Track {media.row + 1}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMedia(media.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-2"
                            title="Remove from timeline"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}