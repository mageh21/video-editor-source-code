import { useEffect, useState } from 'react';
import { FFmpeg } from "@ffmpeg/ffmpeg";

type Props = {
    ffmpeg: FFmpeg;
};

export default function FfmpegProgressBar({ ffmpeg }: Props) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleProgress = ({ progress }: { progress: number }) => {
            const clampedProgress = Math.max(0, Math.min(progress, 1));
            setProgress(clampedProgress);
        };

        ffmpeg.on('progress', handleProgress);

        return () => {
            ffmpeg.off('progress', handleProgress);
        };
    }, [ffmpeg]);

    return (
        <div className="w-full bg-[#222] rounded-lg overflow-hidden h-4 border border-gray-700 mt-2">
            <div
                className="bg-green-500 h-full transition-all duration-200"
                style={{ width: `${(progress * 100).toFixed(1)}%` }}
            />
        </div>
    );
}
