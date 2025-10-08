import React from 'react';
import { OffthreadVideo, Video, useCurrentFrame } from 'remotion';
import { ChromaKeyProcessor } from '../ChromaKeyProcessor';
import { AdvancedChromaKeyProcessor } from '../AdvancedChromaKeyProcessor';

interface VideoWithVisibilityProps {
    src: string;
    startFrom: number;
    endAt: number;
    playbackRate: number;
    volume: number;
    style: React.CSSProperties;
    transparent?: boolean;
    sequenceFrom: number;
    sequenceDuration: number;
    chromaKeyEnabled?: boolean;
    chromaKeyColor?: string;
    chromaKeySimilarity?: number;
    chromaKeySmooth?: number;
    chromaKeySpillSuppress?: number;
    fps?: number;
}

export const VideoWithVisibility: React.FC<VideoWithVisibilityProps> = ({
    src,
    startFrom,
    endAt,
    playbackRate,
    volume,
    style,
    transparent,
    sequenceFrom,
    sequenceDuration,
    chromaKeyEnabled,
    chromaKeyColor,
    chromaKeySimilarity,
    chromaKeySmooth,
    chromaKeySpillSuppress,
    fps = 30,
}) => {
    const currentFrame = useCurrentFrame();
    const relativeFrame = currentFrame - sequenceFrom;
    
    // WORKAROUND: For split videos not at position 0, Remotion has issues
    // Check if this is likely a split video (startFrom > 0) in a non-zero sequence
    const isSplitVideoNotAtStart = startFrom > 0 && sequenceFrom > 0;
    
    // Calculate the actual video duration in frames
    const videoDurationInFrames = (endAt - startFrom);
    
    
    
    
    // Check if we should show the video
    // For transparent videos (WebM), hide after video duration ends
    const shouldShow = relativeFrame >= 0 && relativeFrame < sequenceDuration;
    const videoHasEnded = transparent && relativeFrame > videoDurationInFrames;
    
    if (!shouldShow || videoHasEnded) {
        return null;
    }
    
    // Apply CSS chromakey effect
    const videoStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: style.objectFit as any,
    };
    
    const wrapperStyle: React.CSSProperties = {
        ...style,
        opacity: shouldShow && !videoHasEnded ? (style.opacity ?? 1) : 0,
        pointerEvents: 'none',
        display: shouldShow && !videoHasEnded ? 'block' : 'none',
    };
    
    // Use Remotion's native video frame processing for chromakey
    if (chromaKeyEnabled && chromaKeyColor) {
        const similarity = chromaKeySimilarity || 0.4;
        const smoothness = chromaKeySmooth || 0.1;
        const spillSuppress = chromaKeySpillSuppress || 0.5;
        
        return (
            <div style={{ ...wrapperStyle, position: 'relative' }}>
                <AdvancedChromaKeyProcessor
                    src={src}
                    chromaKeyColor={chromaKeyColor}
                    similarity={similarity}
                    smoothness={smoothness}
                    spillSuppress={spillSuppress}
                    startFrom={startFrom}
                    endAt={endAt}
                    playbackRate={playbackRate}
                    volume={volume}
                    style={videoStyle}
                    transparent={transparent}
                />
            </div>
        );
    }
    
    // Use regular Video component for split videos not at timeline start as a workaround
    const VideoComponent = isSplitVideoNotAtStart ? Video : OffthreadVideo;
    
    return (
        <div style={wrapperStyle}>
            <VideoComponent
                src={src}
                startFrom={startFrom}
                endAt={endAt}
                playbackRate={playbackRate}
                volume={volume}
                style={videoStyle}
                // @ts-ignore
                transparent={transparent}
                muted={volume === 0}
                loop={false}
            />
        </div>
    );
};