import React from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { Smile } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmojiToggleProps {
    caption: Caption;
    trackId: string;
}

const EmojiToggle: React.FC<EmojiToggleProps> = ({ caption, trackId }) => {
    const dispatch = useAppDispatch();
    const isEnabled = caption.enableEmojis ?? true;

    const handleToggle = () => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                enableEmojis: !isEnabled
            }
        }));
        
        toast.success(`Emoji rendering ${!isEnabled ? 'enabled' : 'disabled'}`);
    };

    return (
        <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Smile className="w-5 h-5 text-yellow-400" />
                    <div>
                        <h4 className="text-sm font-medium text-white">Emoji Support</h4>
                        <p className="text-xs text-gray-400">Render emojis with better styling</p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'}
                    `}
                >
                    <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white
                            transition-transform
                            ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>
            
            {isEnabled && (
                <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-400">
                    <p>😊 Emojis will be rendered with proper sizing and alignment</p>
                </div>
            )}
        </div>
    );
};

export default EmojiToggle;