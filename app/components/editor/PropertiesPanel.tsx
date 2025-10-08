import React from 'react';
import { useAppSelector } from '@/app/store';
import MediaPropertiesEnhanced from './PropertiesSection/MediaPropertiesEnhanced';
import TextPropertiesSection from './PropertiesSection/TextPropertiesSection';
import TextPropertiesRedesigned from './PropertiesSection/TextPropertiesRedesigned';
import CaptionPropertiesSection from './PropertiesSection/CaptionPropertiesSection';
import CaptionStyleSection from './PropertiesSection/CaptionStyleSection';
import CaptionManagementSection from './PropertiesSection/CaptionManagementSection';
import { FileQuestion, Type, Subtitles, MessageCircle } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
    const { 
        activeElement, 
        selectedMediaIds, 
        selectedTextIds, 
        textElements,
        selectedCaptionIds,
        captionTracks,
        activeCaptionTrackId,
        activeElementIndex,
        instagramConversations,
        whatsappConversations
    } = useAppSelector(
        (state) => state.projectState
    );

    const hasSelection = selectedMediaIds.length > 0 || selectedTextIds.length > 0 || selectedCaptionIds.length > 0 || activeElement;
    
    // Get selected text element
    const selectedText = selectedTextIds.length > 0 
        ? textElements.find(text => text.id === selectedTextIds[0])
        : null;
    
    // Get selected caption
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    const selectedCaption = selectedCaptionIds.length > 0 && activeTrack
        ? activeTrack.captions.find(caption => caption.id === selectedCaptionIds[0])
        : null;

    // Check if we should show caption style settings
    const showCaptionStyles = activeElement === 'caption' && !selectedCaption && activeTrack;

    if (!hasSelection) {
        return (
            <div className="w-64 bg-black border-l border-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <FileQuestion className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No item selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 bg-black border-l border-gray-800 overflow-y-auto">
            {activeElement === 'media' && <MediaPropertiesEnhanced />}
            {activeElement === 'text' && selectedText && (
                <div>
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-white text-sm font-medium flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Text Properties
                        </h2>
                    </div>
                    <TextPropertiesRedesigned selectedText={selectedText} />
                </div>
            )}
            {activeElement === 'caption' && selectedCaption && activeCaptionTrackId && (
                <CaptionPropertiesSection 
                    selectedCaption={selectedCaption} 
                    trackId={activeCaptionTrackId}
                />
            )}
            {activeElement === 'caption' && !selectedCaption && (
                <CaptionManagementSection />
            )}
            {(activeElement as any) === 'instagram' && activeElementIndex !== -1 && instagramConversations[activeElementIndex] && (
                <div>
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-white text-sm font-medium flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Instagram Conversation
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Chat Title</label>
                            <p className="text-white text-sm">
                                {instagramConversations[activeElementIndex].chatTitle || 'Instagram DM'}
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Messages</label>
                            <p className="text-white text-sm">
                                {instagramConversations[activeElementIndex].messages.length} messages
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Participants</label>
                            <p className="text-white text-sm">
                                {instagramConversations[activeElementIndex].participants.length} participants
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Duration</label>
                            <p className="text-white text-sm">
                                {(instagramConversations[activeElementIndex].positionEnd - instagramConversations[activeElementIndex].positionStart).toFixed(1)}s
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {(activeElement as any) === 'whatsapp' && activeElementIndex !== -1 && whatsappConversations[activeElementIndex] && (
                <div>
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-white text-sm font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.304 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                            </svg>
                            WhatsApp Conversation
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Chat Title</label>
                            <p className="text-white text-sm">
                                {whatsappConversations[activeElementIndex].chatTitle || 'WhatsApp Chat'}
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Messages</label>
                            <p className="text-white text-sm">
                                {whatsappConversations[activeElementIndex].messages.length} messages
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Participants</label>
                            <p className="text-white text-sm">
                                {whatsappConversations[activeElementIndex].participants.length} participants
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Chat Type</label>
                            <p className="text-white text-sm">
                                {whatsappConversations[activeElementIndex].isGroupChat ? 'Group Chat' : 
                                 whatsappConversations[activeElementIndex].isBusinessChat ? 'Business Chat' : 'Personal Chat'}
                            </p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs block mb-1">Duration</label>
                            <p className="text-white text-sm">
                                {(whatsappConversations[activeElementIndex].positionEnd - whatsappConversations[activeElementIndex].positionStart).toFixed(1)}s
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;