import { useRef, useEffect, useCallback, useState } from 'react';

interface TimedWord {
  id: string;
  text: string;
  start: number;
  end: number;
}

interface UseWordSyncOptions {
  words: TimedWord[];
  currentTime: number; // milliseconds
  isPlaying: boolean;
  onWordStart?: (word: TimedWord) => void;
  onWordEnd?: (word: TimedWord) => void;
}

interface UseWordSyncReturn {
  activeWordId: string | null;
  activeWordIndex: number;
  progress: number;
  isWordActive: (wordId: string) => boolean;
}

export const useWordSync = ({
  words,
  currentTime,
  isPlaying,
  onWordStart,
  onWordEnd,
}: UseWordSyncOptions): UseWordSyncReturn => {
  // Performance refs - avoid React re-renders
  const activeWordIdRef = useRef<string | null>(null);
  const activeWordIndexRef = useRef<number>(-1);
  
  // State for component updates (minimal)
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);

  // Optimized word finding using binary search for large word arrays
  const findActiveWordIndex = useCallback((time: number): number => {
    if (!words.length) return -1;
    
    // Binary search for performance with large word arrays
    let left = 0;
    let right = words.length - 1;
    let result = -1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const word = words[mid];
      
      if (time >= word.start && time <= word.end) {
        result = mid;
        break;
      } else if (time < word.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    return result;
  }, [words]);

  // Calculate progress through current word
  const calculateWordProgress = useCallback((word: TimedWord, time: number): number => {
    if (!word) return 0;
    const duration = word.end - word.start;
    if (duration === 0) return 1;
    const elapsed = time - word.start;
    return Math.max(0, Math.min(1, elapsed / duration));
  }, []);

  // Main synchronization effect
  useEffect(() => {
    if (!isPlaying) return;

    const newActiveIndex = findActiveWordIndex(currentTime);
    const newActiveWordId = newActiveIndex >= 0 ? words[newActiveIndex].id : null;
    
    // Only update if word actually changed
    if (newActiveWordId !== activeWordIdRef.current) {
      const previousWord = activeWordIndexRef.current >= 0 ? words[activeWordIndexRef.current] : null;
      const newActiveWord = newActiveIndex >= 0 ? words[newActiveIndex] : null;
      
      // Handle word end event
      if (previousWord && onWordEnd) {
        onWordEnd(previousWord);
      }
      
      // Handle word start event
      if (newActiveWord && onWordStart) {
        onWordStart(newActiveWord);
      }
      
      // Update refs
      activeWordIdRef.current = newActiveWordId;
      activeWordIndexRef.current = newActiveIndex;
      
      // Update React state
      setActiveWordId(newActiveWordId);
      setActiveWordIndex(newActiveIndex);
    }
    
    // Update progress for current word
    if (newActiveIndex >= 0) {
      const currentWord = words[newActiveIndex];
      const wordProgress = calculateWordProgress(currentWord, currentTime);
      setProgress(wordProgress);
    } else {
      setProgress(0);
    }
  }, [
    currentTime, 
    isPlaying, 
    words, 
    findActiveWordIndex, 
    calculateWordProgress, 
    onWordStart,
    onWordEnd,
  ]);

  // Utility function to check if a specific word is active
  const isWordActive = useCallback((wordId: string): boolean => {
    return activeWordIdRef.current === wordId;
  }, []);

  // Reset when words change
  useEffect(() => {
    activeWordIdRef.current = null;
    activeWordIndexRef.current = -1;
    setActiveWordId(null);
    setActiveWordIndex(-1);
    setProgress(0);
  }, [words]);

  return {
    activeWordId,
    activeWordIndex,
    progress,
    isWordActive,
  };
};