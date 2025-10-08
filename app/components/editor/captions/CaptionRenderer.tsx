'use client';

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { useAppSelector } from '@/app/store';
import { Caption, CaptionStyle } from '@/app/types';
import { HIGHLIGHT_STYLES } from '@/config/themes';
import { 
    TikTokCaptionRenderer, 
    YouTubeCaptionRenderer, 
    TypewriterCaptionRenderer,
    KaraokeCaptionRenderer,
    BounceCaptionRenderer,
    WaveCaptionRenderer,
    RainbowCaptionRenderer,
    GlitchCaptionRenderer,
    FireCaptionRenderer,
    LiquidCaptionRenderer
} from './TikTokCaptionRenderer';

interface CaptionRendererProps {
    currentTime?: number; // in seconds
    isPlaying?: boolean;
}

export const CaptionRenderer: React.FC<CaptionRendererProps> = ({
    currentTime: externalTime,
    isPlaying
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeInSeconds = externalTime ?? frame / fps;
    
    const { captionTracks, activeCaptionTrackId, showCaptions } = useAppSelector(state => state.projectState);
    
    if (!showCaptions) return null;
    
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    if (!activeTrack || activeTrack.captions.length === 0) return null;
    
    // Find current caption
    const currentCaption = activeTrack.captions.find(
        caption => currentTimeInSeconds >= ((caption as any).start ?? caption.startMs / 1000) && currentTimeInSeconds <= ((caption as any).end ?? caption.endMs / 1000)
    );
    
    if (!currentCaption) return null;
    
    return (
        <CaptionDisplay
            caption={currentCaption}
            style={activeTrack.style}
            currentTime={currentTimeInSeconds}
            fps={fps}
        />
    );
};

interface CaptionDisplayProps {
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
    fps: number;
}

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    // Use different renderers based on animation style
    switch (caption.animationStyle) {
        case 'tiktok':
            return (
                <TikTokCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'youtube':
            return (
                <YouTubeCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'typewriter':
            return (
                <TypewriterCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'karaoke':
            return (
                <KaraokeCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'bounce':
            return (
                <BounceCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'wave':
            return (
                <WaveCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'rainbow':
            return (
                <RainbowCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'glitch':
            return (
                <GlitchCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'fire':
            return (
                <FireCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        case 'liquid':
            return (
                <LiquidCaptionRenderer
                    caption={caption}
                    style={style}
                    currentTime={currentTime}
                    fps={fps}
                />
            );
        default:
            // Default original renderer
            return <DefaultCaptionDisplay caption={caption} style={style} currentTime={currentTime} fps={fps} />;
    }
};

// Original caption display as default
const DefaultCaptionDisplay: React.FC<CaptionDisplayProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    // Animation for caption appearance
    const frame = (currentTime - ((caption as any).start ?? caption.startMs / 1000)) * fps;
    const springConfig = {
        fps,
        durationInFrames: Math.floor(fps * 0.3), // 0.3 second animation
        config: {
            damping: 200,
            stiffness: 100
        }
    };
    
    const scale = spring({
        frame,
        ...springConfig,
        from: 0.8,
        to: 1
    });
    
    const opacity = interpolate(
        frame,
        [0, Math.floor(fps * 0.2)],
        [0, style.opacity],
        { extrapolateRight: 'clamp' }
    );
    
    // Fade out near the end
    const fadeOutOpacity = interpolate(
        currentTime,
        [((caption as any).end ?? caption.endMs / 1000) - 0.3, ((caption as any).end ?? caption.endMs / 1000)],
        [style.opacity, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    
    const finalOpacity = Math.min(opacity, fadeOutOpacity);
    
    // Position styles
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: `translate(-50%, -50%) scale(${scale})` }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000
    };
    
    // Text styles
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        padding: '8px 16px',
        borderRadius: '8px',
        textAlign: style.textAlign as any,
        lineHeight: 1.4,
        opacity: finalOpacity,
        textShadow: style.outlineWidth > 0 
            ? `
                ${style.outlineColor} ${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} -${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} 0px ${style.outlineWidth}px 0px,
                ${style.outlineColor} 0px -${style.outlineWidth}px 0px,
                ${style.outlineColor} ${style.outlineWidth}px ${style.outlineWidth}px 0px,
                ${style.outlineColor} -${style.outlineWidth}px ${style.outlineWidth}px 0px,
                ${style.outlineColor} ${style.outlineWidth}px -${style.outlineWidth}px 0px,
                ${style.outlineColor} -${style.outlineWidth}px -${style.outlineWidth}px 0px
            `
            : 'none'
    };
    
    // Render highlighted text
    const renderHighlightedText = () => {
        const words = caption.text.split(' ');
        const highlightedWords = caption.highlightedWords || [];
        
        if (highlightedWords.length === 0) {
            return caption.text;
        }
        
        return words.map((word, index) => {
            const highlight = highlightedWords.find(hw => hw.wordIndex === index);
            
            if (highlight) {
                const highlightStyle = HIGHLIGHT_STYLES[highlight.style];
                return (
                    <span 
                        key={index}
                        style={{
                            ...highlightStyle,
                            fontSize: 'inherit',
                            lineHeight: 'inherit'
                        }}
                    >
                        {word}
                    </span>
                );
            }
            
            return word;
        }).reduce((acc, word, index) => {
            if (index === 0) return [word];
            return [...acc, ' ', word];
        }, [] as React.ReactNode[]);
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {renderHighlightedText()}
            </div>
        </div>
    );
};

// Export a non-Remotion version for the editor preview
export const StaticCaptionRenderer: React.FC<{
    currentTime: number;
    containerWidth: number;
    containerHeight: number;
}> = ({ currentTime, containerWidth, containerHeight }) => {
    const { captionTracks, activeCaptionTrackId, showCaptions } = useAppSelector(state => state.projectState);
    
    if (!showCaptions) return null;
    
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    if (!activeTrack || activeTrack.captions.length === 0) return null;
    
    // Find current caption
    const currentCaption = activeTrack.captions.find(
        caption => currentTime >= ((caption as any).start ?? caption.startMs / 1000) && currentTime <= ((caption as any).end ?? caption.endMs / 1000)
    );
    
    if (!currentCaption) return null;
    
    const style = activeTrack.style;
    
    // Use different renderers based on animation style for static preview
    switch (currentCaption.animationStyle) {
        case 'tiktok':
            return (
                <StaticTikTokRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'youtube':
            return (
                <StaticYouTubeRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'typewriter':
            return (
                <StaticTypewriterRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'karaoke':
            return (
                <StaticKaraokeRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'bounce':
            return (
                <StaticBounceRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'wave':
            return (
                <StaticWaveRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'rainbow':
            return (
                <StaticRainbowRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'glitch':
            return (
                <StaticGlitchRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'fire':
            return (
                <StaticFireRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        case 'liquid':
            return (
                <StaticLiquidRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
        default:
            return (
                <StaticDefaultRenderer
                    caption={currentCaption}
                    style={style}
                    currentTime={currentTime}
                />
            );
    }
};

// Static renderers for preview
const StaticDefaultRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        padding: '8px 16px',
        borderRadius: '8px',
        textAlign: style.textAlign as any,
        lineHeight: 1.4,
        opacity: style.opacity,
        textShadow: style.outlineWidth > 0 
            ? `
                ${style.outlineColor} ${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} -${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} 0px ${style.outlineWidth}px 0px,
                ${style.outlineColor} 0px -${style.outlineWidth}px 0px
            `
            : 'none'
    };
    
    const renderHighlightedText = () => {
        const words = caption.text.split(' ');
        const highlightedWords = caption.highlightedWords || [];
        
        if (highlightedWords.length === 0) {
            return caption.text;
        }
        
        return words.map((word, index) => {
            const highlight = highlightedWords.find(hw => hw.wordIndex === index);
            
            if (highlight) {
                const highlightStyle = HIGHLIGHT_STYLES[highlight.style];
                return (
                    <span 
                        key={index}
                        style={{
                            ...highlightStyle,
                            fontSize: 'inherit',
                            lineHeight: 'inherit'
                        }}
                    >
                        {word}
                    </span>
                );
            }
            
            return word;
        }).reduce((acc, word, index) => {
            if (index === 0) return [word];
            return [...acc, ' ', word];
        }, [] as React.ReactNode[]);
    };

    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {renderHighlightedText()}
            </div>
        </div>
    );
};

// Static TikTok renderer
const StaticTikTokRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none',
        textAlign: style.textAlign as any
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.2,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: 0,
        padding: '8px 16px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === index);
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        color: isActive ? '#39E508' : style.color,
                        backgroundColor: isActive && style.backgroundColor !== 'transparent' 
                            ? 'rgba(57, 229, 8, 0.2)' 
                            : style.backgroundColor,
                        borderRadius: '4px',
                        padding: isActive ? '2px 4px' : '0',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        transition: 'all 0.2s ease-in-out',
                        ...((wordHighlight && !isActive) ? HIGHLIGHT_STYLES[wordHighlight.style] : {})
                    };
                    
                    return (
                        <span key={index} style={wordStyles}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static YouTube renderer
const StaticYouTubeRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '8px 16px',
        backgroundColor: style.backgroundColor,
        borderRadius: '8px',
        textAlign: style.textAlign as any,
        textShadow: style.outlineWidth > 0 
            ? `
                ${style.outlineColor} ${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} -${style.outlineWidth}px 0px 0px,
                ${style.outlineColor} 0px ${style.outlineWidth}px 0px,
                ${style.outlineColor} 0px -${style.outlineWidth}px 0px
            `
            : 'none'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === index);
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline',
                        marginRight: '0.2em',
                        color: isActive ? '#FFD700' : style.color,
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        backgroundColor: isActive ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                        borderRadius: '2px',
                        padding: isActive ? '1px 2px' : '0',
                        transition: 'all 0.15s ease-in-out',
                        ...((wordHighlight && !isActive) ? HIGHLIGHT_STYLES[wordHighlight.style] : {})
                    };
                    
                    return (
                        <span key={index} style={wordStyles}>
                            {token.text}{' '}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Typewriter renderer
const StaticTypewriterRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        backgroundColor: caption.typewriterTransparent ? 'transparent' : 'rgba(0, 0, 0, 0.9)',
        border: caption.typewriterTransparent ? 'none' : '1px solid #444',
        borderRadius: '8px',
        color: '#00FF00',
        textAlign: 'center' as any
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const hasAppeared = currentTime >= token.start;
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    if (!hasAppeared) return null;
                    
                    return (
                        <span key={index} style={{
                            display: 'inline',
                            marginRight: '0.2em',
                            color: isActive ? '#FFFF00' : '#00FF00'
                        }}>
                            {token.text}{' '}
                            {isActive && <span>|</span>}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Karaoke renderer
const StaticKaraokeRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        backgroundColor: style.backgroundColor,
        borderRadius: '8px',
        textAlign: style.textAlign as any
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    let fillProgress = 0;
                    if (currentTime >= token.start && currentTime <= token.end) {
                        fillProgress = (currentTime - token.start) / (token.end - token.start);
                    } else if (currentTime > token.end) {
                        fillProgress = 1;
                    }
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            position: 'relative',
                            color: fillProgress > 0 ? '#FFD700' : style.color,
                            opacity: fillProgress > 0 ? 1 : 0.3
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Bounce renderer
const StaticBounceRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const wordAge = currentTime - token.start;
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    let opacity = wordAge < 0 ? 0 : 1;
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            opacity,
                            color: isActive ? '#FF6B6B' : style.color,
                            fontWeight: isActive ? 'bold' : style.fontWeight,
                            textShadow: isActive ? '0 3px 5px rgba(0,0,0,0.3)' : (style as any).textShadow || 'none'
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Wave renderer
const StaticWaveRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const wordAge = currentTime - token.start;
                    const waveDelay = index * 0.1;
                    const adjustedAge = wordAge - waveDelay;
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    let translateY = 0;
                    let opacity = 1;
                    
                    if (adjustedAge < 0) {
                        opacity = 0;
                        translateY = 30;
                    } else {
                        const waveTime = adjustedAge * 2;
                        translateY = Math.sin(waveTime) * 5;
                    }
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            transform: `translateY(${translateY}px)`,
                            opacity,
                            color: isActive ? '#00B4D8' : style.color,
                            fontWeight: isActive ? 'bold' : style.fontWeight,
                            textShadow: isActive ? '0 0 15px #00B4D8' : (style as any).textShadow || 'none'
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Rainbow renderer
const StaticRainbowRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none',
        textAlign: style.textAlign as any
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const hue = ((currentTime * 60) + (index * 30)) % 360;
                    const waveOffset = Math.sin((currentTime * 2) + (index * 0.5)) * 10;
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            transform: `translateY(${waveOffset}px)`,
                            color: `hsl(${hue}, ${isActive ? 100 : 80}%, ${isActive ? 50 : 60}%)`,
                            fontWeight: isActive ? 'bold' : style.fontWeight,
                            textShadow: isActive ? `0 0 20px hsl(${hue}, 100%, 50%)` : 'none'
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Glitch renderer
const StaticGlitchRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    const glitchActive = Math.sin(currentTime * 20) > 0.8;
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none',
        textAlign: style.textAlign as any
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const glitch = isActive && Math.random() > 0.9;
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            color: glitchActive || isActive ? '#00FF00' : style.color,
                            fontWeight: isActive ? 'bold' : style.fontWeight,
                            transform: glitch ? `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px)` : 'none',
                            filter: glitchActive ? 'blur(1px)' : 'none'
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Liquid renderer
const StaticLiquidRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none',
        textAlign: style.textAlign as any
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const rippleTime = currentTime * 3;
                    const ripplePhase = index * 0.5;
                    
                    // Calculate wave effect
                    const wave = Math.sin(rippleTime + ripplePhase) * 5;
                    const distortionX = Math.cos(rippleTime + ripplePhase) * (isActive ? 3 : 1);
                    
                    // Dynamic color for active words
                    let color = style.color;
                    if (isActive) {
                        const hue = (180 + Math.sin(rippleTime) * 30) % 360;
                        color = `hsl(${hue}, 100%, 50%)`;
                    }
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            transform: `translateX(${distortionX}px) translateY(${wave}px)`,
                            background: isActive 
                                ? `linear-gradient(135deg, ${color}, hsl(220, 100%, 60%))`
                                : 'linear-gradient(135deg, rgba(100, 150, 255, 0.8), rgba(50, 100, 200, 0.9))',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            fontWeight: isActive ? 'bold' : style.fontWeight,
                            filter: `drop-shadow(0 ${isActive ? 3 : 2}px ${isActive ? 6 : 4}px ${isActive ? color : 'rgba(50, 100, 200, 0.3)'})`
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Static Fire renderer
const StaticFireRenderer: React.FC<{
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
}> = ({ caption, style, currentTime }) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const positionStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        pointerEvents: 'none',
        textAlign: style.textAlign as any
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: 'bold' as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px'
    };
    
    return (
        <div style={positionStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    return (
                        <span key={index} style={{
                            display: 'inline-block',
                            marginRight: '0.3em',
                            background: isActive 
                                ? 'linear-gradient(to top, #FF0000, #FF6600, #FFAA00, #FFFF00)'
                                : 'linear-gradient(to top, #660000, #CC0000, #FF6600)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            filter: isActive ? 'brightness(1.2)' : 'brightness(0.8)',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)'
                        }}>
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Helper function to generate word tokens (shared between renderers)
function generateWordTokens(caption: Caption) {
    const words = caption.text.split(' ');
    const captionDuration = ((caption as any).end ?? caption.endMs / 1000) - ((caption as any).start ?? caption.startMs / 1000);
    const wordsPerSecond = 2.5;
    const wordDuration = Math.min(captionDuration / words.length, 1 / wordsPerSecond);
    
    return words.map((word, index) => ({
        text: word,
        start: ((caption as any).start ?? caption.startMs / 1000) + (index * wordDuration),
        end: ((caption as any).start ?? caption.startMs / 1000) + ((index + 1) * wordDuration)
    }));
}

export default CaptionRenderer;