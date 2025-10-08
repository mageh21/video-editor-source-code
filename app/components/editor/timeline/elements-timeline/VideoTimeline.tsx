import React, { useRef, useCallback, useMemo } from "react";
import Moveable, { OnScale, OnDrag, OnResize, OnRotate } from "react-moveable";
import { useAppSelector } from "@/app/store";
import { setActiveElement, setActiveElementIndex, setMediaFiles } from "@/app/store/slices/projectSlice";
import { memo, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import Header from "../Header";
import { MediaFile } from "@/app/types";
import { debounce, throttle } from "lodash";
import { TimelineKeyframes } from "../TimelineKeyframes";
// import { getSnapPoints, getSnappedPosition } from "@/app/utils/timelineUtils";

export default function VideoTimeline() {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { mediaFiles, textElements, activeElement, activeElementIndex, timelineZoom, currentTime, enableSnapping } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});
    const [snapIndicators, setSnapIndicators] = useState<number[]>([]);

    // this affect the performance cause of too much re-renders

    // const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
    //     dispatch(setMediaFiles(mediaFiles.map(media =>
    //         media.id === id ? { ...media, ...updates } : media
    //     )));
    // };

    // TODO: this is a hack to prevent the mediaFiles from being updated too often while dragging or resizing
    const mediaFilesRef = useRef(mediaFiles);
    useEffect(() => {
        mediaFilesRef.current = mediaFiles;
    }, [mediaFiles]);

    const onUpdateMedia = useMemo(() =>
        throttle((id: string, updates: Partial<MediaFile>) => {
            const currentFiles = mediaFilesRef.current;
            const updated = currentFiles.map(media =>
                media.id === id ? { ...media, ...updates } : media
            );
            dispatch(setMediaFiles(updated));
        }, 100), [dispatch]
    );

    const handleClick = (element: string, index: number | string) => {
        if (element === 'media') {
            dispatch(setActiveElement('media') as any);
            // TODO: cause we pass id when media to find the right index i will change this later (this happens cause each timeline pass its index not index from mediaFiles array)
            const actualIndex = mediaFiles.findIndex(clip => clip.id === index as unknown as string);
            dispatch(setActiveElementIndex(actualIndex));
        }
    };

    const handleDrag = (clip: MediaFile, target: HTMLElement, left: number) => {
        // no negative left
        const constrainedLeft = Math.max(left, 0);
        let newPositionStart = constrainedLeft / timelineZoom;
        
        // Apply snapping if enabled
        // TODO: Implement snapping functionality
        // if (enableSnapping) {
        //     const snapPoints = getSnapPoints(mediaFiles, textElements, currentTime, clip.id);
        //     const duration = clip.positionEnd - clip.positionStart;
        //     const snappedResult = getSnappedPosition(newPositionStart, duration, snapPoints, timelineZoom, enableSnapping);
        //     
        //     if (snappedResult.snapped) {
        //         newPositionStart = snappedResult.position;
        //         setSnapIndicators([snappedResult.snapPoint!.position]);
        //     } else {
        //         setSnapIndicators([]);
        //     }
        // }
        
        const positionDiff = newPositionStart - clip.positionStart;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: clip.positionEnd + positionDiff,
            endTime: Math.max(clip.endTime + positionDiff, clip.endTime)
        })

        target.style.left = `${newPositionStart * timelineZoom}px`;
    };

    const handleRightResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const adjustedDuration = width / timelineZoom;
        const newPositionEnd = clip.positionStart + adjustedDuration;

        onUpdateMedia(clip.id, {
            positionEnd: newPositionEnd,
            endTime: Math.max(newPositionEnd, clip.endTime)
        })
    };
    const handleLeftResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionStart = width / timelineZoom;
        // Ensure we do not resize beyond the right edge of the clip
        const constrainedLeft = Math.max(clip.positionStart + ((clip.positionEnd - clip.positionStart) - newPositionStart), 0);
        
        // Calculate how much we're trimming from the start
        const trimAmount = constrainedLeft - clip.positionStart;
        const newStartTime = clip.startTime + trimAmount;

        onUpdateMedia(clip.id, {
            positionStart: constrainedLeft,
            startTime: newStartTime,
        })
    };

    useEffect(() => {
        for (const clip of mediaFiles) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [timelineZoom]);

    return (
        <div >
            {/* Snap indicators */}
            {snapIndicators.map((position, index) => (
                <div
                    key={`snap-${index}`}
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-50 pointer-events-none"
                    style={{ left: `${position * timelineZoom}px` }}
                />
            ))}
            
            {mediaFiles
                .filter((clip) => clip.type === 'video')
                .map((clip) => (
                    <div key={clip.id}>
                        <div
                            key={clip.id}
                            ref={(el: HTMLDivElement | null) => {
                                if (el) {
                                    targetRefs.current[clip.id] = el;
                                }
                            }}
                            onClick={() => handleClick('media', clip.id)}
                            className={`timeline-element draggable-media absolute border border-gray-500 border-opacity-50 rounded-md top-2 h-12 rounded bg-[#27272A] text-white text-sm flex items-center justify-center cursor-pointer overflow-hidden ${activeElement === 'media' && mediaFiles[activeElementIndex].id === clip.id ? 'bg-[#3F3F46] border-blue-500' : ''}`}
                            style={{
                                left: `${clip.positionStart * timelineZoom}px`,
                                width: `${(clip.positionEnd - clip.positionStart) * timelineZoom}px`,
                                zIndex: clip.zIndex,
                            }}
                        >
                            {/* Video thumbnails background */}
                            <TimelineKeyframes 
                                media={clip}
                                timelineZoom={timelineZoom}
                            />
                            
                            {/* Video info overlay */}
                            <div className="absolute inset-0 flex items-center px-2 bg-gradient-to-r from-black/60 via-transparent to-black/60">
                                <Image
                                    alt="Video"
                                    className="h-7 w-7 min-w-6 mr-2 flex-shrink-0 drop-shadow-lg"
                                    height={30}
                                    width={30}
                                    src="https://www.svgrepo.com/show/532727/video.svg"
                                />
                                <span className="truncate text-xs font-medium drop-shadow-lg">{clip.fileName}</span>
                            </div>
                        </div>
                        <Moveable
                            ref={(el: Moveable | null) => {
                                if (el) {
                                    moveableRef.current[clip.id] = el;
                                }
                            }}
                            target={targetRefs.current[clip.id] || null}
                            container={null}
                            renderDirections={activeElement === 'media' && mediaFiles[activeElementIndex].id === clip.id ? ['w', 'e'] : []}
                            draggable={true}
                            throttleDrag={0}
                            rotatable={false}
                            onDragStart={({ target, clientX, clientY }) => {
                            }}
                            onDrag={({
                                target,
                                beforeDelta, beforeDist,
                                left,
                                right,
                                delta, dist,
                                transform,
                            }: OnDrag) => {
                                handleClick('media', clip.id)
                                handleDrag(clip, target as HTMLElement, left);
                            }}
                            onDragEnd={({ target, isDrag, clientX, clientY }) => {
                                setSnapIndicators([]);
                            }}

                            /* resizable*/
                            resizable={true}
                            throttleResize={0}
                            onResizeStart={({ target, clientX, clientY }) => {
                            }}
                            onResize={({
                                target, width,
                                delta, direction,
                            }: OnResize) => {
                                if (direction[0] === 1) {
                                    handleClick('media', clip.id)
                                    delta[0] && (target!.style.width = `${width}px`);
                                    handleRightResize(clip, target as HTMLElement, width);
                                }
                                else if (direction[0] === -1) {
                                    // TODO: handle left resize
                                    // handleClick('media', clip.id)
                                    // delta[0] && (target!.style.width = `${width}px`);
                                    // handleLeftResize(clip, target as HTMLElement, width);
                                }
                            }}
                            onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                            }}
                        />
                    </div>

                ))}
        </div>
    );
}
