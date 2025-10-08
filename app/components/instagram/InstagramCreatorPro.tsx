import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle, Send, Reply, Clock, Smile, Trash2, Download, Upload,
  Camera, Video, Mic, Phone, MapPin, Info, User, Users,
  MessageCircle, Heart, ThumbsUp, Laugh, Angry, Check, CheckCheck, X,
  MoreHorizontal, Music, BarChart3, Image, UserPlus, UserMinus, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  InstagramConversation, 
  InstagramMessage, 
  InstagramParticipant 
} from '@/app/types';
import { calculateInstagramConversationDuration } from '@/app/utils/instagram-duration-calculator';
import { InstagramConversationRenderer } from './InstagramConversationRenderer';

interface InstagramCreatorProProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conversation: InstagramConversation) => void;
  existingConversation?: InstagramConversation;
  onDownload?: (conversation: InstagramConversation) => void;
}

// Pre-defined avatars for Instagram
const AVATAR_PRESETS = [
  { id: 'user1', emoji: '👤', color: '#E4405F', label: 'Default' },
  { id: 'influencer1', emoji: '💫', color: '#C13584', label: 'Influencer' },
  { id: 'photographer', emoji: '📸', color: '#833AB4', label: 'Photographer' },
  { id: 'artist', emoji: '🎨', color: '#405DE6', label: 'Artist' },
  { id: 'musician', emoji: '🎵', color: '#F77737', label: 'Musician' },
  { id: 'foodie', emoji: '🍕', color: '#FCAF45', label: 'Foodie' },
  { id: 'traveler', emoji: '✈️', color: '#5851DB', label: 'Traveler' },
  { id: 'fitness', emoji: '💪', color: '#E1306C', label: 'Fitness' },
  { id: 'fashion', emoji: '👗', color: '#C32AA3', label: 'Fashion' },
  { id: 'tech', emoji: '💻', color: '#7B68EE', label: 'Tech' },
  { id: 'beauty', emoji: '💄', color: '#FF69B4', label: 'Beauty' },
  { id: 'nature', emoji: '🌿', color: '#32CD32', label: 'Nature' },
];

// Instagram-style conversation starters
const CONVERSATION_STARTERS = [
  {
    category: "Story Reactions",
    icon: "❤️",
    messages: [
      "Love your story!",
      "This is amazing! 🔥",
      "Where was this taken?",
      "Goals! 😍"
    ]
  },
  {
    category: "DM Openers",
    icon: "💬",
    messages: [
      "Hey! Saw your post 📸",
      "Your content is inspiring!",
      "Can we collaborate?",
      "Love your aesthetic ✨"
    ]
  },
  {
    category: "Compliments",
    icon: "🌟",
    messages: [
      "Your feed is gorgeous!",
      "Such good vibes 🙌",
      "You're so creative!",
      "Obsessed with this look 💯"
    ]
  },
  {
    category: "Questions",
    icon: "❓",
    messages: [
      "What camera do you use?",
      "Tutorial please! 🙏",
      "Where did you get this?",
      "Tips for beginners?"
    ]
  }
];

// Smart replies for Instagram context
const SMART_REPLIES = {
  greeting: ["Hey! 👋", "What's up!", "Hi there! ✨", "Hey babe! 💕"],
  compliment: ["Thank you! 🥺", "You're so sweet! 💕", "Aww thanks babe! ❤️", "Made my day! 😭"],
  question: ["Let me check! 👀", "I'll DM you the details!", "Link in my bio! 📝", "Coming soon! 🔥"],
  collaboration: ["I'm interested! 💫", "Let's chat! 📞", "Send me details! 📩", "I'm down! ✨"],
};

export const InstagramCreatorPro: React.FC<InstagramCreatorProProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConversation,
  onDownload
}) => {
  // Core state
  const [chatType, setChatType] = useState<'personal' | 'group'>('personal');
  const [messages, setMessages] = useState<InstagramMessage[]>(existingConversation?.messages || []);
  const [participants, setParticipants] = useState<InstagramParticipant[]>(
    existingConversation?.participants || [
      { id: "me", name: "Me", color: "#E4405F", isOnline: true, avatar: '💫' },
      { id: "other", name: "Influencer", color: "#C13584", isOnline: true, avatar: '📸' }
    ]
  );
  
  // UI state
  const [selectedSender, setSelectedSender] = useState("me");
  const [messageText, setMessageText] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState<'text' | 'image' | 'video' | 'voice' | 'call' | 'system' | 'typing' | 'story_reply' | 'location' | 'music' | 'poll' | 'disappearing' | 'gif' | 'member_added' | 'member_removed' | 'group_name_changed' | 'group_photo_changed'>('text');
  const [isTyping, setIsTyping] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(true);
  const [autoTypingIndicators, setAutoTypingIndicators] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<{ src: string; type: string } | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<InstagramMessage | null>(null);
  const [editingTimestampId, setEditingTimestampId] = useState<string | null>(null);
  const [addingReactionToId, setAddingReactionToId] = useState<string | null>(null);
  const [editingTimingId, setEditingTimingId] = useState<string | null>(null);
  
  // New message type states
  const [storyReplyData, setStoryReplyData] = useState({ owner: '', caption: '' });
  const [locationData, setLocationData] = useState({ name: '', address: '' });
  const [musicData, setMusicData] = useState({ title: '', artist: '', duration: 180 });
  const [pollData, setPollData] = useState({ 
    question: '', 
    options: ['', ''], 
    multipleChoice: false 
  });
  const [groupEventData, setGroupEventData] = useState({
    actor: '',
    affectedUsers: [''],
    oldValue: '',
    newValue: ''
  });
  
  // Instagram specific state
  const [chatTitle, setChatTitle] = useState(existingConversation?.chatTitle || "");
  const [chatDescription, setChatDescription] = useState("");
  const [previewTime, setPreviewTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update chat title based on participants
  useEffect(() => {
    if (!chatTitle && chatType === 'personal') {
      const otherParticipant = participants.find(p => p.id !== 'me');
      if (otherParticipant) {
        setChatTitle(otherParticipant.name || 'Instagram User');
      }
    }
  }, [chatType, participants.length, chatTitle]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update preview time to show all messages
  useEffect(() => {
    if (messages.length > 0) {
      // Calculate the total duration needed to show all messages
      const lastMessage = messages[messages.length - 1];
      const totalDuration = (lastMessage.animationDelay || 0) + 60; // Add extra time after last message
      setPreviewTime(totalDuration / 30); // Convert frames to seconds (30 FPS)
    } else {
      setPreviewTime(0);
    }
  }, [messages]);

  // Helper function to parse time and sort messages
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  const sortMessagesByTimestamp = (messages: InstagramMessage[]): InstagramMessage[] => {
    // Sort messages by timestamp
    const sorted = [...messages].sort((a, b) => {
      const timeA = parseTime(a.timestamp);
      const timeB = parseTime(b.timestamp);
      return timeA - timeB;
    });
    
    // Update animation delays based on new order
    let currentDelay = 0;
    return sorted.map((msg, index) => {
      const updatedMsg = { ...msg, animationDelay: currentDelay };
      
      if (msg.messageType === 'typing') {
        currentDelay += (msg.typingDuration || 30) + 15;
      } else {
        currentDelay += (msg.typingDuration || 20) + 15;
      }
      
      return updatedMsg;
    });
  };

  // Generate next timestamp based on last message
  const getNextTimestamp = (): string => {
    if (messages.length === 0) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const lastMessage = messages[messages.length - 1];
    const lastTime = parseTime(lastMessage.timestamp);
    
    // Add 1-3 minutes to last timestamp
    const additionalMinutes = Math.floor(Math.random() * 3) + 1;
    const newMinutes = lastTime + additionalMinutes;
    
    const hours = Math.floor(newMinutes / 60) % 24;
    const minutes = newMinutes % 60;
    
    // Format time
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Add message with Instagram features
  const addMessage = useCallback(() => {
    if (!messageText.trim() && ['text', 'system'].includes(selectedMessageType)) return;
    if (!selectedMedia && ['image', 'video', 'gif'].includes(selectedMessageType)) {
      return;
    }
    
    const sender = participants.find(p => p.id === selectedSender);
    const messagesToAdd: InstagramMessage[] = [];
    
    // Handle media with caption (Instagram style)
    if (selectedMedia && ['image', 'video', 'gif'].includes(selectedMessageType) && messageText.trim()) {
      // Single message with media and caption
      const mediaMessage: InstagramMessage = {
        id: `msg-${Date.now()}-media`,
        text: messageText, // Caption included in media message
        sender: selectedSender,
        isIncoming: selectedSender !== 'me',
        timestamp: getNextTimestamp(),
        messageType: selectedMessageType,
        status: selectedSender === 'me' ? 'sent' : undefined,
        animationDelay: messages.reduce((acc, msg) => {
          if (msg.messageType === 'typing') {
            return acc + (msg.typingDuration || 30) + 15;
          }
          return acc + (msg.typingDuration || 20) + 15;
        }, 0) + (messagesToAdd.length > 0 && messagesToAdd[0].messageType === 'typing' ? messagesToAdd[0].typingDuration + 15 : 0), // Account for typing indicator
        typingDuration: 0, // No typing for message after typing indicator
        media: {
          src: selectedMedia.src,
          type: selectedMessageType as 'image' | 'video' | 'gif',
          thumbnail: selectedMedia.src
        },
        mediaUrl: selectedMedia.src,
        replyTo: replyingToMessage ? {
          messageId: replyingToMessage.id,
          originalMessage: {
            text: replyingToMessage.text,
            sender: replyingToMessage.sender,
            senderName: participants.find(p => p.id === replyingToMessage.sender)?.name || replyingToMessage.sender,
            messageType: replyingToMessage.messageType || 'text'
          }
        } : undefined
      };
      messagesToAdd.push(mediaMessage);
    } else {
      // Add automatic typing indicator before text messages
      if (autoTypingIndicators && selectedMessageType === 'text' && selectedSender !== 'me' && messageText.trim()) {
        const charCount = messageText.length;
        // 4 chars per second typing speed, min 15 frames, max 90 frames
        const typingDur = Math.min(90, Math.max(15, Math.floor(charCount / 4)));
        
        // Calculate proper animation delay for typing
        const currentDelay = messages.reduce((acc, msg) => {
          if (msg.messageType === 'typing') {
            return acc + (msg.typingDuration || 30) + 10;
          }
          return acc + (msg.typingDuration || 20) + 10;
        }, 0);
        
        const typingIndicator: InstagramMessage = {
          id: `typing-${Date.now()}`,
          text: '',
          sender: selectedSender,
          isIncoming: true,
          timestamp: getNextTimestamp(),
          messageType: 'typing',
          animationDelay: currentDelay,
          typingDuration: typingDur,
        };
        messagesToAdd.push(typingIndicator);
      }
      
      // Single message (text-only or media-only)
      let messageType = selectedMessageType;
      let text = messageText;
      let typingDuration = selectedMessageType === 'system' ? 0 : 20; // Faster for Instagram
      
      // Handle voice messages
      if (selectedMessageType === 'voice') {
        messageType = 'voice';
        text = ''; // Voice messages don't have text
        typingDuration = 0;
      }
      
      const newMessage: InstagramMessage = {
        id: `msg-${Date.now()}`,
        text: text,
        sender: selectedMessageType === 'system' ? 'system' : selectedSender,
        isIncoming: selectedMessageType === 'system' ? true : selectedSender !== 'me',
        timestamp: getNextTimestamp(),
        messageType: messageType,
        status: selectedMessageType === 'system' ? undefined : (selectedSender === 'me' ? (['sent', 'delivered', 'seen'][Math.floor(Math.random() * 3)] as any) : undefined),
        seenAt: selectedSender === 'me' && Math.random() > 0.5 ? getNextTimestamp() : undefined,
        animationDelay: messages.reduce((acc, msg) => {
          if (msg.messageType === 'typing') {
            return acc + (msg.typingDuration || 30) + 15;
          }
          return acc + (msg.typingDuration || 20) + 15;
        }, 0) + (messagesToAdd.length > 0 && messagesToAdd[0].messageType === 'typing' ? messagesToAdd[0].typingDuration + 15 : 0), // Account for typing indicator
        typingDuration: messagesToAdd.length > 0 ? 0 : typingDuration, // No typing if we added typing indicator
        replyTo: selectedMessageType === 'system' ? undefined : (replyingToMessage ? {
          messageId: replyingToMessage.id,
          originalMessage: {
            text: replyingToMessage.text,
            sender: replyingToMessage.sender,
            senderName: participants.find(p => p.id === replyingToMessage.sender)?.name || replyingToMessage.sender,
            messageType: replyingToMessage.messageType || 'text'
          }
        } : undefined)
      };
      
      // Add media if selected (media without caption)
      if (selectedMedia && ['image', 'video', 'gif'].includes(selectedMessageType)) {
        newMessage.media = {
          src: selectedMedia.src,
          type: selectedMessageType as 'image' | 'video' | 'gif',
          thumbnail: selectedMedia.src
        };
        newMessage.mediaUrl = selectedMedia.src;
        newMessage.text = ''; // No text for media-only messages
      }
      
      // Add voice message properties
      if (selectedMessageType === 'voice') {
        // Parse duration from text input (e.g., "10" or "0:10" -> 10 seconds)
        let durationInSeconds = 10; // default
        if (messageText) {
          const parts = messageText.split(':');
          if (parts.length === 2) {
            durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else if (parts.length === 1) {
            durationInSeconds = parseInt(parts[0]);
          }
        }
        
        newMessage.voice = {
          duration: durationInSeconds,
          // Generate random waveform data
          waveform: Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
        };
      }
      
      // Add call message properties
      if (selectedMessageType === 'call') {
        newMessage.callType = 'voice';
        newMessage.callStatus = 'missed';
        newMessage.callDuration = messageText || '0:20';
        newMessage.text = '';
      }
      
      // Add typing indicator properties
      if (selectedMessageType === 'typing') {
        newMessage.messageType = 'typing';
        newMessage.text = '';
        // If user provided duration, use it. Otherwise auto-calculate
        if (messageText.trim()) {
          newMessage.typingDuration = parseInt(messageText);
        } else {
          // Look for the next message from the same sender to calculate duration
          const nextMessageIndex = messages.findIndex((msg, idx) => 
            idx > messages.length && msg.sender === selectedSender && msg.messageType === 'text'
          );
          if (nextMessageIndex !== -1) {
            const nextMessage = messages[nextMessageIndex];
            const charCount = nextMessage.text.length;
            // 4 chars per second typing speed, min 15 frames, max 60 frames
            newMessage.typingDuration = Math.min(60, Math.max(15, Math.floor(charCount / 4)));
          } else {
            newMessage.typingDuration = 30; // Default 1 second
          }
        }
      }
      
      // Add story reply properties
      if (selectedMessageType === 'story_reply') {
        newMessage.storyReply = {
          storyId: `story-${Date.now()}`,
          storyImage: selectedMedia?.src || 'https://via.placeholder.com/200x300',
          storyOwner: storyReplyData.owner || 'User',
          storyCaption: storyReplyData.caption
        };
        newMessage.text = messageText; // Reply text
      }
      
      // Add location properties
      if (selectedMessageType === 'location') {
        newMessage.location = {
          name: locationData.name || 'Unknown Location',
          address: locationData.address,
          latitude: 37.7749, // Default SF coordinates
          longitude: -122.4194,
          mapPreview: selectedMedia?.src // Optional map preview image
        };
        newMessage.text = ''; // No text for location messages
      }
      
      // Add music properties
      if (selectedMessageType === 'music') {
        newMessage.music = {
          title: musicData.title || 'Unknown Song',
          artist: musicData.artist || 'Unknown Artist',
          albumArt: selectedMedia?.src || 'https://via.placeholder.com/100x100',
          duration: musicData.duration || 180,
          preview: '' // Could be audio preview URL
        };
        newMessage.text = ''; // No text for music messages
      }
      
      // Add poll properties
      if (selectedMessageType === 'poll') {
        const pollOptions = pollData.options
          .filter(opt => opt.trim())
          .map((text, index) => ({
            id: `opt-${index}`,
            text,
            votes: [], // No initial votes
            percentage: 0
          }));
          
        newMessage.poll = {
          question: pollData.question || 'Poll Question',
          options: pollOptions.length >= 2 ? pollOptions : [
            { id: 'opt-0', text: 'Option 1', votes: [], percentage: 0 },
            { id: 'opt-1', text: 'Option 2', votes: [], percentage: 0 }
          ],
          multipleChoice: pollData.multipleChoice,
          anonymous: false
        };
        newMessage.text = ''; // No text for poll messages
      }
      
      // Add GIF properties
      if (selectedMessageType === 'gif' && selectedMedia) {
        newMessage.media = {
          src: selectedMedia.src,
          type: 'gif',
          thumbnail: selectedMedia.src
        };
        newMessage.mediaUrl = selectedMedia.src;
        newMessage.text = messageText; // GIFs can have captions
      }
      
      // Add group event properties
      if (['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(selectedMessageType)) {
        newMessage.systemMessageData = {
          type: selectedMessageType as any,
          actor: groupEventData.actor || selectedSender,
          affectedUsers: groupEventData.affectedUsers.filter(u => u),
          oldValue: groupEventData.oldValue,
          newValue: groupEventData.newValue
        };
        
        // Generate text for system messages
        const actorName = participants.find(p => p.id === (groupEventData.actor || selectedSender))?.name || 'Someone';
        const affectedNames = groupEventData.affectedUsers
          .filter(u => u)
          .map(userId => participants.find(p => p.id === userId)?.name || 'Unknown')
          .join(', ');
        
        switch (selectedMessageType) {
          case 'member_added':
            newMessage.text = `${actorName} added ${affectedNames}`;
            break;
          case 'member_removed':
            if (groupEventData.actor === groupEventData.affectedUsers[0]) {
              newMessage.text = `${affectedNames} left`;
            } else {
              newMessage.text = `${actorName} removed ${affectedNames}`;
            }
            break;
          case 'group_name_changed':
            newMessage.text = `${actorName} changed the group name from "${groupEventData.oldValue}" to "${groupEventData.newValue}"`;
            break;
          case 'group_photo_changed':
            newMessage.text = `${actorName} changed the group photo`;
            break;
        }
        
        newMessage.isIncoming = true; // System messages are always incoming
      }
      
      messagesToAdd.push(newMessage);
    }
    
    setMessages(prev => [...prev, ...messagesToAdd]);
    setMessageText("");
    setSelectedMedia(null);
    setReplyingToMessage(null);
    
    // Auto-update message status for Instagram (faster)
    if (selectedSender === 'me') {
      messagesToAdd.forEach((msg, index) => {
        setTimeout(() => {
          updateMessageStatus(msg.id, 'delivered');
          setTimeout(() => {
            updateMessageStatus(msg.id, 'seen');
          }, 500);
        }, 300 + (index * 50));
      });
    }
  }, [messageText, selectedSender, selectedMessageType, messages.length, participants, selectedMedia, replyingToMessage]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: 'sent' | 'delivered' | 'seen') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);
  
  // Add reaction to message
  const addReaction = useCallback((messageId: string, userId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newReactions = { ...msg.reactions } || {};
        newReactions[userId] = reaction as any;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
    setAddingReactionToId(null);
  }, []);
  
  // Handle double tap to like
  const handleDoubleTap = useCallback((messageId: string) => {
    // Add heart reaction from 'me'
    addReaction(messageId, 'me', 'heart');
  }, [addReaction]);

  // Generate conversation object for Instagram
  const generateConversation = useCallback(async (): Promise<InstagramConversation> => {
    // Ensure messages is an array
    const currentMessages = Array.isArray(messages) ? messages : [];
    
    console.log('Generating conversation with messages:', currentMessages);
    
    // Create a temporary conversation object for duration calculation
    const tempConversation: Partial<InstagramConversation> = { 
      messages: currentMessages 
    };
    
    // Instagram conversations are typically faster
    let duration = 10; // Default duration
    try {
      if (currentMessages.length > 0) {
        duration = calculateInstagramConversationDuration(tempConversation as InstagramConversation);
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      duration = Math.max(10, currentMessages.length * 3); // Fallback: 3 seconds per message
    }
    
    if (existingConversation?.fixedDuration) {
      duration = existingConversation.fixedDuration;
    }
    
    const conversation: InstagramConversation = {
      id: existingConversation?.id || `insta-${Date.now()}`,
      messages: currentMessages,
      participants,
      theme: {
        backgroundColor: "#FFFFFF",
        headerColor: "#FFFFFF",
        bubbleColorIncoming: "#F1F3F4",
        bubbleColorOutgoing: "#E4405F",
        textColorIncoming: "#262626",
        textColorOutgoing: "#FFFFFF",
        statusBarColor: "#FFFFFF",
        fontFamily: "'SF Pro Display', -apple-system, system-ui",
        fontSize: 14,
        bubbleRadius: 18,
        showTypingIndicator: true,
        showTimestamps: true,
        showReadReceipts: true,
        showProfilePictures: chatType === 'group',
        showLastSeen: true,
        showMessageReactions: true,
        inputFieldColor: "#F1F3F4",
        inputTextColor: "#262626",
        linkColor: "#00376B",
        mentionColor: "#E4405F",
        deletedMessageText: "This message was deleted",
        showOnlineStatus: true,
        showMessageStatus: true,
        showReactions: true,
        autoScroll: true
      },
      chatTitle: chatTitle || (chatType === 'group' ? 'Instagram Group' : participants.find(p => p.id !== 'me')?.name || 'Instagram User'),
      chatSubtitle: chatType === 'group' ? `${participants.length} members` : 'Active now',
      isGroupChat: chatType === 'group',
      autoScroll: true,
      scrollEffect: true,
      showInputField: true,
      showNotificationBar: true,
      showBackButton: true,
      showVideoCallButton: true,
      showVoiceCallButton: true,
      showMenuButton: true,
      showActionButtons: true,
      notificationBar: {
        carrier: "Instagram",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        battery: 85,
        signal: 4,
        wifi: true
      },
      platform: 'instagram',
      platformTheme: {
        primaryColor: '#E4405F',
        secondaryColor: '#C13584',
        backgroundColor: '#FFFFFF',
        textColor: '#262626',
      },
      exportPreset: 'instagram-reels',
      fixedDuration: existingConversation?.fixedDuration,
      
      // Timeline properties
      positionStart: existingConversation?.positionStart || 0,
      positionEnd: existingConversation?.positionEnd || (existingConversation?.positionStart || 0) + duration,
      row: existingConversation?.row || 0,
      x: existingConversation?.x || 0,
      y: existingConversation?.y || 0,
      width: existingConversation?.width || 360,
      height: existingConversation?.height || 640,
      rotation: existingConversation?.rotation || 0,
      opacity: existingConversation?.opacity || 1,
      zIndex: existingConversation?.zIndex || 100,
    };
    
    return conversation;
  }, [messages, participants, chatTitle, chatType, existingConversation]);

  // Media upload handlers
  const handleMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        setSelectedMedia({
          src,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Participant management
  const updateParticipant = useCallback((id: string, updates: Partial<InstagramParticipant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addParticipant = useCallback(() => {
    const newId = `participant_${Date.now()}`;
    const preset = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    setParticipants(prev => [...prev, {
      id: newId,
      name: `User ${prev.length}`,
      color: preset.color,
      isOnline: true,
      avatar: preset.emoji
    }]);
  }, []);

  const removeParticipant = useCallback((id: string) => {
    if (id === 'me') return;
    setParticipants(prev => prev.filter(p => p.id !== id));
  }, []);

  // Smart reply insertion
  const insertSmartReply = useCallback((reply: string) => {
    setMessageText(reply);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="!z-[9998]" />
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col !z-[9999]">
        {/* Hidden for accessibility */}
        <div className="sr-only">
          <DialogTitle>Instagram Creator Pro</DialogTitle>
          <DialogDescription>Create Instagram DM conversations</DialogDescription>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Instagram Creator Pro</h2>
              <p className="text-sm opacity-90">Create Instagram DM conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {messages.length} messages
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              ~{Math.ceil(messages.length * 45 / 30)}s
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Configuration */}
          <ScrollArea className="w-1/3 border-r bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              {/* Platform indicator */}
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    📸
                  </div>
                  <div>
                    <div className="font-semibold text-purple-800 dark:text-purple-200">Instagram DMs</div>
                    <div className="text-xs text-purple-600 dark:text-purple-300">Authentic Instagram styling</div>
                  </div>
                </div>
              </div>

              {/* Chat Type Selector */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Chat Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={cn(
                      "flex items-center justify-start gap-2 px-3 py-2 rounded-md border transition-colors text-sm w-full",
                      chatType === 'personal' 
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    )}
                    onClick={() => {
                      setChatType('personal');
                      if (participants.length > 2) {
                        setParticipants(participants.slice(0, 2));
                      }
                    }}
                  >
                    <User className="w-4 h-4" />
                    Direct Message
                  </button>
                  <button
                    className={cn(
                      "flex items-center justify-start gap-2 px-3 py-2 rounded-md border transition-colors text-sm w-full",
                      chatType === 'group' 
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    )}
                    onClick={() => setChatType('group')}
                  >
                    <Users className="w-4 h-4" />
                    Group Chat
                  </button>
                </div>
              </div>

              {/* Participants */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Participants</Label>
                  {chatType === 'group' && (
                    <button 
                      onClick={addParticipant}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className={cn(
                      "p-3 border rounded-lg transition-all",
                      participant.id === 'me' && "border-purple-500 bg-purple-50 dark:bg-purple-950"
                    )}>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                            {participant.avatar && (participant.avatar.startsWith('data:') || participant.avatar.startsWith('http') || participant.avatar.startsWith('/')) ? (
                              <img 
                                src={participant.avatar}
                                alt={participant.name}
                                className="w-full h-full object-cover"
                                onError={() => updateParticipant(participant.id, { avatar: '💫' })}
                              />
                            ) : (
                              <span>{participant.avatar || '💫'}</span>
                            )}
                          </div>
                          {participant.id === 'me' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                          <Input
                            value={participant.name}
                            onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                            className="h-7 text-sm font-medium text-gray-900 dark:text-gray-100"
                            placeholder="Username"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            {participant.id === 'me' ? (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {participant.isOnline ? 'Active now' : 'Offline'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {participant.id !== 'me' && chatType === 'group' && participants.length > 2 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeParticipant(participant.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Avatar selector */}
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs text-gray-700 dark:text-gray-300">Profile Picture:</Label>
                        
                        {/* Preset avatars */}
                        <div className="grid grid-cols-6 gap-1">
                          {AVATAR_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              className={cn(
                                "h-8 w-8 p-0 text-lg rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors",
                                participant.avatar === preset.emoji && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950 border-purple-500"
                              )}
                              onClick={() => updateParticipant(participant.id, { avatar: preset.emoji })}
                              title={(preset as any).name || preset.label}
                            >
                              {preset.emoji}
                            </button>
                          ))}
                        </div>
                        
                        {/* Upload button */}
                        <button
                          className="w-full mt-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const src = e.target?.result as string;
                                  if (src) {
                                    updateParticipant(participant.id, { avatar: src });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Upload Custom Photo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Start */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Quick Start</Label>
                <div className="space-y-2">
                  {CONVERSATION_STARTERS.map((starter) => (
                    <div key={starter.category} className="space-y-1">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <span>{starter.icon}</span>
                        {starter.category}
                      </div>
                      {starter.messages.map((message, idx) => (
                        <button
                          key={idx}
                          className="w-full justify-start text-xs h-7 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-left"
                          onClick={() => setMessageText(message)}
                        >
                          {message}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Center Panel - Message Composer */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Message Input Section */}
            <ScrollArea className="flex-shrink-0 max-h-[50vh]">
              <div className="p-4 border-b">
                <div className="space-y-2 mb-3">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Send Message As:</Label>
                <select
                  value={selectedSender}
                  onChange={(e) => setSelectedSender(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.avatar && !p.avatar.startsWith('http') ? `${p.avatar} ` : ''}
                      {p.name} {p.id === 'me' ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Typing Toggle */}
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Auto Typing Indicators:</Label>
                <button
                  onClick={() => setAutoTypingIndicators(!autoTypingIndicators)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    autoTypingIndicators ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      autoTypingIndicators ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              
              {/* Message Type Selector */}
              <div className="space-y-2 mb-3">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Message Type:</Label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { type: 'text', icon: MessageCircle, label: 'Text', description: 'Regular text message' },
                    { type: 'image', icon: Camera, label: 'Photo', description: 'Image with optional caption' },
                    { type: 'video', icon: Video, label: 'Video', description: 'Video with optional caption' },
                    { type: 'voice', icon: Mic, label: 'Voice', description: 'Voice message' },
                    { type: 'story_reply', icon: Camera, label: 'Story Reply', description: 'Reply to a story' },
                    { type: 'location', icon: MapPin, label: 'Location', description: 'Share location' },
                    { type: 'music', icon: Music, label: 'Music', description: 'Share music' },
                    { type: 'poll', icon: BarChart3, label: 'Poll', description: 'Create a poll' },
                    { type: 'gif', icon: Image, label: 'GIF', description: 'Send a GIF' },
                    { type: 'call', icon: Phone, label: 'Call', description: 'Call notification' },
                    { type: 'typing', icon: MoreHorizontal, label: 'Typing', description: 'Typing indicator' },
                    { type: 'system', icon: Info, label: 'System', description: 'System message' },
                    { type: 'member_added', icon: UserPlus, label: 'Member Added', description: 'Member added to group' },
                    { type: 'member_removed', icon: UserMinus, label: 'Member Removed', description: 'Member removed from group' },
                    { type: 'group_name_changed', icon: Edit3, label: 'Name Changed', description: 'Group name changed' },
                    { type: 'group_photo_changed', icon: Camera, label: 'Photo Changed', description: 'Group photo changed' },
                  ].map(({ type, icon: Icon, label, description }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMessageType(type as any)}
                      className={cn(
                        "h-8 px-3 text-sm rounded-md border transition-colors flex items-center gap-1",
                        selectedMessageType === type 
                          ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                      )}
                      title={description}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              {['image', 'video', 'gif'].includes(selectedMessageType) && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedMessageType === 'image' ? 'Upload Photo:' : 
                     selectedMessageType === 'video' ? 'Upload Video:' : 'Upload GIF:'}
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedMessageType === 'gif' ? 'image/gif' : selectedMessageType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose {selectedMessageType === 'image' ? 'Photo' : selectedMessageType === 'video' ? 'Video' : 'GIF'} from Device
                  </button>
                  {selectedMedia && (
                    <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedMessageType} selected
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story Reply */}
              {selectedMessageType === 'story_reply' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Story Reply Settings:</Label>
                  <Input
                    placeholder="Story owner name"
                    value={storyReplyData.owner}
                    onChange={(e) => setStoryReplyData({...storyReplyData, owner: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="Story caption (optional)"
                    value={storyReplyData.caption}
                    onChange={(e) => setStoryReplyData({...storyReplyData, caption: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <div className="text-xs text-gray-500">
                    Upload story image above or use default placeholder
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedMessageType === 'location' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Location Details:</Label>
                  <Input
                    placeholder="Location name (e.g., Eiffel Tower)"
                    value={locationData.name}
                    onChange={(e) => setLocationData({...locationData, name: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="Address (optional)"
                    value={locationData.address}
                    onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {/* Music */}
              {selectedMessageType === 'music' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Music Details:</Label>
                  <Input
                    placeholder="Song title"
                    value={musicData.title}
                    onChange={(e) => setMusicData({...musicData, title: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="Artist name"
                    value={musicData.artist}
                    onChange={(e) => setMusicData({...musicData, artist: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="Duration (seconds)"
                    type="number"
                    value={musicData.duration}
                    onChange={(e) => setMusicData({...musicData, duration: parseInt(e.target.value) || 0})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <div className="text-xs text-gray-500">
                    Upload album art as image above
                  </div>
                </div>
              )}

              {/* Poll */}
              {selectedMessageType === 'poll' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Poll Details:</Label>
                  <Input
                    placeholder="Poll question"
                    value={pollData.question}
                    onChange={(e) => setPollData({...pollData, question: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  {pollData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollData.options];
                          newOptions[index] = e.target.value;
                          setPollData({...pollData, options: newOptions});
                        }}
                        className="text-sm text-gray-900 dark:text-gray-100"
                      />
                      {pollData.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = pollData.options.filter((_, i) => i !== index);
                            setPollData({...pollData, options: newOptions});
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollData.options.length < 4 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPollData({...pollData, options: [...pollData.options, '']})}
                      className="w-full"
                    >
                      Add Option
                    </Button>
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pollData.multipleChoice}
                      onCheckedChange={(checked) => setPollData({...pollData, multipleChoice: checked})}
                    />
                    <Label className="text-xs">Allow multiple choices</Label>
                  </div>
                </div>
              )}

              {/* Group Event Messages */}
              {['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(selectedMessageType) && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Group Event Details:</Label>
                  
                  {/* Actor selection */}
                  <div>
                    <Label className="text-xs">Who performed this action?</Label>
                    <select
                      value={groupEventData.actor}
                      onChange={(e) => setGroupEventData({...groupEventData, actor: e.target.value})}
                      className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700"
                    >
                      <option value="">Select participant...</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Affected users for member events */}
                  {['member_added', 'member_removed'].includes(selectedMessageType) && (
                    <div>
                      <Label className="text-xs">Affected members:</Label>
                      {groupEventData.affectedUsers.map((userId, index) => (
                        <div key={index} className="flex gap-2 mb-1">
                          <select
                            value={userId}
                            onChange={(e) => {
                              const newUsers = [...groupEventData.affectedUsers];
                              newUsers[index] = e.target.value;
                              setGroupEventData({...groupEventData, affectedUsers: newUsers});
                            }}
                            className="flex-1 p-2 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700"
                          >
                            <option value="">Select participant...</option>
                            {participants.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          {groupEventData.affectedUsers.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newUsers = groupEventData.affectedUsers.filter((_, i) => i !== index);
                                setGroupEventData({...groupEventData, affectedUsers: newUsers});
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGroupEventData({...groupEventData, affectedUsers: [...groupEventData.affectedUsers, '']})}
                        className="w-full"
                      >
                        Add Member
                      </Button>
                    </div>
                  )}

                  {/* Name change fields */}
                  {selectedMessageType === 'group_name_changed' && (
                    <>
                      <Input
                        placeholder="Old group name"
                        value={groupEventData.oldValue}
                        onChange={(e) => setGroupEventData({...groupEventData, oldValue: e.target.value})}
                        className="text-sm text-gray-900 dark:text-gray-100"
                      />
                      <Input
                        placeholder="New group name"
                        value={groupEventData.newValue}
                        onChange={(e) => setGroupEventData({...groupEventData, newValue: e.target.value})}
                        className="text-sm text-gray-900 dark:text-gray-100"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Reply indicator */}
              {replyingToMessage && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Replying to {participants.find(p => p.id === replyingToMessage.sender)?.name}
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {replyingToMessage.text}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingToMessage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    selectedMessageType === 'voice' ? 'Voice message duration (e.g., "0:15")' :
                    selectedMessageType === 'call' ? 'Call duration (e.g., "2:30")' :
                    selectedMessageType === 'system' ? 'System message (e.g., "User joined the chat")' :
                    selectedMessageType === 'typing' ? 'Duration in frames (leave empty for auto)' :
                    ['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(selectedMessageType) ? 
                      'Fill in the form above, then click send' :
                    'Type your message...'
                  }
                  className="min-h-[60px] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addMessage();
                    }
                  }}
                />
                <Button
                  onClick={addMessage}
                  disabled={
                    !messageText.trim() && 
                    !selectedMedia && 
                    !['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(selectedMessageType)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Smart Replies */}
              {showSmartReplies && messages.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Smart Replies:</Label>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(SMART_REPLIES).flatMap(([category, replies]) => 
                      replies.slice(0, 2).map((reply, idx) => (
                        <button
                          key={`${category}-${idx}`}
                          onClick={() => insertSmartReply(reply)}
                          className="text-xs h-6 px-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {reply}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              </div>
            </ScrollArea>

            {/* Messages List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {/* Avatar for incoming messages */}
                      {message.isIncoming && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0">
                          {participants.find(p => p.id === message.sender)?.avatar || '👤'}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {/* Sender name for group chats */}
                        {message.isIncoming && chatType === 'group' && (
                          <div className="text-xs text-gray-500 px-2">
                            {participants.find(p => p.id === message.sender)?.name}
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className={cn(
                          "px-3 py-2 rounded-lg text-sm relative group",
                          message.sender === 'me' 
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}>
                          {/* Reply reference */}
                          {message.replyTo && (
                            <div className="mb-2 p-2 bg-black/10 rounded text-xs">
                              <div className="font-medium">{message.replyTo.originalMessage.senderName}</div>
                              <div className="opacity-80">{message.replyTo.originalMessage.text}</div>
                            </div>
                          )}
                          
                          {/* Media */}
                          {(message.mediaUrl || message.media?.src) && (
                            <div className="mb-2">
                              {message.messageType === 'video' ? (
                                <video className="max-w-full h-auto rounded" controls>
                                  <source src={message.mediaUrl || message.media?.src} />
                                </video>
                              ) : (
                                <img 
                                  src={message.mediaUrl || message.media?.src} 
                                  alt="Message media" 
                                  className="max-w-full h-auto rounded"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Reaction selector */}
                          {addingReactionToId === message.id && (
                            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div className="text-xs mb-2">Select reaction:</div>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  { emoji: '❤️', type: 'heart' },
                                  { emoji: '😂', type: 'laugh' },
                                  { emoji: '😮', type: 'wow' },
                                  { emoji: '😢', type: 'sad' },
                                  { emoji: '😡', type: 'angry' },
                                  { emoji: '👍', type: 'thumbsup' },
                                ].map(({ emoji, type }) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      // Select who is reacting
                                      const reactor = message.sender === 'me' 
                                        ? participants.find(p => p.id !== 'me')?.id || 'user' 
                                        : 'me';
                                      addReaction(message.id, reactor, type);
                                    }}
                                    className="text-xl hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Timing editor */}
                          {editingTimingId === message.id && (
                            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div className="text-xs mb-2 font-medium">Edit Timing:</div>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-400">
                                    Animation Delay (frames): {message.animationDelay || 0}
                                  </label>
                                  <Input
                                    type="range"
                                    min="0"
                                    max="300"
                                    value={message.animationDelay || 0}
                                    onChange={(e) => {
                                      const newDelay = parseInt(e.target.value);
                                      setMessages(prev => prev.map(m => 
                                        m.id === message.id 
                                          ? { ...m, animationDelay: newDelay }
                                          : m
                                      ));
                                    }}
                                    className="w-full h-2"
                                  />
                                </div>
                                {message.messageType === 'typing' && (
                                  <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">
                                      Typing Duration (frames): {message.typingDuration || 30}
                                    </label>
                                    <Input
                                      type="range"
                                      min="10"
                                      max="90"
                                      value={message.typingDuration || 30}
                                      onChange={(e) => {
                                        const newDuration = parseInt(e.target.value);
                                        setMessages(prev => prev.map(m => 
                                          m.id === message.id 
                                            ? { ...m, typingDuration: newDuration }
                                            : m
                                        ));
                                      }}
                                      className="w-full h-2"
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingTimingId(null)}
                                  >
                                    Done
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Reset to calculated timing
                                      const baseDelay = messages.slice(0, messages.findIndex(m => m.id === message.id))
                                        .reduce((acc, msg) => {
                                          if (msg.messageType === 'typing') {
                                            return acc + (msg.typingDuration || 30) + 15;
                                          }
                                          return acc + (msg.typingDuration || 20) + 15;
                                        }, 0);
                                      
                                      setMessages(prev => prev.map(m => 
                                        m.id === message.id 
                                          ? { ...m, animationDelay: baseDelay, typingDuration: message.messageType === 'typing' ? 30 : 20 }
                                          : m
                                      ));
                                    }}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Text content */}
                          {message.text && (
                            <div className={cn(
                              message.messageType === 'system' && "italic text-center"
                            )}>
                              {message.text}
                            </div>
                          )}
                          
                          {/* Show reactions */}
                          {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {Object.entries(message.reactions).map(([userId, reaction]) => {
                                const user = participants.find(p => p.id === userId);
                                const reactionEmojis: { [key: string]: string } = {
                                  heart: '❤️',
                                  laugh: '😂',
                                  wow: '😮',
                                  sad: '😢',
                                  angry: '😡',
                                  thumbsup: '👍',
                                };
                                return (
                                  <span 
                                    key={userId} 
                                    className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded"
                                    title={user?.name || userId}
                                  >
                                    {reactionEmojis[reaction]}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Message actions */}
                          <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReplyingToMessage(message)}
                                className="h-6 w-6 p-0"
                                title="Reply"
                              >
                                <Reply className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setAddingReactionToId(message.id)}
                                className="h-6 w-6 p-0"
                                title="Add reaction"
                              >
                                <Heart className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTimingId(message.id)}
                                className="h-6 w-6 p-0"
                                title="Edit timing"
                              >
                                <Clock className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMessage(message.id)}
                                className="h-6 w-6 p-0"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timestamp and status */}
                        <div className={cn(
                          "flex items-center gap-1 text-xs text-gray-500",
                          message.sender === 'me' ? 'justify-end' : 'justify-start'
                        )}>
                          {editingTimestampId === message.id ? (
                            <Input
                              type="text"
                              value={message.timestamp}
                              onChange={(e) => {
                                const newTimestamp = e.target.value;
                                setMessages(prev => {
                                  const updated = prev.map(m => 
                                    m.id === message.id 
                                      ? { ...m, timestamp: newTimestamp }
                                      : m
                                  );
                                  // Re-sort messages and update animation delays
                                  return sortMessagesByTimestamp(updated);
                                });
                              }}
                              onBlur={() => setEditingTimestampId(null)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingTimestampId(null);
                                }
                              }}
                              className="w-20 h-5 text-xs px-1"
                              placeholder="HH:MM AM/PM"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:underline hover:text-blue-500 transition-colors"
                              onClick={() => setEditingTimestampId(message.id)}
                              title="Click to edit timestamp"
                            >
                              {message.timestamp}
                            </span>
                          )}
                          <span className="text-gray-400">
                            • {Math.round((message.animationDelay || 0) / 30)}s
                          </span>
                          {message.sender === 'me' && message.status && (
                            <div>
                              {message.status === 'sent' && <Check className="w-3 h-3" />}
                              {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                              {message.status === 'seen' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Phone Preview */}
          <div className="w-80 border-l bg-gray-50 dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">Instagram Preview</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Live preview of your conversation
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative">
                {/* Phone frame */}
                <div className="relative bg-black rounded-[2rem] p-2 shadow-2xl" style={{ width: '220px', height: '440px' }}>
                  {/* Screen */}
                  <div className="bg-white rounded-[1.5rem] overflow-hidden" style={{ width: '204px', height: '424px' }}>
                    {messages.length > 0 ? (
                      <InstagramConversationRenderer
                    conversation={{
                      autoScroll: true,
                      scrollEffect: true,
                      showInputField: false,
                      positionStart: 0,
                      positionEnd: 10,
                      row: 0,
                      id: 'preview',
                      messages,
                      participants,
                      chatTitle,
                      chatSubtitle: chatDescription,
                      theme: {
                        backgroundColor: '#FFFFFF',
                        headerColor: '#FFFFFF',
                        statusBarColor: '#FFFFFF',
                        bubbleColorIncoming: '#F1F3F4',
                        bubbleColorOutgoing: '#E4405F',
                        textColorIncoming: '#000000',
                        textColorOutgoing: '#FFFFFF',
                        bubbleRadius: 18,
                        fontSize: 14,
                        showTimestamps: true,
                        showProfilePictures: chatType === 'group',
                        showOnlineStatus: true,
                      } as any,
                      showNotificationBar: true,
                      showBackButton: true,
                      showVoiceCallButton: true,
                      showVideoCallButton: true,
                      showMenuButton: true,
                      notificationBar: {
                        carrier: 'Instagram',
                        time: '9:41 AM',
                        battery: 85,
                        wifi: true,
                        signal: 4,
                      },
                    }}
                        currentTime={previewTime}
                        duration={Math.max(10, previewTime + 2)}
                        containerWidth={204}
                        containerHeight={424}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center text-gray-600">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">Instagram Preview</div>
                          <div className="text-xs">Add messages to see preview</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black rounded-full" style={{ width: '60px', height: '4px' }} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {onDownload && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const conversation = await generateConversation();
                    onDownload(conversation);
                    onClose();
                  } catch (error) {
                    console.error('Failed to download:', error);
                  }
                }}
                disabled={messages.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            )}
            <Button
              variant="default"
              onClick={async () => {
                try {
                  const conversation = await generateConversation();
                  onSave(conversation);
                  onClose();
                } catch (error) {
                  console.error('Failed to generate conversation:', error);
                }
              }}
              disabled={messages.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add to Timeline
            </Button>
          </div>
        </div>
      </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};