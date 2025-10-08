import React from 'react';

interface MultiImageMessageProps {
  images: { src: string; thumbnail?: string; caption?: string }[];
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const MultiImageMessage: React.FC<MultiImageMessageProps> = ({
  images,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gap: `${2 * presentationScale}px`,
    width: `${240 * presentationScale}px`,
    borderRadius: `${18 * presentationScale}px`,
    overflow: 'hidden',
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
  };

  // Determine grid layout based on number of images
  const getGridStyle = (): React.CSSProperties => {
    if (images.length === 2) {
      return {
        ...containerStyle,
        gridTemplateColumns: '1fr 1fr',
      };
    } else if (images.length === 3) {
      return {
        ...containerStyle,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      };
    } else if (images.length === 4) {
      return {
        ...containerStyle,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      };
    } else if (images.length > 4) {
      return {
        ...containerStyle,
        gridTemplateColumns: 'repeat(3, 1fr)',
      };
    }
    return containerStyle;
  };

  const imageStyle = (index: number): React.CSSProperties => {
    let style: React.CSSProperties = {
      width: '100%',
      height: `${120 * presentationScale}px`,
      objectFit: 'cover',
      display: 'block',
    };

    // Special layouts for 3 images
    if (images.length === 3) {
      if (index === 0) {
        style.gridColumn = '1 / 3';
        style.height = `${120 * presentationScale}px`;
      } else {
        style.height = `${120 * presentationScale}px`;
      }
    }

    // Special layout for 5 images
    if (images.length === 5) {
      if (index < 2) {
        style.gridColumn = 'span 1';
        style.height = `${120 * presentationScale}px`;
      } else {
        style.height = `${80 * presentationScale}px`;
      }
    }

    return style;
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: `${20 * presentationScale}px`,
    fontWeight: 600,
  };

  const maxVisibleImages = 6;
  const visibleImages = images.slice(0, maxVisibleImages);
  const remainingCount = images.length - maxVisibleImages;

  return (
    <div style={getGridStyle()}>
      {visibleImages.map((image, index) => (
        <div 
          key={index} 
          style={{
            position: 'relative',
            ...imageStyle(index),
            overflow: 'hidden',
          }}
        >
          <img 
            src={image.thumbnail || image.src} 
            alt={`Image ${index + 1}`}
            style={imageStyle(index)}
          />
          {index === maxVisibleImages - 1 && remainingCount > 0 && (
            <div style={overlayStyle}>
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};