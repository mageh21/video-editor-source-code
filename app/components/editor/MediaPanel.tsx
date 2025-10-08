import React from 'react';
import { Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setActiveSection } from '@/app/store/slices/projectSlice';
import AddMedia from './AssetsPanel/AddButtons/UploadMedia';
import UploadedMediaList from './AssetsPanel/tools-section/UploadedMediaList';

const MediaPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { activeSection, mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const [activeTab, setActiveTab] = React.useState<'project' | 'workspace'>('project');

    React.useEffect(() => {
        if (activeTab === 'project') {
            dispatch(setActiveSection('media'));
        }
    }, [activeTab, dispatch]);

    return (
        <div className="w-64 bg-black border-r border-gray-800 flex flex-col">
            {/* Header */}
            <div className="p-4">
                <h2 className="text-white text-sm font-medium mb-4">Your media</h2>
                
                {/* Tabs */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('project')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${
                            activeTab === 'project'
                                ? 'text-white'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Project
                        {activeTab === 'project' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${
                            activeTab === 'workspace'
                                ? 'text-white'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Workspace
                        {activeTab === 'workspace' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'project' && (
                    <div className="p-4">
                        {(!filesID || filesID.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Upload className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-sm text-center mb-4">
                                    No media uploaded yet
                                </p>
                                <p className="text-gray-500 text-xs text-center">
                                    Click upload to add files
                                </p>
                            </div>
                        ) : (
                            <UploadedMediaList />
                        )}
                        
                        <div className="mt-4">
                            <AddMedia />
                        </div>
                    </div>
                )}
                
                {activeTab === 'workspace' && (
                    <div className="p-4">
                        <p className="text-gray-400 text-sm">Workspace content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaPanel;