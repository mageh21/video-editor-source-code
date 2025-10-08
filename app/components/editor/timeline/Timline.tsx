import { useAppSelector } from "@/app/store";
import { setMarkerTrack, setTextElements, setMediaFiles, setTimelineZoom, setCurrentTime, setIsPlaying, setActiveElement, setEnableSnapping, addRow, removeRow } from "@/app/store/slices/projectSlice";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import Header from "./Header";
import TimelineGrid from "./TimelineGrid";
import { throttle } from 'lodash';
import GlobalKeyHandlerProps from "../../../components/editor/keys/GlobalKeyHandlerProps";
import toast from "react-hot-toast";
export const Timeline = () => {
    const { currentTime, timelineZoom, enableMarkerTracking, enableSnapping, activeElement, activeElementIndex, mediaFiles, textElements, duration, isPlaying, visibleRows, maxRows } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const timelineRef = useRef<HTMLDivElement>(null)

    const throttledZoom = useMemo(() =>
        throttle((value: number) => {
            dispatch(setTimelineZoom(value));
        }, 100),
        [dispatch]
    );

    const handleSplit = () => {
        let element = null;
        let elements = null;
        let setElements = null;

        if (!activeElement) {
            toast.error('No element selected.');
            return;
        }

        if (activeElement === 'media') {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;

            if (!element) {
                toast.error('No element selected.');
                return;
            }

            const { positionStart, positionEnd } = element;

            if (currentTime <= positionStart || currentTime >= positionEnd) {
                toast.error('Marker is outside the selected element bounds.');
                return;
            }

            const positionDuration = positionEnd - positionStart;

            // Media logic (uses startTime/endTime for trimming)
            const { startTime, endTime } = element;
            const sourceDuration = endTime - startTime;
            const ratio = (currentTime - positionStart) / positionDuration;
            const splitSourceOffset = startTime + ratio * sourceDuration;

            const firstPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart,
                positionEnd: currentTime,
                startTime,
                endTime: splitSourceOffset,
                row: element.row // Preserve row
            };

            const secondPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                positionEnd,
                startTime: splitSourceOffset,
                endTime,
                row: element.row // Preserve row
            };

            elements.splice(activeElementIndex, 1, firstPart, secondPart);
        } else if (activeElement === 'text') {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;

            if (!element) {
                toast.error('No element selected.');
                return;
            }

            const { positionStart, positionEnd } = element;

            if (currentTime <= positionStart || currentTime >= positionEnd) {
                toast.error('Marker is outside the selected element.');
                return;
            }

            const firstPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart,
                positionEnd: currentTime,
                row: element.row // Preserve row
            };

            const secondPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                positionEnd,
                row: element.row // Preserve row
            };

            elements.splice(activeElementIndex, 1, firstPart, secondPart);
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success('Element split successfully.');
        }
    };

    const handleDuplicate = () => {
        let element = null;
        let elements = null;
        let setElements = null;

        if (activeElement === 'media') {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === 'text') {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
        }

        if (!element) {
            toast.error('No element selected.');
            return;
        }

        const duplicatedElement = {
            ...element,
            id: crypto.randomUUID(),
            row: element.row // Preserve row
        };

        if (elements) {
            elements.splice(activeElementIndex + 1, 0, duplicatedElement as any);
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success('Element duplicated successfully.');
        }
    };

    const handleDelete = () => {
        // @ts-ignore
        let element = null;
        let elements = null;
        let setElements = null;

        if (activeElement === 'media') {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === 'text') {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
        }

        if (!element) {
            toast.error('No element selected.');
            return;
        }

        if (elements) {
            // @ts-ignore
            elements = elements.filter(ele => ele.id !== element.id)
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success('Element deleted successfully.');
        }
    };


    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        dispatch(setIsPlaying(false));
        const rect = timelineRef.current.getBoundingClientRect();

        const scrollOffset = timelineRef.current.scrollLeft;
        const offsetX = e.clientX - rect.left + scrollOffset;

        const seconds = offsetX / timelineZoom;
        const clampedTime = Math.max(0, Math.min(duration, seconds));

        dispatch(setCurrentTime(clampedTime));
    };

    return (
        <div className="flex w-full flex-col">
            <div className="flex flex-row items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
                <div className="flex flex-row items-center gap-1">
                    {/* Track Marker */}
                    <button
                        onClick={() => dispatch(setMarkerTrack(!enableMarkerTracking))}
                        className={`px-3 py-1.5 rounded-md transition-colors flex flex-row items-center justify-center text-sm font-medium ${
                            enableMarkerTracking 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Track Marker (T)"
                    >
                        {enableMarkerTracking ? (
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">Track Marker</span>
                    </button>

                    {/* Snapping */}
                    <button
                        onClick={() => dispatch(setEnableSnapping(!enableSnapping))}
                        className={`px-3 py-1.5 rounded-md transition-colors flex flex-row items-center justify-center text-sm font-medium ${
                            enableSnapping 
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Enable Snapping"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="hidden sm:inline">Snap</span>
                    </button>

                    {/* Split */}
                    <button
                        onClick={handleSplit}
                        className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors flex flex-row items-center justify-center text-gray-300 text-sm font-medium"
                        title="Split (S)"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="hidden sm:inline">Split</span>
                    </button>

                    {/* Duplicate */}
                    <button
                        onClick={handleDuplicate}
                        className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors flex flex-row items-center justify-center text-gray-300 text-sm font-medium"
                        title="Duplicate (D)"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Duplicate</span>
                    </button>

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-red-600 transition-colors flex flex-row items-center justify-center text-gray-300 hover:text-white text-sm font-medium"
                        title="Delete (Del)"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                </div>

                {/* Timeline Zoom */}
                <div className="flex flex-row items-center gap-2">
                    <label className="text-sm font-medium text-gray-300">Zoom</label>
                    <span className="text-gray-400">-</span>
                    <input
                        type="range"
                        min={30}
                        max={120}
                        step="1"
                        value={timelineZoom}
                        onChange={(e) => throttledZoom(Number(e.target.value))}
                        className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-gray-400">+</span>
                </div>

                {/* Row controls */}
                <div className="flex flex-row items-center gap-2">
                    <label className="text-sm font-medium text-gray-300">Tracks</label>
                    <button
                        onClick={() => dispatch(removeRow())}
                        disabled={visibleRows <= 1}
                        className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Track"
                    >
                        -
                    </button>
                    <span className="text-sm text-gray-400 min-w-[20px] text-center">{visibleRows}</span>
                    <button
                        onClick={() => dispatch(addRow())}
                        disabled={visibleRows >= maxRows}
                        className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add Track"
                    >
                        +
                    </button>
                </div>
            </div>

            <div
                className="relative overflow-x-auto w-full bg-gray-800 z-10"
                ref={timelineRef}
                onClick={handleClick}
            >
                {/* Timeline Header */}
                <Header />

                <div className="bg-gray-800 relative" style={{ width: "100%" }}>
                    {/* Timeline cursor */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white z-50 shadow-lg"
                        style={{
                            left: `${currentTime * timelineZoom}px`,
                        }}
                    />
                    
                    {/* Timeline grid */}
                    <TimelineGrid />
                </div>
            </div>
            <GlobalKeyHandlerProps handleDuplicate={handleDuplicate} handleSplit={handleSplit} handleDelete={handleDelete} />
        </div>

    );
};

export default memo(Timeline)
