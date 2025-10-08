import { AbsoluteFill, OffthreadVideo, Video, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MediaFile, TextElement, InstagramConversation, WhatsAppConversation } from "@/app/types";
import { EffectsWrapper } from "./EffectsWrapper";
import { VideoWithVisibility } from "./VideoWithVisibility";
import { getFontFamilyWithFallbacks } from "@/app/utils/remotion-font-loader";
import { InstagramConversationRenderer } from "@/app/components/instagram/InstagramConversationRenderer";
import { InstagramSequenceWrapper } from "./InstagramSequenceWrapper";
import { WhatsAppSequenceWrapper } from "./WhatsAppSequenceWrapper";
import { TextAnimations } from "../animations/TextAnimations";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
    shouldForcePositioning?: boolean;
}


const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    return { from, durationInFrames };
};

export const SequenceItem: Record<
    string,
    (item: any, options: SequenceItemOptions) => JSX.Element> = {
    video: (item: MediaFile, options: SequenceItemOptions) => {
        const { fps, shouldForcePositioning } = options;
        
        // Validate that the media has a valid src
        if (!item.src) {
            console.error(`Media file ${item.id} has no src URL`, item);
            return <div key={item.id} style={{ display: 'none' }} />;
        }

        const playbackRate = item.playbackSpeed || 1;
        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        // For split videos, we need to ensure the trim points are correct
        // The video should play from startTime to endTime regardless of timeline position
        const trim = {
            from: (item.startTime) / playbackRate,
            to: (item.endTime) / playbackRate
        };
        
        // WORKAROUND: Remotion seems to have issues with trimmed videos that aren't at position 0
        // If this is a split video (startTime > 0) and not at timeline position 0, we need special handling
        const isSplitVideo = item.startTime > 0;
        const isNotAtTimelineStart = item.positionStart > 0;
        
        
        // IMPORTANT: For split videos, ensure the sequence duration matches the actual video segment duration
        const videoDuration = (item.endTime - item.startTime) / playbackRate;
        const videoDurationInFrames = Math.round(videoDuration * fps);
        
        // Use the smaller of the two to prevent overrun
        const actualDurationInFrames = Math.min(durationInFrames, videoDurationInFrames);
        
        
        // Debug video timing - commented for now
        /* console.log(`🎬 VIDEO RENDER DEBUG [${item.positionStart.toFixed(2)}s - ${item.positionEnd.toFixed(2)}s]:`, {
            id: item.id,
            fileName: item.fileName,
            timeline: {
                positionStart: item.positionStart,
                positionEnd: item.positionEnd,
                duration: item.positionEnd - item.positionStart
            },
            source: {
                startTime: item.startTime,
                endTime: item.endTime,
                duration: item.endTime - item.startTime
            },
            trim: {
                from: trim.from,
                to: trim.to,
                duration: trim.to - trim.from
            },
            frames: {
                from,
                durationInFrames,
                startFrom: trim.from * fps,
                endAt: trim.to * fps
            },
            raw: {
                item
            }
        }); */

        // If no position/size is set, default to full canvas
        const hasCustomPosition = (item.x !== undefined && item.x !== 0) || 
                                (item.y !== undefined && item.y !== 0) || 
                                (item.width !== undefined) || 
                                (item.height !== undefined);
        

        // Ensure we have proper sequence boundaries for WebM
        const isWebM = item.src?.includes('.webm') || item.mimeType?.includes('webm');
        
        // WORKAROUND: Remotion has an issue with trimmed videos (startFrom > 0) in sequences that don't start at frame 0
        // When a video is split and the resulting segment has startTime > 0 AND is positioned at a non-zero timeline position,
        // Remotion fails to render it correctly, showing a blank/paused section.
        // 
        // The workaround is to wrap the video in a nested sequence that starts at frame 0, which effectively
        // recreates the scenario where the video is at timeline position 0 (which works correctly).
        // This maintains the correct timeline positioning while fixing the rendering issue.
        if (isSplitVideo && isNotAtTimelineStart) {
            return (
                <Sequence
                    key={item.id}
                    from={from}
                    durationInFrames={actualDurationInFrames}
                    layout={isWebM ? "none" : undefined}
                >
                    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
                    <div
                        data-track-item="transition-element"
                        className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                        style={{
                            position: "absolute",
                            pointerEvents: "auto",
                            top: hasCustomPosition ? (item.y || 0) : 0,
                            left: hasCustomPosition ? (item.x || 0) : 0,
                            width: hasCustomPosition ? (item.width || "100%") : "100%",
                            height: hasCustomPosition ? (item.height || "100%") : "100%",
                            zIndex: item.zIndex !== undefined ? item.zIndex : (1000 - (item.row * 10)),
                            borderRadius: hasCustomPosition ? `10px` : 0,
                            overflow: "hidden",
                            backgroundColor: "transparent",
                        }}
                    >
                        <EffectsWrapper 
                            media={item} 
                            durationInFrames={actualDurationInFrames}
                            fps={fps}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                    overflow: "hidden",
                                    pointerEvents: "none",
                                    backgroundColor: "transparent",
                                }}
                            >
                                {/* Nested sequence at position 0 to work around Remotion issue */}
                                <Sequence from={0} durationInFrames={actualDurationInFrames}>
                                    <VideoWithVisibility
                                        src={item.src || ""}
                                        startFrom={Math.round((trim.from) * fps)}
                                        endAt={Math.round((trim.to) * fps)}
                                        playbackRate={playbackRate}
                                        volume={item.volume !== undefined ? item.volume / 100 : 1}
                                        transparent={item.src?.includes('.webm') || item.mimeType?.includes('webm')}
                                        sequenceFrom={0} // Inner sequence starts at 0
                                        sequenceDuration={actualDurationInFrames}
                                        chromaKeyEnabled={item.chromaKeyEnabled}
                                        chromaKeyColor={item.chromaKeyColor}
                                        chromaKeySimilarity={item.chromaKeySimilarity}
                                        chromaKeySmooth={item.chromaKeySmooth}
                                        chromaKeySpillSuppress={item.chromaKeySpillSuppress}
                                        fps={fps}
                                        style={{
                                            pointerEvents: "none",
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: hasCustomPosition ? "cover" : "contain",
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                            backgroundColor: "transparent"
                                        }}
                                    />
                                </Sequence>
                            </div>
                        </EffectsWrapper>
                    </div>
                    </AbsoluteFill>
                </Sequence>
            );
        }
        
        // Normal video rendering
        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={actualDurationInFrames}
                // Force layout to none after sequence ends for WebM
                layout={isWebM ? "none" : undefined}
            >
                <AbsoluteFill style={{ backgroundColor: "transparent" }}>
                <div
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    style={{
                        position: "absolute",
                        pointerEvents: "auto",
                        top: hasCustomPosition ? (item.y || 0) : 0,
                        left: hasCustomPosition ? (item.x || 0) : 0,
                        width: hasCustomPosition ? (item.width || "100%") : "100%",
                        height: hasCustomPosition ? (item.height || "100%") : "100%",
                        zIndex: item.zIndex !== undefined ? item.zIndex : (1000 - (item.row * 10)), // Higher rows (lower numbers) on top
                        borderRadius: hasCustomPosition ? `10px` : 0,
                        overflow: "hidden",
                        backgroundColor: "transparent", // Ensure transparency
                    }}
                >
                    <EffectsWrapper 
                        media={item} 
                        durationInFrames={actualDurationInFrames}
                        fps={fps}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                pointerEvents: "none",
                                backgroundColor: "transparent",
                            }}
                        >
                            <VideoWithVisibility
                                src={item.src || ""}
                                startFrom={Math.round((trim.from) * fps)}
                                endAt={Math.round((trim.to) * fps)}
                                playbackRate={playbackRate}
                                volume={item.volume !== undefined ? item.volume / 100 : 1}
                                transparent={item.src?.includes('.webm') || item.mimeType?.includes('webm')}
                                sequenceFrom={from}
                                sequenceDuration={actualDurationInFrames}
                                chromaKeyEnabled={item.chromaKeyEnabled}
                                chromaKeyColor={item.chromaKeyColor}
                                chromaKeySimilarity={item.chromaKeySimilarity}
                                chromaKeySmooth={item.chromaKeySmooth}
                                chromaKeySpillSuppress={item.chromaKeySpillSuppress}
                                fps={fps}
                                // Debug props
                                {...(item.startTime > 0 || item.positionStart > 0 ? {
                                    'data-debug-startFrom': Math.round((trim.from) * fps),
                                    'data-debug-endAt': Math.round((trim.to) * fps),
                                    'data-debug-trim-from': trim.from,
                                    'data-debug-trim-to': trim.to,
                                    'data-debug-position-start': item.positionStart,
                                    'data-debug-sequence-from': from
                                } : {})}
                                style={{
                                    pointerEvents: "none",
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: hasCustomPosition ? "cover" : "contain",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    backgroundColor: "transparent"
                                }}
                            />
                        </div>
                    </EffectsWrapper>
                </div>
                </AbsoluteFill>
            </Sequence>
        );
    },
    text: (item: TextElement, options: SequenceItemOptions) => {
        const { handleTextChange, fps, editableTextId } = options;

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        // Font loading is handled by FontPreloader component

        // Simple rendering without hooks - animations will be handled differently
        const opacity = (item.opacity || 100) / 100;
        const transform = `rotate(${item.rotation || 0}deg)`;

        // Use the font size directly - no auto-scaling needed with text wrapping
        const fontSize = item.fontSize || 32;
        // Use fontFamily if available (loaded via CSS), otherwise fall back to postScriptName
        const fontFamily = item.fontFamily || item.font || 'Roboto';
        const fontFallbacks = `"${fontFamily}", "Inter", system-ui, -apple-system, sans-serif`;
        
        // Debug font rendering (only when font changes)
        if (item.text === 'TITLE') {
          console.log(`📖 Rendering "${item.text}" with font: ${fontFamily}`);
        }
        

        return (
            <Sequence
                className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text`}
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            >
                <AbsoluteFill style={{ pointerEvents: 'none' }}>
                    <TextAnimations
                        item={item}
                        sequenceFrom={from}
                        sequenceDuration={durationInFrames}
                    >
                    <div
                        style={{
                            position: "absolute",
                            width: item.width || 'auto',
                            height: 'auto', // Don't use item.height for container
                            top: item.y,
                            left: item.x,
                            transform,
                            opacity,
                            transformOrigin: 'center',
                            zIndex: item.zIndex !== undefined ? item.zIndex : (1000 - (item.row * 10)),
                        }}
                    >
                    <div
                        data-text-id={item.id}
                        style={{
                            fontSize: `${fontSize}px`,
                            color: item.color || "#FFFFFF",
                            backgroundColor: (() => {
                              if (!item.backgroundColor || item.backgroundColor === 'transparent') return 'transparent';
                              // For underline shape, make background transparent and use backgroundImage
                              if (item.backgroundShape === 'underline') return 'transparent';
                              return item.backgroundColor;
                            })(),
                            fontFamily: fontFallbacks,
                            padding: item.backgroundColor !== 'transparent' ? '12px 20px' : '0',
                            borderRadius: (() => {
                              if (item.backgroundColor === 'transparent' || !item.backgroundColor) return '0';
                              const shape = item.backgroundShape || 'rounded';
                              console.log(`🎨 Sequence: Applying background shape "${shape}" to text "${item.text.substring(0, 20)}..."`);
                              switch (shape) {
                                case 'rectangle': return '0px';
                                case 'rounded': return '8px';
                                case 'pill': return '50px';
                                case 'bubble': return '16px';
                                case 'marker': return '4px 12px 4px 4px';
                                case 'underline': return '0px';
                                case 'speech': return '12px';
                                default: return '8px';
                              }
                            })(),
                            clipPath: (() => {
                              if (item.backgroundColor === 'transparent') return 'none';
                              const shape = item.backgroundShape || 'rounded';
                              switch (shape) {
                                case 'marker':
                                  return 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';
                                case 'underline':
                                  // Create underline effect with gradient
                                  return 'none';
                                case 'speech':
                                  // Speech bubble with CSS (simplified without tail)
                                  return 'none';
                                default:
                                  return 'none';
                              }
                            })(),
                            backgroundImage: (() => {
                              if (item.backgroundColor === 'transparent') return 'none';
                              const shape = item.backgroundShape || 'rounded';
                              if (shape === 'underline') {
                                // Create underline gradient effect
                                return `linear-gradient(to bottom, transparent 80%, ${item.backgroundColor} 80%)`;
                              }
                              return 'none';
                            })(),
                            whiteSpace: 'pre-wrap', // Allow text wrapping
                            lineHeight: 1.4,
                            fontWeight: item.fontWeight || 400,
                            fontStyle: item.italic ? 'italic' : 'normal',
                            textDecoration: item.underline ? 'underline' : 'none',
                            textTransform: (item.textTransform || 'none') as any,
                            // Match canvas renderer positioning exactly
                            width: item.width || 'auto',
                            display: 'block', // Changed from flex to block
                            textAlign: (item.align || 'left') as any,
                            boxSizing: 'border-box',
                            // Text stroke for meme-style text
                            WebkitTextStroke: item.strokeWidth && item.strokeColor ? `${item.strokeWidth}px ${item.strokeColor}` : undefined,
                            paintOrder: 'stroke fill' // Ensures stroke is drawn behind fill
                        } as any}
                    >
                        {item.text}
                    </div>
                    </div>
                    </TextAnimations>
                </AbsoluteFill>
            </Sequence>
        );
    },
    image: (item: MediaFile, options: SequenceItemOptions) => {
        const { fps } = options;
        
        // Validate that the media has a valid src
        if (!item.src) {
            console.error(`Image file ${item.id} has no src URL`, item);
            return <div key={item.id} style={{ display: 'none' }} />;
        }

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );
        
        // Use durationInFrames as is for images (no video trim needed)
        const actualDurationInFrames = durationInFrames;

        const crop = item.crop || {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        };

        // If no position/size is set, default to full canvas
        const hasCustomPosition = (item.x !== undefined && item.x !== 0) || 
                                (item.y !== undefined && item.y !== 0) || 
                                (item.width !== undefined) || 
                                (item.height !== undefined);

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={actualDurationInFrames + REMOTION_SAFE_FRAME}
                style={{ pointerEvents: "none" }}
            >
                <AbsoluteFill
                    data-track-item="transition-element"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                    style={{
                        pointerEvents: "auto",
                        top: hasCustomPosition ? (item.y || 0) : 0,
                        left: hasCustomPosition ? (item.x || 0) : 0,
                        width: hasCustomPosition ? (crop.width || item.width || "100%") : "100%",
                        height: hasCustomPosition ? (crop.height || item.height || "100%") : "100%",
                        overflow: "hidden",
                        borderRadius: hasCustomPosition ? `10px` : 0,
                    }}
                >
                    <EffectsWrapper 
                        media={item} 
                        durationInFrames={actualDurationInFrames}
                        fps={fps}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                pointerEvents: "none",
                            }}
                        >
                            <Img
                            style={{
                                pointerEvents: "none",
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                objectFit: hasCustomPosition ? "cover" : "contain",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: item.zIndex || 0,
                            }}
                            data-id={item.id}
                            src={item.src || ""}
                        />
                        </div>
                    </EffectsWrapper>
                </AbsoluteFill>
            </Sequence>
        );
    },
    audio: (item: MediaFile, options: SequenceItemOptions) => {
        const { fps } = options;
        
        // Validate that the media has a valid src
        if (!item.src) {
            console.error(`Audio file ${item.id} has no src URL`, item);
            return <div key={item.id} style={{ display: 'none' }} />;
        }
        
        const playbackRate = item.playbackSpeed || 1;
        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart / playbackRate,
                to: item.positionEnd / playbackRate
            },
            fps
        );

        // For split audio with original bounds, calculate the actual trim points
        let trimFrom = item.startTime;
        let trimTo = item.endTime;
        
        if (item.originalStartTime !== undefined && item.originalEndTime !== undefined) {
            // This is a split audio - adjust trim to reference the original source
            trimFrom = item.originalStartTime + item.startTime;
            trimTo = item.originalStartTime + item.endTime;
        }

        const trim = {
            from: trimFrom / playbackRate,
            to: trimTo / playbackRate
        };
        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                style={{
                    userSelect: "none",
                    pointerEvents: "none"
                }}
            >
                <AbsoluteFill>
                    <Audio
                        startFrom={(trim.from) * fps}
                        endAt={(trim.to) * fps + REMOTION_SAFE_FRAME}
                        playbackRate={playbackRate}
                        src={item.src || ""}
                        volume={item.volume !== undefined ? item.volume / 100 : 1}
                    />
                </AbsoluteFill>
            </Sequence>
        );
    },
    instagram: (item: InstagramConversation, options: SequenceItemOptions) => {
        const { fps } = options;

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        // Check if custom position is set
        const hasCustomPosition = (item.x !== undefined) || 
                                (item.y !== undefined) || 
                                (item.width !== undefined) || 
                                (item.height !== undefined);

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames}
                layout="none"
            >
                <div
                    data-track-item="instagram-conversation"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-instagram`}
                    style={{
                        position: "absolute",
                        pointerEvents: "none",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: item.zIndex !== undefined ? item.zIndex : (1000 - (item.row * 10)),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: "transparent",
                    }}
                >
                    <InstagramSequenceWrapper conversation={item} />
                </div>
            </Sequence>
        );
    },
    whatsapp: (item: WhatsAppConversation, options: SequenceItemOptions) => {
        const { fps } = options;

        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );

        // Check if custom position is set
        const hasCustomPosition = (item.x !== undefined) || 
                                (item.y !== undefined) || 
                                (item.width !== undefined) || 
                                (item.height !== undefined);

        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames}
                layout="none"
            >
                <div
                    data-track-item="whatsapp-conversation"
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-whatsapp`}
                    style={{
                        position: "absolute",
                        pointerEvents: "none",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: item.zIndex !== undefined ? item.zIndex : (1000 - (item.row * 10)),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: "transparent",
                    }}
                >
                    <WhatsAppSequenceWrapper conversation={item} />
                </div>
            </Sequence>
        );
    }
};
