'use client';

import React from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { WhatsAppConversation, WhatsAppMessage } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { addWhatsAppConversation } from '@/app/store/slices/projectSlice';
import { calculateWhatsAppConversationDuration } from '@/app/utils/whatsapp-duration-calculator';
import { WhatsAppCreatorPro } from './WhatsAppCreatorPro';

interface SelectWhatsAppOverlayProps {
  onSelect?: (conversation: WhatsAppConversation) => void;
}

export const SelectWhatsAppOverlay: React.FC<SelectWhatsAppOverlayProps> = ({
  onSelect,
}) => {
  const dispatch = useAppDispatch();
  const { currentTime, visibleRows, whatsappConversations = [] } = useAppSelector(state => state.projectState);
  const [isCreatorProOpen, setIsCreatorProOpen] = React.useState(false);
  const [editingConversation, setEditingConversation] = React.useState<WhatsAppConversation | undefined>();

  // Create a default conversation for new conversations
  const createDefaultConversation = (): WhatsAppConversation => {
    // Find the best position for the new conversation
    const startTime = currentTime;
    
    // Create default messages for duration calculation
    const defaultMessages: WhatsAppMessage[] = [
      {
        id: "1",
        text: "Hey! How are you? 👋",
        sender: "friend",
        timestamp: "10:30 AM",
        isIncoming: true,
        status: "read",
        messageType: "text",
        animationDelay: 0,
        typingDuration: 25,
      },
      {
        id: "2", 
        text: "I'm good! How about you?",
        sender: "me",
        timestamp: "10:31 AM",
        isIncoming: false,
        status: "read",
        messageType: "text",
        animationDelay: 50,
        typingDuration: 25,
      },
    ];
    
    // Calculate duration based on messages
    const duration = calculateWhatsAppConversationDuration({ messages: defaultMessages } as WhatsAppConversation);
    
    // Find an empty row
    let targetRow = 0;
    for (let row = 0; row < visibleRows; row++) {
      const hasOverlap = whatsappConversations.some(conv => 
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
      id: `whatsapp-${Date.now()}`,
      messages: defaultMessages,
      participants: [
        {
          id: "friend",
          name: "Friend",
          color: "#25D366",
          isOnline: true,
          avatar: "👤",
          lastSeen: "online",
        },
        {
          id: "me",
          name: "Me",
          color: "#128C7E",
          isOnline: true,
          avatar: "🙂",
          lastSeen: "online",
        },
      ],
      theme: {
        backgroundColor: "#E5DDD5",
        backgroundImage: "whatsapp-pattern",
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
        showProfilePictures: false,
        showLastSeen: true,
        showMessageReactions: false,
        inputFieldColor: "#FFFFFF",
        inputTextColor: "#303030",
        linkColor: "#34B7F1",
        mentionColor: "#34B7F1",
        deletedMessageText: "🚫 This message was deleted",
        showOnlineStatus: true,
        showMessageStatus: true,
        showReactions: false,
        autoScroll: true,
        encryptionNotice: true
      },
      chatTitle: "Friend",
      chatSubtitle: "online",
      isGroupChat: false,
      isBusinessChat: false,
      scrollEffect: true,
      autoScroll: true,
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
      
      // Timeline properties
      positionStart: startTime,
      positionEnd: startTime + duration,
      row: targetRow,
      x: undefined,  // Let it auto-center
      y: undefined,  // Let it auto-center
      width: 360,    // Original WhatsApp dimensions
      height: 640,   // Original WhatsApp dimensions
      rotation: 0,
      opacity: 100,  // Percentage value
      zIndex: 100,
    };
  };

  // Handle adding a new conversation to the timeline
  const handleAddConversation = (conversation: WhatsAppConversation) => {
    dispatch(addWhatsAppConversation(conversation));
    if (onSelect) {
      onSelect(conversation);
    }
    setIsCreatorProOpen(false);
  };

  // Templates for quick start
  const whatsappTemplates = [
    {
      name: "Casual Chat",
      description: "Friends catching up",
      icon: "💬",
      messages: [
        { text: "Hey! How are you? 👋", sender: "friend", isIncoming: true },
        { text: "I'm good! How about you?", sender: "me", isIncoming: false },
        { text: "Great! Want to meet up this weekend?", sender: "friend", isIncoming: true },
        { text: "Sure! Let's plan something 🎉", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "Family Group", 
      description: "Family group chat conversation",
      icon: "👨‍👩‍👧‍👦",
      messages: [
        { text: "Good morning everyone! ☀️", sender: "mom", isIncoming: true },
        { text: "Morning mom!", sender: "me", isIncoming: false },
        { text: "Don't forget lunch on Sunday", sender: "mom", isIncoming: true },
        { text: "I'll be there! 😊", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "Business Inquiry",
      description: "Professional conversation",
      icon: "💼",
      messages: [
        { text: "Hello! I saw your portfolio", sender: "client", isIncoming: true },
        { text: "Hi! Thanks for reaching out", sender: "me", isIncoming: false },
        { text: "Are you available for a project?", sender: "client", isIncoming: true },
        { text: "Yes, I'd love to discuss further", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "Quick Reply",
      description: "Short conversation with voice/media",
      icon: "⚡",
      messages: [
        { text: "Check out this photo!", sender: "friend", isIncoming: true, messageType: "image" },
        { text: "Wow! That's amazing 😍", sender: "me", isIncoming: false },
        { text: "Sending you the location 📍", sender: "friend", isIncoming: true, messageType: "location" },
        { text: "Thanks! See you there", sender: "me", isIncoming: false }
      ]
    },
    {
      name: "Good Morning",
      description: "Morning greetings exchange",
      icon: "🌅",
      messages: [
        { text: "Good morning! 🌞", sender: "friend", isIncoming: true },
        { text: "Morning! Have a great day!", sender: "me", isIncoming: false },
        { text: "You too! ☕", sender: "friend", isIncoming: true }
      ]
    }
  ];

  const createTemplateConversation = (template: typeof whatsappTemplates[0]) => {
    const defaultConversation = createDefaultConversation();
    
    // Generate timestamps with increasing minutes
    const baseTime = new Date();
    const messages: WhatsAppMessage[] = template.messages.map((msg, index) => {
      const messageTime = new Date(baseTime.getTime() + index * 60000); // Add 1 minute per message
      return {
        id: `msg-${Date.now()}-${index}`,
        text: msg.text,
        sender: msg.sender,
        timestamp: messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isIncoming: msg.isIncoming,
        status: msg.isIncoming ? undefined : "read" as const,
        messageType: (msg.messageType || "text") as WhatsAppMessage['messageType'],
        animationDelay: index * 50,
        typingDuration: 25,
      };
    });

    // Update participants based on template
    let participants = [...defaultConversation.participants];
    if (template.name === "Family Group") {
      participants = [
        { id: "mom", name: "Mom", color: "#25D366", isOnline: true, avatar: "👩", lastSeen: "online" },
        { id: "dad", name: "Dad", color: "#128C7E", isOnline: false, avatar: "👨", lastSeen: "last seen 10:15 AM" },
        { id: "me", name: "Me", color: "#075E54", isOnline: true, avatar: "🙂", lastSeen: "online" },
      ];
    } else if (template.name === "Business Inquiry") {
      participants = [
        { id: "client", name: "Client", color: "#25D366", isOnline: true, avatar: "💼", lastSeen: "online", isBusiness: true },
        { id: "me", name: "Me", color: "#128C7E", isOnline: true, avatar: "🙂", lastSeen: "online" },
      ];
    }

    const conversation: WhatsAppConversation = {
      ...defaultConversation,
      messages,
      participants,
      chatTitle: template.name === "Family Group" ? "Family ❤️" : 
                template.name === "Business Inquiry" ? "Client" : 
                defaultConversation.chatTitle,
      isGroupChat: template.name === "Family Group",
      isBusinessChat: template.name === "Business Inquiry",
    };
    
    // Recalculate duration and end position
    const duration = calculateWhatsAppConversationDuration(conversation);
    conversation.positionEnd = conversation.positionStart + duration;
    
    return conversation;
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">WhatsApp Chats</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create WhatsApp conversations
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Creator Pro Button */}
            <Card className="p-4 border-2 border-dashed border-green-300 hover:border-green-400 transition-colors cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={() => {
                  setEditingConversation(createDefaultConversation());
                  setIsCreatorProOpen(true);
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-700 dark:text-green-300">
                      WhatsApp Creator Pro
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Build custom WhatsApp conversations
                    </div>
                  </div>
                </div>
              </Button>
            </Card>

            {/* Quick Templates */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">Quick Templates</h4>
              <div className="space-y-2">
                {whatsappTemplates.map((template, index) => (
                  <Card 
                    key={index} 
                    className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-green-200 dark:border-green-800"
                    onClick={() => {
                      const conversation = createTemplateConversation(template);
                      handleAddConversation(conversation);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-green-700 dark:text-green-300">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {template.description}
                        </div>
                        <div className="space-y-1">
                          {template.messages.slice(0, 2).map((msg, msgIndex) => (
                            <div key={msgIndex} className="flex items-center gap-2 text-xs">
                              <div className={cn(
                                "px-2 py-1 rounded-md max-w-[200px] truncate",
                                msg.isIncoming 
                                  ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" 
                                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              )}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Conversations */}
            {whatsappConversations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Recent Conversations</h4>
                <div className="space-y-2">
                  {whatsappConversations.slice(-3).reverse().map((conv) => (
                    <Card 
                      key={conv.id}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const updatedConv = {
                          ...conv,
                          id: `whatsapp-${Date.now()}`,
                          positionStart: currentTime,
                          positionEnd: currentTime + (conv.positionEnd - conv.positionStart)
                        };
                        handleAddConversation(updatedConv);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium text-sm">{conv.chatTitle}</div>
                            <div className="text-xs text-muted-foreground">
                              {conv.messages.length} messages
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConversation(conv);
                            setIsCreatorProOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Creator Pro Dialog */}
      {isCreatorProOpen && (
        <WhatsAppCreatorPro
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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}