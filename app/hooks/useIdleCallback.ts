import { useEffect, useRef, useCallback } from 'react';

interface IdleTask {
    id: number;
    callback: () => void;
    priority: 'high' | 'normal' | 'low';
}

export function useIdleCallback() {
    const tasksRef = useRef<IdleTask[]>([]);
    const nextIdRef = useRef(0);
    
    useEffect(() => {
        let idleCallbackId: number;
        
        const processTasks = (deadline: IdleDeadline) => {
            // Process tasks while we have time
            while (deadline.timeRemaining() > 0 && tasksRef.current.length > 0) {
                // Sort by priority
                tasksRef.current.sort((a, b) => {
                    const priorityOrder = { high: 0, normal: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                });
                
                const task = tasksRef.current.shift();
                if (task) {
                    try {
                        task.callback();
                    } catch (error) {
                        console.error('Error in idle callback:', error);
                    }
                }
            }
            
            // Schedule next idle callback if tasks remain
            if (tasksRef.current.length > 0) {
                idleCallbackId = requestIdleCallback(processTasks);
            }
        };
        
        // Start processing if we have tasks
        if (tasksRef.current.length > 0) {
            idleCallbackId = requestIdleCallback(processTasks);
        }
        
        return () => {
            if (idleCallbackId) {
                cancelIdleCallback(idleCallbackId);
            }
        };
    }, []);
    
    const scheduleTask = useCallback((callback: () => void, priority: 'high' | 'normal' | 'low' = 'normal') => {
        const task: IdleTask = {
            id: nextIdRef.current++,
            callback,
            priority
        };
        
        tasksRef.current.push(task);
        
        // Start processing if not already running
        if (tasksRef.current.length === 1) {
            requestIdleCallback((deadline) => {
                const processTasks = (deadline: IdleDeadline) => {
                    while (deadline.timeRemaining() > 0 && tasksRef.current.length > 0) {
                        tasksRef.current.sort((a, b) => {
                            const priorityOrder = { high: 0, normal: 1, low: 2 };
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                        });
                        
                        const task = tasksRef.current.shift();
                        if (task) {
                            try {
                                task.callback();
                            } catch (error) {
                                console.error('Error in idle callback:', error);
                            }
                        }
                    }
                    
                    if (tasksRef.current.length > 0) {
                        requestIdleCallback(processTasks);
                    }
                };
                
                processTasks(deadline);
            });
        }
        
        return task.id;
    }, []);
    
    const cancelTask = useCallback((taskId: number) => {
        tasksRef.current = tasksRef.current.filter(task => task.id !== taskId);
    }, []);
    
    const clearAllTasks = useCallback(() => {
        tasksRef.current = [];
    }, []);
    
    return {
        scheduleTask,
        cancelTask,
        clearAllTasks,
        hasPendingTasks: () => tasksRef.current.length > 0
    };
}

// Polyfill for browsers that don't support requestIdleCallback
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
    (window as any).requestIdleCallback = function(callback: IdleRequestCallback) {
        const start = Date.now();
        return setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            } as IdleDeadline);
        }, 1);
    };
    
    (window as any).cancelIdleCallback = function(id: number) {
        clearTimeout(id);
    };
}