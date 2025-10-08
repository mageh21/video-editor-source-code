"use client";
import { useEffect, useState } from "react";
import { getFile, storeProject, useAppDispatch, useAppSelector } from "../../../store";
import { getProject } from "../../../store";
import { setCurrentProject, updateProject } from "../../../store/slices/projectsSlice";
import { rehydrate, setMediaFiles, createNewProject } from '../../../store/slices/projectSlice';
import { setActiveSection } from "../../../store/slices/projectSlice";
import { useRouter } from 'next/navigation';
import { MediaFile } from "@/app/types";
import { KeyframeProvider } from "@/app/contexts/KeyframeContext";
import Sidebar from "../../../components/editor/Sidebar";
import MediaPanel from "../../../components/editor/MediaPanel";
import TextPanel from "../../../components/editor/TextPanel";
import { CaptionsPanel } from "../../../components/editor/captions/CaptionsPanel";
import { InstagramSection } from "../../../components/instagram/InstagramSection";
import WhatsAppSection from "../../../components/whatsapp/WhatsAppSection";
import { TransitionsPanel } from "../../../components/editor/TransitionsPanel";
import PreviewArea from "../../../components/editor/PreviewArea";
import PropertiesPanel from "../../../components/editor/PropertiesPanel";
import TimelineSection from "../../../components/editor/TimelineSection";
import Header from "../../../components/editor/Header";
import { useTimelineShortcuts } from "@/app/hooks/useTimelineShortcuts";

export default function Project({ params }: { params: { id: string } }) {
    const { id } = params;
    const dispatch = useAppDispatch();
    const projectState = useAppSelector((state) => state.projectState);
    const { currentProjectId } = useAppSelector((state) => state.projects);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    // Enable keyboard shortcuts
    useTimelineShortcuts();

    // Load project on mount
    useEffect(() => {
        const loadProject = async () => {
            if (id) {
                setIsLoading(true);
                const project = await getProject(id);
                if (project) {
                    dispatch(setCurrentProject(id));
                    setIsLoading(false);
                } else {
                    router.push('/404');
                }
            }
        };
        loadProject();
    }, [id, dispatch, router]);

    // Set project state from current project id
    useEffect(() => {
        const loadProject = async () => {
            if (currentProjectId) {
                const project = await getProject(currentProjectId);
                if (project) {
                    // Initialize clean state before rehydrating to ensure all fields are present
                    dispatch(createNewProject());
                    dispatch(rehydrate(project));

                    // Only regenerate blob URLs for media files that don't have valid ones or have missing files
                    const mediaFilesWithSrc = await Promise.all(
                        project.mediaFiles.map(async (media: MediaFile) => {
                            try {
                                const file = await getFile(media.fileId);
                                if (!file) {
                                    console.error(`Failed to load file for media ${media.id} with fileId ${media.fileId}`);
                                    return null;
                                }
                                
                                // Revoke old blob URL if it exists
                                if (media.src && media.src.startsWith('blob:')) {
                                    URL.revokeObjectURL(media.src);
                                }
                                
                                // Add originalStartTime/originalEndTime if not present (for backward compatibility)
                                return { 
                                    ...media, 
                                    src: URL.createObjectURL(file),
                                    originalStartTime: media.originalStartTime ?? media.startTime,
                                    originalEndTime: media.originalEndTime ?? media.endTime
                                };
                            } catch (error) {
                                console.error(`Error processing media file ${media.id}:`, error);
                                return null;
                            }
                        })
                    );
                    
                    // Filter out any null entries
                    const validMediaFiles = mediaFilesWithSrc.filter(media => media !== null);
                    dispatch(setMediaFiles(validMediaFiles));
                }
            }
        };
        loadProject();
    }, [dispatch, currentProjectId]);

    // Auto-save project
    useEffect(() => {
        const saveProject = async () => {
            if (!projectState || projectState.id != currentProjectId) return;
            await storeProject(projectState);
            dispatch(updateProject(projectState));
        };
        saveProject();
    }, [projectState, dispatch, currentProjectId]);

    return (
        <KeyframeProvider>
            <div className="flex flex-col h-screen bg-black">
                {/* Loading screen */}
                {isLoading && (
                    <div className="fixed inset-0 flex items-center bg-black bg-opacity-90 justify-center z-50">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-2 border-t-white border-gray-800 rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-400 text-sm">Loading project...</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <Header />

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Upper section */}
                    <div className="flex flex-1 overflow-hidden relative z-0">
                        {/* Icon Sidebar */}
                        <Sidebar />

                        {/* Dynamic Panel based on activeSection */}
                        {projectState.activeSection === 'media' && <MediaPanel />}
                        {projectState.activeSection === 'text' && <TextPanel />}
                        {projectState.activeSection === 'caption' && <CaptionsPanel />}
                        {projectState.activeSection === 'instagram-conversation' && <InstagramSection />}
                        {projectState.activeSection === 'whatsapp-conversation' && <WhatsAppSection />}
                        {projectState.activeSection === 'transitions' && <TransitionsPanel />}

                        {/* Preview Area */}
                        <PreviewArea />

                        {/* Properties Panel */}
                        <PropertiesPanel />
                    </div>

                    {/* Timeline - Fixed height */}
                    <div className="h-64 flex-shrink-0 relative z-10">
                        <TimelineSection />
                    </div>
                </div>
            </div>
        </KeyframeProvider>
    );
}