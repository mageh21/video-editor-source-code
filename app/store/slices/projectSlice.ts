import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TextElement, MediaFile, ActiveElement, ExportConfig, CaptionTrack, Caption, InstagramConversation, WhatsAppConversation, ITransition } from '../../types';
import { ProjectState } from '../../types';

export const initialState: ProjectState = {
    id: crypto.randomUUID(),
    projectName: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mediaFiles: [],
    textElements: [],
    instagramConversations: [],
    whatsappConversations: [],
    captionTracks: [],
    activeCaptionTrackId: null,
    showCaptions: true,
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
    duration: 30,
    zoomLevel: 1,
    timelineZoom: 100,
    enableMarkerTracking: true,
    enableSnapping: true,
    selectedMediaIds: [],
    selectedTextIds: [],
    selectedCaptionIds: [],
    selectedInstagramConversationIds: [],
    selectedWhatsAppConversationIds: [],
    visibleRows: 5,
    maxRows: 8,
    activeSection: 'media',
    activeElement: null,
    activeElementIndex: 0,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: '16:9',
    history: [],
    future: [],
    exportSettings: {
        resolution: '1080p',
        quality: 'high',
        speed: 'fastest',
        fps: 30,
        format: 'mp4',
        includeSubtitles: false,
    },
    betweenClipTransitions: {},
    transitionIds: [],
};

const calculateTotalDuration = (
    mediaFiles: MediaFile[],
    textElements: TextElement[],
    instagramConversations: InstagramConversation[] = [],
    whatsappConversations: WhatsAppConversation[] = []
): number => {
    const mediaDurations = mediaFiles.map(v => v.positionEnd);
    const textDurations = textElements.map(v => v.positionEnd);
    const instagramDurations = instagramConversations.map(c => c.positionEnd);
    const whatsappDurations = whatsappConversations.map(c => c.positionEnd);
    const allDurations = [...mediaDurations, ...textDurations, ...instagramDurations, ...whatsappDurations];
    
    // If no elements exist, return a default duration of 30 seconds
    if (allDurations.length === 0) {
        return 30;
    }
    
    // Ensure we have a valid finite number
    const maxDuration = Math.max(...allDurations);
    return isFinite(maxDuration) ? Math.max(1, maxDuration) : 30;
};

const projectStateSlice = createSlice({
    name: 'projectState',
    initialState,
    reducers: {
        setMediaFiles: (state, action: PayloadAction<MediaFile[]>) => {
            state.mediaFiles = action.payload;
            // Calculate duration based on the last video's end time
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setProjectName: (state, action: PayloadAction<string>) => {
            state.projectName = action.payload;
        },
        setProjectId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setProjectCreatedAt: (state, action: PayloadAction<string>) => {
            state.createdAt = action.payload;
        },
        setProjectLastModified: (state, action: PayloadAction<string>) => {
            state.lastModified = action.payload;
        },

        setTextElements: (state, action: PayloadAction<TextElement[]>) => {
            state.textElements = action.payload;
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            // Ensure currentTime is always a valid finite number
            const time = action.payload;
            state.currentTime = isFinite(time) ? Math.max(0, time) : 0;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setIsMuted: (state, action: PayloadAction<boolean>) => {
            state.isMuted = action.payload;
        },
        setActiveSection: (state, action: PayloadAction<ActiveElement>) => {
            state.activeSection = action.payload;
        },
        setActiveElement: (state, action: PayloadAction<ActiveElement | null>) => {
            state.activeElement = action.payload;
        },
        setActiveElementIndex: (state, action: PayloadAction<number>) => {
            state.activeElementIndex = action.payload;
        },
        setFilesID: (state, action: PayloadAction<string[]>) => {
            state.filesID = action.payload;
        },
        setExportSettings: (state, action: PayloadAction<ExportConfig>) => {
            state.exportSettings = action.payload;
        },
        setResolution: (state, action: PayloadAction<string>) => {
            state.exportSettings.resolution = action.payload;
        },
        setQuality: (state, action: PayloadAction<string>) => {
            state.exportSettings.quality = action.payload;
        },
        setSpeed: (state, action: PayloadAction<string>) => {
            state.exportSettings.speed = action.payload;
        },
        setFps: (state, action: PayloadAction<number>) => {
            state.exportSettings.fps = action.payload;
        },
        setCanvasResolution: (state, action: PayloadAction<{ width: number; height: number }>) => {
            state.resolution = action.payload;
        },
        setAspectRatio: (state, action: PayloadAction<string>) => {
            state.aspectRatio = action.payload;
        },
        setTimelineZoom: (state, action: PayloadAction<number>) => {
            state.timelineZoom = action.payload;
        },
        setMarkerTrack: (state, action: PayloadAction<boolean>) => {
            state.enableMarkerTracking = action.payload;
        },
        setEnableSnapping: (state, action: PayloadAction<boolean>) => {
            state.enableSnapping = action.payload;
        },
        setSelectedMediaIds: (state, action: PayloadAction<string[]>) => {
            state.selectedMediaIds = action.payload;
        },
        setSelectedTextIds: (state, action: PayloadAction<string[]>) => {
            state.selectedTextIds = action.payload;
        },
        addToSelection: (state, action: PayloadAction<{ mediaIds?: string[]; textIds?: string[] }>) => {
            if (action.payload.mediaIds) {
                state.selectedMediaIds = Array.from(new Set([...state.selectedMediaIds, ...action.payload.mediaIds]));
            }
            if (action.payload.textIds) {
                state.selectedTextIds = Array.from(new Set([...state.selectedTextIds, ...action.payload.textIds]));
            }
        },
        clearSelection: (state) => {
            state.selectedMediaIds = [];
            state.selectedTextIds = [];
            state.selectedCaptionIds = [];
            state.selectedInstagramConversationIds = [];
            state.selectedWhatsAppConversationIds = [];
        },
        // Caption actions
        addCaptionTrack: (state, action: PayloadAction<CaptionTrack>) => {
            state.captionTracks.push(action.payload);
            if (state.captionTracks.length === 1) {
                state.activeCaptionTrackId = action.payload.id;
            }
        },
        removeCaptionTrack: (state, action: PayloadAction<string>) => {
            state.captionTracks = state.captionTracks.filter(track => track.id !== action.payload);
            if (state.activeCaptionTrackId === action.payload) {
                state.activeCaptionTrackId = state.captionTracks.length > 0 ? state.captionTracks[0].id : null;
            }
        },
        updateCaptionTrack: (state, action: PayloadAction<{ id: string; updates: Partial<CaptionTrack> }>) => {
            const trackIndex = state.captionTracks.findIndex(track => track.id === action.payload.id);
            if (trackIndex !== -1) {
                state.captionTracks[trackIndex] = {
                    ...state.captionTracks[trackIndex],
                    ...action.payload.updates
                };
            }
        },
        setActiveCaptionTrack: (state, action: PayloadAction<string | null>) => {
            state.activeCaptionTrackId = action.payload;
        },
        setShowCaptions: (state, action: PayloadAction<boolean>) => {
            state.showCaptions = action.payload;
        },
        addCaption: (state, action: PayloadAction<{ trackId: string; caption: Caption }>) => {
            const track = state.captionTracks.find(t => t.id === action.payload.trackId);
            if (track) {
                track.captions.push(action.payload.caption);
                // Sort captions by start time
                track.captions.sort((a, b) => ((a as any).start ?? a.startMs) - ((b as any).start ?? b.startMs));
            }
        },
        updateCaption: (state, action: PayloadAction<{ trackId: string; captionId: string; updates: Partial<Caption> }>) => {
            const track = state.captionTracks.find(t => t.id === action.payload.trackId);
            if (track) {
                const captionIndex = track.captions.findIndex(c => c.id === action.payload.captionId);
                if (captionIndex !== -1) {
                    track.captions[captionIndex] = {
                        ...track.captions[captionIndex],
                        ...action.payload.updates
                    };
                    // Re-sort after update
                    track.captions.sort((a, b) => ((a as any).start ?? a.startMs) - ((b as any).start ?? b.startMs));
                }
            }
        },
        removeCaption: (state, action: PayloadAction<{ trackId: string; captionId: string }>) => {
            const track = state.captionTracks.find(t => t.id === action.payload.trackId);
            if (track) {
                track.captions = track.captions.filter(c => c.id !== action.payload.captionId);
            }
        },
        setSelectedCaptionIds: (state, action: PayloadAction<string[]>) => {
            state.selectedCaptionIds = action.payload;
        },
        // Instagram Conversation actions
        addInstagramConversation: (state, action: PayloadAction<InstagramConversation>) => {
            state.instagramConversations.push(action.payload);
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        updateInstagramConversation: (state, action: PayloadAction<InstagramConversation>) => {
            const index = state.instagramConversations.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.instagramConversations[index] = action.payload;
                state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
            }
        },
        removeInstagramConversation: (state, action: PayloadAction<string>) => {
            state.instagramConversations = state.instagramConversations.filter(c => c.id !== action.payload);
            state.selectedInstagramConversationIds = state.selectedInstagramConversationIds.filter(id => id !== action.payload);
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setInstagramConversations: (state, action: PayloadAction<InstagramConversation[]>) => {
            state.instagramConversations = action.payload;
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setSelectedInstagramConversationIds: (state, action: PayloadAction<string[]>) => {
            state.selectedInstagramConversationIds = action.payload;
        },
        // WhatsApp Conversation actions
        addWhatsAppConversation: (state, action: PayloadAction<WhatsAppConversation>) => {
            state.whatsappConversations.push(action.payload);
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        updateWhatsAppConversation: (state, action: PayloadAction<WhatsAppConversation>) => {
            const index = state.whatsappConversations.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.whatsappConversations[index] = action.payload;
                state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
            }
        },
        removeWhatsAppConversation: (state, action: PayloadAction<string>) => {
            state.whatsappConversations = state.whatsappConversations.filter(c => c.id !== action.payload);
            state.selectedWhatsAppConversationIds = state.selectedWhatsAppConversationIds.filter(id => id !== action.payload);
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setWhatsAppConversations: (state, action: PayloadAction<WhatsAppConversation[]>) => {
            state.whatsappConversations = action.payload;
            state.duration = calculateTotalDuration(state.mediaFiles, state.textElements, state.instagramConversations, state.whatsappConversations);
        },
        setSelectedWhatsAppConversationIds: (state, action: PayloadAction<string[]>) => {
            state.selectedWhatsAppConversationIds = action.payload;
        },
        setVisibleRows: (state, action: PayloadAction<number>) => {
            state.visibleRows = Math.min(Math.max(1, action.payload), state.maxRows);
        },
        addRow: (state) => {
            if (state.visibleRows < state.maxRows) {
                state.visibleRows += 1;
            }
        },
        removeRow: (state) => {
            if (state.visibleRows > 1) {
                state.visibleRows -= 1;
                // Move elements from removed row to the last visible row
                const removedRow = state.visibleRows;
                state.mediaFiles = state.mediaFiles.map(file => 
                    file.row === removedRow ? { ...file, row: state.visibleRows - 1 } : file
                );
                state.textElements = state.textElements.map(text => 
                    text.row === removedRow ? { ...text, row: state.visibleRows - 1 } : text
                );
                state.instagramConversations = state.instagramConversations.map(conv => 
                    conv.row === removedRow ? { ...conv, row: state.visibleRows - 1 } : conv
                );
            }
        },
        swapRows: (state, action: PayloadAction<{ row1: number; row2: number }>) => {
            const { row1, row2 } = action.payload;
            // Swap media files
            state.mediaFiles = state.mediaFiles.map(file => {
                if (file.row === row1) return { ...file, row: row2 };
                if (file.row === row2) return { ...file, row: row1 };
                return file;
            });
            // Swap text elements
            state.textElements = state.textElements.map(text => {
                if (text.row === row1) return { ...text, row: row2 };
                if (text.row === row2) return { ...text, row: row1 };
                return text;
            });
            // Swap Instagram conversations
            state.instagramConversations = state.instagramConversations.map(conv => {
                if (conv.row === row1) return { ...conv, row: row2 };
                if (conv.row === row2) return { ...conv, row: row1 };
                return conv;
            });
        },
        setCanvasSize: (state, action: PayloadAction<{ width: number; height: number; aspectRatio?: string }>) => {
            state.resolution = { width: action.payload.width, height: action.payload.height };
            if (action.payload.aspectRatio) {
                state.aspectRatio = action.payload.aspectRatio;
            }
        },
        // Special reducer for rehydrating state from IndexedDB
        rehydrate: (state, action: PayloadAction<ProjectState>) => {
            return { ...state, ...action.payload };
        },
        createNewProject: (state) => {
            return { ...initialState };
        },
        // History management
        recordHistory: (state, action: PayloadAction<{ state: Partial<ProjectState>; action: any }>) => {
            // Add current state to history before applying changes
            state.history.push(action.payload.state as any);
            // Limit history size
            if (state.history.length > 50) {
                state.history = state.history.slice(-50);
            }
            // Clear future when new action is recorded
            state.future = [];
        },
        undo: (state) => {
            if (state.history.length > 0) {
                // Save current state to future
                const currentState = {
                    mediaFiles: [...state.mediaFiles],
                    textElements: [...state.textElements],
                    captionTracks: [...state.captionTracks],
                    instagramConversations: [...state.instagramConversations],
                    resolution: { ...state.resolution },
                    fps: state.fps,
                    aspectRatio: state.aspectRatio,
                };
                state.future.push(currentState as any);
                
                // Restore previous state
                const previousState = state.history.pop()!;
                Object.assign(state, previousState);
                
                // Recalculate duration
                state.duration = calculateTotalDuration(
                    state.mediaFiles || [],
                    state.textElements || [],
                    state.instagramConversations || [],
                    state.whatsappConversations || []
                );
            }
        },
        redo: (state) => {
            if (state.future.length > 0) {
                // Save current state to history
                const currentState = {
                    mediaFiles: [...state.mediaFiles],
                    textElements: [...state.textElements],
                    captionTracks: [...state.captionTracks],
                    instagramConversations: [...state.instagramConversations],
                    resolution: { ...state.resolution },
                    fps: state.fps,
                    aspectRatio: state.aspectRatio,
                };
                state.history.push(currentState as any);
                
                // Restore future state
                const futureState = state.future.pop()!;
                Object.assign(state, futureState);
                
                // Recalculate duration
                state.duration = calculateTotalDuration(
                    state.mediaFiles || [],
                    state.textElements || [],
                    state.instagramConversations || [],
                    state.whatsappConversations || []
                );
            }
        },
        clearHistory: (state) => {
            state.history = [];
            state.future = [];
        },
        
        // Transition actions
        addTransition: (state, action: PayloadAction<ITransition>) => {
            const transition = action.payload;
            state.betweenClipTransitions[transition.id] = transition;
            if (!state.transitionIds.includes(transition.id)) {
                state.transitionIds.push(transition.id);
            }
        },
        updateTransition: (state, action: PayloadAction<{ id: string; updates: Partial<ITransition> }>) => {
            const { id, updates } = action.payload;
            if (state.betweenClipTransitions[id]) {
                state.betweenClipTransitions[id] = { ...state.betweenClipTransitions[id], ...updates };
            }
        },
        removeTransition: (state, action: PayloadAction<string>) => {
            const transitionId = action.payload;
            delete state.betweenClipTransitions[transitionId];
            state.transitionIds = state.transitionIds.filter(id => id !== transitionId);
        },
        removeTransitionsForClip: (state, action: PayloadAction<string>) => {
            const clipId = action.payload;
            // Remove all transitions that involve this clip
            const transitionsToRemove = Object.values(state.betweenClipTransitions)
                .filter(t => t.fromId === clipId || t.toId === clipId)
                .map(t => t.id);
            
            transitionsToRemove.forEach(id => {
                delete state.betweenClipTransitions[id];
            });
            state.transitionIds = state.transitionIds.filter(id => !transitionsToRemove.includes(id));
        },
        setTransitions: (state, action: PayloadAction<{ transitions: Record<string, ITransition>; ids: string[] }>) => {
            state.betweenClipTransitions = action.payload.transitions;
            state.transitionIds = action.payload.ids;
        },
    },
});

export const {
    setMediaFiles,
    setTextElements,
    setCurrentTime,
    setProjectName,
    setIsPlaying,
    setFilesID,
    setExportSettings,
    setResolution,
    setQuality,
    setSpeed,
    setFps,
    setCanvasResolution,
    setAspectRatio,
    setMarkerTrack,
    setEnableSnapping,
    setSelectedMediaIds,
    setSelectedTextIds,
    addToSelection,
    clearSelection,
    setVisibleRows,
    addRow,
    removeRow,
    swapRows,
    setIsMuted,
    setActiveSection,
    setActiveElement,
    setActiveElementIndex,
    setTimelineZoom,
    setCanvasSize,
    rehydrate,
    createNewProject,
    // Caption actions
    addCaptionTrack,
    removeCaptionTrack,
    updateCaptionTrack,
    setActiveCaptionTrack,
    setShowCaptions,
    addCaption,
    updateCaption,
    removeCaption,
    setSelectedCaptionIds,
    // Instagram Conversation actions
    addInstagramConversation,
    updateInstagramConversation,
    removeInstagramConversation,
    setInstagramConversations,
    setSelectedInstagramConversationIds,
    // WhatsApp Conversation actions
    addWhatsAppConversation,
    updateWhatsAppConversation,
    removeWhatsAppConversation,
    setWhatsAppConversations,
    setSelectedWhatsAppConversationIds,
    // History actions
    recordHistory,
    undo,
    redo,
    clearHistory,
    // Transition actions
    addTransition,
    updateTransition,
    removeTransition,
    removeTransitionsForClip,
    setTransitions,
} = projectStateSlice.actions;

export default projectStateSlice.reducer; 