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
  MoreHorizontal, Music, BarChart3, Image, UserPlus, UserMinus, Edit3,
  Paperclip, FileText, Share2, Star, Bell, BellOff, Archive, Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  WhatsAppConversation, 
  WhatsAppMessage, 
  WhatsAppParticipant 
} from '@/app/types';
import { calculateWhatsAppConversationDuration } from '@/app/utils/whatsapp-duration-calculator';
import { WhatsAppConversationRenderer } from './WhatsAppConversationRenderer';

interface WhatsAppCreatorProProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conversation: WhatsAppConversation) => void;
  existingConversation?: WhatsAppConversation;
  onDownload?: (conversation: WhatsAppConversation) => void;
}

// Pre-defined avatars for WhatsApp
const AVATAR_PRESETS = [
  { id: 'user1', emoji: '👤', color: '#25D366', label: 'Default' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', color: '#128C7E', label: 'Family' },
  { id: 'friend', emoji: '🤝', color: '#075E54', label: 'Friend' },
  { id: 'work', emoji: '💼', color: '#34B7F1', label: 'Work' },
  { id: 'school', emoji: '🎓', color: '#00A884', label: 'School' },
  { id: 'sports', emoji: '⚽', color: '#25D366', label: 'Sports' },
  { id: 'food', emoji: '🍔', color: '#128C7E', label: 'Food' },
  { id: 'travel', emoji: '✈️', color: '#075E54', label: 'Travel' },
  { id: 'music', emoji: '🎵', color: '#34B7F1', label: 'Music' },
  { id: 'gaming', emoji: '🎮', color: '#00A884', label: 'Gaming' },
  { id: 'pet', emoji: '🐕', color: '#25D366', label: 'Pet' },
  { id: 'doctor', emoji: '👨‍⚕️', color: '#128C7E', label: 'Doctor' },
];

// WhatsApp-style conversation starters
const CONVERSATION_STARTERS = [
  {
    category: "Greetings",
    icon: "👋",
    messages: [
      "Hey! How are you?",
      "Good morning! 🌅",
      "Hi there! What's up?",
      "Hello! Hope you're doing well"
    ]
  },
  {
    category: "Daily Life",
    icon: "☕",
    messages: [
      "Just had coffee ☕",
      "On my way!",
      "Running late, sorry!",
      "What's for dinner?"
    ]
  },
  {
    category: "Quick Replies",
    icon: "💬",
    messages: [
      "Ok",
      "Sure thing!",
      "Got it, thanks!",
      "No problem 👍"
    ]
  },
  {
    category: "Questions",
    icon: "❓",
    messages: [
      "Are you free today?",
      "Can you call me?",
      "Where are you?",
      "Did you see my message?"
    ]
  }
];

// Smart replies for WhatsApp context
const SMART_REPLIES = {
  greeting: ["Hey! 👋", "Hi! How are you?", "Hello there!", "Good to hear from you!"],
  acknowledgment: ["Ok", "Got it", "Sure", "👍"],
  thanks: ["You're welcome!", "No problem!", "Anytime!", "Happy to help!"],
  busy: ["In a meeting", "Driving, will call later", "Can't talk now", "Will message you soon"],
};

export const WhatsAppCreatorPro: React.FC<WhatsAppCreatorProProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConversation,
  onDownload
}) => {
  // Core state
  const [chatType, setChatType] = useState<'personal' | 'group'>('personal');
  const [messages, setMessages] = useState<WhatsAppMessage[]>(existingConversation?.messages || []);
  const [participants, setParticipants] = useState<WhatsAppParticipant[]>(
    existingConversation?.participants || [
      { id: "me", name: "Me", color: "#25D366", isOnline: true, avatar: '👤', lastSeen: 'online' },
      { id: "other", name: "Contact", color: "#128C7E", isOnline: false, avatar: '🤝', lastSeen: 'last seen today at 2:30 PM' }
    ]
  );
  
  // UI state
  const [selectedSender, setSelectedSender] = useState("me");
  const [messageText, setMessageText] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState<'text' | 'image' | 'video' | 'voice' | 'call' | 'system' | 'typing' | 'location' | 'document' | 'contact' | 'poll' | 'sticker' | 'deleted' | 'member_added' | 'member_removed' | 'group_name_changed' | 'group_photo_changed' | 'pinned_message'>('text');
  const [isTyping, setIsTyping] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(true);
  const [autoTypingIndicators, setAutoTypingIndicators] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<{ src: string; type: string } | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<WhatsAppMessage | null>(null);
  const [editingTimestampId, setEditingTimestampId] = useState<string | null>(null);
  const [addingReactionToId, setAddingReactionToId] = useState<string | null>(null);
  const [editingTimingId, setEditingTimingId] = useState<string | null>(null);
  
  // New message type states
  const [locationData, setLocationData] = useState({ name: '', address: '', latitude: 0, longitude: 0 });
  const [documentData, setDocumentData] = useState({ name: '', size: '', type: 'pdf' });
  const [contactData, setContactData] = useState({ name: '', phone: '' });
  const [pollData, setPollData] = useState({ 
    question: '', 
    options: ['', ''], 
    allowMultipleAnswers: false 
  });
  const [groupEventData, setGroupEventData] = useState({
    actor: '',
    affectedUsers: [''],
    oldValue: '',
    newValue: ''
  });
  const [pinnedMessageData, setPinnedMessageData] = useState({
    messageText: '',
    pinnedBy: ''
  });
  
  // WhatsApp specific state
  const [chatTitle, setChatTitle] = useState(existingConversation?.chatTitle || "");
  const [chatDescription, setChatDescription] = useState("");
  const [previewTime, setPreviewTime] = useState(0);
  const [isBusinessChat, setIsBusinessChat] = useState(false);
  const [showEncryptionNotice, setShowEncryptionNotice] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update chat title based on participants
  useEffect(() => {
    if (!chatTitle && chatType === 'personal') {
      const otherParticipant = participants.find(p => p.id !== 'me');
      if (otherParticipant) {
        setChatTitle(otherParticipant.name || 'WhatsApp User');
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

  const sortMessagesByTimestamp = (messages: WhatsAppMessage[]): WhatsAppMessage[] => {
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

      if ((msg as any).messageType === 'typing') {
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

  // Add message with WhatsApp features
  const addMessage = useCallback(() => {
    if (!messageText.trim() && ['text', 'system'].includes(selectedMessageType)) return;
    if (!selectedMedia && ['image', 'video', 'sticker'].includes(selectedMessageType)) {
      return;
    }
    
    const sender = participants.find(p => p.id === selectedSender);
    const messagesToAdd: WhatsAppMessage[] = [];
    
    // Add automatic typing indicator before text messages
    if (autoTypingIndicators && selectedMessageType === 'text' && selectedSender !== 'me' && messageText.trim()) {
      const charCount = messageText.length;
      // 4 chars per second typing speed, min 15 frames, max 90 frames
      const typingDur = Math.min(90, Math.max(15, Math.floor(charCount / 4)));
      
      // Calculate proper animation delay for typing
      const currentDelay = messages.reduce((acc, msg) => {
        if ((msg as any).messageType === 'typing') {
          return acc + (msg.typingDuration || 30) + 10;
        }
        return acc + (msg.typingDuration || 20) + 10;
      }, 0);
      
      const typingIndicator: WhatsAppMessage = {
        id: `typing-${Date.now()}`,
        text: '',
        sender: selectedSender,
        isIncoming: true,
        timestamp: getNextTimestamp(),
        messageType: 'typing' as any,
        animationDelay: currentDelay,
        typingDuration: typingDur,
      };
      messagesToAdd.push(typingIndicator);
    }
    
    // Create the main message
    let messageType = selectedMessageType;
    let text = messageText;
    let typingDuration = selectedMessageType === 'system' ? 0 : 20; // Faster for WhatsApp
    
    // Handle voice messages
    if (selectedMessageType === 'voice') {
      messageType = 'voice';
      text = ''; // Voice messages don't have text
      typingDuration = 0;
    }
    
    const newMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      text: text,
      sender: selectedMessageType === 'system' ? 'system' : selectedSender,
      isIncoming: selectedMessageType === 'system' ? true : selectedSender !== 'me',
      timestamp: getNextTimestamp(),
      messageType: messageType as any,
      status: selectedMessageType === 'system' ? undefined : (selectedSender === 'me' ? 'sent' : undefined),
      animationDelay: messages.reduce((acc, msg) => {
        if ((msg as any).messageType === 'typing') {
          return acc + (msg.typingDuration || 30) + 15;
        }
        return acc + (msg.typingDuration || 20) + 15;
      }, 0) + (messagesToAdd.length > 0 && (messagesToAdd[0] as any).messageType === 'typing' ? messagesToAdd[0].typingDuration + 15 : 0),
      typingDuration: messagesToAdd.length > 0 ? 0 : typingDuration,
      replyTo: selectedMessageType === 'system' ? undefined : (replyingToMessage ? {
        messageId: replyingToMessage.id,
        originalMessage: {
          text: replyingToMessage.text,
          sender: replyingToMessage.sender,
          senderName: participants.find(p => p.id === replyingToMessage.sender)?.name || replyingToMessage.sender,
          messageType: replyingToMessage.messageType || 'text'
        }
      } as any : undefined)
    };
    
    // Add media if selected
    if (selectedMedia && ['image', 'video', 'sticker'].includes(selectedMessageType)) {
      newMessage.media = {
        src: selectedMedia.src,
        type: selectedMessageType as 'image' | 'video' | 'sticker',
        thumbnail: selectedMedia.src
      } as any;
      (newMessage as any).mediaUrl = selectedMedia.src;
      if (selectedMessageType !== 'sticker') {
        // Images and videos can have captions
        newMessage.text = messageText;
      } else {
        // Stickers don't have captions
        newMessage.text = '';
      }
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
      
      (newMessage as any).voice = {
        duration: durationInSeconds,
        // Generate random waveform data
        waveform: Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2),
        isPlayed: false
      };
    }

    // Add call message properties
    if (selectedMessageType === 'call') {
      (newMessage as any).callType = 'voice';
      (newMessage as any).callStatus = 'missed';
      (newMessage as any).callDuration = messageText || '0:00';
      newMessage.text = '';
    }
    
    // Add typing indicator properties
    if (selectedMessageType === 'typing') {
      newMessage.messageType = 'typing' as any;
      newMessage.text = '';
      // If user provided duration, use it. Otherwise auto-calculate
      if (messageText.trim()) {
        newMessage.typingDuration = parseInt(messageText);
      } else {
        newMessage.typingDuration = 30; // Default 1 second
      }
    }
    
    // Add location properties
    if (selectedMessageType === 'location') {
      newMessage.location = {
        name: locationData.name || 'Location',
        address: locationData.address,
        latitude: locationData.latitude || 0,
        longitude: locationData.longitude || 0,
        mapPreview: selectedMedia?.src
      } as any;
      newMessage.text = locationData.name || 'Location';
    }
    
    // Add document properties
    if (selectedMessageType === 'document') {
      (newMessage as any).document = {
        name: documentData.name || 'Document.pdf',
        size: documentData.size || '1.2 MB',
        type: documentData.type as 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'other',
        pages: documentData.type === 'pdf' ? Math.floor(Math.random() * 10) + 1 : undefined
      };
      newMessage.text = ''; // No text for document messages
    }

    // Add contact properties
    if (selectedMessageType === 'contact') {
      (newMessage as any).contact = {
        name: contactData.name || 'Contact Name',
        phone: contactData.phone || '+1234567890',
        avatar: selectedMedia?.src
      };
      newMessage.text = ''; // No text for contact messages
    }
    
    // Add poll properties
    if (selectedMessageType === 'poll') {
      const pollOptions = pollData.options
        .filter(opt => opt.trim())
        .map((text, index) => ({
          id: `opt-${index}`,
          text,
          votes: [],
          percentage: 0
        }));
        
      (newMessage as any).poll = {
        question: pollData.question || 'Poll Question',
        options: pollOptions.length >= 2 ? pollOptions : [
          { id: 'opt-0', text: 'Option 1', votes: [], percentage: 0 },
          { id: 'opt-1', text: 'Option 2', votes: [], percentage: 0 }
        ],
        allowMultipleAnswers: pollData.allowMultipleAnswers,
        totalVotes: 0
      };
      newMessage.text = ''; // No text for poll messages
    }
    
    // Add deleted message properties
    if (selectedMessageType === 'deleted') {
      newMessage.text = '🚫 This message was deleted';
      (newMessage as any).isDeleted = true;
    }
    
    // Add group event properties
    if (['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(selectedMessageType)) {
      (newMessage as any).systemMessageData = {
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
    
    // Add pinned message properties
    if (selectedMessageType === 'pinned_message') {
      const pinnerName = participants.find(p => p.id === (pinnedMessageData.pinnedBy || selectedSender))?.name || 'Someone';
      newMessage.text = `${pinnerName} pinned "${pinnedMessageData.messageText}"`;
      (newMessage as any).isPinned = true;
      newMessage.isIncoming = true;
    }
    
    messagesToAdd.push(newMessage);
    
    setMessages(prev => [...prev, ...messagesToAdd]);
    setMessageText("");
    setSelectedMedia(null);
    setReplyingToMessage(null);
    
    // Auto-update message status for WhatsApp
    if (selectedSender === 'me' && selectedMessageType !== 'system') {
      messagesToAdd.forEach((msg, index) => {
        if ((msg as any).messageType !== 'typing') {
          setTimeout(() => {
            updateMessageStatus(msg.id, 'delivered');
            setTimeout(() => {
              updateMessageStatus(msg.id, 'read');
            }, 500);
          }, 300 + (index * 50));
        }
      });
    }
  }, [messageText, selectedSender, selectedMessageType, messages.length, participants, selectedMedia, replyingToMessage, autoTypingIndicators, locationData, documentData, contactData, pollData, groupEventData, pinnedMessageData]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: 'sent' | 'delivered' | 'read') => {
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
        return { ...msg, reactions: newReactions } as any;
      }
      return msg;
    }) as any);
    setAddingReactionToId(null);
  }, []);

  // Generate conversation object for WhatsApp
  const generateConversation = useCallback(async (): Promise<WhatsAppConversation> => {
    // Ensure messages is an array
    const currentMessages = Array.isArray(messages) ? messages : [];
    
    console.log('Generating conversation with messages:', currentMessages);
    
    // Create a temporary conversation object for duration calculation
    const tempConversation: Partial<WhatsAppConversation> = { 
      messages: currentMessages 
    };
    
    // WhatsApp conversations are typically slower than Instagram
    let duration = 10; // Default duration
    try {
      if (currentMessages.length > 0) {
        duration = calculateWhatsAppConversationDuration(tempConversation as WhatsAppConversation);
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      duration = Math.max(10, currentMessages.length * 3); // Fallback: 3 seconds per message
    }
    
    if (existingConversation?.fixedDuration) {
      duration = existingConversation.fixedDuration;
    }
    
    const conversation: WhatsAppConversation = {
      id: existingConversation?.id || `whatsapp-${Date.now()}`,
      messages: currentMessages,
      participants,
      theme: {
        backgroundColor: "#E5DDD5",
        backgroundImage: "whatsapp-pattern", // Special pattern background
        headerColor: "#075E54",
        bubbleColorIncoming: "#FFFFFF",
        bubbleColorOutgoing: "#DCF8C6",
        textColorIncoming: "#303030",
        textColorOutgoing: "#303030",
        statusBarColor: "#075E54",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 14,
        bubbleRadius: 7,
        showTypingIndicator: true,
        showTimestamps: true,
        showReadReceipts: true,
        showProfilePictures: chatType === 'group',
        showLastSeen: true,
        showMessageReactions: false, // WhatsApp doesn't have reactions like Instagram
        inputFieldColor: "#FFFFFF",
        inputTextColor: "#303030",
        linkColor: "#34B7F1",
        mentionColor: "#34B7F1",
        deletedMessageText: "🚫 This message was deleted",
        showOnlineStatus: true,
        showMessageStatus: true,
        showReactions: false,
        autoScroll: true,
        encryptionNotice: showEncryptionNotice
      },
      chatTitle: chatTitle || (chatType === 'group' ? 'WhatsApp Group' : participants.find(p => p.id !== 'me')?.name || 'WhatsApp User'),
      chatSubtitle: chatType === 'group' ? `${participants.length} participants` : participants.find(p => p.id !== 'me')?.lastSeen || 'last seen recently',
      isGroupChat: chatType === 'group',
      isBusinessChat: isBusinessChat,
      autoScroll: true,
      scrollEffect: true,
      showInputField: true,
      showNotificationBar: true,
      showBackButton: true,
      showVideoCallButton: true,
      showVoiceCallButton: true,
      showMenuButton: true,
      showActionButtons: true,
      showAttachmentButton: true,
      notificationBar: {
        carrier: "WhatsApp",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        battery: 85,
        signal: 4,
        wifi: true
      },
      platform: 'whatsapp',
      platformTheme: {
        primaryColor: '#25D366',
        secondaryColor: '#128C7E',
        backgroundColor: '#E5DDD5',
        textColor: '#303030',
      },
      exportPreset: 'whatsapp-status',
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
  }, [messages, participants, chatTitle, chatType, existingConversation, isBusinessChat, showEncryptionNotice]);

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
  const updateParticipant = useCallback((id: string, updates: Partial<WhatsAppParticipant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addParticipant = useCallback(() => {
    const newId = `participant_${Date.now()}`;
    const preset = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    setParticipants(prev => [...prev, {
      id: newId,
      name: `User ${prev.length}`,
      color: preset.color,
      isOnline: Math.random() > 0.5,
      avatar: preset.emoji,
      lastSeen: 'last seen recently'
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
          <DialogTitle>WhatsApp Creator Pro</DialogTitle>
          <DialogDescription>Create WhatsApp conversations</DialogDescription>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-500 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">WhatsApp Creator Pro</h2>
              <p className="text-sm opacity-90">Create WhatsApp conversations</p>
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
              <div className="mb-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <div className="font-semibold text-green-800 dark:text-green-200">WhatsApp</div>
                    <div className="text-xs text-green-600 dark:text-green-300">Authentic WhatsApp styling</div>
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
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
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
                    Personal Chat
                  </button>
                  <button
                    className={cn(
                      "flex items-center justify-start gap-2 px-3 py-2 rounded-md border transition-colors text-sm w-full",
                      chatType === 'group' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    )}
                    onClick={() => setChatType('group')}
                  >
                    <Users className="w-4 h-4" />
                    Group Chat
                  </button>
                </div>
              </div>

              {/* WhatsApp Options */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Business Account</Label>
                  <Switch
                    checked={isBusinessChat}
                    onCheckedChange={setIsBusinessChat}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Encryption Notice</Label>
                  <Switch
                    checked={showEncryptionNotice}
                    onCheckedChange={setShowEncryptionNotice}
                  />
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
                      participant.id === 'me' && "border-green-500 bg-green-50 dark:bg-green-950"
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
                                onError={() => updateParticipant(participant.id, { avatar: '👤' })}
                              />
                            ) : (
                              <span>{participant.avatar || '👤'}</span>
                            )}
                          </div>
                          {participant.isOnline && participant.id !== 'me' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                          <Input
                            value={participant.name}
                            onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                            className="h-7 text-sm font-medium text-gray-900 dark:text-gray-100"
                            placeholder="Contact Name"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            {participant.id === 'me' ? (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            ) : (
                              <>
                                <Input
                                  value={participant.lastSeen || 'last seen recently'}
                                  onChange={(e) => updateParticipant(participant.id, { lastSeen: e.target.value })}
                                  className="h-5 text-xs text-gray-500"
                                  placeholder="last seen..."
                                />
                              </>
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
                                "h-8 w-8 p-0 text-lg rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900 transition-colors",
                                participant.avatar === preset.emoji && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950 border-green-500"
                              )}
                              onClick={() => updateParticipant(participant.id, { avatar: preset.emoji })}
                              title={preset.label}
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
                  className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    autoTypingIndicators ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
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
                    { type: 'document', icon: FileText, label: 'Document', description: 'PDF, DOC, etc.' },
                    { type: 'location', icon: MapPin, label: 'Location', description: 'Share location' },
                    { type: 'contact', icon: User, label: 'Contact', description: 'Share contact' },
                    { type: 'poll', icon: BarChart3, label: 'Poll', description: 'Create a poll' },
                    { type: 'sticker', icon: Smile, label: 'Sticker', description: 'Send a sticker' },
                    { type: 'call', icon: Phone, label: 'Call', description: 'Call notification' },
                    { type: 'typing', icon: MoreHorizontal, label: 'Typing', description: 'Typing indicator' },
                    { type: 'deleted', icon: Trash2, label: 'Deleted', description: 'Deleted message' },
                    { type: 'system', icon: Info, label: 'System', description: 'System message' },
                    { type: 'member_added', icon: UserPlus, label: 'Member Added', description: 'Member added to group' },
                    { type: 'member_removed', icon: UserMinus, label: 'Member Removed', description: 'Member removed from group' },
                    { type: 'group_name_changed', icon: Edit3, label: 'Name Changed', description: 'Group name changed' },
                    { type: 'group_photo_changed', icon: Camera, label: 'Photo Changed', description: 'Group photo changed' },
                    { type: 'pinned_message', icon: Pin, label: 'Pinned', description: 'Message pinned' },
                  ].map(({ type, icon: Icon, label, description }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMessageType(type as any)}
                      className={cn(
                        "h-8 px-3 text-sm rounded-md border transition-colors flex items-center gap-1",
                        selectedMessageType === type 
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
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
              {['image', 'video', 'sticker'].includes(selectedMessageType) && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedMessageType === 'image' ? 'Upload Photo:' : 
                     selectedMessageType === 'video' ? 'Upload Video:' : 'Upload Sticker:'}
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedMessageType === 'image' ? 'image/*' : selectedMessageType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose {selectedMessageType === 'image' ? 'Photo' : selectedMessageType === 'video' ? 'Video' : 'Sticker'} from Device
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

              {/* Location */}
              {selectedMessageType === 'location' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Location Details:</Label>
                  <Input
                    placeholder="Location name (e.g., Central Park)"
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

              {/* Document */}
              {selectedMessageType === 'document' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Document Details:</Label>
                  <Input
                    placeholder="File name (e.g., Report.pdf)"
                    value={documentData.name}
                    onChange={(e) => setDocumentData({...documentData, name: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="File size (e.g., 2.5 MB)"
                    value={documentData.size}
                    onChange={(e) => setDocumentData({...documentData, size: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <select
                    value={documentData.type}
                    onChange={(e) => setDocumentData({...documentData, type: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC/DOCX</option>
                    <option value="xls">XLS/XLSX</option>
                    <option value="ppt">PPT/PPTX</option>
                    <option value="txt">TXT</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {/* Contact */}
              {selectedMessageType === 'contact' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Contact Details:</Label>
                  <Input
                    placeholder="Contact name"
                    value={contactData.name}
                    onChange={(e) => setContactData({...contactData, name: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <Input
                    placeholder="Phone number"
                    value={contactData.phone}
                    onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
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
                  {pollData.options.length < 12 && (
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
                      checked={pollData.allowMultipleAnswers}
                      onCheckedChange={(checked) => setPollData({...pollData, allowMultipleAnswers: checked})}
                    />
                    <Label className="text-xs">Allow multiple answers</Label>
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

              {/* Pinned Message */}
              {selectedMessageType === 'pinned_message' && (
                <div className="mb-3 space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Pinned Message Details:</Label>
                  <Input
                    placeholder="Message text that was pinned"
                    value={pinnedMessageData.messageText}
                    onChange={(e) => setPinnedMessageData({...pinnedMessageData, messageText: e.target.value})}
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                  <select
                    value={pinnedMessageData.pinnedBy}
                    onChange={(e) => setPinnedMessageData({...pinnedMessageData, pinnedBy: e.target.value})}
                    className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700"
                  >
                    <option value="">Who pinned this message?</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reply indicator */}
              {replyingToMessage && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-950 rounded border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">
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
                    selectedMessageType === 'deleted' ? 'This will show as deleted message' :
                    ['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed', 'pinned_message'].includes(selectedMessageType) ? 
                      'Fill in the form above, then click send' :
                    'Type a message'
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
                    !['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed', 'deleted', 'pinned_message'].includes(selectedMessageType)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Smart Replies */}
              {showSmartReplies && messages.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Quick Replies:</Label>
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
                      {/* Avatar for incoming messages in groups */}
                      {message.isIncoming && chatType === 'group' && (
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
                            ? "bg-green-100 dark:bg-green-900 text-gray-900 dark:text-gray-100"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                          (message as any).messageType === 'deleted' && "opacity-60 italic"
                        )}>
                          {/* Reply reference */}
                          {message.replyTo && (
                            <div className="mb-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs border-l-2 border-green-500">
                              <div className="font-medium text-green-600 dark:text-green-400">{(message.replyTo as any).originalMessage.senderName}</div>
                              <div className="opacity-80">{(message.replyTo as any).originalMessage.text}</div>
                            </div>
                          )}
                          
                          {/* Media */}
                          {((message as any).mediaUrl || (message.media as any)?.src) && (
                            <div className="mb-2">
                              {message.messageType === 'video' ? (
                                <video className="max-w-full h-auto rounded" controls>
                                  <source src={(message as any).mediaUrl || (message.media as any)?.src} />
                                </video>
                              ) : (
                                <img
                                  src={(message as any).mediaUrl || (message.media as any)?.src}
                                  alt="Message media"
                                  className="max-w-full h-auto rounded"
                                />
                              )}
                            </div>
                          )}

                          {/* Voice message */}
                          {message.messageType === 'voice' && (message as any).voice && (
                            <div className="flex items-center gap-2">
                              <Mic className="w-4 h-4 text-gray-500" />
                              <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center px-2">
                                  {(message as any).voice.waveform?.map((height: number, i: number) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-gray-400 dark:bg-gray-500 mx-px"
                                      style={{ height: `${height * 100}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.floor((message as any).voice.duration / 60)}:{((message as any).voice.duration % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          )}
                          
                          {/* Document */}
                          {message.messageType === 'document' && (message as any).document && (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <FileText className="w-6 h-6 text-gray-500" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{(message as any).document.name}</div>
                                <div className="text-xs text-gray-500">
                                  {(message as any).document.type.toUpperCase()} • {(message as any).document.size}
                                  {(message as any).document.pages && ` • ${(message as any).document.pages} pages`}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Location */}
                          {message.messageType === 'location' && message.location && (
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-sm">{message.location.name}</span>
                              </div>
                              {message.location.address && (
                                <div className="text-xs text-gray-500">{message.location.address}</div>
                              )}
                            </div>
                          )}
                          
                          {/* Contact */}
                          {message.messageType === 'contact' && message.contact && (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{message.contact.name}</div>
                                <div className="text-xs text-gray-500">{message.contact.phone}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Poll */}
                          {message.messageType === 'poll' && message.poll && (
                            <div className="space-y-2">
                              <div className="font-medium">{message.poll.question}</div>
                              {message.poll.options.map((option) => (
                                <div key={option.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                  {option.text}
                                </div>
                              ))}
                              <div className="text-xs text-gray-500">
                                {(message as any).poll.allowMultipleAnswers ? 'Multiple answers allowed' : 'Single answer only'}
                              </div>
                            </div>
                          )}
                          
                          {/* Reaction selector */}
                          {addingReactionToId === message.id && (
                            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div className="text-xs mb-2">WhatsApp doesn't support reactions</div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAddingReactionToId(null)}
                              >
                                Close
                              </Button>
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
                                {(message as any).messageType === 'typing' && (
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
                                          if ((msg as any).messageType === 'typing') {
                                            return acc + (msg.typingDuration || 30) + 15;
                                          }
                                          return acc + (msg.typingDuration || 20) + 15;
                                        }, 0);

                                      setMessages(prev => prev.map(m =>
                                        m.id === message.id
                                          ? { ...m, animationDelay: baseDelay, typingDuration: (message as any).messageType === 'typing' ? 30 : 20 }
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
                              (message as any).messageType === 'system' && "italic text-center text-xs text-gray-500"
                            )}>
                              {message.text}
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
                              className="cursor-pointer hover:underline hover:text-green-600 transition-colors"
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
                            <div className="flex">
                              {message.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                              {message.status === 'delivered' && <CheckCheck className="w-3 h-3 text-gray-400" />}
                              {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
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
              <h3 className="font-semibold mb-2">WhatsApp Preview</h3>
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
                      <WhatsAppConversationRenderer
                        conversation={{
                          id: 'preview',
                          messages,
                          participants,
                          chatTitle,
                          chatSubtitle: chatType === 'group' ? `${participants.length} participants` : participants.find(p => p.id !== 'me')?.lastSeen || 'last seen recently',
                          theme: {
                            backgroundColor: '#E5DDD5',
                            backgroundImage: 'whatsapp-pattern',
                            headerColor: '#075E54',
                            statusBarColor: '#075E54',
                            bubbleColorIncoming: '#FFFFFF',
                            bubbleColorOutgoing: '#DCF8C6',
                            textColorIncoming: '#303030',
                            textColorOutgoing: '#303030',
                            textLight: '#667781',
                            bubbleRadius: 7,
                            fontSize: 14,
                            showTimestamps: true,
                            showProfilePictures: chatType === 'group',
                            showOnlineStatus: true,
                            encryptionNotice: showEncryptionNotice,
                          } as any,
                          showNotificationBar: true,
                          showBackButton: true,
                          showVoiceCallButton: true,
                          showVideoCallButton: true,
                          showMenuButton: true,
                          showAttachmentButton: true,
                          isBusinessChat: isBusinessChat,
                          notificationBar: {
                            carrier: 'WhatsApp',
                            time: '9:41 AM',
                            battery: 85,
                            wifi: true,
                            signal: 4,
                          },
                          autoScroll: false,
                          scrollEffect: false,
                          showInputField: false,
                          positionStart: 0,
                          positionEnd: 10,
                          row: 0,
                        } as any}
                        currentTime={previewTime}
                        duration={Math.max(10, previewTime + 2)}
                        containerWidth={204}
                        containerHeight={424}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E5DDD5] flex items-center justify-center">
                        <div className="text-center text-gray-600">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">WhatsApp Preview</div>
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
              className="bg-green-600 hover:bg-green-700"
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