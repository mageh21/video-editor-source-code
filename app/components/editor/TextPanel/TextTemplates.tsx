import React from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { TextElement } from '@/app/types';
import { setTextElements, setVisibleRows, setSelectedTextIds, setActiveElement } from '@/app/store/slices/projectSlice';
import { findAvailableRow } from '@/app/utils/timelineUtils';
import { DEFAULT_FONT, FONTS } from '@/app/data/fonts';

interface TextTemplate {
    id: string;
    name: string;
    preview: string;
    style: Partial<TextElement>;
}

const textTemplates: TextTemplate[] = [
    {
        id: 'title-bold',
        name: 'Bold Title',
        preview: 'TITLE',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 72,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'subtitle',
        name: 'Subtitle',
        preview: 'Subtitle Text',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 36,
            color: '#E5E5E5',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'none'
        }
    },
    {
        id: 'lower-third',
        name: 'Lower Third',
        preview: 'Name / Title',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 28,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            align: 'left',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'highlight',
        name: 'Highlight',
        preview: 'HIGHLIGHT',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 48,
            color: '#000000',
            backgroundColor: '#FFD700',
            backgroundShape: 'marker',
            align: 'center',
            opacity: 100,
            animation: 'zoom'
        }
    },
    {
        id: 'highlight-pill',
        name: 'Pill Highlight',
        preview: 'IMPORTANT',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: '#FF6B6B',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'highlight-bubble',
        name: 'Bubble Note',
        preview: 'NOTE',
        style: {
            font: 'Inter-Medium',
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 36,
            color: '#FFFFFF',
            backgroundColor: '#4ECDC4',
            backgroundShape: 'bubble',
            align: 'center',
            opacity: 100,
            animation: 'bounce'
        }
    },
    {
        id: 'highlight-underline',
        name: 'Underline',
        preview: 'KEY POINT',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 52,
            color: '#2C3E50',
            backgroundColor: '#F39C12',
            backgroundShape: 'underline',
            align: 'center',
            opacity: 100,
            animation: 'none'
        }
    },
    {
        id: 'highlight-speech',
        name: 'Speech Bubble',
        preview: 'HELLO!',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 40,
            color: '#2C3E50',
            backgroundColor: '#FFFFFF',
            backgroundShape: 'speech',
            align: 'center',
            opacity: 100,
            animation: 'bounce',
            strokeWidth: 2,
            strokeColor: '#2C3E50'
        }
    },
    {
        id: 'highlight-rectangle',
        name: 'Box Highlight',
        preview: 'FEATURED',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 44,
            color: '#FFFFFF',
            backgroundColor: '#8B5CF6',
            backgroundShape: 'rectangle',
            align: 'center',
            opacity: 100,
            animation: 'zoom'
        }
    },
    {
        id: 'highlight-rounded',
        name: 'Soft Highlight',
        preview: 'SMOOTH',
        style: {
            font: 'Inter-Medium',
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 40,
            color: '#FFFFFF',
            backgroundColor: '#10B981',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'quote',
        name: 'Quote',
        preview: '"Quote"',
        style: {
            font: DEFAULT_FONT.postScriptName,
            fontFamily: DEFAULT_FONT.family,
            fontSize: 36,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 90,
            animation: 'none'
        }
    },
    {
        id: 'highlight-neon',
        name: 'Neon Glow',
        preview: 'GLOW',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 46,
            color: '#000000',
            backgroundColor: '#39FF14',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'zoom',
            shadowX: 0,
            shadowY: 0,
            shadowBlur: 20,
            shadowColor: '#39FF14'
        }
    },
    {
        id: 'highlight-gradient',
        name: 'Gradient Label',
        preview: 'PREMIUM',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 38,
            color: '#FFFFFF',
            backgroundColor: '#EC4899',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'highlight-minimal',
        name: 'Minimal Mark',
        preview: 'MARK',
        style: {
            font: 'Inter-Regular',
            fontFamily: 'Inter',
            fontSize: 42,
            color: '#1F2937',
            backgroundColor: '#FEF3C7',
            backgroundShape: 'rectangle',
            align: 'center',
            opacity: 100,
            animation: 'none'
        }
    },
    {
        id: 'warning-sign',
        name: 'Warning',
        preview: '⚠️ WARNING',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 44,
            color: '#000000',
            backgroundColor: '#FCD34D',
            backgroundShape: 'rectangle',
            align: 'center',
            opacity: 100,
            animation: 'bounce',
            strokeWidth: 2,
            strokeColor: '#000000'
        }
    },
    {
        id: 'success-badge',
        name: 'Success',
        preview: '✓ SUCCESS',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 40,
            color: '#FFFFFF',
            backgroundColor: '#059669',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'zoom'
        }
    },
    {
        id: 'error-alert',
        name: 'Error Alert',
        preview: '❌ ERROR',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'info-bubble',
        name: 'Info Tip',
        preview: 'ℹ️ TIP',
        style: {
            font: 'Inter-Medium',
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 36,
            color: '#FFFFFF',
            backgroundColor: '#3B82F6',
            backgroundShape: 'bubble',
            align: 'center',
            opacity: 100,
            animation: 'bounce'
        }
    },
    {
        id: 'sale-badge',
        name: 'Sale Badge',
        preview: 'SALE',
        style: {
            font: 'Inter-Black',
            fontFamily: 'Inter',
            fontWeight: 900,
            fontSize: 56,
            color: '#FFFFFF',
            backgroundColor: '#EF4444',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'zoom',
            rotation: -15
        }
    },
    {
        id: 'new-label',
        name: 'New Label',
        preview: 'NEW',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 32,
            color: '#FFFFFF',
            backgroundColor: '#8B5CF6',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'pro-tip',
        name: 'Pro Tip',
        preview: 'PRO TIP',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 38,
            color: '#1F2937',
            backgroundColor: '#FDE047',
            backgroundShape: 'marker',
            align: 'center',
            opacity: 100,
            animation: 'none'
        }
    },
    {
        id: 'chapter-heading',
        name: 'Chapter',
        preview: 'CHAPTER 1',
        style: {
            font: 'Inter-Light',
            fontFamily: 'Inter',
            fontWeight: 300,
            fontSize: 48,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'slide-in',
            textTransform: 'uppercase'
        }
    },
    {
        id: 'handwritten',
        name: 'Handwritten',
        preview: 'Note to self',
        style: {
            font: 'Kalam-Regular',
            fontFamily: 'Kalam',
            fontSize: 44,
            color: '#1E40AF',
            backgroundColor: '#FEF3C7',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'none',
            rotation: -5
        }
    },
    {
        id: 'retro-badge',
        name: 'Retro',
        preview: 'RETRO',
        style: {
            font: 'Bebas Neue-Regular',
            fontFamily: 'Bebas Neue',
            fontSize: 52,
            color: '#F59E0B',
            backgroundColor: '#1F2937',
            backgroundShape: 'rectangle',
            align: 'center',
            opacity: 100,
            animation: 'zoom',
            strokeWidth: 2,
            strokeColor: '#F59E0B'
        }
    },
    {
        id: 'elegant-serif',
        name: 'Elegant',
        preview: 'Elegant',
        style: {
            font: 'Playfair Display-Regular',
            fontFamily: 'Playfair Display',
            fontSize: 54,
            color: '#D4AF37',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'slide-in',
            italic: true
        }
    },
    {
        id: 'tech-mono',
        name: 'Tech Code',
        preview: '<CODE/>',
        style: {
            font: 'Roboto Mono-Regular',
            fontFamily: 'Roboto Mono',
            fontSize: 36,
            color: '#10B981',
            backgroundColor: '#1F2937',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'none'
        }
    },
    {
        id: 'live-badge',
        name: 'Live',
        preview: '● LIVE',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 32,
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'bounce'
        }
    },
    {
        id: 'trending',
        name: 'Trending',
        preview: '🔥 TRENDING',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 38,
            color: '#FFFFFF',
            backgroundColor: '#F97316',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 100,
            animation: 'zoom'
        }
    },
    {
        id: 'discount-slash',
        name: 'Discount',
        preview: '50% OFF',
        style: {
            font: 'Inter-Black',
            fontFamily: 'Inter',
            fontWeight: 900,
            fontSize: 48,
            color: '#FFFFFF',
            backgroundColor: '#059669',
            backgroundShape: 'marker',
            align: 'center',
            opacity: 100,
            animation: 'zoom',
            rotation: -10
        }
    },
    {
        id: 'coming-soon',
        name: 'Coming Soon',
        preview: 'COMING SOON',
        style: {
            font: 'Inter-Medium',
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 40,
            color: '#9333EA',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'slide-in',
            strokeWidth: 1,
            strokeColor: '#9333EA'
        }
    },
    {
        id: 'subscribe-cta',
        name: 'Subscribe',
        preview: 'SUBSCRIBE',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            backgroundShape: 'rounded',
            align: 'center',
            opacity: 100,
            animation: 'bounce',
            shadowX: 0,
            shadowY: 4,
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.3)'
        }
    },
    {
        id: 'location-tag',
        name: 'Location',
        preview: '📍 TOKYO',
        style: {
            font: 'Inter-Medium',
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 36,
            color: '#FFFFFF',
            backgroundColor: '#000000',
            backgroundShape: 'pill',
            align: 'center',
            opacity: 90,
            animation: 'slide-in'
        }
    },
    {
        id: 'date-stamp',
        name: 'Date',
        preview: '2024',
        style: {
            font: 'Inter-Light',
            fontFamily: 'Inter',
            fontWeight: 300,
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 80,
            animation: 'none'
        }
    },
    {
        id: 'hashtag',
        name: 'Hashtag',
        preview: '#TRENDING',
        style: {
            font: 'Inter-Bold',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 38,
            color: '#3B82F6',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'slide-in'
        }
    },
    {
        id: 'meme-top',
        name: 'Meme Top',
        preview: 'TOP TEXT',
        style: {
            font: 'Bangers-Regular',
            fontFamily: 'Bangers',
            fontSize: 56,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'none',
            strokeWidth: 3,
            strokeColor: '#000000'
        }
    },
    {
        id: 'meme-bottom',
        name: 'Meme Bottom',
        preview: 'BOTTOM TEXT',
        style: {
            font: 'Bangers-Regular',
            fontFamily: 'Bangers',
            fontSize: 56,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'none',
            strokeWidth: 3,
            strokeColor: '#000000'
        }
    },
    {
        id: 'meme-both',
        name: 'Meme Both',
        preview: 'TOP TEXT',
        style: {
            font: 'Bangers-Regular',
            fontFamily: 'Bangers',
            fontSize: 56,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            animation: 'none',
            strokeWidth: 3,
            strokeColor: '#000000'
        }
    }
];

const TextTemplates: React.FC = () => {
    const dispatch = useAppDispatch();
    const { textElements, mediaFiles, currentTime, duration, resolution, visibleRows, maxRows } = useAppSelector((state) => state.projectState);
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleTemplateClick = (template: TextTemplate) => {
        const positionStart = currentTime || 0;
        const positionEnd = Math.min(positionStart + 5, duration);
        
        console.log('Template click - Resolution:', resolution);
        
        // Find the next available row
        const allElements = [...mediaFiles, ...textElements];
        const row = findAvailableRow(allElements, positionStart, positionEnd);

        // Ensure we have enough visible rows
        if (row >= visibleRows && visibleRows < maxRows) {
            dispatch(setVisibleRows(Math.min(row + 1, maxRows)));
        }
        
        // Calculate position based on template type
        // Use percentage of screen width for better scaling
        let defaultWidth = Math.round(resolution.width * 0.5); // 50% of screen width
        let x = (resolution.width - defaultWidth) / 2; // Center horizontally
        let y = resolution.height / 2 - 50; // Center vertically
        
        // Meme text should be wider to accommodate longer text
        if (template.id === 'meme-top' || template.id === 'meme-bottom' || template.id === 'meme-both') {
            defaultWidth = Math.round(resolution.width * 0.9); // 90% of screen width for memes
            x = (resolution.width - defaultWidth) / 2;
        }
        
        if (template.id === 'lower-third') {
            x = 50;
            y = resolution.height - 200;
        } else if (template.id === 'title-bold') {
            y = resolution.height / 3;
        } else if (template.id === 'meme-top') {
            // Position at top with small margin
            x = resolution.width / 2 - defaultWidth / 2;
            y = 20;
        } else if (template.id === 'meme-bottom') {
            // Position at bottom with small margin
            x = resolution.width / 2 - defaultWidth / 2;
            // For bottom text, position from bottom with padding
            // Use a fixed offset from bottom to ensure visibility
            y = Math.max(20, resolution.height - 150);
        } else if (template.id === 'meme-both') {
            // This creates the top text, we'll add bottom text after
            x = resolution.width / 2 - defaultWidth / 2;
            y = 20;
        }

        const newText: TextElement = {
            id: crypto.randomUUID(),
            text: template.preview,
            row,
            positionStart,
            positionEnd,
            x,
            y,
            width: defaultWidth,
            height: 100,
            ...template.style
        };

        const newTexts = [newText];
        
        // For meme-both template, also create bottom text
        if (template.id === 'meme-both') {
            const bottomText: TextElement = {
                ...newText,
                id: crypto.randomUUID(),
                text: 'BOTTOM TEXT',
                y: Math.max(20, resolution.height - 150), // Same position as meme-bottom
            };
            newTexts.push(bottomText);
        }
        
        dispatch(setTextElements([...textElements, ...newTexts]));
        dispatch(setSelectedTextIds(newTexts.map(t => t.id)));
        dispatch(setActiveElement('text'));
    };

    const filteredTemplates = textTemplates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4">
            {/* Template Categories */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
                />
            </div>
            
            <div className="grid grid-cols-3 gap-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {filteredTemplates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className="group relative bg-gray-900 hover:bg-gray-800 rounded-lg p-3 transition-all hover:scale-[1.02] border border-gray-800 hover:border-blue-600"
                    >
                        <div className="aspect-[4/3] bg-black rounded mb-2 flex items-center justify-center overflow-hidden">
                            <div
                                className="text-center px-2 transform"
                                style={{
                                    fontFamily: template.style.font || 'Inter',
                                    fontSize: `${(template.style.fontSize || 24) / 4}px`,
                                    color: template.style.color || '#FFFFFF',
                                    backgroundColor: template.style.backgroundColor || 'transparent',
                                    padding: template.style.backgroundColor !== 'transparent' ? '2px 6px' : '0',
                                    borderRadius: (() => {
                                        if (!template.style.backgroundColor || template.style.backgroundColor === 'transparent') return '0';
                                        switch (template.style.backgroundShape) {
                                            case 'rectangle': return '0px';
                                            case 'rounded': return '4px';
                                            case 'pill': return '20px';
                                            case 'bubble': return '8px';
                                            case 'marker': return '2px 6px 2px 2px';
                                            case 'underline': return '0px';
                                            case 'speech': return '6px';
                                            default: return '4px';
                                        }
                                    })(),
                                    clipPath: template.style.backgroundShape === 'marker' 
                                        ? 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)'
                                        : 'none',
                                    backgroundImage: template.style.backgroundShape === 'underline' && template.style.backgroundColor !== 'transparent'
                                        ? `linear-gradient(to bottom, transparent 70%, ${template.style.backgroundColor} 70%)`
                                        : 'none',
                                    fontWeight: template.style.fontWeight || 400,
                                    WebkitTextStroke: template.style.strokeWidth ? `${template.style.strokeWidth / 4}px ${template.style.strokeColor}` : undefined,
                                    transform: template.style.rotation ? `rotate(${template.style.rotation}deg)` : 'none'
                                }}
                            >
                                {template.preview}
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center font-medium group-hover:text-white transition-colors">{template.name}</p>
                        
                        {/* Hover overlay with icon */}
                        <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all pointer-events-none flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TextTemplates;