import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setIsPlaying, setCurrentTime, setMediaFiles, setTextElements } from '@/app/store/slices/projectSlice';
import toast from 'react-hot-toast';
import { MediaFile, TextElement } from '@/app/types';

export const useTimelineShortcuts = () => {
    const dispatch = useAppDispatch();
    const { 
        isPlaying, 
        currentTime, 
        duration, 
        activeElement, 
        activeElementIndex,
        mediaFiles,
        textElements 
    } = useAppSelector((state) => state.projectState);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Space: Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                dispatch(setIsPlaying(!isPlaying));
            }

            // Arrow keys: Navigate timeline
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1; // Shift for larger jumps
                dispatch(setCurrentTime(Math.max(0, currentTime - step)));
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                dispatch(setCurrentTime(Math.min(duration, currentTime + step)));
            }

            // Home/End: Jump to start/end
            if (e.code === 'Home') {
                e.preventDefault();
                dispatch(setCurrentTime(0));
            }
            if (e.code === 'End') {
                e.preventDefault();
                dispatch(setCurrentTime(duration));
            }

            // S: Split at playhead
            if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                // Trigger the TimelineSection split button click
                const splitButton = document.querySelector('button[title="Split (S)"]') as HTMLButtonElement;
                if (splitButton && !splitButton.disabled) {
                    splitButton.click();
                    console.log('🔴 useTimelineShortcuts: Triggered TimelineSection split via button click');
                } else {
                    console.log('🔴 useTimelineShortcuts: Split button not found or disabled');
                }
            }

            // D: Duplicate selected
            if (e.code === 'KeyD' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                handleDuplicate();
            }

            // Delete/Backspace: Delete selected
            if (e.code === 'Delete' || e.code === 'Backspace') {
                e.preventDefault();
                handleDelete();
            }

            // Cmd/Ctrl + Z: Undo (placeholder)
            if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                toast('Undo not implemented yet');
            }

            // Cmd/Ctrl + Shift + Z: Redo (placeholder)
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyZ') {
                e.preventDefault();
                toast('Redo not implemented yet');
            }
        };

        const handleSplit = () => {
            console.log('🔴 useTimelineShortcuts handleSplit called');
            if (!activeElement || activeElementIndex === -1) {
                toast.error('No element selected');
                return;
            }

            const elements = activeElement === 'media' ? [...mediaFiles] : [...textElements];
            const element = elements[activeElementIndex];

            if (!element || currentTime <= element.positionStart || currentTime >= element.positionEnd) {
                toast.error('Position playhead within element to split');
                return;
            }

            // Calculate split ratios for proper video timing
            const totalDuration = element.positionEnd - element.positionStart;
            const firstDuration = currentTime - element.positionStart;
            const secondDuration = element.positionEnd - currentTime;

            // Calculate the split point in the source video
            const sourceVideoDuration = (element as any).endTime - (element as any).startTime;
            const splitRatio = firstDuration / totalDuration;
            const sourceSplitPoint = (element as any).startTime + (splitRatio * sourceVideoDuration);

            const firstPart = {
                ...element,
                id: crypto.randomUUID(),
                positionEnd: currentTime,
                // For media files, adjust the endTime to match the split point
                endTime: activeElement === 'media' ? sourceSplitPoint : (element as any).endTime
            };

            const secondPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                // For media files, adjust the startTime to begin from the split point
                startTime: activeElement === 'media' ? sourceSplitPoint : (element as any).startTime,
                // Keep the original endTime for media files
                endTime: (element as any).endTime
            };

            // Debug logging to verify properties are copied correctly
            if (activeElement === 'media') {
                console.log('🔪 SPLIT DEBUG - Video Split Operation:', {
                    originalElement: {
                        id: element.id,
                        positionStart: element.positionStart,
                        positionEnd: element.positionEnd,
                        startTime: (element as any).startTime,
                        endTime: (element as any).endTime,
                        duration: (element as any).endTime - (element as any).startTime,
                        timelineDuration: element.positionEnd - element.positionStart,
                        fileName: (element as any).fileName
                    },
                    splitPoint: {
                        currentTime,
                        splitRatio,
                        sourceSplitPoint,
                        sourceVideoDuration
                    },
                    firstPart: {
                        id: firstPart.id,
                        positionStart: firstPart.positionStart,
                        positionEnd: firstPart.positionEnd,
                        startTime: (firstPart as any).startTime,
                        endTime: (firstPart as any).endTime,
                        duration: (firstPart as any).endTime - (firstPart as any).startTime,
                        timelineDuration: firstPart.positionEnd - firstPart.positionStart
                    },
                    secondPart: {
                        id: secondPart.id,
                        positionStart: secondPart.positionStart,
                        positionEnd: secondPart.positionEnd,
                        startTime: (secondPart as any).startTime,
                        endTime: (secondPart as any).endTime,
                        duration: (secondPart as any).endTime - (secondPart as any).startTime,
                        timelineDuration: secondPart.positionEnd - secondPart.positionStart
                    }
                });
            }

            if (activeElement === 'media') {
                const mediaElements = elements as MediaFile[];
                mediaElements.splice(activeElementIndex, 1, firstPart as MediaFile, secondPart as MediaFile);
                dispatch(setMediaFiles(mediaElements));
            } else {
                const textElementsArray = elements as TextElement[];
                textElementsArray.splice(activeElementIndex, 1, firstPart as TextElement, secondPart as TextElement);
                dispatch(setTextElements(textElementsArray));
            }
            
            // Keep the same activeElementIndex since we're replacing the original element with two new ones
            // The first part will be at the same index

            toast.success('Element split');
        };

        const handleDuplicate = () => {
            if (!activeElement || activeElementIndex === -1) {
                toast.error('No element selected');
                return;
            }

            let element: MediaFile | TextElement | undefined;
            if (activeElement === 'media') {
                element = mediaFiles[activeElementIndex];
            } else {
                element = textElements[activeElementIndex];
            }

            if (!element) return;

            const duration = element.positionEnd - element.positionStart;
            
            if (activeElement === 'media') {
                const newElement: MediaFile = {
                    ...(element as MediaFile),
                    id: crypto.randomUUID(),
                    positionStart: element.positionEnd + 0.5,
                    positionEnd: element.positionEnd + duration + 0.5
                };
                dispatch(setMediaFiles([...mediaFiles, newElement]));
            } else {
                const newElement: TextElement = {
                    ...(element as TextElement),
                    id: crypto.randomUUID(),
                    positionStart: element.positionEnd + 0.5,
                    positionEnd: element.positionEnd + duration + 0.5
                };
                dispatch(setTextElements([...textElements, newElement]));
            }

            toast.success('Element duplicated');
        };

        const handleDelete = () => {
            if (!activeElement || activeElementIndex === -1) {
                toast.error('No element selected');
                return;
            }

            if (activeElement === 'media') {
                const filtered = mediaFiles.filter((_, index) => index !== activeElementIndex);
                dispatch(setMediaFiles(filtered));
            } else {
                const filtered = textElements.filter((_, index) => index !== activeElementIndex);
                dispatch(setTextElements(filtered));
            }

            toast.success('Element deleted');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        dispatch, 
        isPlaying, 
        currentTime, 
        duration, 
        activeElement, 
        activeElementIndex,
        mediaFiles,
        textElements
    ]);
};

export default useTimelineShortcuts;