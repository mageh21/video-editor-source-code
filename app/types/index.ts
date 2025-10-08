export type MediaType = 'video' | 'audio' | 'image' | 'unknown';

export interface UploadedFile {
    id: string;
    file: File;
    type?: MediaType;
    src?: string;
}

export interface MediaFile {
    id: string;
    fileName: string;
    fileId: string;
    type: MediaType;
    startTime: number;  // trim start within the segment
    src?: string;
    endTime: number;    // trim end within the segment
    positionStart: number;  // position in the final video
    positionEnd: number;
    includeInMerge: boolean;
    playbackSpeed: number;
    volume: number;
    zIndex: number;
    row: number;  // Track/row index (0-based)
    
    // For split videos: track the original source bounds
    originalStartTime?: number;  // Start time in the original source file
    originalEndTime?: number;    // End time in the original source file

    // Optional visual settings
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    mimeType?: string;              // MIME type for format detection

    // Effects
    crop?: { x: number; y: number; width: number; height: number };
    
    // Advanced properties
    chromaKeyEnabled?: boolean;     // Enable chromakey for this media
    chromaKeyColor?: string;        // Color to remove (default: #00FF00 - green)
    chromaKeySimilarity?: number;   // Color similarity threshold (0-1, default: 0.4)
    chromaKeySmooth?: number;       // Edge smoothing (0-1, default: 0.1)
    chromaKeySpillSuppress?: number; // Spill suppression strength (0-1, default: 0.5)
    loop?: boolean;                 // Loop animation (for GIFs/stickers)
    fadeIn?: number;                // Fade in duration (seconds)
    fadeOut?: number;               // Fade out duration (seconds)
    effects?: {                     // Visual effects
        blur?: number;
        brightness?: number;
        contrast?: number;
        saturation?: number;
    };
    
    // Transitions
    transition?: {
        type: 'none' | 'fade' | 'slide' | 'wipe' | 'zoom' | 'blur';
        duration: number;           // Duration in seconds
        direction?: 'left' | 'right' | 'up' | 'down';
        easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
    };
    
    // New transition system
    entranceTransition?: {
        type: string;              // Transition template ID
        duration: number;          // Duration in seconds
        speed?: number;            // Speed multiplier (0.5-2)
    };
    exitTransition?: {
        type: string;              // Transition template ID
        duration: number;          // Duration in seconds
        speed?: number;            // Speed multiplier (0.5-2)
    };
}

export interface TextElement {
    id: string;
    text: string;                     // The actual text content
    includeInMerge?: boolean;
    row: number;                      // Track/row index (0-based)

    // Timing
    positionStart: number;           // When text appears in final video
    positionEnd: number;             // When text disappears

    // Position & Size (canvas-based)
    x: number;
    y: number;
    width?: number;
    height?: number;

    // Styling
    font?: string;                   // Font postScriptName (e.g., 'Roboto-Bold')
    fontFamily?: string;             // Font family name (e.g., 'Roboto')
    fontSize?: number;               // Font size in pixels
    color?: string;                  // Text color (hex or rgba)
    backgroundColor?: string;       // Background behind text
    backgroundShape?: 'rectangle' | 'rounded' | 'pill' | 'bubble' | 'marker' | 'underline' | 'speech'; // Background shape
    align?: 'left' | 'center' | 'right'; // Horizontal alignment
    zIndex?: number;                 // Layering

    // Effects
    opacity?: number;                // Transparency (0 to 1)
    rotation?: number;               // Rotation in degrees
    fadeInDuration?: number;        // Seconds to fade in
    fadeOutDuration?: number;       // Seconds to fade out
    animation?: 'slide-in' | 'zoom' | 'bounce' | 'none'; // Optional animation (deprecated - use animationIn)
    animationIn?: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom-in' | 'zoom-out' | 'bounce' | 'flip' | 'rotate';
    animationOut?: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom-in' | 'zoom-out' | 'bounce' | 'flip' | 'rotate';
    animationLoop?: 'none' | 'pulse' | 'wiggle' | 'float' | 'spin' | 'blink' | 'shake';
    animationInDuration?: number; // Duration in seconds
    animationOutDuration?: number; // Duration in seconds
    animationLoopSpeed?: number; // Speed multiplier (0.5 = slow, 2 = fast)

    // Runtime only (not persisted)
    visible?: boolean;              // Internal flag for rendering logic
    
    // Advanced text properties
    strokeWidth?: number;            // Text stroke width
    strokeColor?: string;            // Text stroke color
    shadowX?: number;                // Shadow X offset
    shadowY?: number;                // Shadow Y offset
    shadowColor?: string;            // Shadow color
    shadowBlur?: number;             // Shadow blur radius
    backgroundPadding?: number;      // Padding for text background
    fontWeight?: number;             // Font weight (400, 700, etc.)
    bold?: boolean;                  // Bold text
    italic?: boolean;                // Italic text
    underline?: boolean;             // Underline text
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'; // Text transform
}

// Instagram Conversation Types
export interface InstagramMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    isIncoming: boolean;
    status?: 'pending' | 'sent' | 'delivered' | 'seen';
    seenBy?: string[]; // Array of user IDs who have seen the message
    seenAt?: string; // Timestamp when message was seen
    replyTo?: {
        messageId: string;
        originalMessage: {
            text: string;
            sender: string;
            senderName: string;
            messageType: string;
        };
    };
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'emoji' | 'sticker' | 'gif' | 'call' | 'system' | 'typing' | 'story_reply' | 'location' | 'music' | 'poll' | 'disappearing' | 'member_added' | 'member_removed' | 'group_name_changed' | 'group_photo_changed';
    typingDuration?: number; // Duration in frames to show typing indicator
    reactions?: {
        [userId: string]: 'heart' | 'laugh' | 'wow' | 'sad' | 'angry' | 'thumbsup';
    };
    media?: {
        src: string;
        type: 'image' | 'video' | 'audio' | 'gif';
        duration?: number | string;
        thumbnail?: string;
        fileName?: string;
        fileSize?: string;
    };
    voice?: {
        duration: number; // Duration in seconds
        waveform?: number[]; // Array of amplitude values for waveform visualization
    };
    images?: { // For multiple images in one message
        src: string;
        thumbnail?: string;
        caption?: string;
    }[];
    mediaUrl?: string;
    callType?: 'voice' | 'video';
    callStatus?: 'missed' | 'answered' | 'declined';
    callDuration?: string;
    animationDelay?: number;
    
    // Story reply
    storyReply?: {
        storyId: string;
        storyImage: string;
        storyOwner: string;
        storyCaption?: string;
    };
    
    // Location sharing
    location?: {
        name: string;
        address?: string;
        latitude: number;
        longitude: number;
        mapPreview?: string;
    };
    
    // Music sharing
    music?: {
        title: string;
        artist: string;
        albumArt: string;
        duration: number;
        preview?: string; // Preview URL
        spotifyUrl?: string;
    };
    
    // Poll
    poll?: {
        question: string;
        options: {
            id: string;
            text: string;
            votes: string[]; // User IDs who voted
            percentage?: number;
        }[];
        multipleChoice?: boolean;
        anonymous?: boolean;
    };
    
    // Disappearing message
    disappearing?: {
        duration: number; // Duration in seconds before message disappears
        viewedAt?: number; // Timestamp when first viewed
    };
    
    // Group chat system messages
    systemMessageData?: {
        type: 'member_added' | 'member_removed' | 'group_name_changed' | 'group_photo_changed';
        affectedUsers?: string[]; // User IDs for member added/removed
        oldValue?: string; // Previous group name
        newValue?: string; // New group name
        actor?: string; // User ID who made the change
    };
    
    // Mentions
    mentions?: {
        userId: string;
        userName: string;
        startIndex: number;
        endIndex: number;
    }[];
}

export interface InstagramParticipant {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    isOnline?: boolean;
    lastSeen?: string;
    isAdmin?: boolean;
    role?: 'admin' | 'moderator' | 'member';
}

export interface InstagramTheme {
    backgroundColor: string;
    headerColor: string;
    bubbleColorIncoming: string;
    bubbleColorOutgoing: string;
    textColorIncoming: string;
    textColorOutgoing: string;
    statusBarColor: string;
    fontFamily: string;
    fontSize: number;
    bubbleRadius: number;
    showTypingIndicator: boolean;
    showTimestamps: boolean;
    showReadReceipts: boolean;
    showProfilePictures: boolean;
    showLastSeen: boolean;
    showMessageReactions: boolean;
    inputFieldColor: string;
    inputTextColor: string;
    linkColor: string;
    mentionColor: string;
    deletedMessageText: string;
    showOnlineStatus?: boolean;
    showMessageStatus?: boolean;
    showReactions?: boolean;
    autoScroll?: boolean;
}

// Between-clip transition types
export interface ITransition {
    id: string;
    fromId: string;           // ID of the first media clip
    toId: string;             // ID of the second media clip
    kind: string;             // Transition type (fade, slide, wipe, etc.)
    type?: string;            // Alias for kind (for compatibility)
    name?: string;            // Display name
    duration: number;         // Duration in milliseconds
    direction?: string;       // Direction for directional transitions
    trackId?: string;         // Track/row this transition belongs to
}

export interface InstagramConversation {
    id: string;
    messages: InstagramMessage[];
    participants: InstagramParticipant[];
    theme: InstagramTheme;
    chatTitle: string;
    chatSubtitle?: string;
    isGroupChat?: boolean;
    autoScroll: boolean;
    scrollEffect: boolean;
    showInputField: boolean;
    showNotificationBar: boolean;
    showBackButton?: boolean;
    showVideoCallButton?: boolean;
    showVoiceCallButton?: boolean;
    showMenuButton?: boolean;
    showActionButtons?: boolean;
    notificationBar?: {
        carrier?: string;
        time?: string;
        battery?: number;
        signal?: number;
        wifi?: boolean;
    };
    platform?: 'instagram';
    platformTheme?: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
    };
    exportPreset?: string;
    fixedDuration?: number;
    
    // Timing and positioning
    positionStart: number;
    positionEnd: number;
    row: number;
    
    // Visual properties
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
}

// WhatsApp types
export interface WhatsAppMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    isIncoming: boolean;
    status?: 'sent' | 'delivered' | 'read';
    messageType: 'text'
        | 'image'
        | 'video'
        | 'audio'
        | 'voice'
        | 'document'
        | 'location'
        | 'contact'
        | 'sticker'
        | 'gif'
        | 'poll'
        | 'link'
        | 'system'
        | 'typing'
        | 'call'
        | 'deleted'
        | 'member_added'
        | 'member_removed'
        | 'group_name_changed'
        | 'group_photo_changed'
        | 'pinned_message';
    animationDelay: number;
    typingDuration: number;
    
    // Media content
    media?: {
        url: string;
        type: 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker' | 'gif';
        thumbnail?: string;
        duration?: number; // For audio/video
        size?: number; // File size in bytes
        fileName?: string; // For documents
        mimeType?: string;
        caption?: string; // Caption for media
    };

    voice?: {
        duration: number;
        waveform?: number[];
        isPlayed?: boolean;
    };
    
    // Location sharing
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
        name?: string; // Place name
        thumbnail?: string; // Map thumbnail
    };
    
    // Contact sharing
    contact?: {
        name: string;
        phone?: string;
        avatar?: string;
        organization?: string;
    };
    
    // Link preview
    link?: {
        url: string;
        title?: string;
        description?: string;
        image?: string;
        domain?: string;
    };
    
    // Poll
    poll?: {
        question: string;
        options: {
            id: string;
            text: string;
            votes: string[]; // User IDs who voted
            percentage?: number;
        }[];
        multipleChoice?: boolean;
        anonymous?: boolean;
    };
    
    // Reactions
    reactions?: {
        emoji: string;
        users: string[]; // User IDs who reacted
    }[];
    
    // Reply to another message
    replyTo?: {
        messageId: string;
        text: string;
        sender: string;
    };
    
    // Forward information
    forwarded?: {
        from: string;
        originalSender?: string;
        forwardCount?: number;
    };
    
    // Message editing
    edited?: {
        timestamp: string;
        originalText?: string;
    };
    
    // Disappearing message
    disappearing?: {
        duration: number; // Duration in seconds before message disappears
        viewedAt?: number; // Timestamp when first viewed
    };
}

export interface WhatsAppParticipant {
    id: string;
    name: string;
    color?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
    phone?: string;
    about?: string;
    isBusiness?: boolean;
    isAdmin?: boolean; // For group chats
}

export interface WhatsAppTheme {
    backgroundColor: string;
    backgroundImage?: string;
    headerColor: string;
    bubbleColorIncoming: string;
    bubbleColorOutgoing: string;
    textColorIncoming: string;
    textColorOutgoing: string;
    statusBarColor: string;
    fontFamily: string;
    fontSize: number;
    bubbleRadius: number;
    showTypingIndicator: boolean;
    showTimestamps: boolean;
    showReadReceipts: boolean;
    showProfilePictures: boolean;
    showLastSeen: boolean;
    showMessageReactions: boolean;
    inputFieldColor: string;
    inputTextColor: string;
    linkColor: string;
    mentionColor: string;
    deletedMessageText: string;
    showOnlineStatus: boolean;
    showMessageStatus: boolean;
    showReactions: boolean;
    autoScroll: boolean;
    encryptionNotice?: boolean;
}

export interface WhatsAppConversation {
    id: string;
    messages: WhatsAppMessage[];
    participants: WhatsAppParticipant[];
    theme: WhatsAppTheme;
    chatTitle: string;
    chatSubtitle?: string;
    isGroupChat?: boolean;
    isBusinessChat?: boolean;
    autoScroll: boolean;
    scrollEffect: boolean;
    showInputField: boolean;
    showNotificationBar: boolean;
    showBackButton?: boolean;
    showVideoCallButton?: boolean;
    showVoiceCallButton?: boolean;
    showMenuButton?: boolean;
    showActionButtons?: boolean;
    showAttachmentButton?: boolean;
    notificationBar?: {
        carrier?: string;
        time?: string;
        battery?: number;
        signal?: number;
        wifi?: boolean;
    };
    platform?: 'whatsapp';
    platformTheme?: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
    };
    exportPreset?: string;
    fixedDuration?: number;
    
    // Timing and positioning
    positionStart: number;
    positionEnd: number;
    row: number;
    
    // Visual properties
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
}


export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'mov';

export interface ExportConfig {
    resolution: string;
    quality: string;
    speed: string;
    fps: number; // TODO: add this as an option
    format: ExportFormat; // TODO: add this as an option
    includeSubtitles: boolean; // TODO: add this as an option
}

export type ActiveElement = 'media' | 'text' | 'caption' | 'export' | 'instagram-conversation' | 'whatsapp-conversation' | 'transitions' | 'video' | 'images' | 'audio' | 'effects' | 'tools' | 'settings';

// Caption types - extending Remotion's caption format
import type { Caption as RemotionCaption } from '@remotion/captions';

export interface WordHighlight {
    wordIndex: number;
    style: 'default' | 'monospace' | 'emphasis' | 'success' | 'warning';
}

export interface WordEffect {
    wordIndex: number;
    type: 'color' | 'shake' | 'glow' | 'shadow' | 'gradient';
    config: {
        color?: string;
        secondaryColor?: string; // For gradients
        intensity?: number; // For shake/glow
        direction?: 'horizontal' | 'vertical' | 'radial'; // For gradients
        shadowColor?: string;
        shadowBlur?: number;
    };
}

export interface WordToken {
    text: string;
    start: number;  // Start time in seconds
    end: number;    // End time in seconds
}

export interface Caption extends RemotionCaption {
    id: string;
    speaker?: string;
    highlightedWords?: WordHighlight[];
    wordTokens?: WordToken[];  // For word-by-word timing
    animationStyle?: 'default' | 'tiktok' | 'youtube' | 'typewriter' | 'karaoke' | 'bounce' | 'wave' | 'rainbow' | 'glitch' | 'fire' | 'liquid' | 'explosion';
    wordEffects?: WordEffect[]; // Enhanced per-word effects
    enableEmojis?: boolean; // Enable emoji rendering
    typewriterTransparent?: boolean; // Make typewriter background transparent
    start?: number; // Legacy seconds support for older caption data
    end?: number;
}

export interface CaptionTrack {
    id: string;
    name: string;
    language: string;
    captions: Caption[];
    isActive: boolean;
    style: CaptionStyle;
    // Store original format for export
    originalFormat?: 'srt' | 'vtt' | 'transcript';
}

export interface CaptionStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    outlineColor: string;
    outlineWidth: number;
    position: 'top' | 'center' | 'bottom';
    offsetY: number;
    opacity: number;
    maxWidth: number;
    textAlign: 'left' | 'center' | 'right';
}

export interface ProjectState {
    id: string;
    mediaFiles: MediaFile[];
    textElements: TextElement[];
    instagramConversations: InstagramConversation[];
    captionTracks: CaptionTrack[];
    activeCaptionTrackId: string | null;
    showCaptions: boolean;
    filesID?: string[],
    currentTime: number;
    isPlaying: boolean;
    isMuted: boolean;
    duration: number;
    zoomLevel: number;
    timelineZoom: number;
    enableMarkerTracking: boolean;
    enableSnapping: boolean;
    selectedMediaIds: string[];
    selectedTextIds: string[];
    selectedCaptionIds: string[];
    selectedInstagramConversationIds: string[];
    visibleRows: number;
    maxRows: number;
    projectName: string;
    createdAt: string;
    lastModified: string;
    activeSection: ActiveElement;
    activeElement: ActiveElement | null;
    activeElementIndex: number;

    resolution: { width: number; height: number };
    fps: number;
    aspectRatio: string;
    history: ProjectState[]; // stack for undo
    future: ProjectState[]; // stack for redo
    exportSettings: ExportConfig;
    
    // Between-clip transitions
    betweenClipTransitions: Record<string, ITransition>;
    transitionIds: string[];
    
    // WhatsApp Conversations
    whatsappConversations: WhatsAppConversation[];
    selectedWhatsAppConversationIds: string[];
}

export const mimeToExt = {
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/webm': 'webm',
    'image/gif': 'gif',
    'image/apng': 'apng',
    'video/quicktime': 'mov',
    'video/x-quicktime': 'mov',
    // TODO: Add more as needed
};
