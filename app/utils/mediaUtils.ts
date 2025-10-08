export const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const fileType = file.type || '';
        
        if (fileType.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                // Ensure minimum duration of 1 second for very short videos
                const duration = Math.max(1, video.duration || 30);
                // console.log(`Video duration: ${duration} seconds`);
                resolve(duration);
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                console.warn('Failed to load video metadata, using default duration');
                resolve(30); // Default 30 seconds on error
            };
            
            video.src = url;
        } else if (fileType.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                // Ensure minimum duration of 1 second for very short audio
                const duration = Math.max(1, audio.duration || 30);
                // console.log(`Audio duration: ${duration} seconds`);
                resolve(duration);
            };
            
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                console.warn('Failed to load audio metadata, using default duration');
                resolve(30); // Default 30 seconds on error
            };
            
            audio.src = url;
        } else if (fileType.startsWith('image/')) {
            // Images don't have duration, use default
            URL.revokeObjectURL(url);
            resolve(5); // Default 5 seconds for images
        } else {
            URL.revokeObjectURL(url);
            resolve(10); // Default 10 seconds for unknown types
        }
    });
};