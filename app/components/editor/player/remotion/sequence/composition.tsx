import { storeProject, useAppDispatch, useAppSelector } from "@/app/store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement, InstagramConversation, WhatsAppConversation } from "@/app/types";
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { use, useCallback, useEffect, useRef, useState } from "react";
import { setCurrentTime, setMediaFiles } from "@/app/store/slices/projectSlice";
import { FontPreloader } from "../FontPreloader";
import { CaptionRenderer } from "../../../captions/CaptionRenderer";
import { TransitionOverlay } from "../TransitionOverlay";

const Composition = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { mediaFiles, textElements, instagramConversations, whatsappConversations, resolution, showCaptions, betweenClipTransitions, transitionIds } = projectState;
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();
    const { width, height } = useVideoConfig();
    const fps = 30;

    const THRESHOLD = 0.1; // Minimum change to trigger dispatch (in seconds)
    const previousTime = useRef(0); // Store previous time to track changes
    

    useEffect(() => {
        const currentTimeInSeconds = frame / fps;
        if (isFinite(currentTimeInSeconds) && Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
            dispatch(setCurrentTime(currentTimeInSeconds));
            previousTime.current = currentTimeInSeconds;
        }
    }, [frame, dispatch, fps]);
    
    // Sort media files by row and then by zIndex
    const sortedMediaFiles = [...mediaFiles].sort((a, b) => {
        // Sort by row - higher row numbers render first (background)
        // Row 0 is top track and renders last (foreground)
        if (a.row !== b.row) {
            return (b.row || 0) - (a.row || 0); // Higher rows first (background)
        }
        // Then sort by zIndex within the same row
        return (a.zIndex || 0) - (b.zIndex || 0);
    });
    
    // Sort text elements similarly
    const sortedTextElements = [...textElements].sort((a, b) => {
        if (a.row !== b.row) {
            return (b.row || 0) - (a.row || 0); // Higher rows first (background)
        }
        return (a.zIndex || 0) - (b.zIndex || 0);
    });
    
    // Sort Instagram conversations similarly
    const sortedInstagramConversations = [...instagramConversations].sort((a, b) => {
        if (a.row !== b.row) {
            return (b.row || 0) - (a.row || 0); // Higher rows first (background)
        }
        return (a.zIndex || 0) - (b.zIndex || 0);
    });
    
    // Sort WhatsApp conversations similarly
    const sortedWhatsAppConversations = [...whatsappConversations].sort((a, b) => {
        if (a.row !== b.row) {
            return (b.row || 0) - (a.row || 0); // Higher rows first (background)
        }
        return (a.zIndex || 0) - (b.zIndex || 0);
    });
    
    // Combine all elements for proper layering
    type RenderableElement = (MediaFile & { elementType: 'media' }) | 
                            (TextElement & { elementType: 'text' }) | 
                            (InstagramConversation & { elementType: 'instagram' }) | 
                            (WhatsAppConversation & { elementType: 'whatsapp' });
    
    const allElements: RenderableElement[] = [
        ...sortedMediaFiles.map(m => ({ ...m, elementType: 'media' as const })),
        ...sortedTextElements.map(t => ({ ...t, elementType: 'text' as const })),
        ...sortedInstagramConversations.map(i => ({ ...i, elementType: 'instagram' as const })),
        ...sortedWhatsAppConversations.map(w => ({ ...w, elementType: 'whatsapp' as const }))
    ];
    
    // Sort all elements together by row and z-index
    const sortedElements = allElements.sort((a, b) => {
        // Calculate effective z-index based on row position
        const aZIndex = a.zIndex !== undefined ? a.zIndex : (1000 - (a.row || 0) * 10);
        const bZIndex = b.zIndex !== undefined ? b.zIndex : (1000 - (b.row || 0) * 10);
        return aZIndex - bZIndex; // Lower z-index renders first
    });
    
    return (
        <FontPreloader>
            {sortedElements.map((element, index) => {
                if (!element) return null;
                
                if (element.elementType === 'media') {
                    const item = element as MediaFile;
                    return SequenceItem[item.type](item, { fps });
                } else if (element.elementType === 'text') {
                    const item = element as TextElement;
                    return SequenceItem["text"](item, { fps });
                } else if (element.elementType === 'instagram') {
                    const item = element as InstagramConversation;
                    return SequenceItem["instagram"](item, { fps });
                } else if (element.elementType === 'whatsapp') {
                    const item = element as WhatsAppConversation;
                    return SequenceItem["whatsapp"](item, { fps });
                }
                
                return null;
            })}
            {showCaptions && <CaptionRenderer />}
            
            {/* Render transition overlays */}
            {transitionIds.map((transitionId) => {
                const transition = betweenClipTransitions[transitionId];
                if (!transition || transition.kind === "none") return null;
                
                const fromClip = mediaFiles.find(m => m.id === transition.fromId);
                const toClip = mediaFiles.find(m => m.id === transition.toId);
                
                if (!fromClip || !toClip) return null;
                
                // Convert times to frames
                const fromStart = Math.round(fromClip.positionStart * fps);
                const fromEnd = Math.round(fromClip.positionEnd * fps);
                const toStart = Math.round(toClip.positionStart * fps);
                const toEnd = Math.round(toClip.positionEnd * fps);
                
                return (
                    <TransitionOverlay
                        key={`transition-${transitionId}`}
                        transition={transition}
                        fromStart={fromStart}
                        fromEnd={fromEnd}
                        toStart={toStart}
                        toEnd={toEnd}
                        fps={fps}
                    />
                );
            })}
        </FontPreloader>
    );
};

export default Composition;
