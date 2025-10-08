'use client';

import React from 'react';
import { Plus, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { InstagramConversation, InstagramMessage } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { addInstagramConversation } from '@/app/store/slices/projectSlice';
import { calculateInstagramConversationDuration } from '@/app/utils/instagram-duration-calculator';
import { InstagramCreatorPro } from './InstagramCreatorPro';

interface SelectInstagramOverlayProps {
  onSelect?: (conversation: InstagramConversation) => void;
}

export const SelectInstagramOverlay: React.FC<SelectInstagramOverlayProps> = ({
  onSelect,
}) => {
  const dispatch = useAppDispatch();
  const { currentTime, visibleRows, instagramConversations } = useAppSelector(state => state.projectState);
  const [isCreatorProOpen, setIsCreatorProOpen] = React.useState(false);
  const [editingConversation, setEditingConversation] = React.useState<InstagramConversation | undefined>();

  // Create a default conversation for new conversations
  const createDefaultConversation = (): InstagramConversation => {
    // Find the best position for the new conversation
    const startTime = currentTime;
    
    // Create default messages for duration calculation
    const defaultMessages: InstagramMessage[] = [
      {
        id: "1",
        text: "Love your story! 🔥",
        sender: "follower",
        timestamp: "2:30 PM",
        isIncoming: true,
        status: "seen",
        messageType: "text",
        animationDelay: 0,
        typingDuration: 20,
      },
      {
        id: "2", 
        text: "Thank you! 💕",
        sender: "me",
        timestamp: "2:31 PM",
        isIncoming: false,
        status: "seen",
        messageType: "text",
        animationDelay: 45,
        typingDuration: 20,
      },
    ];
    
    // Calculate duration based on messages
    const duration = calculateInstagramConversationDuration({ messages: defaultMessages } as InstagramConversation);
    
    // Find an empty row
    let targetRow = 0;
    for (let row = 0; row < visibleRows; row++) {
      const hasOverlap = instagramConversations.some(conv => 
        conv.row === row && 
        ((startTime >= conv.positionStart && startTime < conv.positionEnd) ||
         (startTime + duration > conv.positionStart && startTime + duration <= conv.positionEnd))
      );
      if (!hasOverlap) {
        targetRow = row;
        break;
      }
    }

    return {
      id: `insta-${Date.now()}`,
      messages: defaultMessages,
      participants: [
        {
          id: "follower",
          name: "Follower",
          color: "#E4405F",
          isOnline: true,
          avatar: "📸",
        },
        {
          id: "me",
          name: "Me",
          color: "#C13584",
          isOnline: true,
          avatar: "💫",
        },
      ],
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
        showProfilePictures: false,
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
      chatTitle: "Follower",
      chatSubtitle: "Active now",
      isGroupChat: false,
      scrollEffect: true,
      autoScroll: true,
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
      
      // Timeline properties
      positionStart: startTime,
      positionEnd: startTime + duration,
      row: targetRow,
      x: undefined,  // Let it auto-center
      y: undefined,  // Let it auto-center
      width: 360,    // Original Instagram dimensions
      height: 640,   // Original Instagram dimensions
      rotation: 0,
      opacity: 100,  // Percentage value
      zIndex: 100,
    };
  };

  // Handle adding a new conversation to the timeline
  const handleAddConversation = (conversation: InstagramConversation) => {
    dispatch(addInstagramConversation(conversation));
    if (onSelect) {
      onSelect(conversation);
    }
    setIsCreatorProOpen(false);
  };

  // Templates for quick start
  const instagramTemplates = [
    {
      name: "Story Reaction",
      description: "Someone reacting to your Instagram story",
      icon: "❤️",
      messages: [
        { text: "Love your story! 🔥", sender: "follower", isIncoming: true },
        { text: "Thank you! 💕", sender: "me", isIncoming: false },
        { text: "Where was this taken?", sender: "follower", isIncoming: true },
        { text: "Bali! Just got back ✈️", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "DM Conversation", 
      description: "Business or collaboration inquiry",
      icon: "💬",
      messages: [
        { text: "Hi! Saw your post about photography 📸", sender: "brand", isIncoming: true },
        { text: "Hey! Thanks for reaching out!", sender: "me", isIncoming: false },
        { text: "Would love to collaborate!", sender: "brand", isIncoming: true },
        { text: "I'm interested! Send me details 📩", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "Compliment Thread",
      description: "Fan complimenting your content",
      icon: "🌟",
      messages: [
        { text: "Your feed is gorgeous! 😍", sender: "fan", isIncoming: true },
        { text: "Aww thank you so much! 🥺", sender: "me", isIncoming: false },
        { text: "You're so inspiring!", sender: "fan", isIncoming: true },
        { text: "You just made my day! ❤️", sender: "me", isIncoming: false }
      ]
    }
  ];

  const createTemplateConversation = (template: typeof instagramTemplates[0]) => {
    const defaultConversation = createDefaultConversation();
    
    const messages: InstagramMessage[] = template.messages.map((msg, index) => ({
      id: `msg-${index + 1}`,
      text: msg.text,
      sender: msg.sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: msg.isIncoming,
      status: msg.isIncoming ? undefined : "seen" as const,
      messageType: "text",
      animationDelay: index * 45,
      typingDuration: 20,
    }));

    const conversation = {
      ...defaultConversation,
      messages,
      chatTitle: defaultConversation.chatTitle, // Keep the default title (participant name)
    };
    
    return {
      ...conversation,
      positionEnd: conversation.positionStart + calculateInstagramConversationDuration(conversation)
    };
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Instagram DMs</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create Instagram Direct Message conversations
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Creator Pro Button */}
            <Card className="p-4 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={() => {
                  setEditingConversation(createDefaultConversation());
                  setIsCreatorProOpen(true);
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-purple-700 dark:text-purple-300">
                      Instagram Creator Pro
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Build custom Instagram conversations
                    </div>
                  </div>
                </div>
              </Button>
            </Card>

            {/* Quick Templates */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">Quick Templates</h4>
              <div className="space-y-2">
                {instagramTemplates.map((template, index) => (
                  <Card 
                    key={index} 
                    className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-purple-200 dark:border-purple-800"
                    onClick={() => {
                      const conversation = createTemplateConversation(template);
                      handleAddConversation(conversation);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-purple-700 dark:text-purple-300">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {template.description}
                        </div>
                        <div className="space-y-1">
                          {template.messages.slice(0, 2).map((msg, msgIndex) => (
                            <div 
                              key={msgIndex}
                              className={`text-xs px-2 py-1 rounded-lg max-w-[80%] ${
                                msg.isIncoming 
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                                  : 'bg-purple-500 text-white ml-auto'
                              }`}
                              style={{
                                marginLeft: msg.isIncoming ? '0' : 'auto',
                                marginRight: msg.isIncoming ? 'auto' : '0'
                              }}
                            >
                              {msg.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Creator Pro Modal */}
      {isCreatorProOpen && (
        <InstagramCreatorPro
          isOpen={isCreatorProOpen}
          onClose={() => {
            setIsCreatorProOpen(false);
            setEditingConversation(undefined);
          }}
          onSave={handleAddConversation}
          existingConversation={editingConversation}
        />
      )}
    </>
  );
};