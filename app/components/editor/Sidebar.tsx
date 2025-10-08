import React, { useState, useRef, useEffect } from 'react';
import { FileText, Subtitles, MessageCircle, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setActiveSection, setActiveElement } from '@/app/store/slices/projectSlice';

const Sidebar: React.FC = () => {
    const dispatch = useAppDispatch();
    const { activeSection } = useAppSelector((state) => state.projectState);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    
    // Check if there's more content to scroll
    useEffect(() => {
        const checkScrollable = () => {
            if (scrollContainerRef.current) {
                const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
                const hasMoreContent = scrollHeight > clientHeight;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px threshold
                setShowScrollIndicator(hasMoreContent && !isAtBottom);
            }
        };
        
        checkScrollable();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollable);
            return () => container.removeEventListener('scroll', checkScrollable);
        }
    }, []);
    
    const menuItems = [
        { 
            icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>, 
            tooltip: 'Media',
            section: 'media'
        },
        { 
            icon: <FileText className="w-5 h-5" />, 
            tooltip: 'Text',
            section: 'text'
        },
        { 
            icon: <Subtitles className="w-5 h-5" />, 
            tooltip: 'Captions',
            section: 'caption'
        },
        { 
            icon: <MessageCircle className="w-5 h-5" />, 
            tooltip: 'Instagram DMs',
            section: 'instagram-conversation'
        },
        {
            icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.304 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
            </svg>,
            tooltip: 'WhatsApp Chats',
            section: 'whatsapp-conversation'
        },
        {
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
            </svg>,
            tooltip: 'Transitions',
            section: 'transitions'
        },
    ];

    return (
        <div className="w-20 bg-black border-r border-gray-800 flex flex-col h-full relative">
            {/* Scrollable container for menu items */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto py-4 space-y-2 px-2 hover:scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" 
                style={{scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent'}}
            >
                {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        if (item.section) {
                            dispatch(setActiveSection(item.section as any));
                            // Set activeElement to 'caption' when caption section is selected
                            if (item.section === 'caption') {
                                dispatch(setActiveElement('caption'));
                            }
                            // Set activeElement to 'instagram-conversation' when Instagram section is selected
                            if (item.section === 'instagram-conversation') {
                                dispatch(setActiveElement('instagram-conversation'));
                            }
                            // Set activeElement to 'whatsapp-conversation' when WhatsApp section is selected
                            if (item.section === 'whatsapp-conversation') {
                                dispatch(setActiveElement('whatsapp-conversation'));
                            }
                        }
                    }}
                    className={`w-full px-2 py-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
                        activeSection === item.section
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-white hover:bg-gray-900'
                    }`}
                    title={item.tooltip}
                >
                    {item.icon}
                    <span className="text-[10px] font-medium leading-tight text-center">
                        {item.tooltip}
                    </span>
                </button>
                ))}
            </div>
            
            {/* Scroll indicator */}
            {showScrollIndicator && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
                </div>
            )}
        </div>
    );
};

export default Sidebar;