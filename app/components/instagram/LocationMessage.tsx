import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationMessageProps {
  name: string;
  address?: string;
  mapPreview?: string;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({
  name,
  address,
  mapPreview,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
    borderRadius: `${18 * presentationScale}px`,
    overflow: 'hidden',
    width: `${240 * presentationScale}px`,
  };

  const mapStyle: React.CSSProperties = {
    width: '100%',
    height: `${120 * presentationScale}px`,
    backgroundColor: '#E5E5E5',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const mapImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const pinIconStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#E4405F',
    borderRadius: '50%',
    width: `${32 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  const locationInfoStyle: React.CSSProperties = {
    padding: `${12 * presentationScale}px`,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: `${14 * presentationScale}px`,
    fontWeight: 600,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    marginBottom: address ? `${4 * presentationScale}px` : 0,
  };

  const addressStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    opacity: 0.8,
    lineHeight: 1.3,
  };

  // Default map preview if none provided
  const defaultMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s+E4405F(-122.4194,37.7749)/-122.4194,37.7749,13,0/240x120@2x?access_token=pk.example`;

  return (
    <div style={containerStyle}>
      <div style={mapStyle}>
        {mapPreview ? (
          <img 
            src={mapPreview} 
            alt={`Map of ${name}`} 
            style={mapImageStyle}
          />
        ) : (
          <>
            <div style={{ 
              ...mapImageStyle, 
              backgroundColor: '#F0F0F0',
              backgroundImage: 'linear-gradient(45deg, #E8E8E8 25%, transparent 25%), linear-gradient(-45deg, #E8E8E8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E8E8E8 75%), linear-gradient(-45deg, transparent 75%, #E8E8E8 75%)',
              backgroundSize: `${20 * presentationScale}px ${20 * presentationScale}px`,
              backgroundPosition: `0 0, 0 ${10 * presentationScale}px, ${10 * presentationScale}px ${-10 * presentationScale}px, ${-10 * presentationScale}px 0px`,
            }} />
          </>
        )}
        <div style={pinIconStyle}>
          <MapPin 
            size={18 * presentationScale} 
            color="#FFFFFF"
            strokeWidth={2.5}
          />
        </div>
      </div>
      <div style={locationInfoStyle}>
        <div style={nameStyle}>{name}</div>
        {address && (
          <div style={addressStyle}>{address}</div>
        )}
      </div>
    </div>
  );
};