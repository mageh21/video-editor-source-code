import React from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { 
    Type,
    Zap,
    Music,
    Waves,
    PenTool,
    Sparkles,
    SquareStack,
    Rainbow,
    Cpu,
    Flame,
    Droplets
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnimationStyleSelectorProps {
    caption: Caption;
    trackId: string;
}

const ANIMATION_STYLES = [
    {
        id: 'default',
        name: 'Default',
        description: 'Simple fade in/out',
        icon: Type,
        color: 'text-gray-400'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Green word highlighting',
        icon: Zap,
        color: 'text-green-400'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Golden word highlighting',
        icon: SquareStack,
        color: 'text-yellow-400'
    },
    {
        id: 'typewriter',
        name: 'Typewriter',
        description: 'Terminal-style reveal',
        icon: PenTool,
        color: 'text-green-400'
    },
    {
        id: 'karaoke',
        name: 'Karaoke',
        description: 'Words fill with color',
        icon: Music,
        color: 'text-purple-400'
    },
    {
        id: 'bounce',
        name: 'Bounce',
        description: 'Words bounce in',
        icon: Sparkles,
        color: 'text-pink-400'
    },
    {
        id: 'wave',
        name: 'Wave',
        description: 'Ocean wave motion',
        icon: Waves,
        color: 'text-blue-400'
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        description: 'Colorful wave animation',
        icon: Rainbow,
        color: 'text-pink-400'
    },
    {
        id: 'glitch',
        name: 'Glitch',
        description: 'Digital distortion effect',
        icon: Cpu,
        color: 'text-cyan-400'
    },
    {
        id: 'fire',
        name: 'Fire',
        description: 'Burning flame effect',
        icon: Flame,
        color: 'text-orange-400'
    },
    {
        id: 'liquid',
        name: 'Liquid Ripple',
        description: 'Water-like ripple animation',
        icon: Droplets,
        color: 'text-blue-400'
    }
];

const AnimationStyleSelector: React.FC<AnimationStyleSelectorProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const currentStyle = caption.animationStyle || 'default';

    const handleStyleChange = (styleId: string) => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                animationStyle: styleId as any
            }
        }));
        
        const styleName = ANIMATION_STYLES.find(s => s.id === styleId)?.name || styleId;
        toast.success(`Animation style changed to ${styleName}`);
    };

    return (
        <div className="space-y-2">
            {ANIMATION_STYLES.map((style) => {
                const Icon = style.icon;
                const isSelected = currentStyle === style.id;
                
                return (
                    <button
                        key={style.id}
                        onClick={() => handleStyleChange(style.id)}
                        className={`
                            w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                            ${isSelected 
                                ? 'bg-gray-700 border-blue-500' 
                                : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                            }
                        `}
                    >
                        <Icon className={`w-5 h-5 ${style.color}`} />
                        <div className="flex-1 text-left">
                            <div className="font-medium text-white text-sm">
                                {style.name}
                            </div>
                            <div className="text-xs text-gray-400">
                                {style.description}
                            </div>
                        </div>
                        {isSelected && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                    </button>
                );
            })}
            
            {/* Preview hint */}
            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
                <p>💡 Tip: Play the video to see the animation in action. Different styles work better for different types of content.</p>
            </div>
        </div>
    );
};

export default AnimationStyleSelector;