'use client'
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setMediaFiles } from '@/app/store/slices/projectSlice';
import { nanoid } from 'nanoid';
import { Sparkles, Smile, Heart, Star, ThumbsUp, Zap } from 'lucide-react';

interface StickerCategory {
    name: string;
    icon: React.ReactNode;
    stickers: {
        name: string;
        url: string;
        type: 'gif' | 'apng' | 'webp';
        hasAlpha?: boolean;
    }[];
}

// Demo sticker library - in production, these would come from a CDN or asset library
const STICKER_LIBRARY: StickerCategory[] = [
    {
        name: 'Emojis',
        icon: <Smile className="w-4 h-4" />,
        stickers: [
            { name: 'Laughing', url: '/stickers/laughing.gif', type: 'gif', hasAlpha: true },
            { name: 'Heart', url: '/stickers/heart.apng', type: 'apng', hasAlpha: true },
            { name: 'Thumbs Up', url: '/stickers/thumbsup.gif', type: 'gif', hasAlpha: true },
            { name: 'Fire', url: '/stickers/fire.webp', type: 'webp', hasAlpha: true },
        ]
    },
    {
        name: 'Effects',
        icon: <Sparkles className="w-4 h-4" />,
        stickers: [
            { name: 'Sparkle', url: '/stickers/sparkle.apng', type: 'apng', hasAlpha: true },
            { name: 'Confetti', url: '/stickers/confetti.gif', type: 'gif', hasAlpha: true },
            { name: 'Stars', url: '/stickers/stars.webp', type: 'webp', hasAlpha: true },
            { name: 'Explosion', url: '/stickers/explosion.gif', type: 'gif', hasAlpha: true },
        ]
    },
    {
        name: 'Reactions',
        icon: <Heart className="w-4 h-4" />,
        stickers: [
            { name: 'Love', url: '/stickers/love.gif', type: 'gif', hasAlpha: true },
            { name: 'Wow', url: '/stickers/wow.apng', type: 'apng', hasAlpha: true },
            { name: 'Sad', url: '/stickers/sad.gif', type: 'gif', hasAlpha: true },
            { name: 'Angry', url: '/stickers/angry.webp', type: 'webp', hasAlpha: true },
        ]
    }
];

export default function StickerLibrary() {
    const dispatch = useAppDispatch();
    const mediaFiles = useAppSelector(state => state.projectState.mediaFiles);
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [loading, setLoading] = useState<string | null>(null);

    const addSticker = async (sticker: typeof STICKER_LIBRARY[0]['stickers'][0]) => {
        setLoading(sticker.name);
        
        try {
            // Fetch the sticker file
            const response = await fetch(sticker.url);
            const blob = await response.blob();
            const file = new File([blob], `${sticker.name}.${sticker.type}`, {
                type: sticker.type === 'gif' ? 'image/gif' : 
                      sticker.type === 'apng' ? 'image/apng' : 
                      'image/webp'
            });

            // Create file ID for storage
            const fileId = nanoid();
            
            // Store in IndexedDB (you'd implement this based on your storage system)
            // await storeFile(fileId, file);

            // Add to timeline
            const mediaFile = {
                id: nanoid(),
                fileName: sticker.name,
                fileId,
                type: 'image' as const,
                mimeType: file.type,
                startTime: 0,
                endTime: 5, // Default 5 second duration for stickers
                positionStart: 0, // Will be positioned at current playhead
                positionEnd: 5,
                includeInMerge: true,
                playbackSpeed: 1,
                volume: 100,
                zIndex: 100, // Stickers on top
                row: 0,
                width: 200, // Default size
                height: 200,
                x: 100,
                y: 100,
                opacity: 100,
                loop: true, // Enable looping for stickers
                chromaKeyEnabled: false,
                effects: {}
            };

            dispatch(setMediaFiles([...mediaFiles, mediaFile]));
            setLoading(null);
        } catch (error) {
            console.error('Failed to add sticker:', error);
            setLoading(null);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Stickers & GIFs</h3>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-700">
                {STICKER_LIBRARY.map((category, index) => (
                    <button
                        key={category.name}
                        onClick={() => setSelectedCategory(index)}
                        className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                            selectedCategory === index 
                                ? 'text-blue-400 border-b-2 border-blue-400' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {category.icon}
                        <span className="text-sm">{category.name}</span>
                    </button>
                ))}
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-4 gap-2">
                {STICKER_LIBRARY[selectedCategory].stickers.map((sticker) => (
                    <button
                        key={sticker.name}
                        onClick={() => addSticker(sticker)}
                        disabled={loading === sticker.name}
                        className="relative group bg-gray-800 rounded-lg p-2 hover:bg-gray-700 transition-colors aspect-square flex items-center justify-center"
                    >
                        {loading === sticker.name ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                            <>
                                {/* Placeholder for sticker preview */}
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    {sticker.type === 'gif' && <span className="text-xs">GIF</span>}
                                    {sticker.type === 'apng' && <span className="text-xs">APNG</span>}
                                    {sticker.type === 'webp' && <span className="text-xs">WebP</span>}
                                </div>
                                
                                {/* Sticker name on hover */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {sticker.name}
                                </div>
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* Info */}
            <div className="mt-4 text-xs text-gray-400">
                <p>Click to add stickers to your timeline</p>
                <p>Supports GIF, APNG, and WebP animations</p>
            </div>
        </div>
    );
}