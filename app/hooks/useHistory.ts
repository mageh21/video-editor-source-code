import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { undo, redo, clearHistory } from '@/app/store/slices/projectSlice';

export const useHistory = () => {
    const dispatch = useAppDispatch();
    const { history, future } = useAppSelector(state => state.projectState);
    
    const handleUndo = useCallback(() => {
        dispatch(undo());
    }, [dispatch]);
    
    const handleRedo = useCallback(() => {
        dispatch(redo());
    }, [dispatch]);
    
    const handleClearHistory = useCallback(() => {
        dispatch(clearHistory());
    }, [dispatch]);
    
    return {
        undo: handleUndo,
        redo: handleRedo,
        clearHistory: handleClearHistory,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        historyCount: history.length,
        futureCount: future.length,
    };
};