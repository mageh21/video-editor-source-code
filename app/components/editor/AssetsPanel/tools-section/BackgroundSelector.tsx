'use client'
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setMediaFiles } from '@/app/store/slices/projectSlice';
import { nanoid } from 'nanoid';
import { Image as ImageIcon, Video, Palette } from 'lucide-react';

const BACKGROUND_COLORS = [
    { name: 'Black', color: '#000000' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Gray', color: '#808080' },
    { name: 'Blue', color: '#0066CC' },
    { name: 'Green', color: '#00CC66' },
    { name: 'Red', color: '#CC0000' },
    { name: 'Purple', color: '#6600CC' },
    { name: 'Orange', color: '#FF6600' }
];

export default function BackgroundSelector() {
    const dispatch = useAppDispatch();
    const { mediaFiles, duration } = useAppSelector(state => state.projectState);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [customColor, setCustomColor] = useState('#000000');

    const addColorBackground = (color: string) => {
        // Create a solid color background
        const backgroundMedia = {
            id: nanoid(),
            fileName: `Background (${color})`,
            fileId: nanoid(),
            type: 'image' as const,
            mimeType: 'background/color',
            startTime: 0,
            endTime: duration,
            positionStart: 0,
            positionEnd: duration,
            includeInMerge: true,
            playbackSpeed: 1,
            volume: 100,
            zIndex: -1000, // Behind everything
            row: 0,
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            rotation: 0,
            opacity: 100,
            backgroundColor: color // Store color for rendering
        };

        // Add as first element (background)
        const updatedMediaFiles = [backgroundMedia, ...mediaFiles];
        dispatch(setMediaFiles(updatedMediaFiles));
    };

    const handleFileBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Store file and create background media
            const fileId = nanoid();
            // Note: You'd need to implement file storage here
            // await storeFile(fileId, file);

            const backgroundMedia = {
                id: nanoid(),
                fileName: `Background (${file.name})`,
                fileId,
                type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                mimeType: file.type,
                startTime: 0,
                endTime: duration,
                positionStart: 0,
                positionEnd: duration,
                includeInMerge: true,
                playbackSpeed: 1,
                volume: 100,
                zIndex: -1000, // Behind everything
                row: 0,
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                rotation: 0,
                opacity: 100
            };

            const updatedMediaFiles = [backgroundMedia, ...mediaFiles];
            dispatch(setMediaFiles(updatedMediaFiles));
        } catch (error) {
            console.error('Failed to add background:', error);
        }

        e.target.value = ''; // Reset input
    };

    const removeBackground = () => {
        // Remove any media with zIndex < 0 (backgrounds)
        const updatedMediaFiles = mediaFiles.filter((media: any) => (media.zIndex || 0) >= 0);
        dispatch(setMediaFiles(updatedMediaFiles));
    };

    const hasBackground = mediaFiles.some((media: any) => (media.zIndex || 0) < 0);

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Background</h3>
            
            {hasBackground && (
                <div className="mb-4">
                    <button
                        onClick={removeBackground}
                        className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Remove Background
                    </button>
                </div>
            )}

            {/* Color Backgrounds */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Solid Colors</h4>
                <div className="grid grid-cols-4 gap-2">
                    {BACKGROUND_COLORS.map((bg) => (
                        <button
                            key={bg.color}
                            onClick={() => addColorBackground(bg.color)}
                            className="aspect-square rounded-lg border-2 border-gray-600 hover:border-white transition-colors"
                            style={{ backgroundColor: bg.color }}
                            title={bg.name}
                        />
                    ))}
                </div>
                
                {/* Custom Color */}
                <div className="mt-2">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm w-full"
                    >
                        <Palette className="w-4 h-4" />
                        Custom Color
                    </button>
                    
                    {showColorPicker && (
                        <div className="mt-2 flex gap-2">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-12 h-8 rounded border border-gray-600"
                            />
                            <button
                                onClick={() => {
                                    addColorBackground(customColor);
                                    setShowColorPicker(false);
                                }}
                                className="flex-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* File Backgrounds */}
            <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Image/Video Background</h4>
                <label className="block">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileBackground}
                        className="hidden"
                    />
                    <div className="flex items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white cursor-pointer transition-colors">
                        <ImageIcon className="w-4 h-4" />
                        <Video className="w-4 h-4" />
                        <span className="text-sm">Upload Background</span>
                    </div>
                </label>
            </div>

            <div className="mt-4 text-xs text-gray-400">
                <p>• Backgrounds appear behind all other content</p>
                <p>• Use solid colors for transparent video export</p>
                <p>• Upload images or videos for custom backgrounds</p>
            </div>
        </div>
    );
}