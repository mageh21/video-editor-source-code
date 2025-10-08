import React from 'react';

interface StoryReplyMessageProps {
  storyImage: string;
  storyOwner: string;
  storyCaption?: string;
  replyText: string;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const StoryReplyMessage: React.FC<StoryReplyMessageProps> = ({
  storyImage,
  storyOwner,
  storyCaption,
  replyText,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
    borderRadius: `${18 * presentationScale}px`,
    padding: `${8 * presentationScale}px`,
    maxWidth: `${240 * presentationScale}px`,
  };

  const storyPreviewStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${8 * presentationScale}px`,
    marginBottom: `${8 * presentationScale}px`,
    padding: `${6 * presentationScale}px`,
    backgroundColor: isIncoming ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)',
    borderRadius: `${12 * presentationScale}px`,
  };

  const storyImageStyle: React.CSSProperties = {
    width: `${40 * presentationScale}px`,
    height: `${40 * presentationScale}px`,
    borderRadius: `${8 * presentationScale}px`,
    objectFit: 'cover',
  };

  const storyInfoStyle: React.CSSProperties = {
    flex: 1,
  };

  const storyOwnerStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    fontWeight: 600,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    marginBottom: `${2 * presentationScale}px`,
  };

  const storyCaptionStyle: React.CSSProperties = {
    fontSize: `${11 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    opacity: 0.7,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const replyTextStyle: React.CSSProperties = {
    fontSize: `${14 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    lineHeight: 1.4,
  };

  return (
    <div style={containerStyle}>
      <div style={storyPreviewStyle}>
        <img 
          src={storyImage} 
          alt={`${storyOwner}'s story`} 
          style={storyImageStyle}
        />
        <div style={storyInfoStyle}>
          <div style={storyOwnerStyle}>{storyOwner}'s story</div>
          {storyCaption && (
            <div style={storyCaptionStyle}>{storyCaption}</div>
          )}
        </div>
      </div>
      {replyText && (
        <div style={replyTextStyle}>{replyText}</div>
      )}
    </div>
  );
};