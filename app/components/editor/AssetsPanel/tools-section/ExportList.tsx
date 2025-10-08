import Export from "../../render/Ffmpeg/Export";
import { useExportContext } from "../../../../contexts/ExportContext";
import { useAppSelector } from "@/app/store";
import { Button } from "../../../ui/Button";
import { Download, Loader2 } from "lucide-react";

export default function ExportList() {
    const { mediaFiles, textElements } = useAppSelector((state) => state.projectState);
    const { startExport, isExporting } = useExportContext();

    const hasContent = mediaFiles.length > 0 || textElements.length > 0;

    const handleQuickExport = (format: 'mp4' | 'webm' | 'gif') => {
        startExport(format);
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Export Options</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Choose your preferred format and export your video
                </p>
            </div>

            {!hasContent ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Download className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-sm font-medium mb-1">No content to export</p>
                    <p className="text-gray-400 text-xs">Add media or text to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <Button
                        onClick={() => handleQuickExport('mp4')}
                        className="w-full justify-between"
                        variant="default"
                        disabled={isExporting}
                    >
                        <div className="flex items-center">
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Export MP4
                        </div>
                        <span className="text-xs">Recommended</span>
                    </Button>

                    <Button
                        onClick={() => handleQuickExport('webm')}
                        className="w-full justify-between"
                        variant="outline"
                        disabled={isExporting}
                    >
                        <div className="flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export WebM
                        </div>
                        <span className="text-xs">Web optimized</span>
                    </Button>

                    <Button
                        onClick={() => handleQuickExport('gif')}
                        className="w-full justify-between"
                        variant="outline"
                        disabled={isExporting}
                    >
                        <div className="flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export GIF
                        </div>
                        <span className="text-xs">No audio</span>
                    </Button>

                    <div className="text-xs text-gray-500 text-center mt-4">
                        Ready to export
                    </div>
                </div>
            )}

            {/* Keep the original Export component for backward compatibility */}
            <div className="border-t border-gray-700 pt-4">
                <details className="group">
                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                        Advanced Export Options
                    </summary>
                    <div className="mt-2">
                        <Export />
                    </div>
                </details>
            </div>

        </div>
    );
}