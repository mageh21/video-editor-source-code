import React from 'react';
import { Shield } from 'lucide-react';

interface AdminBadgeProps {
  role?: 'admin' | 'moderator' | 'member';
  presentationScale?: number;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ 
  role,
  presentationScale = 1 
}) => {
  if (!role || role === 'member') return null;

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${2 * presentationScale}px`,
    backgroundColor: role === 'admin' ? '#E4405F' : '#7B68EE',
    color: '#FFFFFF',
    padding: `${2 * presentationScale}px ${6 * presentationScale}px`,
    borderRadius: `${10 * presentationScale}px`,
    fontSize: `${10 * presentationScale}px`,
    fontWeight: 600,
    marginLeft: `${4 * presentationScale}px`,
  };

  const iconStyle: React.CSSProperties = {
    width: `${10 * presentationScale}px`,
    height: `${10 * presentationScale}px`,
  };

  return (
    <span style={badgeStyle}>
      <Shield style={iconStyle} />
      {role === 'admin' ? 'Admin' : 'Mod'}
    </span>
  );
};