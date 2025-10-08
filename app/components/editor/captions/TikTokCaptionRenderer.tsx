'use client';

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { Caption, CaptionStyle, WordToken } from '@/app/types';
import { HIGHLIGHT_STYLES } from '@/config/themes';

interface TikTokCaptionRendererProps {
    caption: Caption;
    style: CaptionStyle;
    currentTime: number;
    fps: number;
}

export const TikTokCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();
    
    // Calculate entrance animation
    const enterProgress = interpolate(
        currentTime - ((caption as any).start ?? caption.startMs / 1000),
        [0, 0.3],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );
    
    // Scale animation
    const scale = interpolate(enterProgress, [0, 1], [0.8, 1]);
    
    // Vertical translation
    const translateY = interpolate(enterProgress, [0, 1], [50, 0]);
    
    // Generate word tokens if not provided
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Position styles
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})` }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        maxWidth: `${width * 0.9}px`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
    };
    
    // Base text styles
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.2,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: 0,
        padding: '8px 16px',
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
            : `2px 2px 4px rgba(0,0,0,0.8)`
    };
    
    return (
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === index);
                    
                    // Word-specific styling
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        transition: 'all 0.2s ease-in-out',
                        color: isActive ? '#39E508' : style.color, // TikTok green for active word
                        backgroundColor: isActive && style.backgroundColor !== 'transparent' 
                            ? 'rgba(57, 229, 8, 0.2)' 
                            : style.backgroundColor,
                        borderRadius: '4px',
                        padding: isActive ? '2px 4px' : '0',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        ...((wordHighlight && !isActive) ? HIGHLIGHT_STYLES[wordHighlight.style] : {})
                    };
                    
                    return (
                        <span
                            key={index}
                            style={wordStyles}
                        >
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Generate word tokens with estimated timing if not provided
function generateWordTokens(caption: Caption): WordToken[] {
    const words = caption.text.split(' ');
    const captionDuration = ((caption as any).end ?? caption.endMs / 1000) - ((caption as any).start ?? caption.startMs / 1000);
    const wordsPerSecond = 2.5; // Configurable speaking rate
    const wordDuration = Math.min(captionDuration / words.length, 1 / wordsPerSecond);
    
    return words.map((word, index) => ({
        text: word,
        start: ((caption as any).start ?? caption.startMs / 1000) + (index * wordDuration),
        end: ((caption as any).start ?? caption.startMs / 1000) + ((index + 1) * wordDuration)
    }));
}

// YouTube-style caption renderer (more subtle highlighting)
export const YouTubeCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Position styles
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
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
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === index);
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline',
                        marginRight: '0.2em',
                        color: isActive ? '#FFD700' : style.color, // YouTube yellow for active word
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        backgroundColor: isActive ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                        borderRadius: '2px',
                        padding: isActive ? '1px 2px' : '0',
                        transition: 'all 0.15s ease-in-out',
                        ...((wordHighlight && !isActive) ? HIGHLIGHT_STYLES[wordHighlight.style] : {})
                    };
                    
                    return (
                        <span
                            key={index}
                            style={wordStyles}
                        >
                            {token.text}{' '}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Typewriter-style caption renderer
export const TypewriterCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%', 
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
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
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const hasAppeared = currentTime >= token.start;
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    if (!hasAppeared) return null;
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline',
                        marginRight: '0.2em',
                        color: isActive ? '#FFFF00' : '#00FF00',
                        animation: isActive ? 'blink 1s infinite' : 'none'
                    };
                    
                    return (
                        <span key={index} style={wordStyles}>
                            {token.text}{' '}
                            {isActive && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Karaoke-style caption renderer (words fill with color)
export const KaraokeCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        backgroundColor: style.backgroundColor,
        borderRadius: '8px'
    };
    
    return (
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    let fillProgress = 0;
                    if (currentTime >= token.start && currentTime <= token.end) {
                        fillProgress = (currentTime - token.start) / (token.end - token.start);
                    } else if (currentTime > token.end) {
                        fillProgress = 1;
                    }
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        position: 'relative',
                        color: style.color,
                        opacity: 0.3
                    };
                    
                    const fillStyles: React.CSSProperties = {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: `${fillProgress * 100}%`,
                        height: '100%',
                        overflow: 'hidden',
                        color: '#FFD700',
                        opacity: 1
                    };
                    
                    return (
                        <span key={index} style={wordStyles}>
                            {token.text}
                            <span style={fillStyles}>
                                <span style={{ position: 'absolute', left: 0, top: 0 }}>
                                    {token.text}
                                </span>
                            </span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// Bounce-style caption renderer
export const BounceCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const frame = useCurrentFrame();
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
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
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const wordAge = currentTime - token.start;
                    const bounceDuration = 0.5;
                    
                    let translateY = 0;
                    let scale = 1;
                    let opacity = 1;
                    
                    if (wordAge < 0) {
                        opacity = 0;
                    } else if (wordAge < bounceDuration) {
                        const progress = wordAge / bounceDuration;
                        const bounceFrame = progress * fps * bounceDuration;
                        
                        translateY = spring({
                            frame: bounceFrame,
                            fps,
                            from: -50,
                            to: 0,
                            durationInFrames: fps * bounceDuration,
                            config: {
                                damping: 10,
                                stiffness: 200,
                                overshootClamping: false
                            }
                        });
                        
                        scale = spring({
                            frame: bounceFrame,
                            fps,
                            from: 0.5,
                            to: 1,
                            durationInFrames: fps * bounceDuration
                        });
                        
                        opacity = interpolate(progress, [0, 0.3], [0, 1], {
                            extrapolateRight: 'clamp'
                        });
                    }
                    
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        transform: `translateY(${translateY}px) scale(${scale})`,
                        opacity,
                        color: isActive ? '#FF6B6B' : style.color,
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        textShadow: isActive ? '0 3px 5px rgba(0,0,0,0.3)' : (style as any).textShadow || 'none'
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

// Wave-style caption renderer
export const WaveCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
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
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const wordAge = currentTime - token.start;
                    const waveDelay = index * 0.1;
                    const adjustedAge = wordAge - waveDelay;
                    
                    let translateY = 0;
                    let opacity = 1;
                    
                    if (adjustedAge < 0) {
                        opacity = 0;
                        translateY = 30;
                    } else {
                        const waveTime = adjustedAge * 2;
                        translateY = Math.sin(waveTime) * 5;
                        opacity = interpolate(adjustedAge, [0, 0.3], [0, 1], {
                            extrapolateRight: 'clamp'
                        });
                    }
                    
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        transform: `translateY(${translateY}px)`,
                        opacity,
                        color: isActive ? '#00B4D8' : style.color,
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        textShadow: isActive ? '0 0 15px #00B4D8' : (style as any).textShadow || 'none',
                        transition: 'color 0.3s ease'
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

// Rainbow Caption Renderer
export const RainbowCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
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
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    
                    // Calculate rainbow color
                    const hueBase = (currentTime * 60) % 360;
                    const hueOffset = (index * 30) % 360;
                    const hue = (hueBase + hueOffset) % 360;
                    
                    // Wave animation
                    const waveOffset = Math.sin((currentTime * 2) + (index * 0.5)) * 10;
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        transform: `translateY(${waveOffset}px)`,
                        color: `hsl(${hue}, ${isActive ? 100 : 80}%, ${isActive ? 50 : 60}%)`,
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        textShadow: isActive ? `0 0 20px hsl(${hue}, 100%, 50%)` : 'none',
                        transition: 'all 0.3s ease'
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

// Glitch Caption Renderer
export const GlitchCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    const glitchActive = Math.sin(currentTime * 20) > 0.8;
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        position: 'relative'
    };
    
    return (
        <div style={containerStyles}>
            <div style={textStyles}>
                {/* RGB Split Effect Layers */}
                {glitchActive && (
                    <>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '-2px',
                            color: 'red',
                            opacity: 0.8,
                            mixBlendMode: 'screen'
                        }}>
                            {wordTokens.map((token, index) => (
                                <span key={index} style={{ marginRight: '0.3em' }}>
                                    {token.text}
                                </span>
                            ))}
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '2px',
                            color: 'cyan',
                            opacity: 0.8,
                            mixBlendMode: 'screen'
                        }}>
                            {wordTokens.map((token, index) => (
                                <span key={index} style={{ marginRight: '0.3em' }}>
                                    {token.text}
                                </span>
                            ))}
                        </div>
                    </>
                )}
                
                {/* Main text */}
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const glitch = isActive && Math.random() > 0.9;
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        color: isActive ? '#00FF00' : style.color,
                        fontWeight: isActive ? 'bold' : style.fontWeight,
                        transform: glitch ? `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px)` : 'none',
                        filter: glitch ? 'blur(1px)' : 'none'
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

// Liquid Ripple Caption Renderer
export const LiquidCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        position: 'relative'
    };
    
    return (
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const rippleTime = currentTime * 3;
                    const ripplePhase = index * 0.5;
                    
                    // Multiple wave layers for liquid effect
                    const wave1 = Math.sin(rippleTime + ripplePhase) * 5;
                    const wave2 = Math.sin(rippleTime * 1.5 + ripplePhase + Math.PI/3) * 3;
                    const wave3 = Math.sin(rippleTime * 2 + ripplePhase + Math.PI/6) * 2;
                    const totalWave = wave1 + wave2 + wave3;
                    
                    // Distortion effect
                    const distortionX = Math.cos(rippleTime + ripplePhase) * (isActive ? 3 : 1);
                    
                    const wordStyles: React.CSSProperties = {
                        display: 'inline-block',
                        marginRight: '0.3em',
                        position: 'relative',
                        transform: `translateX(${distortionX}px) translateY(${totalWave}px) rotate(${Math.sin(rippleTime + ripplePhase) * 5}deg)`,
                        transition: 'all 0.1s ease-out'
                    };
                    
                    if (isActive) {
                        // Active word - vibrant liquid colors
                        const hue1 = (180 + Math.sin(rippleTime) * 30) % 360;
                        const hue2 = (220 + Math.sin(rippleTime + Math.PI) * 30) % 360;
                        
                        return (
                            <span key={index} style={wordStyles}>
                                {/* Ripple effect layers */}
                                <span style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '120%',
                                    height: '120%',
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, hsla(${hue1}, 100%, 50%, 0.3), transparent 70%)`,
                                    animation: 'ripple 2s infinite',
                                    pointerEvents: 'none'
                                }} />
                                
                                {/* Main text with gradient */}
                                <span style={{
                                    position: 'relative',
                                    background: `linear-gradient(135deg, hsl(${hue1}, 100%, 50%), hsl(${hue2}, 100%, 60%))`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                    fontWeight: 'bold',
                                    filter: `drop-shadow(0 3px 6px hsla(${hue1}, 100%, 50%, 0.5))`,
                                    transform: `scale(${1 + Math.sin(rippleTime * 2) * 0.1})`
                                }}>
                                    {token.text}
                                </span>
                                
                                {/* Water reflection effect */}
                                <span style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    height: '50%',
                                    overflow: 'hidden',
                                    opacity: 0.3,
                                    transform: 'scaleY(-1)',
                                    filter: 'blur(1px)',
                                    pointerEvents: 'none'
                                }}>
                                    <span style={{
                                        background: `linear-gradient(135deg, hsl(${hue1}, 100%, 50%), hsl(${hue2}, 100%, 60%))`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        color: 'transparent',
                                        fontWeight: 'bold'
                                    }}>
                                        {token.text}
                                    </span>
                                </span>
                            </span>
                        );
                    } else {
                        // Inactive word - calm water effect
                        return (
                            <span key={index} style={{
                                ...wordStyles,
                                background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.8), rgba(50, 100, 200, 0.9))',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                filter: 'drop-shadow(0 2px 4px rgba(50, 100, 200, 0.3))'
                            }}>
                                {token.text}
                            </span>
                        );
                    }
                })}
            </div>
            
            <style jsx>{`
                @keyframes ripple {
                    0% {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0.5;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0.2;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

// Fire Caption Renderer
export const FireCaptionRenderer: React.FC<TikTokCaptionRendererProps> = ({
    caption,
    style,
    currentTime,
    fps
}) => {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    const containerStyles: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(style.position === 'top' && { top: `${style.offsetY}px` }),
        ...(style.position === 'center' && { top: '50%', transform: 'translate(-50%, -50%)' }),
        ...(style.position === 'bottom' && { bottom: `${style.offsetY}px` }),
        width: `${style.maxWidth}%`,
        zIndex: 1000,
        textAlign: style.textAlign as any,
        opacity: style.opacity
    };
    
    const textStyles: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: 900 as any,
        lineHeight: 1.4,
        margin: 0,
        padding: '12px 20px',
        position: 'relative'
    };
    
    return (
        <div style={containerStyles}>
            <div style={textStyles}>
                {wordTokens.map((token, index) => {
                    const isActive = currentTime >= token.start && currentTime <= token.end;
                    const flickerIntensity = Math.sin(currentTime * 15) * 0.1 + 0.9;
                    
                    return (
                        <span key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '0.3em' }}>
                            {/* Multiple layers for realistic fire */}
                            {/* Base ember layer */}
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                background: isActive
                                    ? 'linear-gradient(to top, #330000 0%, #660000 30%, #990000 60%, #CC3300 80%, #FF6600 100%)'
                                    : 'linear-gradient(to top, #1a0000 0%, #330000 50%, #660000 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                filter: 'blur(2px)',
                                transform: 'scale(1.1)',
                                opacity: 0.8
                            }}>
                                {token.text}
                            </span>
                            
                            {/* Middle flame layer */}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    background: 'linear-gradient(to top, #FF0000 0%, #FF6600 30%, #FF9900 60%, #FFCC00 80%, #FFFF00 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                    filter: `blur(1px) brightness(${flickerIntensity})`,
                                    transform: `scale(1.05) translateY(${Math.sin(currentTime * 20 + index) * 2}px)`,
                                    opacity: 0.9 * flickerIntensity
                                }}>
                                    {token.text}
                                </span>
                            )}
                            
                            {/* Core hot layer */}
                            <span style={{
                                position: 'relative',
                                background: isActive
                                    ? 'linear-gradient(to top, #FFCC00 0%, #FFFF00 30%, #FFFF99 60%, #FFFFCC 80%, #FFFFFF 100%)'
                                    : 'linear-gradient(to top, #660000 0%, #CC0000 50%, #FF6600 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                fontWeight: 900,
                                transform: isActive ? `scale(1.1) translateY(${Math.sin(currentTime * 30 + index * 0.5) * 1}px)` : 'scale(1)',
                                filter: isActive ? `brightness(${flickerIntensity * 1.2})` : 'brightness(0.8)',
                                textShadow: isActive 
                                    ? `0 0 30px #FF6600, 0 0 60px #FF0000, 0 -5px 100px #FFCC00` 
                                    : '0 0 20px #CC0000'
                            }}>
                                {token.text}
                            </span>
                            
                            {/* Flame particles effect */}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '100%',
                                    height: '40px',
                                    background: `radial-gradient(ellipse at center bottom, rgba(255,200,0,${0.3 * flickerIntensity}) 0%, transparent 70%)`,
                                    filter: 'blur(5px)',
                                    animation: 'flicker 0.5s infinite'
                                }} />
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default TikTokCaptionRenderer;