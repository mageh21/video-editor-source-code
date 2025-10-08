import React from 'react';
import { SelectWhatsAppOverlay } from './SelectWhatsAppOverlay';
import { WhatsAppConversation } from '@/app/types';

interface WhatsAppSectionProps {
  onSelect?: (conversation: WhatsAppConversation) => void;
}

const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({ onSelect }) => {
  return <SelectWhatsAppOverlay onSelect={onSelect} />;
};

export default WhatsAppSection;