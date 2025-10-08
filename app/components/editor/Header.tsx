import React, { useState } from 'react';
import { useAppSelector } from '@/app/store';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import ExportModal from './ExportModal';

const Header: React.FC = () => {
    const { projectName } = useAppSelector((state) => state.projectState);
    const router = useRouter();
    const dispatch = useDispatch();
    const [showExportModal, setShowExportModal] = useState(false);

    return (
        <header className="h-14 bg-black border-b border-gray-800 flex items-center px-6">
            {/* Left section - navigation */}
            <div className="flex items-center space-x-2 flex-1">
                <button 
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <button 
                    className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                >
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Center - Project name */}
            <div className="flex items-center justify-center flex-shrink-0">
                <h1 className="text-white text-xl font-semibold px-4">
                    {projectName || 'Untitled video'}
                </h1>
            </div>

            {/* Right section - actions */}
            <div className="flex items-center justify-end flex-1">
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                </button>
            </div>

            {showExportModal && (
                <ExportModal onClose={() => setShowExportModal(false)} />
            )}
        </header>
    );
};

export default Header;