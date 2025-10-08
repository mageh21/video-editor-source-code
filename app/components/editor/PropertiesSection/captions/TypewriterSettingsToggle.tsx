import React from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { Monitor, Square } from 'lucide-react';
import toast from 'react-hot-toast';

interface TypewriterSettingsToggleProps {
    caption: Caption;
    trackId: string;
}

const TypewriterSettingsToggle: React.FC<TypewriterSettingsToggleProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const isTransparent = caption.typewriterTransparent ?? false;

    const handleToggle = () => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                typewriterTransparent: !isTransparent
            }
        }));
        
        toast.success(`Typewriter background ${!isTransparent ? 'transparent' : 'terminal style'}`);
    };

    // Only show this toggle if typewriter animation is selected
    if (caption.animationStyle !== 'typewriter') {
        return null;
    }

    return (
        <div className="p-3 bg-gray-800 rounded-lg mt-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-green-400" />
                    <div>
                        <h4 className="text-sm font-medium text-white">Typewriter Background</h4>
                        <p className="text-xs text-gray-400">
                            {isTransparent ? 'Transparent background' : 'Terminal-style background'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors focus:outline-none focus:ring-2 focus:ring-green-500
                        ${isTransparent ? 'bg-gray-600' : 'bg-green-600'}
                    `}
                    title={isTransparent ? 'Switch to terminal background' : 'Switch to transparent background'}
                >
                    <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white
                            transition-transform
                            ${isTransparent ? 'translate-x-1' : 'translate-x-6'}
                        `}
                    />
                </button>
            </div>
            
            <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs">
                {isTransparent ? (
                    <div className="flex items-center gap-2">
                        <Square className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400">
                            Text appears with no background
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-black border border-gray-600 rounded-sm" />
                        <span className="text-gray-400">
                            Classic terminal look with black background
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TypewriterSettingsToggle;