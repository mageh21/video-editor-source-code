import React from 'react';

interface MessageTextWithMentionsProps {
  text: string;
  mentions?: {
    userId: string;
    userName: string;
    startIndex: number;
    endIndex: number;
  }[];
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const MessageTextWithMentions: React.FC<MessageTextWithMentionsProps> = ({
  text,
  mentions = [],
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const mentionStyle: React.CSSProperties = {
    color: isIncoming ? '#E4405F' : '#FFE0E6',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  };

  if (!mentions.length) {
    return <>{text}</>;
  }

  // Sort mentions by start index
  const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedMentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, mention.startIndex)}
        </span>
      );
    }

    // Add mention
    parts.push(
      <span
        key={`mention-${index}`}
        style={mentionStyle}
        onClick={(e) => {
          e.stopPropagation();
          // Handle mention click
        }}
      >
        @{mention.userName}
      </span>
    );

    lastIndex = mention.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
};