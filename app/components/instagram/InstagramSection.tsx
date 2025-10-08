import React from 'react';
import { SelectInstagramOverlay } from './SelectInstagramOverlay';
import { InstagramConversation } from '@/app/types';

interface InstagramSectionProps {
  onSelect?: (conversation: InstagramConversation) => void;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ onSelect }) => {
  return <SelectInstagramOverlay onSelect={onSelect} />;
};