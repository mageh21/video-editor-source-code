'use client';

import React from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { 
    Sparkles, 
    Play, 
    Type, 
    Zap 
} from 'lucide-react';

interface AnimationStyleSelectorProps {
    caption: Caption;
    trackId: string;
}

const ANIMATION_STYLES = [
    {
        id: 'default',
        name: 'Default',
        description: 'Classic subtitle appearance',
        icon: Type,
        preview: 'Simple caption style',
        color: 'bg-gray-600'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Word-by-word highlighting with scaling',
        icon: Zap,
        preview: 'Dynamic word animation',
        color: 'bg-pink-600'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Subtle word highlighting',
        icon: Play,
        preview: 'Smooth word emphasis',
        color: 'bg-red-600'
    },
    {
        id: 'typewriter',
        name: 'Typewriter',
        description: 'Terminal-style text appearance',
        icon: Sparkles,
        preview: 'Progressive text reveal',
        color: 'bg-green-600'
    }
];

const AnimationStyleSelector: React.FC<AnimationStyleSelectorProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    
    const handleStyleChange = (animationStyle: 'default' | 'tiktok' | 'youtube' | 'typewriter') => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: { animationStyle }
        }));
    };
    
    const currentStyle = caption.animationStyle || 'default';
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Animation Style</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {ANIMATION_STYLES.map((style) => {
                    const Icon = style.icon;
                    const isSelected = currentStyle === style.id;
                    
                    return (
                        <button
                            key={style.id}
                            onClick={() => handleStyleChange(style.id as any)}
                            className={`
                                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                                ${isSelected 
                                    ? 'border-blue-500 bg-blue-900/30 shadow-lg' 
                                    : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600'
                                }
                            `}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                            )}
                            
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${style.color} flex-shrink-0`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white mb-1">
                                        {style.name}
                                    </h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        {style.description}
                                    </p>
                                    <div className="text-xs text-gray-500 italic">
                                        "{style.preview}"
                                    </div>
                                </div>
                            </div>
                            
                            {/* Style-specific preview */}
                            <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-700">
                                <div className="text-xs">
                                    {style.id === 'tiktok' && (
                                        <span>
                                            <span className="text-green-400 font-bold">WORD</span>{' '}
                                            <span className="text-gray-300">BY</span>{' '}
                                            <span className="text-gray-300">WORD</span>
                                        </span>
                                    )}
                                    {style.id === 'youtube' && (
                                        <span>
                                            <span className="text-yellow-400 bg-yellow-400/20 px-1 rounded">Word</span>{' '}
                                            <span className="text-gray-300">by word</span>
                                        </span>
                                    )}
                                    {style.id === 'typewriter' && (
                                        <span className="font-mono text-green-400">
                                            Typing effect<span className="animate-pulse">|</span>
                                        </span>
                                    )}
                                    {style.id === 'default' && (
                                        <span className="text-gray-300">
                                            Classic subtitle style
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {/* Word timing info */}
            {(currentStyle === 'tiktok' || currentStyle === 'youtube') && (
                <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="text-xs text-blue-300">
                            <p className="mb-1 font-medium">Word-by-word timing:</p>
                            <p>Words will highlight automatically based on estimated speaking pace. For precise timing, import captions with word-level timestamps.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimationStyleSelector;