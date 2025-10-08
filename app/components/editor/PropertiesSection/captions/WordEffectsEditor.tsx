import React, { useState } from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption, WordEffect } from '@/app/types';
import { 
    Palette, 
    Sparkles, 
    Zap, 
    CircleDot,
    Brush,
    Plus,
    X,
    Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WordEffectsEditorProps {
    caption: Caption;
    trackId: string;
}

const EFFECT_TYPES = [
    {
        id: 'color',
        name: 'Color',
        icon: Palette,
        description: 'Custom word color'
    },
    {
        id: 'shake',
        name: 'Shake',
        icon: Zap,
        description: 'Vibration effect'
    },
    {
        id: 'glow',
        name: 'Glow',
        icon: Sparkles,
        description: 'Glowing aura'
    },
    {
        id: 'shadow',
        name: 'Shadow',
        icon: CircleDot,
        description: 'Drop shadow'
    },
    {
        id: 'gradient',
        name: 'Gradient',
        icon: Brush,
        description: 'Color gradient'
    }
];

const DEFAULT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF5252', '#536DFE', '#FF4081', '#E91E63', '#9C27B0',
    '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688'
];

const WordEffectsEditor: React.FC<WordEffectsEditorProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const words = caption.text.split(' ');
    const [selectedWords, setSelectedWords] = useState<number[]>([]);
    const [selectedEffect, setSelectedEffect] = useState<string>('color');
    const [effectConfig, setEffectConfig] = useState<WordEffect['config']>({
        color: '#FF6B6B',
        intensity: 50,
        shadowColor: '#000000',
        shadowBlur: 5,
        secondaryColor: '#4ECDC4',
        direction: 'horizontal'
    });
    const [showConfig, setShowConfig] = useState(false);

    const currentEffects = caption.wordEffects || [];

    const handleWordClick = (index: number) => {
        if (selectedWords.includes(index)) {
            setSelectedWords(selectedWords.filter(i => i !== index));
        } else {
            setSelectedWords([...selectedWords, index]);
        }
    };

    const handleApplyEffect = () => {
        if (selectedWords.length === 0) {
            toast.error('Please select words to apply effect');
            return;
        }

        const newEffects: WordEffect[] = [
            ...currentEffects.filter(e => !selectedWords.includes(e.wordIndex)),
            ...selectedWords.map(index => ({
                wordIndex: index,
                type: selectedEffect as WordEffect['type'],
                config: { ...effectConfig }
            }))
        ];

        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                wordEffects: newEffects
            }
        }));

        setSelectedWords([]);
        toast.success(`${selectedEffect} effect applied`);
    };

    const handleRemoveEffect = (wordIndex: number) => {
        const newEffects = currentEffects.filter(e => e.wordIndex !== wordIndex);
        
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                wordEffects: newEffects
            }
        }));
        
        toast.success('Effect removed');
    };

    const handleClearAll = () => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                wordEffects: []
            }
        }));
        
        toast.success('All effects cleared');
    };

    const renderEffectConfig = () => {
        switch (selectedEffect) {
            case 'color':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={effectConfig.color || '#FF6B6B'}
                                    onChange={(e) => setEffectConfig({ ...effectConfig, color: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {DEFAULT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEffectConfig({ ...effectConfig, color })}
                                            className="w-6 h-6 rounded transition-transform hover:scale-110"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'shake':
                return (
                    <div>
                        <label className="text-xs text-gray-400 block mb-2">Intensity</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={effectConfig.intensity || 50}
                            onChange={(e) => setEffectConfig({ ...effectConfig, intensity: Number(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Subtle</span>
                            <span>{effectConfig.intensity}%</span>
                            <span>Intense</span>
                        </div>
                    </div>
                );
            
            case 'glow':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Glow Color</label>
                            <input
                                type="color"
                                value={effectConfig.color || '#FF6B6B'}
                                onChange={(e) => setEffectConfig({ ...effectConfig, color: e.target.value })}
                                className="w-full h-10 rounded cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Intensity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={effectConfig.intensity || 50}
                                onChange={(e) => setEffectConfig({ ...effectConfig, intensity: Number(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    </div>
                );
            
            case 'shadow':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Shadow Color</label>
                            <input
                                type="color"
                                value={effectConfig.shadowColor || '#000000'}
                                onChange={(e) => setEffectConfig({ ...effectConfig, shadowColor: e.target.value })}
                                className="w-full h-10 rounded cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Blur</label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={effectConfig.shadowBlur || 5}
                                onChange={(e) => setEffectConfig({ ...effectConfig, shadowBlur: Number(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    </div>
                );
            
            case 'gradient':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-400 block mb-2">Start Color</label>
                                <input
                                    type="color"
                                    value={effectConfig.color || '#FF6B6B'}
                                    onChange={(e) => setEffectConfig({ ...effectConfig, color: e.target.value })}
                                    className="w-full h-10 rounded cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-2">End Color</label>
                                <input
                                    type="color"
                                    value={effectConfig.secondaryColor || '#4ECDC4'}
                                    onChange={(e) => setEffectConfig({ ...effectConfig, secondaryColor: e.target.value })}
                                    className="w-full h-10 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Direction</label>
                            <select
                                value={effectConfig.direction || 'horizontal'}
                                onChange={(e) => setEffectConfig({ ...effectConfig, direction: e.target.value as any })}
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                            >
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                                <option value="radial">Radial</option>
                            </select>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="space-y-3">
            {/* Word selection */}
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Select words for effects
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-lg">
                    {words.map((word, index) => {
                        const existingEffect = currentEffects.find(e => e.wordIndex === index);
                        const isSelected = selectedWords.includes(index);
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleWordClick(index)}
                                className={`
                                    px-2 py-1 rounded text-sm transition-all relative
                                    ${existingEffect 
                                        ? 'ring-2 ring-offset-2 ring-offset-gray-800' 
                                        : ''
                                    }
                                    ${isSelected 
                                        ? 'bg-blue-600 text-white' 
                                        : existingEffect
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }
                                `}
                                style={existingEffect && existingEffect.type === 'color' ? {
                                    color: existingEffect.config.color
                                } as any : undefined}
                            >
                                {word}
                                {existingEffect && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveEffect(index);
                                        }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Effect type selection */}
            {selectedWords.length > 0 && (
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Choose effect type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {EFFECT_TYPES.map(effect => {
                            const Icon = effect.icon;
                            return (
                                <button
                                    key={effect.id}
                                    onClick={() => setSelectedEffect(effect.id)}
                                    className={`
                                        p-2 rounded-lg border flex items-center gap-2 transition-all
                                        ${selectedEffect === effect.id 
                                            ? 'bg-gray-700 border-blue-500' 
                                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <div className="text-left flex-1">
                                        <div className="text-sm font-medium">{effect.name}</div>
                                        <div className="text-xs text-gray-400">{effect.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Effect configuration */}
            {selectedWords.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="w-full flex items-center justify-between p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                    >
                        <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configure Effect
                        </span>
                        <span className="text-xs text-gray-400">
                            {showConfig ? 'Hide' : 'Show'}
                        </span>
                    </button>
                    
                    {showConfig && (
                        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                            {renderEffectConfig()}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
                {selectedWords.length > 0 && (
                    <button
                        onClick={handleApplyEffect}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Apply Effect
                    </button>
                )}
                
                {currentEffects.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
                <p>Apply special effects to individual words for dynamic, eye-catching captions!</p>
            </div>
        </div>
    );
};

export default WordEffectsEditor;