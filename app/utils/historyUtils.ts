import { ProjectState } from '@/app/types';

// Actions that should not be recorded in history
export const NON_HISTORY_ACTIONS = [
  'setCurrentTime',
  'setIsPlaying',
  'setIsMuted',
  'setTimelineZoom',
  'setZoomLevel',
  'setActiveElement',
  'setActiveElementIndex',
  'setSelectedMediaIds',
  'setSelectedTextIds',
  'setSelectedCaptionIds',
  'setSelectedInstagramConversationIds',
  'addToSelection',
  'clearSelection',
  'setVisibleRows',
  'setActiveSection',
  'undo',
  'redo',
  'recordHistory',
  'rehydrate',
];

// Actions that should be debounced before recording
export const DEBOUNCED_ACTIONS = {
  'updateMediaProperty': 300, // ms
  'updateTextProperty': 300,
  'updateCaptionProperty': 300,
};

// Create a deep clone of the state for history
export const cloneState = (state: Partial<ProjectState>): Partial<ProjectState> => {
  // We only need to track certain parts of the state
  return {
    mediaFiles: JSON.parse(JSON.stringify(state.mediaFiles || [])),
    textElements: JSON.parse(JSON.stringify(state.textElements || [])),
    captionTracks: JSON.parse(JSON.stringify(state.captionTracks || [])),
    instagramConversations: JSON.parse(JSON.stringify(state.instagramConversations || [])),
    resolution: state.resolution ? { ...state.resolution } : undefined,
    fps: state.fps,
    aspectRatio: state.aspectRatio,
  };
};

// Compare two states to check if they're different
export const statesAreDifferent = (state1: Partial<ProjectState>, state2: Partial<ProjectState>): boolean => {
  return JSON.stringify(state1) !== JSON.stringify(state2);
};

// Get a human-readable description of an action
export const getActionDescription = (action: any): string => {
  const actionDescriptions: Record<string, (payload?: any) => string> = {
    'addMedia': () => 'Added media file',
    'removeMedia': () => 'Removed media file',
    'updateMedia': () => 'Updated media properties',
    'addTextElement': () => 'Added text element',
    'removeTextElement': () => 'Removed text element',
    'updateTextElement': () => 'Updated text element',
    'addCaption': () => 'Added caption',
    'removeCaption': () => 'Removed caption',
    'updateCaption': () => 'Updated caption',
    'duplicateElement': () => 'Duplicated element',
    'splitElement': () => 'Split element',
    'setMediaFiles': () => 'Updated media files',
    'setTextElements': () => 'Updated text elements',
    'setCaptionTracks': () => 'Updated captions',
    'setResolution': (payload) => `Changed resolution to ${payload.width}x${payload.height}`,
    'setFps': (payload) => `Changed FPS to ${payload}`,
    'setAspectRatio': (payload) => `Changed aspect ratio to ${payload}`,
  };

  const description = actionDescriptions[action.type];
  return description ? description(action.payload) : action.type;
};

// Limit history size to prevent memory issues
export const MAX_HISTORY_SIZE = 50;

// Trim history arrays if they exceed the maximum size
export const trimHistory = (history: any[], maxSize: number = MAX_HISTORY_SIZE): any[] => {
  if (history.length > maxSize) {
    return history.slice(-maxSize);
  }
  return history;
};