"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Dropdown, DropdownItem } from '../ui/Dropdown';  
import { Popover } from '../ui/Popover';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setProjectName } from "../../store/slices/projectSlice";
import { Menu, Undo, Redo, Languages, Download, Edit, Loader2 } from 'lucide-react';
import { useExportContext } from '../../contexts/ExportContext';
import { useHistory } from '@/app/hooks/useHistory';
import toast from 'react-hot-toast';
import CanvasResizeDropdown from './CanvasResizeDropdown';

export default function Navbar() {
    const [isEditing, setIsEditing] = useState(false);
    const { projectName, mediaFiles, textElements } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const { startExport, isExporting } = useExportContext();
    const { undo, redo, canUndo, canRedo } = useHistory();

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setProjectName(e.target.value));
    };

    const handleNewProject = () => {
        router.push('/projects');
    };

    const handleMyProjects = () => {
        router.push('/projects');
    };

    const handleUndo = () => {
        if (canUndo) {
            undo();
            toast.success('Undone');
        }
    };

    const handleRedo = () => {
        if (canRedo) {
            redo();
            toast.success('Redone');
        }
    };

    const handleExport = (format: 'mp4' | 'webm' | 'gif') => {
        startExport(format);
    };

    return (
        <div className="h-14 bg-black border-b border-gray-800 flex items-center px-6">
            {/* Left Section */}
            <div className="flex items-center space-x-3 flex-1">
                <Dropdown 
                    trigger={
                        <Button variant="ghost" size="icon" className="hover:bg-gray-900">
                            <Menu className="h-4 w-4" />
                        </Button>
                    }
                >
                    <DropdownItem onClick={handleNewProject}>
                        New Project
                    </DropdownItem>
                    <DropdownItem onClick={handleMyProjects}>
                        My Projects
                    </DropdownItem>
                    <DropdownItem>
                        Duplicate Project
                    </DropdownItem>
                </Dropdown>

                <div className="h-6 w-px bg-gray-700" />

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl/Cmd+Z)"
                    className="hover:bg-gray-900"
                >
                    <Undo className={`h-4 w-4 ${!canUndo ? 'opacity-50' : ''}`} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    className="hover:bg-gray-900"
                >
                    <Redo className={`h-4 w-4 ${!canRedo ? 'opacity-50' : ''}`} />
                </Button>
            </div>

            {/* Center Section - Project Title */}
            <div className="flex items-center justify-center flex-shrink-0">
                <div className="relative flex items-center">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={projectName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent text-white text-xl font-semibold border-none outline-none focus:ring-0 text-center min-w-0 px-4"
                            style={{ width: `${Math.max(200, projectName.length * 12)}px` }}
                            autoFocus
                        />
                    ) : (
                        <button
                            onClick={handleClick}
                            className="flex items-center space-x-2 text-xl font-semibold text-white hover:text-gray-200 transition-colors px-4 py-1 rounded-md hover:bg-gray-900/50"
                        >
                            <span>{projectName}</span>
                            <Edit className="h-4 w-4 text-gray-500 opacity-0 hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3 flex-1 justify-end">
                <CanvasResizeDropdown />
                
                <Button variant="ghost" size="sm" className="hover:bg-gray-900">
                    <Languages className="h-4 w-4 mr-2" />
                    Translate
                </Button>

                <Popover
                    trigger={
                        <Button 
                            variant="default" 
                            size="sm" 
                            disabled={isExporting || (mediaFiles.length === 0 && textElements.length === 0)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export'}
                        </Button>
                    }
                    align="end"
                >
                    <div className="space-y-2 p-2">
                        <div className="text-sm font-medium text-white mb-2">Export Options</div>
                        <div className="text-xs text-gray-400 mb-3">
                            Ready to export
                        </div>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start hover:bg-gray-900" 
                            onClick={() => handleExport('mp4')}
                            disabled={isExporting}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>MP4 Video</span>
                                <span className="text-xs text-gray-400">Recommended</span>
                            </div>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start hover:bg-gray-900"
                            onClick={() => handleExport('webm')}
                            disabled={isExporting}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>WebM Video</span>
                                <span className="text-xs text-gray-400">Web optimized</span>
                            </div>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start hover:bg-gray-900"
                            onClick={() => handleExport('gif')}
                            disabled={isExporting}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>GIF Animation</span>
                                <span className="text-xs text-gray-400">No audio</span>
                            </div>
                        </Button>
                    </div>
                </Popover>
            </div>

        </div>
    );
}