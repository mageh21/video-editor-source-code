import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { MediaFile } from '@/app/types';
import { getTransitionStyles } from '@/app/utils/transition-utils';

interface EffectsWrapperProps {
    media: MediaFile;
    children: React.ReactNode;
    durationInFrames: number;
    fps: number;
}

export const EffectsWrapper: React.FC<EffectsWrapperProps> = ({ 
    media, 
    children, 
    durationInFrames,
    fps 
}) => {
    const frame = useCurrentFrame();
    
    // For split videos, the frame is relative to the sequence start
    const relativeTime = frame / fps;
    
    // Calculate effects
    const effects = media.effects || {};
    const blur = effects.blur || 0;
    const brightness = effects.brightness || 100;
    const contrast = effects.contrast || 100;
    const saturation = effects.saturation || 100;
    
    // Calculate opacity with fade in/out
    let opacity = (media.opacity !== undefined ? media.opacity / 100 : 1);
    
    // Apply fade in
    if (media.fadeIn && media.fadeIn > 0) {
        const fadeInFrames = media.fadeIn * fps;
        opacity *= interpolate(
            frame,
            [0, fadeInFrames],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
    }
    
    // Apply fade out
    if (media.fadeOut && media.fadeOut > 0) {
        const fadeOutFrames = media.fadeOut * fps;
        const fadeOutStart = durationInFrames - fadeOutFrames;
        opacity *= interpolate(
            frame,
            [fadeOutStart, durationInFrames],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
    }
    
    // Apply new transition effects
    // Use relative time (0 to duration) for transitions instead of absolute time
    const transitionStyles = getTransitionStyles(
        relativeTime,
        0, // Start time is 0 in the sequence context
        (media.positionEnd - media.positionStart), // Duration of this segment
        media.entranceTransition,
        media.exitTransition
    );
    
    // Debug logging for split videos (comment out in production)
    /*
    if (media.originalStartTime !== undefined || media.entranceTransition || media.exitTransition) {
        console.log(`🎬 Transition Debug [${media.fileName}]:`, {
            frame,
            relativeTime,
            segmentDuration: media.positionEnd - media.positionStart,
            positionStart: media.positionStart,
            positionEnd: media.positionEnd,
            entranceTransition: media.entranceTransition,
            exitTransition: media.exitTransition,
            transitionStyles,
            isSplitVideo: media.originalStartTime !== undefined
        });
    }
    */
    
    // Apply old transition effects for backward compatibility
    let transform = transitionStyles.transform || '';
    let transitionOpacity = transitionStyles.opacity !== undefined ? transitionStyles.opacity : 1;
    let transitionFilter = transitionStyles.filter || '';
    let transitionClipPath = transitionStyles.clipPath || '';
    
    // Legacy transition support
    if (!media.entranceTransition && !media.exitTransition && media.transition && media.transition.type !== 'none') {
        const transitionFrames = media.transition.duration * fps;
        const progress = interpolate(
            frame,
            [0, transitionFrames],
            [0, 1],
            { 
                extrapolateLeft: 'clamp', 
                extrapolateRight: 'clamp',
                easing: getEasing(media.transition.easing)
            }
        );
        
        switch (media.transition.type) {
            case 'fade':
                transitionOpacity = progress;
                break;
                
            case 'slide':
                const slideDistance = media.transition.direction === 'left' || media.transition.direction === 'right' 
                    ? 100 : 100;
                const slideX = media.transition.direction === 'left' ? -slideDistance * (1 - progress) :
                              media.transition.direction === 'right' ? slideDistance * (1 - progress) : 0;
                const slideY = media.transition.direction === 'up' ? -slideDistance * (1 - progress) :
                              media.transition.direction === 'down' ? slideDistance * (1 - progress) : 0;
                transform += ` translate(${slideX}%, ${slideY}%)`;
                break;
                
            case 'zoom':
                const scale = interpolate(progress, [0, 1], [0.5, 1]);
                transform += ` scale(${scale})`;
                transitionOpacity = progress;
                break;
                
            case 'blur':
                const transitionBlur = interpolate(progress, [0, 1], [20, 0]);
                effects.blur = (effects.blur || 0) + transitionBlur;
                transitionOpacity = progress;
                break;
        }
    }
    
    // Apply rotation
    if (media.rotation) {
        transform += ` rotate(${media.rotation}deg)`;
    }
    
    // Build filter string
    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 100) filters.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) filters.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) filters.push(`saturate(${saturation / 100})`);
    
    // Combine filters from effects and transitions
    const allFilters = [...filters];
    if (transitionFilter) {
        allFilters.push(transitionFilter);
    }
    
    const style: React.CSSProperties = {
        opacity: opacity * transitionOpacity,
        transform: transform.trim(),
        filter: allFilters.length > 0 ? allFilters.join(' ') : undefined,
        clipPath: transitionClipPath || undefined,
        width: '100%',
        height: '100%',
    };
    
    return (
        <div style={style}>
            {children}
        </div>
    );
};

function getEasing(easing?: string) {
    switch (easing) {
        case 'ease-in':
            return (t: number) => t * t;
        case 'ease-out':
            return (t: number) => 1 - (1 - t) * (1 - t);
        case 'ease-in-out':
            return (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'linear':
        default:
            return (t: number) => t;
    }
}