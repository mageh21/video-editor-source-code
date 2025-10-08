'use client';

import { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import { useAppDispatch, useAppSelector } from '../../store';
import { addProject, deleteProject, rehydrateProjects, setCurrentProject } from '../../store/slices/projectsSlice';
import { listProjects, storeProject, deleteProject as deleteProjectFromDB } from '../../store';
import { ProjectState } from '../../types';
import { toast } from 'react-hot-toast';
import FullScreenLoader from '@/app/components/common/FullScreenLoader';
import { useNavigationLoader } from '@/app/hooks/useNavigationLoader';

// Predefined screen sizes
const SCREEN_SIZES = [
    { name: 'YouTube (16:9)', width: 1920, height: 1080, aspectRatio: '16:9' },
    { name: 'Instagram Post (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
    { name: 'Instagram Story (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
    { name: 'TikTok (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
    { name: 'Twitter (16:9)', width: 1280, height: 720, aspectRatio: '16:9' },
    { name: 'LinkedIn (16:9)', width: 1200, height: 675, aspectRatio: '16:9' },
    { name: 'Facebook (16:9)', width: 1280, height: 720, aspectRatio: '16:9' },
    { name: 'Square (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
    { name: 'Portrait (4:5)', width: 1080, height: 1350, aspectRatio: '4:5' },
    { name: 'Landscape (4:3)', width: 1440, height: 1080, aspectRatio: '4:3' },
    { name: 'Custom', width: 1920, height: 1080, aspectRatio: 'custom' },
];

export default function Projects() {
    const dispatch = useAppDispatch();
    const { projects, currentProjectId } = useAppSelector((state) => state.projects);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedSize, setSelectedSize] = useState(SCREEN_SIZES[0]);
    const [customWidth, setCustomWidth] = useState('1920');
    const [customHeight, setCustomHeight] = useState('1080');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isNavigating, handleNavigation } = useNavigationLoader();

    useEffect(() => {
        const loadProjects = async () => {
            setIsLoading(true);
            try {
                const storedProjects = await listProjects();
                dispatch(rehydrateProjects(storedProjects));
            } catch (error) {
                toast.error('Failed to load projects');
                console.error('Error loading projects:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProjects();
    }, [dispatch]);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast.error('Please enter a project name');
            return;
        }

        let finalResolution = {
            width: selectedSize.width,
            height: selectedSize.height
        };

        if (selectedSize.aspectRatio === 'custom') {
            const width = parseInt(customWidth);
            const height = parseInt(customHeight);
            if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
                toast.error('Please enter valid width and height');
                return;
            }
            finalResolution = { width, height };
        }

        const newProject: ProjectState = {
            id: crypto.randomUUID(),
            projectName: newProjectName,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            mediaFiles: [],
            textElements: [],
            instagramConversations: [],
            whatsappConversations: [],
            captionTracks: [],
            activeCaptionTrackId: null,
            showCaptions: true,
            currentTime: 0,
            isPlaying: false,
            isMuted: false,
            duration: 0,
            activeSection: 'media',
            activeElement: 'text',
            activeElementIndex: 0,
            filesID: [],
            zoomLevel: 1,
            timelineZoom: 100,
            enableMarkerTracking: true,
            enableSnapping: true,
            selectedMediaIds: [],
            selectedTextIds: [],
            selectedCaptionIds: [],
            selectedInstagramConversationIds: [],
            selectedWhatsAppConversationIds: [],
            visibleRows: 5,
            maxRows: 8,
            resolution: finalResolution,
            fps: 30,
            aspectRatio: selectedSize.aspectRatio === 'custom' 
                ? `${finalResolution.width}:${finalResolution.height}` 
                : selectedSize.aspectRatio,
            history: [],
            future: [],
            exportSettings: {
                resolution: '1080p',
                quality: 'high',
                speed: 'fastest',
                fps: 30,
                format: 'mp4',
                includeSubtitles: false,
            },
            betweenClipTransitions: {},
            transitionIds: [],
        };

        await storeProject(newProject);
        dispatch(addProject(newProject));
        setNewProjectName('');
        setIsCreating(false);
        setSelectedSize(SCREEN_SIZES[0]);
        setCustomWidth('1920');
        setCustomHeight('1080');
        toast.success('Project created successfully');
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            await deleteProjectFromDB(projectId);
            dispatch(deleteProject(projectId));
            const storedProjects = await listProjects();
            dispatch(rehydrateProjects(storedProjects));
            toast.success('Project deleted successfully');
        }
    };

    const formatResolution = (project: ProjectState) => {
        return `${project.resolution.width}×${project.resolution.height} (${project.aspectRatio})`;
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-5xl font-bold text-center mb-12">Your Projects</h1>
                
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-t-white border-r-white border-opacity-30 border-t-opacity-100 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-lg">Loading projects...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {/* Create New Project Card */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="h-64 rounded-lg border-2 border-dashed border-gray-600 hover:border-white transition-all duration-200 flex flex-col items-center justify-center group"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-all duration-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium">Create New Project</p>
                            <p className="text-sm text-gray-400 mt-2">Start from scratch</p>
                        </button>

                        {/* Project Cards */}
                        {[...projects]
                            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                            .map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    onClick={(event) => {
                                        const didNavigate = handleNavigation(event, `/projects/${project.id}`);
                                        if (didNavigate) {
                                            dispatch(setCurrentProject(project.id));
                                        }
                                    }}
                                    className="h-64 rounded-lg border border-gray-800 hover:border-gray-600 bg-gray-900/50 transition-all duration-200 flex flex-col p-6 group relative"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-400"
                                        aria-label="Delete project"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-2 truncate">{project.projectName}</h3>
                                        <p className="text-sm text-gray-400 mb-1">
                                            {formatResolution(project)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {project.mediaFiles.length} media files
                                        </p>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-gray-800">
                                        <p className="text-xs text-gray-500">
                                            Last edited: {new Date(project.lastModified).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                            
                            <div className="space-y-6">
                                {/* Project Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Project Name</label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                handleCreateProject();
                                            } else if (e.key === "Escape") {
                                                setIsCreating(false);
                                            }
                                        }}
                                        placeholder="Enter project name"
                                        className="w-full p-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>

                                {/* Screen Size Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">Screen Size</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {SCREEN_SIZES.map((size) => (
                                            <button
                                                key={size.name}
                                                onClick={() => setSelectedSize(size)}
                                                className={`p-3 rounded-lg border transition-all duration-200 ${
                                                    selectedSize.name === size.name
                                                        ? 'border-white bg-white/10'
                                                        : 'border-gray-700 hover:border-gray-500'
                                                }`}
                                            >
                                                <p className="font-medium text-sm">{size.name}</p>
                                                {size.aspectRatio !== 'custom' && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {size.width}×{size.height}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Size Inputs */}
                                {selectedSize.aspectRatio === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Width (px)</label>
                                            <input
                                                type="number"
                                                value={customWidth}
                                                onChange={(e) => setCustomWidth(e.target.value)}
                                                placeholder="1920"
                                                className="w-full p-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Height (px)</label>
                                            <input
                                                type="number"
                                                value={customHeight}
                                                onChange={(e) => setCustomHeight(e.target.value)}
                                                placeholder="1080"
                                                className="w-full p-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Preview */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Preview</label>
                                    <div className="bg-black border border-gray-700 rounded-lg p-4 flex items-center justify-center" style={{ height: '200px' }}>
                                        <div 
                                            className="bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                aspectRatio: selectedSize.aspectRatio === 'custom' 
                                                    ? `${customWidth} / ${customHeight}`
                                                    : selectedSize.aspectRatio.replace(':', ' / ')
                                            }}
                                        >
                                            <p className="text-xs text-gray-500 p-4">
                                                {selectedSize.aspectRatio === 'custom' 
                                                    ? `${customWidth}×${customHeight}`
                                                    : `${selectedSize.width}×${selectedSize.height}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewProjectName('');
                                        setSelectedSize(SCREEN_SIZES[0]);
                                    }}
                                    className="px-6 py-2 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Create Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isNavigating && <FullScreenLoader message="Opening editor" subtle />}
        </div>
    );
}
